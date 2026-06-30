import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'view_users')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}