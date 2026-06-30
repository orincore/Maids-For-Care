'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, Star, IndianRupee, Clock, Users, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

interface Maid {
  _id: string;
  name: string;
  rating: number;
  totalReviews?: number;
  profileImage?: string;
  specializations?: string[];
  experience?: number;
}

interface ReferralStats {
  totalEarned: number;
  pendingAmount: number;
  totalReferrals: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  maid: Maid;
  userId: string;
}

export function ShareMaidModal({ isOpen, onClose, maid, userId }: Props) {
  const [referralCode, setReferralCode] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      setReferralCode('');
      setShareLink('');
      setLoadError('');
      load();
    }
  }, [isOpen, userId]);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [codeRes, statsRes] = await Promise.all([
        fetch('/api/referral/my-code', { headers: { 'user-id': userId } }),
        fetch('/api/referral/stats', { headers: { 'user-id': userId } }),
      ]);
      if (codeRes.ok) {
        const d = await codeRes.json();
        if (d.referralCode && typeof d.referralCode === 'string' && d.referralCode !== 'undefined') {
          setReferralCode(d.referralCode);
          const base = window.location.origin;
          setShareLink(`${base}/services?ref=${d.referralCode}&provider=${maid._id}`);
        } else {
          setLoadError('Your referral code is not available yet. Please try again later.');
        }
      } else {
        setLoadError('Could not load your referral code. Please try again.');
      }
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats);
      }
    } catch {
      setLoadError('Something went wrong loading your share link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, type: 'link' | 'code') => {
    try { await navigator.clipboard.writeText(text); }
    catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const whatsappMsg = encodeURIComponent(
    `Hi! I've been using *${maid.name}* from Maids For Care for home services and she's fantastic! ⭐ ${maid.rating.toFixed(1)} rating${maid.experience ? `, ${maid.experience} years experience` : ''}.\n\nBook her using my link and get quality home services:\n${shareLink}`
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Share {maid.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Earn commission when your friend books</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : loadError ? (
          <div className="p-5 flex flex-col items-center gap-3 py-10">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 mb-1">Could not load share link</p>
              <p className="text-xs text-gray-500">{loadError}</p>
            </div>
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">

            {/* Maid card */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                {maid.profileImage
                  ? <img src={maid.profileImage} alt={maid.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500">{maid.name[0]}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{maid.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {(maid.totalReviews ?? 0) > 0 ? (
                    <>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium text-gray-700">{maid.rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({maid.totalReviews} reviews)</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No reviews yet</span>
                  )}
                </div>
                {maid.specializations && maid.specializations.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{maid.specializations.slice(0, 3).join(' · ')}</p>
                )}
              </div>
            </div>

            {/* Stats strip */}
            {stats && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Earned', value: `₹${stats.totalEarned.toLocaleString('en-IN')}`, icon: IndianRupee, c: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Pending', value: `₹${stats.pendingAmount.toLocaleString('en-IN')}`, icon: Clock, c: 'text-amber-600 bg-amber-50' },
                  { label: 'Referrals', value: String(stats.totalReferrals), icon: Users, c: 'text-blue-600 bg-blue-50' },
                ].map(({ label, value, icon: Icon, c }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <div className={`inline-flex h-6 w-6 rounded-lg items-center justify-center mb-1 ${c}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Share link */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Share Link</p>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                <span className="text-xs text-gray-500 truncate flex-1">{shareLink}</span>
                <button
                  onClick={() => copy(shareLink, 'link')}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${copied === 'link' ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
                >
                  {copied === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'link' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Referral code */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-gray-400">Your referral code</p>
                <p className="text-base font-mono font-bold tracking-widest text-gray-900">{referralCode}</p>
              </div>
              <button
                onClick={() => copy(referralCode, 'code')}
                className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${copied === 'code' ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                {copied === 'code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'code' ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            {/* Share buttons */}
            {shareLink && (
              <div className="flex gap-2 pt-1">
                <a
                  href={`https://wa.me/?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5d] transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share on WhatsApp
                </a>
                <button
                  onClick={() => copy(shareLink, 'link')}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </button>
              </div>
            )}

            {/* Info pill */}
            <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
              <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                When your friend books any service using your link or code, you earn a commission — credited to your account automatically.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
