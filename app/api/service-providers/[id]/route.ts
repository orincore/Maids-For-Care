import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ServiceProvider from '@/models/ServiceProvider';
import '@/models/Service';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const serviceProvider = await ServiceProvider.findById(id)
      .populate('services', 'name category price discountedPrice duration');

    if (!serviceProvider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    return NextResponse.json({ serviceProvider });
  } catch (error) {
    console.error('Service provider fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'manage_providers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData = await request.json();

    const serviceProvider = await ServiceProvider.findByIdAndUpdate(
      id, { $set: updateData }, { new: true, runValidators: true }
    ).populate('services', 'name category price discountedPrice duration');

    if (!serviceProvider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    await logActivity(adminData, 'UPDATE_PROVIDER', 'service_provider', id, { updates: updateData }, request);

    return NextResponse.json({ message: 'Service provider updated successfully', serviceProvider });
  } catch (error) {
    console.error('Service provider update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'manage_providers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceProvider = await ServiceProvider.findByIdAndDelete(id);
    if (!serviceProvider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    await logActivity(adminData, 'DELETE_PROVIDER', 'service_provider', id, { name: serviceProvider.name }, request);

    return NextResponse.json({ message: 'Service provider deleted successfully' });
  } catch (error) {
    console.error('Service provider deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
