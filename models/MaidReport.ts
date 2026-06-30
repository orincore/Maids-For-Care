import mongoose from 'mongoose';

const MaidReportSchema = new mongoose.Schema({
  bookingId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Booking',         required: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',            required: true },
  maidId:     { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true },
  category:   { type: String, enum: ['behaviour', 'quality', 'theft', 'no_show', 'other'], required: true },
  description:{ type: String, required: true },
  status:     { type: String, enum: ['open', 'under_review', 'resolved', 'dismissed'], default: 'open' },
  adminNote:  { type: String, default: '' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  resolvedAt: { type: Date },
}, { timestamps: true });

MaidReportSchema.index({ maidId: 1 });
MaidReportSchema.index({ status: 1 });

export default mongoose.models.MaidReport || mongoose.model('MaidReport', MaidReportSchema);
