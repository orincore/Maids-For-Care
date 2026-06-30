import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request.headers.get('authorization'));
    if (!admin || !requirePermission(admin, 'view_logs')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { adminEmail: { $regex: search, $options: 'i' } },
        { adminName: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
      ];
    }
    if (action) filter.action = action;

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Fetch logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
