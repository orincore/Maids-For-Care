'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, MapPin, Star, Clock, X } from 'lucide-react';
import { colors } from '@/lib/colors';

interface ServiceProvider {
  _id: string;
  name: string;
  profileImage?: string;
  rating: number;
  totalReviews: number;
  experience: number;
  isVerified: boolean;
  isActive: boolean;
  bio?: string;
  specializations: string[];
  languages?: string[];
  address: { city: string; state: string; zipCode?: string };
  services: Array<{ _id: string; name: string; category: string }> | string[];
}

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'childcare', label: 'Child Care' },
  { value: 'eldercare', label: 'Elder Care' },
  { value: 'general', label: 'General' },
];

export default function ServicesPage() {
  const [allProviders, setAllProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [pincodeFilter, setPincodeFilter] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.get('search') || '';
    setSearchQuery(search);

    const savedLocation = localStorage.getItem('userLocation') || '';
    const savedPincode = localStorage.getItem('userPincode') || '';
    setUserLocation(savedLocation);
    setLocationFilter(savedLocation.toLowerCase());
    setPincodeFilter(savedPincode.toLowerCase());

    fetchProviders();
  }, [searchParams]);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/service-providers');
      const data = await res.json();
      setAllProviders(data.serviceProviders || []);
    } catch (err) {
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = allProviders.filter((provider) => {
    if (!provider.isActive) return false;

    // Location filter
    if (locationFilter || pincodeFilter) {
      const city = provider.address?.city?.toLowerCase() || '';
      const zip = provider.address?.zipCode?.toLowerCase() || '';
      const cityMatch = city.includes(locationFilter) || locationFilter.includes(city);
      const pinMatch = !!(pincodeFilter && zip === pincodeFilter);
      if (!cityMatch && !pinMatch) return false;
    }

    // Category filter via specializations or linked services
    if (selectedCategory !== 'all') {
      const specs = (provider.specializations || []).map((s) => s.toLowerCase());
      const linkedCats = (provider.services as any[]).map((s: any) =>
        (s?.category || '').toLowerCase()
      );
      const catMatch =
        specs.some((sp) => sp.includes(selectedCategory) || selectedCategory.includes(sp)) ||
        linkedCats.includes(selectedCategory);
      if (!catMatch) return false;
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const specs = (provider.specializations || []).map((s) => s.toLowerCase());
      const linkedNames = (provider.services as any[]).map((s: any) =>
        (s?.name || '').toLowerCase()
      );
      const nameMatch = provider.name.toLowerCase().includes(q);
      const specMatch = specs.some((sp) => sp.includes(q) || q.includes(sp));
      const svcMatch = linkedNames.some((n) => n.includes(q));
      const cityMatch = provider.address?.city?.toLowerCase().includes(q);
      if (!nameMatch && !specMatch && !svcMatch && !cityMatch) return false;
    }

    return true;
  });

  const getServiceLabels = (provider: ServiceProvider): string[] => {
    const linked = (provider.services as any[])
      .map((s: any) => s?.name)
      .filter(Boolean);
    return linked.length > 0 ? linked : provider.specializations || [];
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.secondary }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-30" style={{ borderColor: colors.border.light }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5" style={{ color: colors.text.primary }} />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                Find a Maid
              </h1>
              {userLocation && (
                <p className="text-sm flex items-center gap-1 mt-0.5" style={{ color: colors.text.secondary }}>
                  <MapPin className="w-3.5 h-3.5" />
                  {userLocation}
                </p>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.text.tertiary }} />
              <input
                type="text"
                placeholder="Search by name, service or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                style={{
                  borderColor: colors.border.medium,
                  backgroundColor: colors.background.primary,
                  color: colors.text.primary,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4" style={{ color: colors.text.tertiary }} />
                </button>
              )}
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0"
                style={{
                  backgroundColor: selectedCategory === cat.value ? colors.primary[950] : colors.background.primary,
                  color: selectedCategory === cat.value ? colors.text.inverse : colors.text.secondary,
                  border: `1px solid ${selectedCategory === cat.value ? colors.primary[950] : colors.border.medium}`,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p style={{ color: colors.text.secondary }}>Finding maids...</p>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-14 h-14 mx-auto mb-4" style={{ color: colors.text.tertiary }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
              No maids found
            </h3>
            <p style={{ color: colors.text.secondary }}>
              {searchQuery
                ? `No results for "${searchQuery}". Try different keywords.`
                : 'Try changing your location or category filter.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
              {filteredProviders.length} maid{filteredProviders.length !== 1 ? 's' : ''} available
              {userLocation ? ` in ${userLocation}` : ''}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((provider) => {
                const labels = getServiceLabels(provider);
                return (
                  <div
                    key={provider._id}
                    className="bg-white rounded-2xl border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden"
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

                    {/* Bio (optional) */}
                    {provider.bio && (
                      <p className="px-5 pt-3 text-xs text-gray-400 line-clamp-2 leading-relaxed">{provider.bio}</p>
                    )}

                    {/* Skills */}
                    <div className="px-5 py-3 flex-1">
                      {labels.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {labels.slice(0, 4).map((label, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">{label}</span>
                          ))}
                          {labels.length > 4 && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">+{labels.length - 4} more</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No services listed</p>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="px-5 pb-5 pt-2">
                      <button
                        onClick={() => router.push(`/book?provider=${provider._id}`)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}