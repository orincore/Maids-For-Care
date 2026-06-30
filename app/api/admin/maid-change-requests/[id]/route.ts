import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MaidChangeRequest from '@/models/MaidChangeRequest';
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

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const req = await MaidChangeRequest.findByIdAndUpdate(
      id,
      { status, adminNote: adminNote || '', resolvedAt: new Date() },
      { new: true }
    );
    if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    await logActivity(adminData, 'UPDATE_PROVIDER', 'maid_change_request', id, { status, adminNote }, request);

    return NextResponse.json({ success: true, request: req });
  } catch (error) {
    console.error('Update change request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
