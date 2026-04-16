import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientType',
  },
  recipientType: {
    type: String,
    required: true,
    enum: ['User', 'ServiceProvider'],
  },
  type: {
    type: String,
    required: true,
    enum: [
      'booking_confirmed',
      'booking_assigned',
      'booking_started',
      'booking_completed',
      'booking_cancelled',
      'payment_received',
      'payment_failed',
      'review_received',
      'profile_verified',
      'new_booking_request',
      'reminder',
      'promotion',
      'system_update',
    ],
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    bookingId: mongoose.Schema.Types.ObjectId,
    serviceId: mongoose.Schema.Types.ObjectId,
    serviceProviderId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    actionUrl: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
  },
  sentChannels: {
    inApp: { sent: Boolean, sentAt: Date },
    email: { sent: Boolean, sentAt: Date, messageId: String },
    sms: { sent: Boolean, sentAt: Date, messageId: String },
    push: { sent: Boolean, sentAt: Date, messageId: String },
  },
  scheduledFor: Date, // For scheduled notifications
  expiresAt: Date, // For temporary notifications
}, {
  timestamps: true,
});

// Index for efficient queries
NotificationSchema.index({ recipient: 1, recipientType: 1, createdAt: -1 });
NotificationSchema.index({ isRead: 1, recipient: 1 });
NotificationSchema.index({ type: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);