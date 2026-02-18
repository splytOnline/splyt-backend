/**
 * 🚀 Split Service
 * 
 * Handles business logic for split operations.
 * Built for Splyt backend - Web3 split payment platform.
 */

import { ethers } from 'ethers';
import Split, { ISplit, IParticipant } from '../../models/split.model';
import usersModel from '../../models/users.model';
import config from '../../config/app.config';
import SplitFactoryABI from '../../contracts/SplitFactory.json';

export interface CreateSplitInput {
  // Core data
  description: string;
  totalAmount: number;
  
  // Participants
  participants: Array<{
    walletAddress: string;
    name?: string;
    amountDue: number;
  }>;
}

class SplitService {
  /**
   * Creates a new split
   * @param creatorAddress - Wallet address of the user creating the split
   * @param splitData - Split creation data
   * @returns Object containing splitId and contractAddress
   */
  public async createSplit(
    creatorAddress: string,
    splitData: CreateSplitInput
  ): Promise<{ splitId: number; contractAddress: string; txHash: string }> {
    // Declare variables outside try block for error handling
    let splitId = 1;
    let blockchainResult: {
      splitId: bigint;
      splitAddress: string;
      txHash: string;
      blockNumber: number;
      isConfirmed: boolean;
    } | undefined;

    try {
      // Validate creator address format
      const normalizedCreator = creatorAddress.toLowerCase();
      if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedCreator)) {
        throw new Error('Invalid creator wallet address format');
      }

      // Validate participants
      if (!splitData.participants || splitData.participants.length === 0) {
        throw new Error('At least one participant is required');
      }

      if (splitData.participants.length > 50) {
        throw new Error('Maximum 50 participants allowed');
      }

      // Validate total amount matches participant amounts
      const calculatedTotal = splitData.participants.reduce(
        (sum, p) => sum + p.amountDue,
        0
      );

      // Allow small floating point differences (0.01)
      if (Math.abs(calculatedTotal - splitData.totalAmount) > 0.01) {
        throw new Error(
          `Total amount (${splitData.totalAmount}) doesn't match sum of participant amounts (${calculatedTotal})`
        );
      }

      // Validate participant addresses
      for (const participant of splitData.participants) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(participant.walletAddress.toLowerCase())) {
          throw new Error(`Invalid participant wallet address: ${participant.walletAddress}`);
        }
      }

      // Generate unique splitId
      // Find the maximum splitId and increment by 1, or start from 1 if no splits exist
      const maxSplit = await Split.findOne().sort({ splitId: -1 }).lean();
      splitId = maxSplit ? maxSplit.splitId + 1 : 1;

      // Check if splitId already exists (safety check) and find next available
      let existingSplit = await Split.findBySplitId(splitId);
      let attempts = 0;
      while (existingSplit && attempts < 100) {
        splitId++;
        existingSplit = await Split.findBySplitId(splitId);
        attempts++;
      }
      if (attempts >= 100) {
        throw new Error('Unable to generate unique split ID');
      }

      // Deploy Split contract via SplitFactory
      blockchainResult = await this.deploySplitContract(
        normalizedCreator,
        splitData.description,
        splitData.participants,
        splitData.totalAmount
      );

      const contractAddress = blockchainResult.splitAddress;
      const blockchainSplitId = blockchainResult.splitId;
      const txHash = blockchainResult.txHash;
      const blockNumber = blockchainResult.blockNumber;
      const isConfirmed = blockchainResult.isConfirmed;

      // Use blockchain splitId if available, otherwise use generated one
      const finalSplitId = blockchainSplitId ? Number(blockchainSplitId) : splitId;

      // Check if txHash already exists (safety check)
      const existingTx = await Split.findByTxHash(txHash);
      if (existingTx) {
        throw new Error(`Transaction hash ${txHash} already exists in database`);
      }

      // Prepare participants array
      const participants: IParticipant[] = splitData.participants.map((p) => ({
        walletAddress: p.walletAddress.toLowerCase(),
        name: p.name,
        amountDue: p.amountDue,
        hasPaid: false,
        reminderCount: 0,
      }));

      // Create the split
      const split = await Split.create({
        splitId: finalSplitId,
        contractAddress: contractAddress.toLowerCase(),
        txHash: txHash.toLowerCase(),
        blockNumber: blockNumber,
        isConfirmed: isConfirmed,
        creatorAddress: normalizedCreator,
        description: splitData.description,
        totalAmount: splitData.totalAmount,
        currency: 'USDC', // Default currency
        status: isConfirmed ? 'active' : 'pending',
        isCompleted: false,
        isCancelled: false,
        participants: participants,
        // Optional fields set to undefined
        category: undefined,
        note: undefined,
        imageUrl: undefined,
        expiresAt: undefined,
      });

      // Update creator's stats
      try {
        const creator = await usersModel.findByWallet(normalizedCreator);
        if (creator) {
          await creator.incrementSplitCreated();
        }
      } catch (error) {
        // Log error but don't fail split creation
        console.error('Failed to update creator stats:', error);
      }

      // Return splitId, contractAddress, and txHash
      return {
        splitId: split.splitId,
        contractAddress: split.contractAddress,
        txHash: split.txHash,
      };
    } catch (error) {
      // If blockchain transaction succeeded but database save failed,
      // we should still return the blockchain data
      if (blockchainResult) {
        // Blockchain transaction succeeded, return the blockchain data even if DB save failed
        return {
          splitId: blockchainResult.splitId ? Number(blockchainResult.splitId) : splitId,
          contractAddress: blockchainResult.splitAddress,
          txHash: blockchainResult.txHash,
        };
      }

      // If blockchain transaction also failed, throw the error
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create split: ' + String(error));
    }
  }

  /**
   * Deploys a Split contract via SplitFactory
   * @param creatorAddress - Address of the split creator
   * @param description - Split description
   * @param participants - Array of participant data
   * @param totalAmount - Total amount in USDC
   * @returns Object containing splitId, splitAddress, txHash, blockNumber, and isConfirmed
   */
  private async deploySplitContract(
    creatorAddress: string,
    description: string,
    participants: Array<{ walletAddress: string; amountDue: number }>,
    totalAmount: number
  ): Promise<{
    splitId: bigint;
    splitAddress: string;
    txHash: string;
    blockNumber: number;
    isConfirmed: boolean;
  }> {
    try {
      // Validate blockchain configuration
      if (!config.blockchain.splitFactoryContractAddress) {
        throw new Error('SPLIT_FACTORY_CONTRACT_ADDRESS is not configured');
      }
      if (!config.blockchain.gasPayerAddress) {
        throw new Error('GAS_PAYER_ADDRESS is not configured');
      }
      if (!config.blockchain.gasPayerKey) {
        throw new Error('GAS_PAYER_KEY is not configured');
      }
      if (!config.blockchain.rpc) {
        throw new Error('RPC is not configured');
      }

      // Setup provider and wallet
      const provider = new ethers.JsonRpcProvider(config.blockchain.rpc);
      const wallet = new ethers.Wallet(config.blockchain.gasPayerKey, provider);

      // Create contract instance
      const splitFactory = new ethers.Contract(
        config.blockchain.splitFactoryContractAddress,
        SplitFactoryABI as any,
        wallet
      );

      // Prepare function parameters
      const participantAddresses = participants.map(p => p.walletAddress.toLowerCase());
      const amounts = participants.map(p => 
        ethers.parseUnits(p.amountDue.toString(), 6) // USDC has 6 decimals
      );
      const expiryDays = 30; // Default 30 days expiry

      // Call createSplit function
      console.log('Calling createSplit on SplitFactory...');
      const tx = await splitFactory.createSplit(
        creatorAddress.toLowerCase(),
        description,
        participantAddresses,
        amounts,
        expiryDays
      );

      console.log(`Transaction sent: ${tx.hash}`);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      // Get the event logs to extract splitId and splitAddress
      // SplitCreated event: splitId (indexed), creator (indexed), splitAddress (indexed), totalAmount, participantCount
      const splitCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsedLog = splitFactory.interface.parseLog(log);
          return parsedLog && parsedLog.name === 'SplitCreated';
        } catch {
          return false;
        }
      });

      if (!splitCreatedEvent) {
        throw new Error('SplitCreated event not found in transaction receipt');
      }

      const parsedEvent = splitFactory.interface.parseLog(splitCreatedEvent);
      if (!parsedEvent || !parsedEvent.args) {
        throw new Error('Failed to parse SplitCreated event');
      }

      // Event args: [splitId, creator, splitAddress, totalAmount, participantCount]
      const splitId = parsedEvent.args[0] as bigint; // splitId (indexed)
      const splitAddress = parsedEvent.args[2] as string; // splitAddress (indexed, third parameter)

      // Wait for confirmations (12 blocks for security)
      const confirmations = receipt.confirmations;
      const isConfirmed = confirmations >= 12;

      return {
        splitId,
        splitAddress,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        isConfirmed,
      };
    } catch (error) {
      console.error('Error deploying split contract:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to deploy split contract: ${error.message}`);
      }
      throw new Error('Failed to deploy split contract: Unknown error');
    }
  }

  /**
   * Get split by ID
   * @param splitId - Split ID
   * @returns Split document or null
   */
  public async getSplitById(splitId: number): Promise<ISplit | null> {
    return Split.findBySplitId(splitId);
  }

  /**
   * Get splits by creator
   * @param creatorAddress - Creator wallet address
   * @param options - Query options
   * @returns Array of splits
   */
  public async getSplitsByCreator(
    creatorAddress: string,
    options?: { status?: string; limit?: number; skip?: number }
  ): Promise<ISplit[]> {
    return Split.findByCreator(creatorAddress.toLowerCase(), options);
  }

  /**
   * Get splits where user is a participant
   * @param walletAddress - User wallet address
   * @param options - Query options
   * @returns Array of splits with enriched data (creator info, payment status)
   */
  public async getSplitsByParticipant(
    walletAddress: string,
    options?: { status?: string; limit?: number; skip?: number }
  ): Promise<any[]> {
    const splits = await Split.findByParticipant(walletAddress.toLowerCase(), options);
    
    // Enrich splits with creator info and payment status
    const enrichedSplits = await Promise.all(
      splits.map(async (split) => {
        const normalizedRequester = walletAddress.toLowerCase();
        const isCreator = split.creatorAddress.toLowerCase() === normalizedRequester;
        
        // Get creator info if not the requester
        let creatorName: string | undefined;
        let creatorAddress: string | undefined;
        if (!isCreator) {
          const creator = await usersModel.findByWallet(split.creatorAddress);
          creatorName = creator?.displayName;
          creatorAddress = split.creatorAddress;
        }
        
        // Find requester's participant entry
        const requesterParticipant = split.participants.find(
          (p) => p.walletAddress.toLowerCase() === normalizedRequester
        );
        
        // Determine youPaid: true if creator, otherwise based on participant's hasPaid
        const youPaid = isCreator ? true : (requesterParticipant?.hasPaid || false);
        
        // Add paid field to requester's participant entry if they are a participant
        const enrichedParticipants = split.participants.map((p) => {
          if (p.walletAddress.toLowerCase() === normalizedRequester) {
            return {
              ...p,
              paid: p.hasPaid,
            };
          }
          return p;
        });
        
        // Handle both Mongoose documents and plain objects (from .lean())
        const splitObj = typeof (split as any).toObject === 'function' 
          ? (split as any).toObject() 
          : { ...split };
        
        return {
          ...splitObj,
          isCreator,
          creatorName: isCreator ? undefined : creatorName,
          creatorAddress: isCreator ? undefined : creatorAddress,
          youPaid,
          participants: enrichedParticipants,
        };
      })
    );
    
    return enrichedSplits;
  }

  /**
   * Get all splits for a user (both created and participated)
   * @param walletAddress - User wallet address
   * @param options - Query options
   * @returns Array of splits (combined from created and participated) with enriched data
   */
  public async getSplits(
    walletAddress: string,
    options?: { status?: string; limit?: number; skip?: number }
  ): Promise<any[]> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedAddress)) {
        throw new Error('Invalid wallet address format');
      }

      // Get splits created by user
      const createdSplits = await Split.findByCreator(normalizedAddress, options);

      // Get splits where user is a participant
      const participantSplits = await Split.findByParticipant(normalizedAddress, options);

      // Combine both arrays and remove duplicates (by splitId)
      const splitMap = new Map<number, ISplit>();

      // Add created splits
      createdSplits.forEach((split) => {
        splitMap.set(split.splitId, split);
      });

      // Add participant splits (will overwrite if duplicate, but they should be the same)
      participantSplits.forEach((split) => {
        splitMap.set(split.splitId, split);
      });

      // Convert map to array and sort by creation date (newest first)
      const allSplits = Array.from(splitMap.values()).sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      // Apply limit and skip if provided
      let result = allSplits;
      if (options?.skip) {
        result = result.slice(options.skip);
      }
      if (options?.limit) {
        result = result.slice(0, options.limit);
      }

      // Enrich splits with creator info and payment status
      const enrichedSplits = await Promise.all(
        result.map(async (split) => {
          const isCreator = split.creatorAddress.toLowerCase() === normalizedAddress;
          
          // Get creator info if not the requester
          let creatorName: string | undefined;
          let creatorAddress: string | undefined;
          if (!isCreator) {
            const creator = await usersModel.findByWallet(split.creatorAddress);
            creatorName = creator?.displayName;
            creatorAddress = split.creatorAddress;
          }
          
          // Find requester's participant entry
          const requesterParticipant = split.participants.find(
            (p) => p.walletAddress.toLowerCase() === normalizedAddress
          );
          
          // Determine youPaid: true if creator, otherwise based on participant's hasPaid
          const youPaid = isCreator ? true : (requesterParticipant?.hasPaid || false);
          
          // Add paid field to requester's participant entry if they are a participant
          const enrichedParticipants = split.participants.map((p) => {
            const participantObj = (p as any).toObject ? (p as any).toObject() : { ...p };
            if (p.walletAddress.toLowerCase() === normalizedAddress) {
              return {
                ...participantObj,
                paid: p.hasPaid,
              };
            }
            return participantObj;
          });
          
          // Handle both Mongoose documents and plain objects (from .lean())
          const splitObj = typeof (split as any).toObject === 'function' 
            ? (split as any).toObject() 
            : { ...split };
          
          return {
            ...splitObj,
            isCreator,
            creatorName: isCreator ? undefined : creatorName,
            creatorAddress: isCreator ? undefined : creatorAddress,
            youPaid,
            participants: enrichedParticipants,
          };
        })
      );

      return enrichedSplits;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get splits: ' + String(error));
    }
  }
}

// Create and export a singleton instance
const splitService = new SplitService();
export default splitService;
