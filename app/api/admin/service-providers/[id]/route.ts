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
    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'view_dashboard')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    const provider = await ServiceProvider.findById(id).populate('services', 'name category price isActive');
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    return NextResponse.json({ success: true, provider });
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json({ error: 'Failed to fetch provider' }, { status: 500 });
  }
}

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
    const body = await request.json();

    const allowedFields = [
      'name', 'email', 'phone', 'address', 'experience', 'bio',
      'specializations', 'languages', 'services', 'price', 'discountedPrice',
      'isVerified', 'isActive', 'documentsVerified', 'profileImage',
      'documents', 'availability',
    ];
    const allowedDotFields = ['documents.aadharCard', 'documents.panCard', 'documents.experienceCertificate'];
    const setUpdate: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) setUpdate[key] = body[key];
    }
    for (const key of allowedDotFields) {
      if (key in body) setUpdate[key] = body[key];
    }

    const provider = await ServiceProvider.findByIdAndUpdate(id, { $set: setUpdate }, { new: true });
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    await logActivity(adminData, 'UPDATE_PROVIDER', 'service_provider', id, { fields: Object.keys(setUpdate) }, request);

    return NextResponse.json({ success: true, provider });
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
  }
}

export async function DELETE(
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
    const provider = await ServiceProvider.findByIdAndDelete(id);
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    await logActivity(adminData, 'DELETE_PROVIDER', 'service_provider', id, { name: provider.name }, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 });
  }
}
