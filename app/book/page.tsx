'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  Tag,
  Zap,
} from 'lucide-react';

interface ServiceProvider {
  _id: string;
  name: string;
  profileImage?: string;
  rating: number;
  totalReviews: number;
  experience: number;
  isVerified: boolean;
  bio?: string;
  price?: number;
  discountedPrice?: number;
  specializations: string[];
  languages?: string[];
  address: {
    city: string;
    state: string;
    zipCode?: string;
  };
  services: Array<{ _id: string; name: string; category: string }> | string[];
}

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

function BookProviderPage() {
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingData, setBookingData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    address: { street: '', street2: '', landmark: '', city: '', state: '', zipCode: '' },
    specialInstructions: '',
  });

  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const providerId = searchParams.get('provider');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push(`/auth/login?callbackUrl=/book?provider=${providerId}`);
      return;
    }
    if (!providerId) {
      router.push('/');
      return;
    }
    fetchData();
  }, [status, session, providerId]);

  const fetchData = async () => {
    try {
      const [provRes, svcRes] = await Promise.all([
        fetch('/api/service-providers'),
        fetch('/api/services'),
      ]);
      const provData = await provRes.json();
      const svcData = await svcRes.json();

      const found: ServiceProvider | undefined = provData.serviceProviders?.find(
        (p: ServiceProvider) => p._id === providerId
      );
      setProvider(found || null);

      // Determine which services this provider offers
      let providerServices: Service[] = [];
      if (found) {
        if (found.services?.length > 0) {
          const linkedIds = (found.services as any[]).map((s: any) =>
            s?._id ? s._id.toString() : s?.toString()
          );
          providerServices = (svcData.services || []).filter((s: Service) =>
            linkedIds.includes(s._id.toString())
          );
        }
        // Fallback: match by specializations
        if (providerServices.length === 0 && found.specializations?.length > 0) {
          const specs = found.specializations.map((sp) => sp.toLowerCase());
          providerServices = (svcData.services || []).filter((s: Service) =>
            specs.some(
              (sp) =>
                s.name.toLowerCase().includes(sp) ||
                sp.includes(s.name.toLowerCase()) ||
                s.category.toLowerCase().includes(sp) ||
                sp.includes(s.category.toLowerCase())
            )
          );
        }
        // Last resort: show all services
        if (providerServices.length === 0) {
          providerServices = svcData.services || [];
        }
      }

      setServices(providerServices);

      // Pre-fill city/state/zipCode from provider's address; user only provides street
      if (found?.address) {
        setBookingData((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            city: found.address.city || '',
            state: found.address.state || '',
            zipCode: found.address.zipCode || '',
          },
        }));
      }
    } catch (err) {
      console.error('Error loading booking page:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // city, state, zipCode are locked — ignore any changes
    if (name === 'address.city' || name === 'address.state' || name === 'address.zipCode') return;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setBookingData((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
    } else {
      setBookingData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const allServiceIds = services.map((s) => s._id);
  const allServiceNames = services.map((s) => s.name).join(', ');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !provider) return;
    setSubmitting(true);

    try {
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': session.user.id },
        body: JSON.stringify({
          services: allServiceIds,
          service: allServiceIds[0],
          serviceProvider: provider._id,
          scheduledDate: bookingData.scheduledDate,
          scheduledTime: bookingData.scheduledTime,
          totalAmount: bookingPrice,
          address: bookingData.address,
          specialInstructions: bookingData.specialInstructions,
        }),
      });

      const bookingResult = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(bookingResult.error);

      const bookingId = bookingResult.booking._id;

      const paymentRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': session.user.id },
        body: JSON.stringify({ bookingId }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) throw new Error(paymentData.error);

      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'Maids For Care',
        description: `Booking ${provider.name} – ${allServiceNames.substring(0, 50)}${allServiceNames.length > 50 ? '...' : ''}`,
        order_id: paymentData.orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'user-id': session.user.id },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
              }),
            });
            if (verifyRes.ok) {
              setBookingConfirmed(true);
              setTimeout(() => router.push('/dashboard?booking=success'), 4000);
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: { name: session.user.name, email: session.user.email },
        theme: { color: '#000000' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Booking error:', err);
      alert(err.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900" />
          <p className="text-sm text-gray-600 font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Maid not found</h2>
          <button onClick={() => router.push('/')} className="px-5 py-2.5 rounded-xl font-semibold bg-black text-white hover:bg-gray-800 transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const minDate = (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0]; })();

  const bookingPrice = provider.discountedPrice && provider.discountedPrice > 0 && provider.discountedPrice < (provider.price || 0)
    ? provider.discountedPrice
    : provider.price || 0;
  const hasDiscount = provider.discountedPrice && provider.discountedPrice > 0 && provider.discountedPrice < (provider.price || 0);
  const savingsAmount = hasDiscount ? (provider.price! - provider.discountedPrice!) : 0;

  const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Booking Confirmed Popup */}
      {bookingConfirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-500 text-sm mb-1">
              Your booking with <span className="font-semibold text-gray-900">{provider?.name}</span> is confirmed.
            </p>
            <p className="text-gray-400 text-xs mb-3">
              A confirmation email has been sent to your inbox. Redirecting to your dashboard…
            </p>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4 text-left">
              <span className="text-amber-500 text-sm mt-0.5">⚠</span>
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-semibold">Can&apos;t find the email?</span> Check your <span className="font-semibold">Spam or Junk</span> folder and mark it as &quot;Not Spam&quot; so future emails reach your inbox.
              </p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-green-500 h-1.5 rounded-full animate-[progress_4s_linear_forwards]" style={{ width: '100%', animation: 'shrink 4s linear forwards' }} />
            </div>
            <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
            <button
              onClick={() => router.push('/dashboard?booking=success')}
              className="mt-5 w-full py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gray-500" />
            <h1 className="text-xl font-bold text-gray-900">Book a Maid</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-5 gap-8">

        {/* LEFT – Provider Card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">

            {/* Top: avatar + name block */}
            <div className="flex items-start gap-4 p-5 pb-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                  {provider.profileImage ? (
                    <img src={provider.profileImage} alt={provider.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-gray-500">{provider.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {provider.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Name + rating */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{provider.name}</h2>
                  {provider.isVerified && (
                    <span className="flex-shrink-0 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5" fill={i < Math.floor(provider.rating) ? '#f59e0b' : '#e5e7eb'} stroke="none" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {provider.rating > 0 ? provider.rating.toFixed(1) : 'New'}
                    {provider.totalReviews > 0 && ` · ${provider.totalReviews} reviews`}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-px bg-gray-100 border-t border-b border-gray-100">
              {provider.address?.city && (
                <div className="bg-white px-4 py-3 flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Location</span>
                  <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {provider.address.city}
                  </span>
                </div>
              )}
              {provider.experience > 0 && (
                <div className="bg-white px-4 py-3 flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Experience</span>
                  <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {provider.experience} yr{provider.experience !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Bio */}
              {provider.bio && (
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{provider.bio}</p>
              )}

              {/* Languages */}
              {provider.languages && provider.languages.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {provider.languages.map((lang, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 bg-white">{lang}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price block */}
            {bookingPrice > 0 && (
              <div className="mx-5 mb-5 rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-900 px-4 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Booking Price</p>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">₹{bookingPrice}</span>
                    {hasDiscount && <span className="text-sm text-gray-400 line-through">₹{provider.price}</span>}
                  </div>
                  {hasDiscount ? (
                    <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                      Save ₹{savingsAmount}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">per booking</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT – Booking Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Services included — display only */}
            {services.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" /> Services Included
                </h3>
                <p className="text-xs text-gray-400 mb-4">All services below are included with this maid</p>
                <div className="flex flex-wrap gap-2">
                  {services.map((svc) => (
                    <span key={svc._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border bg-gray-50 text-gray-700 border-gray-200"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                      {svc.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Date & Time */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" /> Schedule
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Date</label>
                  <input type="date" name="scheduledDate" required min={minDate}
                    value={bookingData.scheduledDate} onChange={handleInputChange} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Time</label>
                  <input type="time" name="scheduledTime" required
                    value={bookingData.scheduledTime} onChange={handleInputChange} className={inputCls} />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Location warning */}
              <div className="flex items-start gap-3 bg-amber-50 border-b border-amber-200 px-5 py-3.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">This maid is only available in {provider?.address?.city || 'this location'}.</span>{' '}
                  Charges will <span className="font-semibold">not be refunded</span> if you select a maid unavailable at your location. Please confirm your address carefully.
                </p>
              </div>
              <div className="p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" /> Service Address
                </h3>
                <div className="space-y-3">
                  <input type="text" name="address.street" placeholder="Street / Flat no. / Society name" required
                    value={bookingData.address.street} onChange={handleInputChange} className={inputCls} />
                  <input type="text" name="address.street2" placeholder="Address line 2 (optional)"
                    value={bookingData.address.street2} onChange={handleInputChange} className={inputCls} />
                  <input type="text" name="address.landmark" placeholder="Landmark (optional)"
                    value={bookingData.address.landmark} onChange={handleInputChange} className={inputCls} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input type="text" name="address.city" readOnly
                        value={bookingData.address.city}
                        className={`${inputCls} bg-gray-50 cursor-not-allowed text-gray-500`} />
                      <p className="text-xs text-gray-400 mt-1 ml-1">City (fixed)</p>
                    </div>
                    <div>
                      <input type="text" name="address.state" readOnly
                        value={bookingData.address.state}
                        className={`${inputCls} bg-gray-50 cursor-not-allowed text-gray-500`} />
                      <p className="text-xs text-gray-400 mt-1 ml-1">State (fixed)</p>
                    </div>
                  </div>
                  <div>
                    <input type="text" name="address.zipCode" readOnly
                      value={bookingData.address.zipCode}
                      className={`${inputCls} bg-gray-50 cursor-not-allowed text-gray-500`} />
                    <p className="text-xs text-gray-400 mt-1 ml-1">PIN Code (fixed)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-base font-bold text-gray-900 mb-3">
                Special Instructions <span className="text-xs font-normal text-gray-400 ml-1">— optional</span>
              </h3>
              <textarea name="specialInstructions" rows={3}
                placeholder="Any specific requirements, access instructions, preferences…"
                value={bookingData.specialInstructions} onChange={handleInputChange}
                className={`${inputCls} resize-none`} />
            </div>

            {/* Summary & Pay */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 px-6 py-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Booking Summary
                </h3>
              </div>
              <div className="p-6 space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Maid</span>
                  <span className="font-semibold text-gray-900">{provider.name}</span>
                </div>
                {services.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span>Services</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[55%]">{allServiceNames || '—'}</span>
                  </div>
                )}
                {bookingPrice > 0 && (
                  <>
                    {hasDiscount && (
                      <div className="flex justify-between text-gray-400">
                        <span>Normal price</span>
                        <span className="line-through">₹{provider.price}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-3 border-t border-gray-200 text-base font-bold text-gray-900">
                      <span>Total</span>
                      <div className="text-right">
                        <span>₹{bookingPrice}</span>
                        {hasDiscount && <span className="ml-2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Save ₹{savingsAmount}</span>}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="px-6 pb-6">
                <button type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl font-bold text-base text-white bg-black hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> Processing…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Book & Pay Now {bookingPrice > 0 ? `· ₹${bookingPrice}` : ''}</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900" />
          <p className="text-sm text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <BookProviderPage />
    </Suspense>
  );
}
