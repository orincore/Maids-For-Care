import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MaidReport from '@/models/MaidReport';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';
import { logActivity } from '@/lib/activityLogger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'manage_providers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { status, adminNote } = await request.json();

    if (!['under_review', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const report = await MaidReport.findByIdAndUpdate(
      id,
      { status, adminNote: adminNote || '', resolvedAt: new Date() },
      { new: true }
    );
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    await logActivity(adminData, 'UPDATE_PROVIDER', 'maid_report', id, { status, adminNote }, request);

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Update maid report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
