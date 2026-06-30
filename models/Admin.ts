import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ADMIN_ROLES = ['super_admin', 'admin', 'support_agent'] as const;
export type AdminRole = typeof ADMIN_ROLES[number];

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [
    'view_dashboard', 'manage_services', 'view_users', 'manage_users',
    'view_bookings', 'update_booking_status', 'assign_provider',
    'manage_providers', 'view_reviews', 'delete_reviews',
    'view_logs', 'manage_admins', 'view_revenue', 'manage_referrals',
  ],
  admin: [
    'view_dashboard', 'manage_services', 'view_users', 'manage_users',
    'view_bookings', 'update_booking_status', 'assign_provider',
    'manage_providers', 'view_reviews', 'delete_reviews', 'view_logs', 'view_revenue', 'manage_referrals',
  ],
  support_agent: [
    'view_dashboard', 'view_users', 'view_bookings',
    'update_booking_status', 'assign_provider', 'view_reviews',
  ],
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  support_agent: 'Support Agent',
};

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ADMIN_ROLES, default: 'support_agent' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, default: null },
}, { timestamps: true });

AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

AdminSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
