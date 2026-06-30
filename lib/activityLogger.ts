import dbConnect from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';
import { AdminTokenPayload } from '@/lib/adminAuth';
import { NextRequest } from 'next/server';

export const logActivity = async (
  admin: AdminTokenPayload,
  action: string,
  resource: string,
  resourceId: string | null,
  details: Record<string, unknown>,
  request?: NextRequest,
): Promise<void> => {
  try {
    await dbConnect();
    const ip = request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request?.headers.get('x-real-ip')
      || 'unknown';
    await ActivityLog.create({
      adminId: admin.id,
      adminEmail: admin.email,
      adminRole: admin.role,
      adminName: admin.name,
      action,
      resource,
      resourceId,
      details,
      ip,
    });
  } catch (err) {
    console.error('[ActivityLog] Failed to write log:', err);
  }
};
