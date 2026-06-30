import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema({
  referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  referralCode: { type: String, required: true },
  bookingAmount: { type: Number, required: true },
  commissionRate: { type: Number, required: true },
  commissionAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
  paidAt: { type: Date, default: null },
  transactionId: { type: String, default: null },
  paidBy: { type: String, default: null },
}, { timestamps: true });

ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ bookingId: 1 }, { unique: true });
ReferralSchema.index({ referralCode: 1 });

export default mongoose.models.Referral || mongoose.model('Referral', ReferralSchema);
