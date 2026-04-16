import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ServiceProvider from '@/models/ServiceProvider';
import '@/models/Service'; // Ensure Service schema is registered for populate
import { verifyAdminToken } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get admin token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify admin token
    const adminData = verifyAdminToken(token);
    if (!adminData || !adminData.isHardcodedAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const providers = await ServiceProvider.find({})
      .populate('services', 'name category price discountedPrice duration')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      providers,
    });
  } catch (error) {
    console.error('Error fetching service providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service providers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get admin token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify admin token
    const adminData = verifyAdminToken(token);
    if (!adminData || !adminData.isHardcodedAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    const provider = await ServiceProvider.create(data);

    return NextResponse.json({
      success: true,
      provider,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating service provider:', error);
    return NextResponse.json(
      { error: 'Failed to create service provider' },
      { status: 500 }
    );
  }
}