/**
 * 🚀 Notification Model - Production-Ready Mongoose Schema
 * 
 * Optimized for handling millions of notification records with comprehensive indexing strategy.
 * Built for Splyt backend - Web3 split payment platform.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// ==================================================
// TypeScript Interface
// ==================================================

export type NotificationType = 
  | 'split_created'
  | 'payment_received'
  | 'payment_reminder'
  | 'split_completed'
  | 'split_cancelled'
  | 'refund_issued'
  | 'invitation_sent'
  | 'participant_added'
  | 'participant_removed';

export type NotificationChannel = 'whatsapp' | 'push' | 'email' | 'sms' | 'in_app';

export interface INotification extends Document {
  // Who gets it
  recipientAddress: string;          // Wallet address
  
  // What it's about
  splitId?: Types.ObjectId;          // Reference to Split (optional for system notifications)
  type: NotificationType;            // Notification type
  
  // Content
  title: string;                     // "Someone paid their share!"
  message: string;                   // Full notification text
  
  // Delivery
  channels: NotificationChannel[];   // ["whatsapp", "push", "email"]
  isRead: boolean;                   // Has user read it?
  readAt?: Date;                     // When was it read?
  isSent: boolean;                   // Has it been sent?
  sentAt?: Date;                     // When was it sent?
  sendAttempts: number;              // Number of send attempts
  lastSendAttemptAt?: Date;          // Last send attempt timestamp
  
  // Metadata
  data?: Record<string, any>;        // Extra context (amounts, addresses, etc.)
  priority?: 'low' | 'normal' | 'high' | 'urgent'; // Notification priority
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  readonly isUnread: boolean;        // Opposite of isRead
  readonly isDelivered: boolean;    // Check if notification was successfully delivered
  readonly ageInHours: number;       // Age of notification in hours
}

// ==================================================
// Mongoose Schema Definition
// ==================================================

const NotificationSchema: Schema<INotification> = new Schema<INotification>(
  {
    // Who gets it
    recipientAddress: {
      type: String,
      required: [true, 'Recipient address is required'],
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
    
    // What it's about
    splitId: {
      type: Schema.Types.ObjectId,
      ref: 'Split',
      index: true
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'split_created',
        'payment_received',
        'payment_reminder',
        'split_completed',
        'split_cancelled',
        'refund_issued',
        'invitation_sent',
        'participant_added',
        'participant_removed'
      ],
      index: true
    },
    
    // Content
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [1, 'Title must be at least 1 character'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: 'text' // Text search index
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [1, 'Message must be at least 1 character'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      index: 'text' // Text search index
    },
    
    // Delivery
    channels: {
      type: [String],
      required: [true, 'At least one channel is required'],
      validate: {
        validator: function(v: string[]) {
          const validChannels = ['whatsapp', 'push', 'email', 'sms', 'in_app'];
          return v.length > 0 && v.every(channel => validChannels.includes(channel));
        },
        message: 'Invalid notification channel'
      },
      index: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      index: true
    },
    isSent: {
      type: Boolean,
      default: false,
      index: true
    },
    sentAt: {
      type: Date,
      index: true
    },
    sendAttempts: {
      type: Number,
      default: 0,
      min: [0, 'Send attempts cannot be negative']
    },
    lastSendAttemptAt: {
      type: Date
    },
    
    // Metadata
    data: {
      type: Schema.Types.Mixed,
      default: {}
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'notifications',
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
NotificationSchema.index({ recipientAddress: 1 }, { name: 'recipientAddress_index' });
NotificationSchema.index({ splitId: 1 }, { name: 'splitId_index' });
NotificationSchema.index({ type: 1 }, { name: 'type_index' });
NotificationSchema.index({ isRead: 1 }, { name: 'isRead_index' });
NotificationSchema.index({ isSent: 1 }, { name: 'isSent_index' });
NotificationSchema.index({ createdAt: -1 }, { name: 'createdAt_desc' });
NotificationSchema.index({ readAt: -1 }, { name: 'readAt_desc' });
NotificationSchema.index({ sentAt: -1 }, { name: 'sentAt_desc' });
NotificationSchema.index({ priority: 1 }, { name: 'priority_index' });

/**
 * Compound Indexes - For Complex Queries
 */
// Find unread notifications for a user (most common query)
NotificationSchema.index(
  { recipientAddress: 1, isRead: 1, createdAt: -1 },
  { name: 'unread_notifications_composite' }
);

// Find notifications by recipient and type
NotificationSchema.index(
  { recipientAddress: 1, type: 1, createdAt: -1 },
  { name: 'recipient_type_composite' }
);

// Find unsent notifications (for delivery queue)
NotificationSchema.index(
  { isSent: 1, priority: 1, createdAt: 1 },
  { name: 'unsent_notifications_composite' }
);

// Find notifications by split
NotificationSchema.index(
  { splitId: 1, createdAt: -1 },
  { name: 'split_notifications_composite' }
);

// Find notifications by recipient and split
NotificationSchema.index(
  { recipientAddress: 1, splitId: 1, createdAt: -1 },
  { name: 'recipient_split_composite' }
);

// Find high priority unsent notifications
NotificationSchema.index(
  { priority: 1, isSent: 1, createdAt: 1 },
  { name: 'priority_unsent_composite' }
);

// Find read notifications (for cleanup/archival)
NotificationSchema.index(
  { isRead: 1, readAt: -1 },
  { name: 'read_notifications_composite' }
);

// Find notifications by channel
NotificationSchema.index(
  { channels: 1, isSent: 1, createdAt: -1 },
  { name: 'channel_sent_composite' }
);

// Text search index
NotificationSchema.index(
  { title: 'text', message: 'text' },
  {
    name: 'notification_search_text',
    weights: { title: 10, message: 5 }
  }
);

// TTL Index for auto-deletion of old read notifications (optional - 90 days)
// Uncomment if you want automatic cleanup
// NotificationSchema.index(
//   { readAt: 1 },
//   { expireAfterSeconds: 7776000 } // 90 days in seconds
// );

// ==================================================
// Virtual Properties
// ==================================================

NotificationSchema.virtual('isUnread').get(function(this: INotification) {
  return !this.isRead;
});

NotificationSchema.virtual('isDelivered').get(function(this: INotification) {
  return this.isSent && this.sentAt !== undefined;
});

NotificationSchema.virtual('ageInHours').get(function(this: INotification) {
  const now = new Date();
  const diffMs = now.getTime() - this.createdAt.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
});

// ==================================================
// Instance Methods
// ==================================================

/**
 * Mark notification as read
 */
NotificationSchema.methods.markAsRead = async function(this: INotification): Promise<INotification> {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return this;
};

/**
 * Mark notification as sent
 */
NotificationSchema.methods.markAsSent = async function(this: INotification): Promise<INotification> {
  if (!this.isSent) {
    this.isSent = true;
    this.sentAt = new Date();
    this.sendAttempts += 1;
    this.lastSendAttemptAt = new Date();
    return this.save();
  }
  return this;
};

/**
 * Increment send attempts (for retry logic)
 */
NotificationSchema.methods.incrementSendAttempts = async function(this: INotification): Promise<INotification> {
  this.sendAttempts += 1;
  this.lastSendAttemptAt = new Date();
  return this.save();
};

/**
 * Mark notification as failed (after max attempts)
 */
NotificationSchema.methods.markAsFailed = async function(this: INotification): Promise<INotification> {
  // You might want to add a 'failed' status field or use data field
  this.data = { ...this.data, failed: true, failedAt: new Date() };
  return this.save();
};

// ==================================================
// Static Methods
// ==================================================

/**
 * Find notifications by recipient
 */
NotificationSchema.statics.findByRecipient = async function(
  recipientAddress: string,
  options?: { 
    isRead?: boolean; 
    type?: NotificationType; 
    limit?: number; 
    skip?: number;
    sortBy?: 'createdAt' | 'readAt' | 'priority';
  }
): Promise<INotification[]> {
  const query: any = { recipientAddress: recipientAddress.toLowerCase() };
  
  if (options?.isRead !== undefined) {
    query.isRead = options.isRead;
  }
  
  if (options?.type) {
    query.type = options.type;
  }
  
  let queryBuilder = this.find(query);
  
  // Sort order
  const sortField = options?.sortBy || 'createdAt';
  const sortOrder = sortField === 'priority' ? 1 : -1; // Priority: low to high, others: new to old
  queryBuilder = queryBuilder.sort({ [sortField]: sortOrder });
  
  if (options?.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }
  
  if (options?.skip) {
    queryBuilder = queryBuilder.skip(options.skip);
  }
  
  return queryBuilder.lean();
};

/**
 * Find unread notifications for a recipient
 */
NotificationSchema.statics.findUnread = async function(
  recipientAddress: string,
  limit: number = 50
): Promise<INotification[]> {
  return this.find({
    recipientAddress: recipientAddress.toLowerCase(),
    isRead: false
  })
    .sort({ priority: -1, createdAt: -1 }) // High priority first, then newest
    .limit(limit)
    .lean();
};

/**
 * Find unsent notifications (for delivery queue)
 */
NotificationSchema.statics.findUnsent = async function(
  limit: number = 100,
  priority?: 'low' | 'normal' | 'high' | 'urgent'
): Promise<INotification[]> {
  const query: any = { isSent: false };
  
  if (priority) {
    query.priority = priority;
  }
  
  return this.find(query)
    .sort({ priority: -1, createdAt: 1 }) // High priority first, oldest first
    .limit(limit)
    .lean();
};

/**
 * Find notifications by split ID
 */
NotificationSchema.statics.findBySplitId = async function(
  splitId: Types.ObjectId | string,
  limit: number = 100
): Promise<INotification[]> {
  return this.find({ splitId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Find notifications by type
 */
NotificationSchema.statics.findByType = async function(
  type: NotificationType,
  limit: number = 100
): Promise<INotification[]> {
  return this.find({ type })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get unread count for a recipient
 */
NotificationSchema.statics.getUnreadCount = async function(
  recipientAddress: string
): Promise<number> {
  return this.countDocuments({
    recipientAddress: recipientAddress.toLowerCase(),
    isRead: false
  });
};

/**
 * Mark all notifications as read for a recipient
 */
NotificationSchema.statics.markAllAsRead = async function(
  recipientAddress: string
): Promise<{ modifiedCount: number }> {
  const result = await this.updateMany(
    {
      recipientAddress: recipientAddress.toLowerCase(),
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
  
  return { modifiedCount: result.modifiedCount || 0 };
};

/**
 * Delete old read notifications (cleanup)
 */
NotificationSchema.statics.deleteOldRead = async function(
  daysOld: number = 90
): Promise<{ deletedCount: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await this.deleteMany({
    isRead: true,
    readAt: { $lt: cutoffDate }
  });
  
  return { deletedCount: result.deletedCount || 0 };
};

/**
 * Search notifications by text
 */
NotificationSchema.statics.search = async function(
  recipientAddress: string,
  searchTerm: string,
  limit: number = 50
): Promise<INotification[]> {
  return this.find({
    recipientAddress: recipientAddress.toLowerCase(),
    $text: { $search: searchTerm }
  })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean();
};

// ==================================================
// Pre/Post Hooks
// ==================================================

/**
 * Pre-save hook: Normalize recipient address to lowercase
 */
NotificationSchema.pre('save', function(next) {
  if (this.isModified('recipientAddress')) {
    this.recipientAddress = this.recipientAddress.toLowerCase();
  }
  next();
});

/**
 * Pre-save hook: Set sentAt when isSent becomes true
 */
NotificationSchema.pre('save', function(next) {
  if (this.isModified('isSent') && this.isSent && !this.sentAt) {
    this.sentAt = new Date();
  }
  next();
});

/**
 * Pre-save hook: Set readAt when isRead becomes true
 */
NotificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// ==================================================
// Export Model
// ==================================================

// Add static methods to the interface
interface INotificationModel extends Model<INotification> {
  findByRecipient(recipientAddress: string, options?: { 
    isRead?: boolean; 
    type?: NotificationType; 
    limit?: number; 
    skip?: number;
    sortBy?: 'createdAt' | 'readAt' | 'priority';
  }): Promise<INotification[]>;
  findUnread(recipientAddress: string, limit?: number): Promise<INotification[]>;
  findUnsent(limit?: number, priority?: 'low' | 'normal' | 'high' | 'urgent'): Promise<INotification[]>;
  findBySplitId(splitId: Types.ObjectId | string, limit?: number): Promise<INotification[]>;
  findByType(type: NotificationType, limit?: number): Promise<INotification[]>;
  getUnreadCount(recipientAddress: string): Promise<number>;
  markAllAsRead(recipientAddress: string): Promise<{ modifiedCount: number }>;
  deleteOldRead(daysOld?: number): Promise<{ deletedCount: number }>;
  search(recipientAddress: string, searchTerm: string, limit?: number): Promise<INotification[]>;
}

export const Notification: INotificationModel = mongoose.model<INotification, INotificationModel>(
  'Notification',
  NotificationSchema
);

export default Notification;
