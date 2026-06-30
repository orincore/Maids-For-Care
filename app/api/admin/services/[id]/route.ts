import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Service from '@/models/Service';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';
import { logActivity } from '@/lib/activityLogger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'manage_services')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const updateData = await request.json();

    const service = await Service.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    await logActivity(adminData, 'UPDATE_SERVICE', 'service', id, { updates: updateData }, request);

    return NextResponse.json({ message: 'Service updated successfully', service });
  } catch (error) {
    console.error('Service update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'manage_services')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    await logActivity(adminData, 'DELETE_SERVICE', 'service', id, { name: service.name }, request);

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Service deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
