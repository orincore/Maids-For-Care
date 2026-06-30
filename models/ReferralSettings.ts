import mongoose from 'mongoose';

// Singleton document — always update/upsert the one record with key='default'
const ReferralSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'default', unique: true },
  commissionRate: { type: Number, default: 10, min: 0, max: 100 },
  isEnabled: { type: Boolean, default: true },
  updatedBy: { type: String, default: null },
}, { timestamps: true });

export default mongoose.models.ReferralSettings || mongoose.model('ReferralSettings', ReferralSettingsSchema);
