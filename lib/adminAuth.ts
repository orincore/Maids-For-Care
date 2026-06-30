import jwt from 'jsonwebtoken';
import { ROLE_PERMISSIONS, AdminRole } from '@/models/Admin';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin-jwt-secret-fallback';

export interface AdminTokenPayload {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isHardcoded?: boolean;
}

export const generateAdminToken = (payload: AdminTokenPayload): string => {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '7d' });
};

export const verifyAdminToken = (token: string): AdminTokenPayload | null => {
  // Try JWT first (new format)
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminTokenPayload;
    if (decoded?.id && decoded?.role) return decoded;
  } catch {}

  // Backward compat: old JSON format from pre-DB era
  try {
    const parsed = JSON.parse(token);
    if (parsed?.id === 'admin_hardcoded_id' && parsed?.isHardcodedAdmin) {
      return {
        id: 'super_admin_hardcoded',
        email: process.env.ADMIN_EMAIL || 'admin@maidease.com',
        name: 'System Administrator',
        role: 'super_admin',
        isHardcoded: true,
      };
    }
  } catch {}

  return null;
};

export const hasPermission = (role: string, permission: string): boolean => {
  const perms = ROLE_PERMISSIONS[role as AdminRole] || [];
  return perms.includes(permission);
};

export const getAdminFromRequest = (authHeader: string | null): AdminTokenPayload | null => {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  return verifyAdminToken(token);
};

export const requirePermission = (adminData: AdminTokenPayload | null, permission: string): boolean => {
  if (!adminData) return false;
  return hasPermission(adminData.role, permission);
};
