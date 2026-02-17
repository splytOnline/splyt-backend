/**
 * 🚀 Transaction Logs Model - Production-Ready Mongoose Schema
 * 
 * Optimized for handling millions of transaction records with comprehensive indexing strategy.
 * Built for Splyt backend - Web3 split payment platform.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// ==================================================
// TypeScript Interface
// ==================================================

export interface ITransactionLog extends Document {
  // Reference
  splitId: Types.ObjectId;          // Which split (reference to Split model)
  walletAddress: string;            // Who did the transaction
  
  // On-chain data
  txHash: string;                    // Transaction hash (unique)
  blockNumber: number;               // Block number
  blockTimestamp: Date;              // Block timestamp
  
  // Transaction details
  type: 'payment' | 'refund' | 'completion' | 'creation';
  amount: number;                    // USDC amount
  gasUsed: number;                   // Gas used (we pay this)
  gasPrice?: number;                  // Gas price (optional)
  gasCost?: number;                   // Total gas cost in ETH/USDC
  
  // Status
  status: 'pending' | 'success' | 'failed' | 'reverted';
  errorMessage?: string;             // If failed, why
  confirmations?: number;             // Number of confirmations
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  readonly isConfirmed: boolean;     // Check if transaction is confirmed (>= 12 confirmations)
  readonly isFinal: boolean;         // Check if transaction is final (success or failed, not pending)
}

// ==================================================
// Mongoose Schema Definition
// ==================================================

const TransactionLogSchema: Schema<ITransactionLog> = new Schema<ITransactionLog>(
  {
    // Reference
    splitId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Split ID is required'],
      ref: 'Split',
      index: true
    },
    walletAddress: {
      type: String,
      required: [true, 'Wallet address is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: 'Invalid Ethereum wallet address format'
      },
      index: true
    },
    
    // On-chain data
    txHash: {
      type: String,
      required: [true, 'Transaction hash is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          return /^0x[a-fA-F0-9]{64}$/.test(v);
        },
        message: 'Invalid transaction hash format'
      },
      index: true
    },
    blockNumber: {
      type: Number,
      required: [true, 'Block number is required'],
      min: [0, 'Block number cannot be negative'],
      index: true
    },
    blockTimestamp: {
      type: Date,
      required: [true, 'Block timestamp is required'],
      index: true
    },
    
    // Transaction details
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: ['payment', 'refund', 'completion', 'creation'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
      index: true
    },
    gasUsed: {
      type: Number,
      required: [true, 'Gas used is required'],
      min: [0, 'Gas used cannot be negative']
    },
    gasPrice: {
      type: Number,
      min: [0, 'Gas price cannot be negative']
    },
    gasCost: {
      type: Number,
      min: [0, 'Gas cost cannot be negative']
    },
    
    // Status
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['pending', 'success', 'failed', 'reverted'],
      default: 'pending',
      index: true
    },
    errorMessage: {
      type: String,
      trim: true,
      maxlength: [1000, 'Error message cannot exceed 1000 characters']
    },
    confirmations: {
      type: Number,
      default: 0,
      min: [0, 'Confirmations cannot be negative'],
      index: true
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'transaction_logs',
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        if ('__v' in ret) {
          delete (ret as any).__v;
        }
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

// ==================================================
// Indexes - Optimized for Millions of Records
// ==================================================

/**
 * Primary Indexes (Single Field)
 */
TransactionLogSchema.index({ txHash: 1 }, { unique: true, name: 'txHash_unique' });
TransactionLogSchema.index({ splitId: 1 }, { name: 'splitId_index' });
TransactionLogSchema.index({ walletAddress: 1 }, { name: 'walletAddress_index' });
TransactionLogSchema.index({ status: 1 }, { name: 'status_index' });
TransactionLogSchema.index({ type: 1 }, { name: 'type_index' });
TransactionLogSchema.index({ createdAt: -1 }, { name: 'createdAt_desc' });
TransactionLogSchema.index({ blockNumber: -1 }, { name: 'blockNumber_desc' });
TransactionLogSchema.index({ blockTimestamp: -1 }, { name: 'blockTimestamp_desc' });
TransactionLogSchema.index({ confirmations: 1 }, { name: 'confirmations_index' });
TransactionLogSchema.index({ amount: -1 }, { name: 'amount_desc' });

/**
 * Compound Indexes - For Complex Queries
 */
// Find transactions by split, sorted by creation date
TransactionLogSchema.index(
  { splitId: 1, createdAt: -1 },
  { name: 'split_created_composite' }
);

// Find transactions by wallet, sorted by date
TransactionLogSchema.index(
  { walletAddress: 1, createdAt: -1 },
  { name: 'wallet_created_composite' }
);

// Find transactions by split and type
TransactionLogSchema.index(
  { splitId: 1, type: 1, createdAt: -1 },
  { name: 'split_type_composite' }
);

// Find transactions by wallet and type
TransactionLogSchema.index(
  { walletAddress: 1, type: 1, createdAt: -1 },
  { name: 'wallet_type_composite' }
);

// Find pending transactions by split
TransactionLogSchema.index(
  { splitId: 1, status: 1, createdAt: -1 },
  { name: 'split_status_composite' }
);

// Find pending transactions (for monitoring)
TransactionLogSchema.index(
  { status: 1, createdAt: -1 },
  { name: 'pending_status_composite' }
);

// Find failed transactions
TransactionLogSchema.index(
  { status: 1, type: 1, createdAt: -1 },
  { name: 'failed_transactions_composite' }
);

// Find transactions by block number (for blockchain sync)
TransactionLogSchema.index(
  { blockNumber: -1, status: 1 },
  { name: 'block_status_composite' }
);

// Find unconfirmed transactions (for confirmation monitoring)
TransactionLogSchema.index(
  { confirmations: 1, status: 1, createdAt: -1 },
  { name: 'unconfirmed_composite' }
);

// Find transactions by amount range and type
TransactionLogSchema.index(
  { amount: -1, type: 1, createdAt: -1 },
  { name: 'amount_type_composite' }
);

// ==================================================
// Virtual Properties
// ==================================================

TransactionLogSchema.virtual('isConfirmed').get(function(this: ITransactionLog) {
  return this.confirmations !== undefined && this.confirmations >= 12;
});

TransactionLogSchema.virtual('isFinal').get(function(this: ITransactionLog) {
  return this.status === 'success' || this.status === 'failed' || this.status === 'reverted';
});

// ==================================================
// Instance Methods
// ==================================================

/**
 * Update transaction status
 */
TransactionLogSchema.methods.updateStatus = async function(
  this: ITransactionLog,
  newStatus: 'pending' | 'success' | 'failed' | 'reverted',
  errorMessage?: string
): Promise<ITransactionLog> {
  this.status = newStatus;
  if (errorMessage) {
    this.errorMessage = errorMessage;
  }
  return this.save();
};

/**
 * Update confirmation count
 */
TransactionLogSchema.methods.updateConfirmations = async function(
  this: ITransactionLog,
  confirmations: number
): Promise<ITransactionLog> {
  this.confirmations = confirmations;
  
  // Auto-update status if confirmed and still pending
  if (confirmations >= 12 && this.status === 'pending') {
    this.status = 'success';
  }
  
  return this.save();
};

// ==================================================
// Static Methods
// ==================================================

/**
 * Find transaction by hash
 */
TransactionLogSchema.statics.findByTxHash = async function(txHash: string): Promise<ITransactionLog | null> {
  return this.findOne({ txHash: txHash.toLowerCase() });
};

/**
 * Find transactions by split ID
 */
TransactionLogSchema.statics.findBySplitId = async function(
  splitId: Types.ObjectId | string,
  options?: { type?: string; status?: string; limit?: number; skip?: number }
): Promise<ITransactionLog[]> {
  const query: any = { splitId };
  
  if (options?.type) {
    query.type = options.type;
  }
  
  if (options?.status) {
    query.status = options.status;
  }
  
  let queryBuilder = this.find(query).sort({ createdAt: -1 });
  
  if (options?.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }
  
  if (options?.skip) {
    queryBuilder = queryBuilder.skip(options.skip);
  }
  
  return queryBuilder.lean();
};

/**
 * Find transactions by wallet address
 */
TransactionLogSchema.statics.findByWallet = async function(
  walletAddress: string,
  options?: { type?: string; status?: string; limit?: number; skip?: number }
): Promise<ITransactionLog[]> {
  const query: any = { walletAddress: walletAddress.toLowerCase() };
  
  if (options?.type) {
    query.type = options.type;
  }
  
  if (options?.status) {
    query.status = options.status;
  }
  
  let queryBuilder = this.find(query).sort({ createdAt: -1 });
  
  if (options?.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }
  
  if (options?.skip) {
    queryBuilder = queryBuilder.skip(options.skip);
  }
  
  return queryBuilder.lean();
};

/**
 * Find pending transactions
 */
TransactionLogSchema.statics.findPending = async function(limit: number = 100): Promise<ITransactionLog[]> {
  return this.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Find unconfirmed transactions (less than 12 confirmations)
 */
TransactionLogSchema.statics.findUnconfirmed = async function(limit: number = 100): Promise<ITransactionLog[]> {
  return this.find({
    status: { $in: ['pending', 'success'] },
    $or: [
      { confirmations: { $lt: 12 } },
      { confirmations: { $exists: false } }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Find failed transactions
 */
TransactionLogSchema.statics.findFailed = async function(
  limit: number = 100,
  days?: number
): Promise<ITransactionLog[]> {
  const query: any = {
    status: { $in: ['failed', 'reverted'] }
  };
  
  if (days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    query.createdAt = { $gte: cutoffDate };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Find transactions by type
 */
TransactionLogSchema.statics.findByType = async function(
  type: 'payment' | 'refund' | 'completion' | 'creation',
  limit: number = 100
): Promise<ITransactionLog[]> {
  return this.find({ type })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get transaction statistics for a split
 */
TransactionLogSchema.statics.getSplitStats = async function(
  splitId: Types.ObjectId | string
): Promise<{
  totalTransactions: number;
  successfulPayments: number;
  totalAmount: number;
  totalGasUsed: number;
  failedCount: number;
}> {
  const transactions = await this.find({ splitId }).lean() as ITransactionLog[];
  
  return {
    totalTransactions: transactions.length,
    successfulPayments: transactions.filter(
      (t: ITransactionLog) => t.type === 'payment' && t.status === 'success'
    ).length,
    totalAmount: transactions
      .filter((t: ITransactionLog) => t.status === 'success')
      .reduce((sum: number, t: ITransactionLog) => sum + t.amount, 0),
    totalGasUsed: transactions.reduce((sum: number, t: ITransactionLog) => sum + (t.gasUsed || 0), 0),
    failedCount: transactions.filter((t: ITransactionLog) => t.status === 'failed' || t.status === 'reverted').length
  };
};

/**
 * Get transaction statistics for a wallet
 */
TransactionLogSchema.statics.getWalletStats = async function(
  walletAddress: string
): Promise<{
  totalTransactions: number;
  successfulPayments: number;
  totalAmount: number;
  totalGasUsed: number;
  failedCount: number;
}> {
  const transactions = await this.find({ walletAddress: walletAddress.toLowerCase() }).lean() as ITransactionLog[];
  
  return {
    totalTransactions: transactions.length,
    successfulPayments: transactions.filter(
      (t: ITransactionLog) => t.type === 'payment' && t.status === 'success'
    ).length,
    totalAmount: transactions
      .filter((t: ITransactionLog) => t.status === 'success')
      .reduce((sum: number, t: ITransactionLog) => sum + t.amount, 0),
    totalGasUsed: transactions.reduce((sum: number, t: ITransactionLog) => sum + (t.gasUsed || 0), 0),
    failedCount: transactions.filter((t: ITransactionLog) => t.status === 'failed' || t.status === 'reverted').length
  };
};

// ==================================================
// Pre/Post Hooks
// ==================================================

/**
 * Pre-save hook: Normalize addresses and hashes to lowercase
 */
TransactionLogSchema.pre('save', function(next) {
  if (this.isModified('walletAddress')) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }
  if (this.isModified('txHash')) {
    this.txHash = this.txHash.toLowerCase();
  }
  next();
});

/**
 * Pre-save hook: Calculate gas cost if gasPrice and gasUsed are available
 */
TransactionLogSchema.pre('save', function(next) {
  if (this.isModified('gasUsed') || this.isModified('gasPrice')) {
    if (this.gasUsed && this.gasPrice) {
      // gasCost = gasUsed * gasPrice (in wei, convert to ETH if needed)
      this.gasCost = (this.gasUsed * this.gasPrice) / 1e18; // Convert from wei to ETH
    }
  }
  next();
});

// ==================================================
// Export Model
// ==================================================

// Add static methods to the interface
interface ITransactionLogModel extends Model<ITransactionLog> {
  findByTxHash(txHash: string): Promise<ITransactionLog | null>;
  findBySplitId(splitId: Types.ObjectId | string, options?: { type?: string; status?: string; limit?: number; skip?: number }): Promise<ITransactionLog[]>;
  findByWallet(walletAddress: string, options?: { type?: string; status?: string; limit?: number; skip?: number }): Promise<ITransactionLog[]>;
  findPending(limit?: number): Promise<ITransactionLog[]>;
  findUnconfirmed(limit?: number): Promise<ITransactionLog[]>;
  findFailed(limit?: number, days?: number): Promise<ITransactionLog[]>;
  findByType(type: 'payment' | 'refund' | 'completion' | 'creation', limit?: number): Promise<ITransactionLog[]>;
  getSplitStats(splitId: Types.ObjectId | string): Promise<{
    totalTransactions: number;
    successfulPayments: number;
    totalAmount: number;
    totalGasUsed: number;
    failedCount: number;
  }>;
  getWalletStats(walletAddress: string): Promise<{
    totalTransactions: number;
    successfulPayments: number;
    totalAmount: number;
    totalGasUsed: number;
    failedCount: number;
  }>;
}

export const TransactionLog: ITransactionLogModel = mongoose.model<ITransactionLog, ITransactionLogModel>(
  'TransactionLog',
  TransactionLogSchema
);

export default TransactionLog;
