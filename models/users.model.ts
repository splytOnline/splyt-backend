/**
 * 🚀 User Model - Production-Ready Mongoose Schema
 * 
 * Optimized for handling millions of records with comprehensive indexing strategy.
 * Built for Splyt backend - Web3 split payment platform.
 */

import mongoose, { Document, Model, Schema } from 'mongoose';

// ==================================================
// TypeScript Interface
// ==================================================

export interface IUser extends Document {
  // Identity
  walletAddress: string;           // Primary identifier (unique, indexed)
  displayName: string;             // User's display name
  email?: string;                  // Optional email for AA login
  username?: string;               // Optional username
  avatarUrl?: string;              // Optional profile picture URL
  
  // Stats
  totalSplitsCreated: number;      // Total splits user created
  totalSplitsJoined: number;       // Total splits user participated in
  totalAmountSplit: number;        // Lifetime USDC volume split
  
  // Timestamps
  createdAt: Date;
  lastActiveAt: Date;
  updatedAt: Date;
  
  // Virtuals
  readonly isActive: boolean;      // Virtual: checks if user was active recently
  
  // Methods
  updateActivity(): Promise<IUser>;
  incrementSplitCreated(): Promise<IUser>;
  incrementSplitJoined(amount: number): Promise<IUser>;
}

// ==================================================
// Mongoose Schema Definition
// ==================================================

const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    // Identity Fields
    walletAddress: {
      type: String,
      required: [true, 'Wallet address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      validate: {
        validator: function(v: string) {
          // Basic Ethereum address validation (0x followed by 40 hex chars)
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: 'Invalid Ethereum wallet address format'
      }
    },
    
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      minlength: [1, 'Display name must be at least 1 character'],
      maxlength: [100, 'Display name cannot exceed 100 characters'],
      index: true // For search/filter operations
    },
    
    email: {
      type: String,
      sparse: true, // Allows multiple null values but enforces uniqueness for non-null
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string | undefined) {
          if (!v) return true; // Optional field
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      }
    },
    
    username: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      validate: {
        validator: function(v: string | undefined) {
          if (!v) return true; // Optional field
          return /^[a-z0-9_]+$/.test(v); // Alphanumeric and underscores only
        },
        message: 'Username can only contain lowercase letters, numbers, and underscores'
      }
    },
    
    avatarUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string | undefined) {
          if (!v) return true; // Optional field
          return /^https?:\/\/.+/.test(v); // Must be a valid URL
        },
        message: 'Avatar URL must be a valid HTTP/HTTPS URL'
      }
    },
    
    // Stats Fields
    totalSplitsCreated: {
      type: Number,
      default: 0,
      min: [0, 'Total splits created cannot be negative'],
      index: true // For leaderboard queries
    },
    
    totalSplitsJoined: {
      type: Number,
      default: 0,
      min: [0, 'Total splits joined cannot be negative'],
      index: true // For leaderboard queries
    },
    
    totalAmountSplit: {
      type: Number,
      default: 0,
      min: [0, 'Total amount split cannot be negative'],
      index: true // For volume-based queries
    },
    
    // Timestamps
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true // For finding active users
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'users', // Explicit collection name
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        if ('__v' in ret) {
          delete (ret as any).__v; // Remove version key from JSON output
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
 * These are the most critical for performance at scale
 */
UserSchema.index({ walletAddress: 1 }, { unique: true, name: 'walletAddress_unique' });
UserSchema.index({ email: 1 }, { unique: true, sparse: true, name: 'email_unique_sparse' });
UserSchema.index({ username: 1 }, { unique: true, sparse: true, name: 'username_unique_sparse' });
UserSchema.index({ displayName: 1 }, { name: 'displayName_index' });
UserSchema.index({ createdAt: -1 }, { name: 'createdAt_desc' }); // Newest first
UserSchema.index({ lastActiveAt: -1 }, { name: 'lastActiveAt_desc' }); // Most active first

/**
 * Compound Indexes - For Complex Queries
 * These optimize common query patterns
 */
// For leaderboard queries (top users by splits created)
UserSchema.index(
  { totalSplitsCreated: -1, createdAt: -1 },
  { name: 'leaderboard_splits_created' }
);

// For leaderboard queries (top users by splits joined)
UserSchema.index(
  { totalSplitsJoined: -1, createdAt: -1 },
  { name: 'leaderboard_splits_joined' }
);

// For volume leaderboard (top users by amount split)
UserSchema.index(
  { totalAmountSplit: -1, createdAt: -1 },
  { name: 'leaderboard_volume' }
);

// For finding active users (recently active, sorted by activity)
UserSchema.index(
  { lastActiveAt: -1, totalSplitsJoined: -1 },
  { name: 'active_users_composite' }
);

// For search operations (displayName + username)
UserSchema.index(
  { displayName: 'text', username: 'text' },
  { 
    name: 'user_search_text',
    weights: { displayName: 10, username: 5 } // displayName has higher weight
  }
);

// For filtering by activity and stats
UserSchema.index(
  { lastActiveAt: -1, totalSplitsCreated: -1, totalSplitsJoined: -1 },
  { name: 'activity_stats_composite' }
);

// ==================================================
// Virtual Properties
// ==================================================

UserSchema.virtual('isActive').get(function(this: IUser) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.lastActiveAt >= thirtyDaysAgo;
});

// ==================================================
// Instance Methods
// ==================================================

/**
 * Updates the user's last active timestamp
 */
UserSchema.methods.updateActivity = async function(this: IUser): Promise<IUser> {
  this.lastActiveAt = new Date();
  return this.save();
};

/**
 * Increments the total splits created counter
 */
UserSchema.methods.incrementSplitCreated = async function(this: IUser): Promise<IUser> {
  this.totalSplitsCreated += 1;
  this.lastActiveAt = new Date();
  return this.save();
};

/**
 * Increments the total splits joined counter and adds to total amount split
 */
UserSchema.methods.incrementSplitJoined = async function(
  this: IUser,
  amount: number
): Promise<IUser> {
  this.totalSplitsJoined += 1;
  this.totalAmountSplit += amount;
  this.lastActiveAt = new Date();
  return this.save();
};

// ==================================================
// Static Methods
// ==================================================

/**
 * Find user by wallet address (most common lookup)
 */
UserSchema.statics.findByWallet = async function(walletAddress: string): Promise<IUser | null> {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

/**
 * Find user by email
 */
UserSchema.statics.findByEmail = async function(email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find user by username
 */
UserSchema.statics.findByUsername = async function(username: string): Promise<IUser | null> {
  return this.findOne({ username: username.toLowerCase() });
};

/**
 * Get top users by splits created (leaderboard)
 */
UserSchema.statics.getTopCreators = async function(limit: number = 10): Promise<IUser[]> {
  return this.find()
    .sort({ totalSplitsCreated: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get top users by volume (leaderboard)
 */
UserSchema.statics.getTopByVolume = async function(limit: number = 10): Promise<IUser[]> {
  return this.find()
    .sort({ totalAmountSplit: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get active users (active in last N days)
 */
UserSchema.statics.getActiveUsers = async function(
  days: number = 30,
  limit: number = 100
): Promise<IUser[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({ lastActiveAt: { $gte: cutoffDate } })
    .sort({ lastActiveAt: -1 })
    .limit(limit)
    .lean();
};

// ==================================================
// Pre/Post Hooks
// ==================================================

/**
 * Pre-save hook: Normalize wallet address to lowercase
 */
UserSchema.pre('save', function(next) {
  if (this.isModified('walletAddress')) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }
  next();
});

/**
 * Pre-save hook: Update lastActiveAt on any save
 */
UserSchema.pre('save', function(next) {
  if (this.isNew || this.isModified()) {
    this.lastActiveAt = new Date();
  }
  next();
});

// ==================================================
// Export Model
// ==================================================

// Add static methods to the interface
interface IUserModel extends Model<IUser> {
  findByWallet(walletAddress: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  getTopCreators(limit?: number): Promise<IUser[]>;
  getTopByVolume(limit?: number): Promise<IUser[]>;
  getActiveUsers(days?: number, limit?: number): Promise<IUser[]>;
}

export const usersModel: IUserModel = mongoose.model<IUser, IUserModel>('users', UserSchema);

export default usersModel;
