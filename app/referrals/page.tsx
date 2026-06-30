'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Copy,
  Check,
  Share2,
  Gift,
  IndianRupee,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface ReferralRecord {
  _id: string;
  referredUser: { name: string; email: string } | null;
  bookingAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt: string | null;
  transactionId: string | null;
  createdAt: string;
}

interface Stats {
  totalEarned: number;
  pendingAmount: number;
  totalReferrals: number;
  paidReferrals: number;
  pendingReferrals: number;
}

type StatusFilter = 'all' | 'pending' | 'paid' | 'cancelled';

const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock },
  paid:    { label: 'Paid',    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: XCircle },
};

function fmt(n: number) {
  return n.toLocaleString('en-IN');
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 4))}@${domain}`;
}

export default function ReferralsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [referralCode, setReferralCode] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.replace('/auth/login?callbackUrl=/referrals'); return; }
    fetchAll();
  }, [status, session]);

  const fetchAll = async () => {
    const uid = session!.user!.id;
    try {
      const [codeRes, statsRes] = await Promise.all([
        fetch('/api/referral/my-code', { headers: { 'user-id': uid } }),
        fetch('/api/referral/stats',   { headers: { 'user-id': uid } }),
      ]);

      if (codeRes.ok) {
        const d = await codeRes.json();
        setReferralCode(d.referralCode || '');
        if (d.referralCode && d.referralCode !== 'undefined') {
          setShareLink(`${window.location.origin}/services?ref=${d.referralCode}`);
        }
      }

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats);
        setReferrals(d.referrals || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, type: 'code' | 'link') => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const t = document.createElement('textarea');
      t.value = text; document.body.appendChild(t); t.select();
      document.execCommand('copy'); document.body.removeChild(t);
    }
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = filter === 'all' ? referrals : referrals.filter(r => r.status === filter);

  const whatsappMsg = shareLink
    ? encodeURIComponent(`Hey! I've been using Maids For Care for home services — highly recommended! 🏠\n\nUse my referral link to book your first service:\n${shareLink}`)
    : '';

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-gray-900">Refer &amp; Earn</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Hero banner */}
        <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 60%, #16213e 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(ellipse at top left, #7c3aed, transparent 60%)' }} />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#a78bfa' }}>Your Rewards</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                  ₹{fmt(stats?.totalEarned ?? 0)} <span className="text-base font-normal" style={{ color: 'rgba(255,255,255,0.5)' }}>earned</span>
                </h1>
                {(stats?.pendingAmount ?? 0) > 0 && (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    + ₹{fmt(stats!.pendingAmount)} pending
                  </p>
                )}
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)' }}>
                <TrendingUp className="w-7 h-7" style={{ color: '#a78bfa' }} />
              </div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { label: 'Total Referrals', value: stats?.totalReferrals ?? 0, color: '#a78bfa' },
                { label: 'Paid Out',        value: stats?.paidReferrals ?? 0,  color: '#34d399' },
                { label: 'Pending',         value: stats?.pendingReferrals ?? 0, color: '#fbbf24' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl px-3 py-3 text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Referral Code + Share */}
        <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Your Referral Details</h2>

          {/* Code */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Referral Code</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <span className="font-mono font-bold text-lg tracking-[0.25em] text-gray-900">{referralCode || '—'}</span>
              </div>
              <button
                onClick={() => referralCode && copy(referralCode, 'code')}
                disabled={!referralCode}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold shrink-0 transition-colors disabled:opacity-40 ${copied === 'code' ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
              >
                {copied === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === 'code' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Link */}
          {shareLink && (
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Share Link</p>
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
          )}

          {/* Share buttons */}
          {shareLink && (
            <div className="flex gap-2 pt-1">
              <a
                href={`https://wa.me/?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5d] transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share on WhatsApp
              </a>
              <button
                onClick={() => copy(shareLink, 'link')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </button>
            </div>
          )}

          {/* Note */}
          <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Share your referral link — when a friend completes a paid booking using it, your commission is added automatically. Share with a specific maid using the <strong>Share &amp; Earn</strong> button on booking pages.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">How It Works</h2>
          <div className="space-y-0">
            {[
              { icon: Share2,       color: 'text-purple-600 bg-purple-50', title: 'Share Your Link',     desc: 'Send your unique link or code to friends & family.' },
              { icon: Users,        color: 'text-blue-600 bg-blue-50',     title: 'Friend Books a Maid', desc: 'They click your link, pick a maid, and pay for the booking.' },
              { icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50', title: 'You Get Paid',       desc: 'Commission is credited and paid out to you by the admin.' },
            ].map(({ icon: Icon, color, title, desc }, i, arr) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {i < arr.length - 1 && <div className="w-px h-6 bg-gray-100 my-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Referral History</h2>
            <span className="text-xs text-gray-400">{referrals.length} total</span>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 px-5 py-3 border-b border-gray-50 overflow-x-auto">
            {(['all', 'pending', 'paid', 'cancelled'] as StatusFilter[]).map((f) => {
              const count = f === 'all' ? referrals.length : referrals.filter(r => r.status === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    filter === f ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {f === 'all' ? 'All' : STATUS_CONFIG[f].label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${filter === f ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="py-14 text-center">
              <Gift className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">
                {referrals.length === 0 ? 'No referrals yet' : `No ${filter} referrals`}
              </p>
              {referrals.length === 0 && (
                <p className="text-xs text-gray-300 mt-1">Share your link to start earning!</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((r) => {
                const cfg = STATUS_CONFIG[r.status];
                const StatusIcon = cfg.icon;
                const userName = r.referredUser?.name || 'Anonymous';
                const userEmail = r.referredUser?.email ? maskEmail(r.referredUser.email) : '';
                return (
                  <div key={r._id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: user + date */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-sm font-bold text-gray-500">
                          {userName[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                          {userEmail && <p className="text-xs text-gray-400">{userEmail}</p>}
                          <p className="text-xs text-gray-300 mt-0.5">{fmtDate(r.createdAt)}</p>
                        </div>
                      </div>

                      {/* Right: amount + status */}
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-gray-900">+₹{fmt(r.commissionAmount)}</p>
                        <p className="text-xs text-gray-400">{r.commissionRate}% of ₹{fmt(r.bookingAmount)}</p>
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Paid details */}
                    {r.status === 'paid' && (r.paidAt || r.transactionId) && (
                      <div className="mt-3 ml-12 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-wrap items-center gap-x-4 gap-y-1">
                        {r.paidAt && (
                          <span className="text-xs text-emerald-700">
                            <span className="font-semibold">Paid on:</span> {fmtDate(r.paidAt)}
                          </span>
                        )}
                        {r.transactionId && (
                          <span className="text-xs text-emerald-700">
                            <span className="font-semibold">Txn ID:</span> {r.transactionId}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Pending note */}
                    {r.status === 'pending' && (
                      <p className="mt-2 ml-12 text-xs text-amber-600">
                        Commission will be paid out by the admin after verification.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Browse maids CTA */}
        <button
          onClick={() => router.push('/services')}
          className="w-full flex items-center justify-between p-4 bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">Find Maids to Share</p>
              <p className="text-xs text-gray-400">Browse maids and use Share &amp; Earn on the booking page</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

      </div>
    </div>
  );
}
