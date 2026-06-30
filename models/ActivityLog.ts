import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  adminEmail: { type: String, required: true },
  adminRole: { type: String, required: true },
  adminName: { type: String, required: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: String, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: 'unknown' },
}, { timestamps: true });

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ adminId: 1, createdAt: -1 });

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
