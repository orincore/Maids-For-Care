import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';
import { logActivity } from '@/lib/activityLogger';
import bcrypt from 'bcryptjs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = getAdminFromRequest(request.headers.get('authorization'));
    if (!admin || !requirePermission(admin, 'manage_admins')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const target = await Admin.findById(id);
    if (!target) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const allowedFields: Record<string, unknown> = {};
    if (body.name !== undefined) allowedFields.name = body.name.trim();
    if (body.role !== undefined) allowedFields.role = body.role;
    if (body.isActive !== undefined) allowedFields.isActive = body.isActive;
    if (body.password) {
      allowedFields.password = await bcrypt.hash(body.password, 12);
    }

    const updated = await Admin.findByIdAndUpdate(id, allowedFields, { new: true }).select('-password');

    await logActivity(admin, 'UPDATE_ADMIN', 'admin', id, { changes: allowedFields }, request);

    return NextResponse.json({ message: 'Admin updated successfully', admin: updated });
  } catch (error) {
    console.error('Update admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = getAdminFromRequest(request.headers.get('authorization'));
    if (!admin || !requirePermission(admin, 'manage_admins')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    if (id === admin.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const target = await Admin.findByIdAndDelete(id);
    if (!target) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    await logActivity(admin, 'DELETE_ADMIN', 'admin', id, { name: target.name, email: target.email }, request);

    return NextResponse.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
