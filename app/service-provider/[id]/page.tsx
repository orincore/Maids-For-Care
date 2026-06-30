'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Globe,
  Sparkles,
  Calendar,
  MessageSquare,
  IndianRupee,
  User,
} from 'lucide-react';

interface Service {
  _id: string;
  name: string;
  category: string;
  price: number;
  discountedPrice?: number;
  duration?: number;
}

interface Availability {
  available: boolean;
  start?: string;
  end?: string;
}

interface ProviderDetail {
  _id: string;
  name: string;
  profileImage?: string;
  rating: number;
  totalReviews: number;
  experience: number;
  isVerified: boolean;
  isActive: boolean;
  bio?: string;
  price?: number;
  discountedPrice?: number;
  specializations: string[];
  languages?: string[];
  address: { city: string; state: string; zipCode?: string };
  services: Service[];
  availability?: Record<string, Availability>;
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string; profileImage?: string };
  service?: { name: string };
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

export default function ServiceProviderProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [provRes, revRes] = await Promise.all([
        fetch(`/api/service-providers/${id}`),
        fetch(`/api/reviews?serviceProvider=${id}`),
      ]);
      if (!provRes.ok) { setNotFound(true); return; }
      const provData = await provRes.json();
      setProvider(provData.serviceProvider);
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData.reviews || []);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (notFound || !provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <User className="w-16 h-16 text-gray-300" />
        <p className="text-lg font-semibold text-gray-700">Maid not found</p>
        <button onClick={() => router.push('/services')} className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
          Browse All Maids
        </button>
      </div>
    );
  }

  const availableDays = provider.availability
    ? Object.entries(provider.availability).filter(([, v]) => v?.available)
    : [];

  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-900 truncate">{provider.name}</span>
          <button
            onClick={() => router.push(`/book?provider=${provider._id}`)}
            className="ml-auto px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors shrink-0"
          >
            Book Now
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Hero card */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          {/* Color band */}
          <div className="h-24 bg-gradient-to-r from-gray-900 to-gray-700" />

          <div className="px-5 pb-5">
            {/* Avatar */}
            <div className="-mt-12 mb-3">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-2xl ring-4 ring-white overflow-hidden bg-gray-200 flex items-center justify-center">
                  {provider.profileImage ? (
                    <img src={provider.profileImage} alt={provider.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-gray-500">{provider.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {provider.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{provider.name}</h1>
                  {provider.isVerified && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Verified</span>
                  )}
                  {!provider.isActive && (
                    <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Unavailable</span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-1.5">
                  {provider.totalReviews > 0 ? (
                    <>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4" fill={i < Math.floor(provider.rating) ? '#FBBF24' : '#E5E7EB'} stroke="none" />
                        ))}
                      </div>
                      <span className="font-semibold text-gray-900">{provider.rating.toFixed(1)}</span>
                      <span className="text-sm text-gray-400">({provider.totalReviews} review{provider.totalReviews !== 1 ? 's' : ''})</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400 italic">No reviews yet</span>
                  )}
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                  {provider.address?.city && (
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{provider.address.city}{provider.address.state ? `, ${provider.address.state}` : ''}</span>
                  )}
                  {provider.experience > 0 && (
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{provider.experience} yr{provider.experience !== 1 ? 's' : ''} experience</span>
                  )}
                </div>
              </div>

              {/* Pricing */}
              {(provider.price ?? 0) > 0 && (
                <div className="text-right shrink-0">
                  {provider.discountedPrice ? (
                    <>
                      <p className="text-xs text-gray-400 line-through">₹{provider.price}/hr</p>
                      <p className="text-lg font-bold text-gray-900">₹{provider.discountedPrice}<span className="text-sm font-normal text-gray-400">/hr</span></p>
                    </>
                  ) : (
                    <p className="text-lg font-bold text-gray-900">₹{provider.price}<span className="text-sm font-normal text-gray-400">/hr</span></p>
                  )}
                </div>
              )}
            </div>

            {/* Bio */}
            {provider.bio && (
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">{provider.bio}</p>
            )}
          </div>
        </div>

        {/* Services */}
        {provider.services && provider.services.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Services Offered
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {provider.services.map((svc) => (
                <div key={svc._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{svc.category}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {svc.discountedPrice ? (
                      <>
                        <p className="text-xs text-gray-400 line-through">₹{svc.price}</p>
                        <p className="text-sm font-bold text-gray-900">₹{svc.discountedPrice}</p>
                      </>
                    ) : (
                      <p className="text-sm font-bold text-gray-900">₹{svc.price}</p>
                    )}
                    {svc.duration && <p className="text-xs text-gray-400">{svc.duration} min</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Specializations + Languages */}
        {((provider.specializations?.length ?? 0) > 0 || (provider.languages?.length ?? 0) > 0) && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5 space-y-4">
            {(provider.specializations?.length ?? 0) > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2.5">Specializations</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.specializations.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {(provider.languages?.length ?? 0) > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Languages
                </h2>
                <div className="flex flex-wrap gap-2">
                  {provider.languages!.map((l, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Availability */}
        {availableDays.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Availability
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(provider.availability!).map(([day, v]) => (
                <div
                  key={day}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${v?.available ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                >
                  <p>{DAY_LABELS[day]}</p>
                  {v?.available && v.start && (
                    <p className="text-[10px] font-normal mt-0.5 text-emerald-600">{v.start}–{v.end}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-500" />
            Reviews
            {reviews.length > 0 && <span className="text-sm font-normal text-gray-400">({reviews.length})</span>}
          </h2>

          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-6">No reviews yet — be the first to leave one after your booking!</p>
          ) : (
            <div className="space-y-4">
              {/* Star breakdown */}
              {provider.totalReviews > 0 && (
                <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl mb-4">
                  <div className="text-center shrink-0">
                    <p className="text-4xl font-bold text-gray-900">{provider.rating.toFixed(1)}</p>
                    <div className="flex items-center justify-center gap-0.5 my-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5" fill={i < Math.round(provider.rating) ? '#FBBF24' : '#E5E7EB'} stroke="none" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {starCounts.map(({ star, count }) => (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-4 text-right shrink-0">{star}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-5 shrink-0">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual reviews */}
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {review.user.profileImage ? (
                        <img src={review.user.profileImage} alt={review.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-gray-500">{review.user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{review.user.name}</p>
                      {review.service && <p className="text-xs text-gray-400">{review.service.name}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-0.5 justify-end">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3" fill={i < review.rating ? '#FBBF24' : '#E5E7EB'} stroke="none" />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-gray-600 leading-relaxed pl-9">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Book CTA */}
        <div className="pb-4">
          <button
            onClick={() => router.push(`/book?provider=${provider._id}`)}
            disabled={!provider.isActive}
            className="w-full py-4 rounded-2xl text-base font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-gray-700"
          >
            {provider.isActive ? `Book ${provider.name}` : 'Currently Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
}
