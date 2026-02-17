/**
 * 🚀 Split Service
 * 
 * Handles business logic for split operations.
 * Built for Splyt backend - Web3 split payment platform.
 */

import Split, { ISplit, IParticipant } from '../../models/split.model';
import usersModel from '../../models/users.model';
import { Types } from 'mongoose';

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
  ): Promise<{ splitId: number; contractAddress: string }> {
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
      let splitId = maxSplit ? maxSplit.splitId + 1 : 1;

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

      // TODO: Replace with real blockchain function calls
      // - Deploy Split contract and get contractAddress
      // - Get txHash from blockchain transaction
      // - Get blockNumber from blockchain
      // - Verify isConfirmed from blockchain confirmation
      
      // Mock blockchain data for now
      const mockContractAddress = "0x0000000000000000000000000000000000000000"; // TODO: Get from blockchain deployment
      const mockTxHash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(""); // TODO: Get from blockchain transaction
      const mockBlockNumber = Math.floor(Math.random() * 1000000) + 18000000; // TODO: Get from blockchain
      const mockIsConfirmed = false; // TODO: Get from blockchain confirmation

      // Check if txHash already exists (shouldn't happen with mocked data, but safety check)
      let finalTxHash = mockTxHash;
      const existingTx = await Split.findByTxHash(finalTxHash);
      if (existingTx) {
        // Regenerate if collision (unlikely but possible)
        finalTxHash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("");
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
        splitId: splitId,
        contractAddress: mockContractAddress.toLowerCase(),
        txHash: finalTxHash.toLowerCase(),
        blockNumber: mockBlockNumber,
        isConfirmed: mockIsConfirmed,
        creatorAddress: normalizedCreator,
        description: splitData.description,
        totalAmount: splitData.totalAmount,
        currency: 'USDC', // Default currency
        status: mockIsConfirmed ? 'active' : 'pending',
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

      // Return only splitId and contractAddress
      return {
        splitId: split.splitId,
        contractAddress: split.contractAddress,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create split: ' + String(error));
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
   * @returns Array of splits
   */
  public async getSplitsByParticipant(
    walletAddress: string,
    options?: { status?: string; limit?: number; skip?: number }
  ): Promise<ISplit[]> {
    return Split.findByParticipant(walletAddress.toLowerCase(), options);
  }
}

// Create and export a singleton instance
const splitService = new SplitService();
export default splitService;
