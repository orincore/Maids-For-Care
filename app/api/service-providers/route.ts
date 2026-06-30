import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ServiceProvider from '@/models/ServiceProvider';
import '@/models/Service'; // Ensure Service model is registered for populate
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const service = searchParams.get('service');
    
    let query: any = {};
    if (status) query.isActive = status === 'active';
    if (service) query.services = service;

    const serviceProviders = await ServiceProvider.find(query)
      .populate('services', 'name category price discountedPrice duration')
      .sort({ createdAt: -1 });

    console.log('DEBUG API - Query:', query);
    console.log('DEBUG API - Found providers:', serviceProviders.length);
    console.log('DEBUG API - First provider:', serviceProviders[0]?.name, 'isActive:', serviceProviders[0]?.isActive, 'address:', serviceProviders[0]?.address);

    return NextResponse.json({ serviceProviders });
  } catch (error) {
    console.error('Service providers fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'manage_providers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceProviderData = await request.json();

    const serviceProvider = await ServiceProvider.create(serviceProviderData);

    return NextResponse.json(
      { message: 'Service provider created successfully', serviceProvider },
      { status: 201 }
    );
  } catch (error) {
    console.error('Service provider creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}