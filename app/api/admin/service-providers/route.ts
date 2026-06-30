import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ServiceProvider from '@/models/ServiceProvider';
import '@/models/Service';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'view_dashboard')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const providers = await ServiceProvider.find({})
      .populate('services', 'name category price discountedPrice duration')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, providers });
  } catch (error) {
    console.error('Error fetching service providers:', error);
    return NextResponse.json({ error: 'Failed to fetch service providers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'manage_providers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const provider = await ServiceProvider.create(data);

    await logActivity(adminData, 'CREATE_PROVIDER', 'service_provider', String(provider._id), { name: provider.name }, request);

    return NextResponse.json({ success: true, provider }, { status: 201 });
  } catch (error) {
    console.error('Error creating service provider:', error);
    return NextResponse.json({ error: 'Failed to create service provider' }, { status: 500 });
  }
}
