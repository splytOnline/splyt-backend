/**
 * 🚀 Split Model - Production-Ready Mongoose Schema
 * 
 * Optimized for handling millions of records with comprehensive indexing strategy.
 * Built for Splyt backend - Web3 split payment platform.
 */

import mongoose, { Document, Model, Schema } from 'mongoose';

// ==================================================
// TypeScript Interfaces
// ==================================================

export interface IParticipant {
  walletAddress: string;      // "0x..." - participant's wallet
  name?: string;             // Display name (optional)
  amountDue: number;         // Their share (e.g., 25.00)
  hasPaid: boolean;          // Payment status
  paidAt?: Date;             // When they paid
  paymentTxHash?: string;    // Payment transaction hash
  reminderCount: number;     // How many reminders sent
  lastRemindedAt?: Date;     // Last reminder timestamp
}

export interface ISplit extends Document {
  // On-chain reference
  splitId: number;                    // ID from SplitFactory contract (unique)
  contractAddress: string;            // Deployed Split.sol address
  txHash: string;                     // Creation transaction hash
  blockNumber: number;                // Block when created
  isConfirmed: boolean;               // Has blockchain confirmed it?
  
  // Core data
  creatorAddress: string;             // Wallet that created the split
  description: string;                // "Dinner at Joe's"
  totalAmount: number;                // Total USDC amount (e.g., 100.00)
  currency: string;                  // "USDC" (default, future-proofing)
  
  // Status
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  isCompleted: boolean;
  isCancelled: boolean;
  
  // Participants (embedded for fast reads)
  participants: IParticipant[];
  
  // Metadata
  category?: 'food' | 'travel' | 'rent' | 'utilities' | 'entertainment' | 'other';
  note?: string;                     // Extra notes
  imageUrl?: string;                  // Optional receipt photo
  
  // Timestamps
  createdAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  expiresAt?: Date;                  // Auto-cancel after X days
  updatedAt: Date;
  
  // Virtuals
  readonly totalPaid: number;         // Sum of all paid amounts
  readonly totalUnpaid: number;      // Sum of all unpaid amounts
  readonly paidCount: number;        // Number of participants who paid
  readonly unpaidCount: number;      // Number of participants who haven't paid
  readonly isExpired: boolean;        // Check if split has expired
  readonly completionPercentage: number; // Percentage of payment completion
  
  // Methods
  markParticipantPaid(walletAddress: string, txHash: string): Promise<ISplit>;
  addParticipant(participant: IParticipant): Promise<ISplit>;
  removeParticipant(walletAddress: string): Promise<ISplit>;
  updateStatus(newStatus: 'pending' | 'active' | 'completed' | 'cancelled'): Promise<ISplit>;
  sendReminder(walletAddress: string): Promise<ISplit>;
  checkAndUpdateCompletion(): Promise<ISplit>;
}

// ==================================================
// Participant Subdocument Schema
// ==================================================

const ParticipantSchema = new Schema<IParticipant>(
  {
    walletAddress: {
      type: String,
      required: [true, 'Participant wallet address is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: 'Invalid Ethereum wallet address format'
      }
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    amountDue: {
      type: Number,
      required: [true, 'Amount due is required'],
      min: [0, 'Amount due cannot be negative']
    },
    hasPaid: {
      type: Boolean,
      default: false
    },
    paidAt: {
      type: Date
    },
    paymentTxHash: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string | undefined) {
          if (!v) return true;
          return /^0x[a-fA-F0-9]{64}$/.test(v); // Ethereum tx hash format
        },
        message: 'Invalid transaction hash format'
      }
    },
    reminderCount: {
      type: Number,
      default: 0,
      min: [0, 'Reminder count cannot be negative']
    },
    lastRemindedAt: {
      type: Date
    }
  },
  {
    _id: false // Don't create _id for subdocuments
  }
);

// ==================================================
// Split Schema Definition
// ==================================================

const SplitSchema: Schema<ISplit> = new Schema<ISplit>(
  {
    // On-chain reference
    splitId: {
      type: Number,
      required: [true, 'Split ID is required'],
      unique: true,
      index: true,
      min: [0, 'Split ID cannot be negative']
    },
    contractAddress: {
      type: String,
      required: [true, 'Contract address is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: 'Invalid contract address format'
      },
      index: true
    },
    txHash: {
      type: String,
      required: [true, 'Transaction hash is required'],
      unique: true,
      trim: true,
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
    isConfirmed: {
      type: Boolean,
      default: false,
      index: true
    },
    
    // Core data
    creatorAddress: {
      type: String,
      required: [true, 'Creator address is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: 'Invalid creator wallet address format'
      },
      index: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [1, 'Description must be at least 1 character'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
      index: 'text' // Text search index
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0.01, 'Total amount must be at least 0.01'],
      index: true // For filtering by amount ranges
    },
    currency: {
      type: String,
      default: 'USDC',
      trim: true,
      uppercase: true,
      enum: ['USDC', 'USDT', 'DAI', 'ETH'], // Future-proofing
      index: true
    },
    
    // Status
    status: {
      type: String,
      required: true,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'pending',
      index: true
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true
    },
    isCancelled: {
      type: Boolean,
      default: false,
      index: true
    },
    
    // Participants
    participants: {
      type: [ParticipantSchema],
      required: [true, 'At least one participant is required'],
      validate: {
        validator: function(v: IParticipant[]) {
          return v.length > 0 && v.length <= 50; // Max 50 participants
        },
        message: 'Split must have between 1 and 50 participants'
      }
    },
    
    // Metadata
    category: {
      type: String,
      enum: ['food', 'travel', 'rent', 'utilities', 'entertainment', 'other'],
      index: true
    },
    note: {
      type: String,
      trim: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters']
    },
    imageUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string | undefined) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Image URL must be a valid HTTP/HTTPS URL'
      }
    },
    
    // Timestamps
    completedAt: {
      type: Date,
      index: true
    },
    cancelledAt: {
      type: Date
    },
    expiresAt: {
      type: Date,
      index: true // For finding expired splits
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'splits',
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
SplitSchema.index({ splitId: 1 }, { unique: true, name: 'splitId_unique' });
SplitSchema.index({ txHash: 1 }, { unique: true, name: 'txHash_unique' });
SplitSchema.index({ contractAddress: 1 }, { name: 'contractAddress_index' });
SplitSchema.index({ creatorAddress: 1 }, { name: 'creatorAddress_index' });
SplitSchema.index({ status: 1 }, { name: 'status_index' });
SplitSchema.index({ isConfirmed: 1 }, { name: 'isConfirmed_index' });
SplitSchema.index({ isCompleted: 1 }, { name: 'isCompleted_index' });
SplitSchema.index({ isCancelled: 1 }, { name: 'isCancelled_index' });
SplitSchema.index({ createdAt: -1 }, { name: 'createdAt_desc' });
SplitSchema.index({ completedAt: -1 }, { name: 'completedAt_desc' });
SplitSchema.index({ expiresAt: 1 }, { name: 'expiresAt_asc' });
SplitSchema.index({ totalAmount: -1 }, { name: 'totalAmount_desc' });
SplitSchema.index({ currency: 1 }, { name: 'currency_index' });
SplitSchema.index({ category: 1 }, { name: 'category_index' });
SplitSchema.index({ blockNumber: -1 }, { name: 'blockNumber_desc' });

/**
 * Compound Indexes - For Complex Queries
 */
// Find splits by creator, sorted by creation date
SplitSchema.index(
  { creatorAddress: 1, createdAt: -1 },
  { name: 'creator_created_composite' }
);

// Find active splits by creator
SplitSchema.index(
  { creatorAddress: 1, status: 1, createdAt: -1 },
  { name: 'creator_status_composite' }
);

// Find splits by status and creation date (for dashboard)
SplitSchema.index(
  { status: 1, createdAt: -1 },
  { name: 'status_created_composite' }
);

// Find completed splits sorted by completion date
SplitSchema.index(
  { isCompleted: 1, completedAt: -1 },
  { name: 'completed_date_composite' }
);

// Find unconfirmed splits (for blockchain sync)
SplitSchema.index(
  { isConfirmed: 1, blockNumber: 1 },
  { name: 'unconfirmed_block_composite' }
);

// Find expired splits that need cancellation
SplitSchema.index(
  { expiresAt: 1, status: 1 },
  { name: 'expired_status_composite' }
);

// Find splits by amount range and status
SplitSchema.index(
  { totalAmount: -1, status: 1 },
  { name: 'amount_status_composite' }
);

// Find splits by category and status
SplitSchema.index(
  { category: 1, status: 1, createdAt: -1 },
  { name: 'category_status_composite' }
);

// Text search index (already defined in description field)
SplitSchema.index(
  { description: 'text', note: 'text' },
  {
    name: 'split_search_text',
    weights: { description: 10, note: 5 }
  }
);

// ==================================================
// Virtual Properties
// ==================================================

SplitSchema.virtual('totalPaid').get(function(this: ISplit) {
  return this.participants
    .filter(p => p.hasPaid)
    .reduce((sum, p) => sum + p.amountDue, 0);
});

SplitSchema.virtual('totalUnpaid').get(function(this: ISplit) {
  return this.participants
    .filter(p => !p.hasPaid)
    .reduce((sum, p) => sum + p.amountDue, 0);
});

SplitSchema.virtual('paidCount').get(function(this: ISplit) {
  return this.participants.filter(p => p.hasPaid).length;
});

SplitSchema.virtual('unpaidCount').get(function(this: ISplit) {
  return this.participants.filter(p => !p.hasPaid).length;
});

SplitSchema.virtual('isExpired').get(function(this: ISplit) {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

SplitSchema.virtual('completionPercentage').get(function(this: ISplit) {
  if (this.totalAmount === 0) return 0;
  return Math.round((this.totalPaid / this.totalAmount) * 100);
});

// ==================================================
// Instance Methods
// ==================================================

/**
 * Mark a participant as paid
 */
SplitSchema.methods.markParticipantPaid = async function(
  this: ISplit,
  walletAddress: string,
  txHash: string
): Promise<ISplit> {
  const participant = this.participants.find(
    p => p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  );
  
  if (!participant) {
    throw new Error(`Participant with wallet ${walletAddress} not found`);
  }
  
  if (participant.hasPaid) {
    throw new Error(`Participant ${walletAddress} has already paid`);
  }
  
  participant.hasPaid = true;
  participant.paidAt = new Date();
  participant.paymentTxHash = txHash;
  
  // Check if all participants have paid
  await this.checkAndUpdateCompletion();
  
  return this.save();
};

/**
 * Add a new participant to the split
 */
SplitSchema.methods.addParticipant = async function(
  this: ISplit,
  participant: IParticipant
): Promise<ISplit> {
  if (this.isCompleted || this.isCancelled) {
    throw new Error('Cannot add participants to completed or cancelled split');
  }
  
  // Check if participant already exists
  const exists = this.participants.some(
    p => p.walletAddress.toLowerCase() === participant.walletAddress.toLowerCase()
  );
  
  if (exists) {
    throw new Error('Participant already exists in this split');
  }
  
  // Validate wallet address
  if (!/^0x[a-fA-F0-9]{40}$/.test(participant.walletAddress)) {
    throw new Error('Invalid wallet address format');
  }
  
  participant.walletAddress = participant.walletAddress.toLowerCase();
  this.participants.push(participant);
  
  // Recalculate total amount (optional - could be set manually)
  // this.totalAmount = this.participants.reduce((sum, p) => sum + p.amountDue, 0);
  
  return this.save();
};

/**
 * Remove a participant from the split
 */
SplitSchema.methods.removeParticipant = async function(
  this: ISplit,
  walletAddress: string
): Promise<ISplit> {
  if (this.isCompleted || this.isCancelled) {
    throw new Error('Cannot remove participants from completed or cancelled split');
  }
  
  const index = this.participants.findIndex(
    p => p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  );
  
  if (index === -1) {
    throw new Error('Participant not found in this split');
  }
  
  if (this.participants[index].hasPaid) {
    throw new Error('Cannot remove participant who has already paid');
  }
  
  this.participants.splice(index, 1);
  
  if (this.participants.length === 0) {
    throw new Error('Cannot remove last participant from split');
  }
  
  return this.save();
};

/**
 * Update split status
 */
SplitSchema.methods.updateStatus = async function(
  this: ISplit,
  newStatus: 'pending' | 'active' | 'completed' | 'cancelled'
): Promise<ISplit> {
  this.status = newStatus;
  this.isCompleted = newStatus === 'completed';
  this.isCancelled = newStatus === 'cancelled';
  
  if (newStatus === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  if (newStatus === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
  
  return this.save();
};

/**
 * Send a reminder to a participant
 */
SplitSchema.methods.sendReminder = async function(
  this: ISplit,
  walletAddress: string
): Promise<ISplit> {
  const participant = this.participants.find(
    p => p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  );
  
  if (!participant) {
    throw new Error(`Participant with wallet ${walletAddress} not found`);
  }
  
  if (participant.hasPaid) {
    throw new Error('Cannot send reminder to participant who has already paid');
  }
  
  participant.reminderCount += 1;
  participant.lastRemindedAt = new Date();
  
  return this.save();
};

/**
 * Check if all participants have paid and update status accordingly
 */
SplitSchema.methods.checkAndUpdateCompletion = async function(
  this: ISplit
): Promise<ISplit> {
  const allPaid = this.participants.every(p => p.hasPaid);
  
  if (allPaid && this.participants.length > 0 && !this.isCompleted) {
    await this.updateStatus('completed');
  }
  
  return this;
};

// ==================================================
// Static Methods
// ==================================================

/**
 * Find split by splitId (from contract)
 */
SplitSchema.statics.findBySplitId = async function(splitId: number): Promise<ISplit | null> {
  return this.findOne({ splitId });
};

/**
 * Find split by transaction hash
 */
SplitSchema.statics.findByTxHash = async function(txHash: string): Promise<ISplit | null> {
  return this.findOne({ txHash: txHash.toLowerCase() });
};

/**
 * Find splits by creator address
 */
SplitSchema.statics.findByCreator = async function(
  creatorAddress: string,
  options?: { status?: string; limit?: number; skip?: number }
): Promise<ISplit[]> {
  const query: any = { creatorAddress: creatorAddress.toLowerCase() };
  
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
 * Find splits where user is a participant
 */
SplitSchema.statics.findByParticipant = async function(
  walletAddress: string,
  options?: { status?: string; limit?: number; skip?: number }
): Promise<ISplit[]> {
  const query: any = {
    'participants.walletAddress': walletAddress.toLowerCase()
  };
  
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
 * Find active splits (not completed or cancelled)
 */
SplitSchema.statics.findActive = async function(limit: number = 50): Promise<ISplit[]> {
  return this.find({
    status: { $in: ['pending', 'active'] },
    isCompleted: false,
    isCancelled: false
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Find expired splits that need cancellation
 */
SplitSchema.statics.findExpired = async function(): Promise<ISplit[]> {
  return this.find({
    expiresAt: { $lt: new Date() },
    status: { $in: ['pending', 'active'] },
    isCancelled: false
  })
    .sort({ expiresAt: 1 })
    .lean();
};

/**
 * Find unconfirmed splits (for blockchain sync)
 */
SplitSchema.statics.findUnconfirmed = async function(limit: number = 100): Promise<ISplit[]> {
  return this.find({
    isConfirmed: false
  })
    .sort({ blockNumber: 1 })
    .limit(limit)
    .lean();
};

/**
 * Get splits by category
 */
SplitSchema.statics.findByCategory = async function(
  category: string,
  limit: number = 50
): Promise<ISplit[]> {
  return this.find({ category })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Search splits by text (description, note)
 */
SplitSchema.statics.search = async function(
  searchTerm: string,
  limit: number = 50
): Promise<ISplit[]> {
  return this.find({ $text: { $search: searchTerm } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean();
};

// ==================================================
// Pre/Post Hooks
// ==================================================

/**
 * Pre-save hook: Normalize addresses to lowercase
 */
SplitSchema.pre('save', function(next) {
  if (this.isModified('creatorAddress')) {
    this.creatorAddress = this.creatorAddress.toLowerCase();
  }
  if (this.isModified('contractAddress')) {
    this.contractAddress = this.contractAddress.toLowerCase();
  }
  if (this.isModified('txHash')) {
    this.txHash = this.txHash.toLowerCase();
  }
  if (this.isModified('participants')) {
    this.participants.forEach(p => {
      p.walletAddress = p.walletAddress.toLowerCase();
      if (p.paymentTxHash) {
        p.paymentTxHash = p.paymentTxHash.toLowerCase();
      }
    });
  }
  next();
});

/**
 * Pre-save hook: Validate total amount matches participant amounts
 */
SplitSchema.pre('save', function(next) {
  if (this.isModified('participants') || this.isModified('totalAmount')) {
    const calculatedTotal = this.participants.reduce(
      (sum, p) => sum + p.amountDue,
      0
    );
    
    // Allow small floating point differences (0.01)
    if (Math.abs(calculatedTotal - this.totalAmount) > 0.01) {
      // Warn but don't fail - totalAmount might be set manually
      console.warn(
        `Split ${this.splitId}: Total amount (${this.totalAmount}) doesn't match sum of participant amounts (${calculatedTotal})`
      );
    }
  }
  next();
});

/**
 * Pre-save hook: Set default expiresAt if not set (e.g., 30 days from creation)
 */
SplitSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Default 30 days
    this.expiresAt = expiryDate;
  }
  next();
});

// ==================================================
// Export Model
// ==================================================

// Add static methods to the interface
interface ISplitModel extends Model<ISplit> {
  findBySplitId(splitId: number): Promise<ISplit | null>;
  findByTxHash(txHash: string): Promise<ISplit | null>;
  findByCreator(creatorAddress: string, options?: { status?: string; limit?: number; skip?: number }): Promise<ISplit[]>;
  findByParticipant(walletAddress: string, options?: { status?: string; limit?: number; skip?: number }): Promise<ISplit[]>;
  findActive(limit?: number): Promise<ISplit[]>;
  findExpired(): Promise<ISplit[]>;
  findUnconfirmed(limit?: number): Promise<ISplit[]>;
  findByCategory(category: string, limit?: number): Promise<ISplit[]>;
  search(searchTerm: string, limit?: number): Promise<ISplit[]>;
}

export const Split: ISplitModel = mongoose.model<ISplit, ISplitModel>('Split', SplitSchema);

export default Split;
