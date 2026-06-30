import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request.headers.get('authorization'));
    if (!admin || !requirePermission(admin, 'manage_admins')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const admins = await Admin.find({}, '-password').sort({ createdAt: -1 });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Fetch admins error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request.headers.get('authorization'));
    if (!admin || !requirePermission(admin, 'manage_admins')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'name, email, password and role are required' }, { status: 400 });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: 'An admin with this email already exists' }, { status: 409 });
    }

    const newAdmin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      createdBy: admin.id,
    });

    const safeAdmin = { _id: newAdmin._id, name: newAdmin.name, email: newAdmin.email, role: newAdmin.role, isActive: newAdmin.isActive, createdAt: newAdmin.createdAt };

    await logActivity(admin, 'CREATE_ADMIN', 'admin', String(newAdmin._id), { name: newAdmin.name, email: newAdmin.email, role: newAdmin.role }, request);

    return NextResponse.json({ message: 'Admin created successfully', admin: safeAdmin }, { status: 201 });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
