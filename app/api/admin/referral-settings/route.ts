import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ReferralSettings from '@/models/ReferralSettings';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request.headers.get('authorization'));
    if (!admin || !requirePermission(admin, 'manage_referrals')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const settings = await ReferralSettings.findOne({ key: 'default' }) || { commissionRate: 10, isEnabled: true };
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request.headers.get('authorization'));
    if (!admin || !requirePermission(admin, 'manage_referrals')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { commissionRate, isEnabled } = await request.json();

    const update: Record<string, unknown> = { updatedBy: admin.id };
    if (commissionRate !== undefined) update.commissionRate = Math.min(100, Math.max(0, Number(commissionRate)));
    if (isEnabled !== undefined) update.isEnabled = Boolean(isEnabled);

    const settings = await ReferralSettings.findOneAndUpdate(
      { key: 'default' },
      update,
      { upsert: true, new: true }
    );

    await logActivity(admin, 'UPDATE_REFERRAL_SETTINGS', 'referral_settings', null, { commissionRate, isEnabled }, request);

    return NextResponse.json({ message: 'Settings updated', settings });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
