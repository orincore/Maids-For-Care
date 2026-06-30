import mongoose from 'mongoose';

const MaidChangeRequestSchema = new mongoose.Schema({
  bookingId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Booking',         required: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',            required: true },
  maidId:     { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true },
  reason:     { type: String, required: true },
  status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote:  { type: String, default: '' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  resolvedAt: { type: Date },
}, { timestamps: true });

MaidChangeRequestSchema.index({ bookingId: 1 });
MaidChangeRequestSchema.index({ status: 1 });

export default mongoose.models.MaidChangeRequest || mongoose.model('MaidChangeRequest', MaidChangeRequestSchema);
