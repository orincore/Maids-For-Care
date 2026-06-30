import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Service from '@/models/Service';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'view_dashboard')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const services = await Service.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Admin services fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'manage_services')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, description, price, discountedPrice, duration, category, isActive } = await request.json();

    const service = await Service.create({
      name, description, price,
      discountedPrice: discountedPrice || null,
      duration, category,
      isActive: isActive !== undefined ? isActive : true,
    });

    await logActivity(adminData, 'CREATE_SERVICE', 'service', String(service._id), { name, category, price }, request);

    return NextResponse.json({ message: 'Service created successfully', service }, { status: 201 });
  } catch (error) {
    console.error('Admin service creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
