import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ServiceProvider from '@/models/ServiceProvider';
import { sendProviderRegisteredEmail } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const providerData = await request.json();
    console.log('Received provider data:', JSON.stringify(providerData, null, 2));
    console.log('Documents received:', providerData.documents);

    // Validate required fields
    if (!providerData.name || !providerData.email || !providerData.phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    // Validate required documents
    if (!providerData.documents?.aadharCard || !providerData.documents?.panCard) {
      return NextResponse.json(
        { error: 'Aadhar Card and PAN Card are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingProvider = await ServiceProvider.findOne({ email: providerData.email });
    if (existingProvider) {
      return NextResponse.json(
        { error: 'A service provider with this email already exists' },
        { status: 409 }
      );
    }

    // Create service provider with default values
    const createData = {
      name: providerData.name,
      email: providerData.email,
      phone: providerData.phone,
      experience: providerData.experience || 0,
      bio: providerData.bio || '',
      languages: providerData.languages || [],
      specializations: providerData.specializations || [],
      address: providerData.address || {},
      availability: providerData.availability || {
        monday: { start: '09:00', end: '18:00', available: true },
        tuesday: { start: '09:00', end: '18:00', available: true },
        wednesday: { start: '09:00', end: '18:00', available: true },
        thursday: { start: '09:00', end: '18:00', available: true },
        friday: { start: '09:00', end: '18:00', available: true },
        saturday: { start: '09:00', end: '18:00', available: true },
        sunday: { start: '09:00', end: '18:00', available: false },
      },
      documents: providerData.documents,
      profileImage: providerData.profileImage || '',
      isActive: false, // Requires admin approval
      isVerified: false, // Requires admin verification
      rating: 0,
      totalReviews: 0,
    };
    console.log('Creating provider with data:', JSON.stringify(createData, null, 2));
    
    const serviceProvider = await ServiceProvider.create(createData);
    console.log('Created provider documents:', serviceProvider.documents);

    // Fire email event (non-blocking)
    try {
      sendProviderRegisteredEmail({
        providerName: serviceProvider.name,
        providerEmail: serviceProvider.email,
      });
    } catch (emailErr) {
      console.error('[Email] provider.registered emit error:', emailErr);
    }

    return NextResponse.json(
      { 
        message: 'Service provider registered successfully. Your application is pending review.',
        serviceProvider: {
          _id: serviceProvider._id,
          name: serviceProvider.name,
          email: serviceProvider.email,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Service provider registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
