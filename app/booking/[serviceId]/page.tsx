'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import { colors } from '@/lib/colors';

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BookingPage() {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    specialInstructions: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const serviceId = params.serviceId as string;

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    fetchService();
    loadUserData();
  }, [serviceId, session, status, router]);

  const fetchService = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      const foundService = data.services?.find((s: Service) => s._id === serviceId);
      setService(foundService || null);
    } catch (error) {
      console.error('Error fetching service:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Content-Type': 'application/json',
          'user-id': session.user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user.address) {
          setBookingData(prev => ({
            ...prev,
            address: data.user.address,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setBookingData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !session?.user?.id) return;

    setSubmitting(true);

    try {
      // Create booking
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': session.user.id,
        },
        body: JSON.stringify({
          service: serviceId,
          ...bookingData,
          duration: service.duration,
          totalAmount: service.price,
        }),
      });

      const bookingData_result = await bookingResponse.json();

      if (!bookingResponse.ok) {
        throw new Error(bookingData_result.error);
      }

      const bookingId = bookingData_result.booking._id;

      // Create payment order
      const paymentResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': session.user.id,
        },
        body: JSON.stringify({ bookingId }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(paymentData.error);
      }

      // Initialize Razorpay
      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'Maids For Care',
        description: `Payment for ${service.name}`,
        order_id: paymentData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'user-id': session.user.id,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              alert('Payment successful! Your booking is confirmed.');
              router.push('/dashboard');
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: session.user.name,
          email: session.user.email,
        },
        theme: {
          color: '#111827',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Booking error:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service not found</h2>
          <button
            onClick={() => router.push('/services')}
            className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Book Service</h1>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Service Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{service.name}</h2>
            <p className="text-gray-600 mb-6">{service.description}</p>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-400 mr-3" />
                <span>Duration: {service.duration} hours</span>
              </div>
              <div className="flex items-center">
                <span className="text-3xl font-bold text-gray-900">₹{service.price}</span>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Details</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    name="scheduledDate"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary,
                      borderColor: colors.border.medium,
                    }}
                    value={bookingData.scheduledDate}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time
                  </label>
                  <input
                    type="time"
                    name="scheduledTime"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary,
                      borderColor: colors.border.medium,
                    }}
                    value={bookingData.scheduledTime}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Service Address
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    name="address.street"
                    placeholder="Street Address"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary,
                      borderColor: colors.border.medium,
                    }}
                    value={bookingData.address.street}
                    onChange={handleInputChange}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      name="address.city"
                      placeholder="City"
                      required
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: colors.background.primary,
                        color: colors.text.primary,
                        borderColor: colors.border.medium,
                      }}
                      value={bookingData.address.city}
                      onChange={handleInputChange}
                    />
                    <input
                      type="text"
                      name="address.state"
                      placeholder="State"
                      required
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: colors.background.primary,
                        color: colors.text.primary,
                        borderColor: colors.border.medium,
                      }}
                      value={bookingData.address.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  <input
                    type="text"
                    name="address.zipCode"
                    placeholder="ZIP Code"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary,
                      borderColor: colors.border.medium,
                    }}
                    value={bookingData.address.zipCode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions (Optional)
                </label>
                <textarea
                  name="specialInstructions"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary,
                    borderColor: colors.border.medium,
                  }}
                  placeholder="Any special requirements or instructions..."
                  value={bookingData.specialInstructions}
                  onChange={handleInputChange}
                />
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium">Total Amount:</span>
                  <span className="text-2xl font-bold text-gray-900">₹{service.price}</span>
                </div>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gray-900 text-white py-3 px-4 rounded-md hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Book & Pay Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}