'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, MapPin, Star, Clock, Share2, Gift, IndianRupee, Users } from 'lucide-react';
import { colors } from '@/lib/colors';
import { HeroCarousel } from '@/components/layout/HeroCarousel';
import { TrustSection } from '@/components/layout/FeatureCards';
import { TestimonialsSection } from '@/components/layout/TestimonialsSection';

interface ServiceProvider {
  _id: string;
  name: string;
  services: Array<{ _id: string; name: string; category: string }> | string[];
  specializations: string[];
  rating: number;
  totalReviews: number;
  experience: number;
  isVerified: boolean;
  isActive: boolean;
  address: {
    city: string;
    state: string;
    zipCode?: string;
  };
  profileImage?: string;
  bio?: string;
  languages?: string[];
  phone?: string;
}

export default function HomePage() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // Get user's selected location
    const savedLocation = localStorage.getItem('userLocation') || localStorage.getItem('userCity') || '';
    const savedPincode = localStorage.getItem('userPincode') || '';
    setUserLocation(savedLocation || 'Select Location');
    
    fetchProvidersByLocation(savedLocation, savedPincode);
  }, []);

  const fetchProvidersByLocation = async (location: string, pincode: string) => {
    try {
      const providersRes = await fetch('/api/service-providers');
      const providersData = await providersRes.json();

      if (!providersData.serviceProviders) {
        setProviders([]);
        setLoading(false);
        return;
      }

      const locationFilter = location.toLowerCase();
      const pincodeFilter = pincode?.toLowerCase() || '';

      const filtered = providersData.serviceProviders.filter((provider: ServiceProvider) => {
        if (!provider.isActive) return false;
        const providerCity = provider.address?.city?.toLowerCase() || '';
        const providerPincode = provider.address?.zipCode?.toLowerCase() || '';
        const cityMatch = providerCity.includes(locationFilter) || locationFilter.includes(providerCity);
        const pincodeMatch = !!(pincodeFilter && providerPincode === pincodeFilter);
        return cityMatch || pincodeMatch;
      });

      setProviders(filtered);
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Real Service Cards by Location */}
      <section className="py-10 md:py-16" style={{ backgroundColor: colors.background.secondary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5 mr-2" style={{ color: colors.primary[600] }} />
              <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                Services in {userLocation || 'your area'}
              </span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-4" style={{ color: colors.text.primary }}>
              Available Services Near You
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.text.secondary }}>
              {providers.length > 0 
                ? `Found ${providers.length} verified maid${providers.length === 1 ? '' : 's'} available in ${userLocation || 'your area'}`
                : 'Select your location to see available maids in your area'
              }
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p style={{ color: colors.text.secondary }}>Finding maids in your area...</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto mb-4" style={{ color: colors.text.tertiary }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
                No maids available in this area
              </h3>
              <p className="mb-6" style={{ color: colors.text.secondary }}>
                Try selecting a different location or check back later as we expand to more areas.
              </p>
              <button
                onClick={() => router.push('/services')}
                className="px-6 py-3 rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: colors.primary[950], color: colors.text.inverse }}
              >
                Browse All Services
              </button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                {providers.slice(0, 6).map((provider) => {
                  const serviceLabels: string[] = provider.services?.length > 0
                    ? (provider.services as any[]).map((s: any) => s?.name || s).filter(Boolean)
                    : (provider.specializations || []);
                  return (
                    <div
                      key={provider._id}
                      className="bg-white rounded-2xl border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
                      onClick={() => router.push(`/service-provider/${provider._id}`)}
                    >
                      {/* Card header */}
                      <div className="flex items-start gap-4 p-5 pb-4">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                            {provider.profileImage ? (
                              <img src={provider.profileImage} alt={provider.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl font-bold text-gray-500">{provider.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          {provider.isVerified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>

                        {/* Name, rating, meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-gray-900 leading-tight">{provider.name}</h3>
                            {provider.isVerified && (
                              <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">Verified</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3" fill={i < Math.floor(provider.rating) ? '#FBBF24' : '#E5E7EB'} stroke="none" />
                            ))}
                            <span className="text-xs text-gray-500 ml-1">
                              {provider.rating > 0 ? provider.rating.toFixed(1) : 'New'}
                              {provider.totalReviews > 0 && ` (${provider.totalReviews})`}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                            {provider.address?.city && (
                              <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{provider.address.city}</span>
                            )}
                            {provider.experience > 0 && (
                              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{provider.experience} yr{provider.experience !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gray-100 mx-5" />

                      {/* Skills */}
                      <div className="px-5 py-3 flex-1">
                        {serviceLabels.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {serviceLabels.slice(0, 4).map((label, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">{label}</span>
                            ))}
                            {serviceLabels.length > 4 && (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">+{serviceLabels.length - 4} more</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No services listed</p>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="px-5 pb-5 pt-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/book?provider=${provider._id}`); }}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center">
                <button
                  onClick={() => router.push('/services')}
                  className="inline-flex w-full sm:w-auto items-center justify-center px-8 py-3.5 md:py-4 text-base md:text-lg font-semibold rounded-lg transition-colors"
                  style={{ backgroundColor: colors.primary[950], color: colors.text.inverse }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.primary[800])}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.primary[950])}
                >
                  View All Maids
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Refer & Earn Banner */}
      <section className="py-12 md:py-20 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', filter: 'blur(60px)', transform: 'translate(-50%, -50%)' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #2563eb, transparent)', filter: 'blur(80px)', transform: 'translate(50%, 50%)' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase" style={{ background: 'rgba(124,58,237,0.25)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.4)' }}>
              <Gift className="w-3.5 h-3.5" />
              Refer &amp; Earn Program
            </span>
          </div>

          {/* Headline */}
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
              Share a Maid.<br className="hidden sm:block" />
              <span style={{ background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {' '}Earn Real Money.
              </span>
            </h2>
            <p className="text-base md:text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Recommend your favourite maid to friends &amp; family. Every time they complete a booking using your link, you earn a commission — automatically.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-14 max-w-3xl mx-auto">
            {[
              { step: '01', icon: Share2, title: 'Share Your Link', desc: 'Get a unique referral link for any maid. Share it on WhatsApp, Instagram, or anywhere.', color: '#a78bfa' },
              { step: '02', icon: Users, title: 'Friend Books', desc: 'Your friend clicks the link, finds the maid, and completes a booking with payment.', color: '#60a5fa' },
              { step: '03', icon: IndianRupee, title: 'You Earn', desc: 'Commission is credited to your account instantly after their payment is confirmed.', color: '#34d399' },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="relative rounded-2xl p-5 md:p-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <span className="text-xs font-bold tracking-widest" style={{ color: `${color}99` }}>STEP {step}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-base font-bold text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 0 32px rgba(124,58,237,0.4)' }}
            >
              <Gift className="w-5 h-5" />
              Start Referring Now
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              No minimum — earn on every booking
            </p>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <TrustSection />

      {/* Testimonials */}
      <TestimonialsSection />
    </div>
  );
}