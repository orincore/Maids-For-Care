'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Calendar, Star, Plus, Edit, Trash2, MessageSquare, UserCheck,
  Settings, Eye, Search, ChevronLeft, ChevronRight, X, IndianRupee,
  LayoutDashboard, Wrench, Users2, CalendarCheck, UserCog, MessageCircle,
  ClipboardList, ShieldCheck, Menu, LogOut, RefreshCw,
  ToggleLeft, ToggleRight, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownRight,
  CreditCard, CheckCircle, Clock, XCircle, Gift, UserPlus, BadgeCheck, Ban, Flag,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support_agent';
}

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  duration: number;
  category: string;
  isActive: boolean;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

interface ServiceProvider {
  _id: string;
  name: string;
  email: string;
  phone: string;
  services: unknown[];
  experience: number;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  address?: { street?: string; city?: string; state?: string; zipCode?: string };
  specializations?: string[];
  languages?: string[];
  bio?: string;
  price?: number;
  discountedPrice?: number | null;
}

interface Booking {
  _id: string;
  user: { name: string; email: string };
  service: { name: string };
  services?: Array<{ name: string }>;
  serviceProvider?: { name: string; phone: string; isVerified: boolean };
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface AdminMember {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support_agent';
  isActive: boolean;
  createdAt: string;
}

interface ActivityLog {
  _id: string;
  adminName: string;
  adminEmail: string;
  adminRole: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown>;
  ip: string;
  createdAt: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const VALID_ROLES = ['super_admin', 'admin', 'support_agent'];

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  support_agent: 'Support Agent',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  admin: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  support_agent: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
};

const PAGE_SIZE = 10;

// ── Small helpers ──────────────────────────────────────────────────────────────

const SearchBar = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => {
  const [showClear, setShowClear] = useState(false);
  return (
    <div className="relative w-full max-w-xs sm:max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setShowClear(e.target.value.length > 0); }}
        onFocus={() => setShowClear(value.length > 0)}
        onBlur={() => setShowClear(false)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
      {showClear && (
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={() => { onChange(''); setShowClear(false); }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

const Pagination = ({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) => {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  const visible = pages.filter(p => p === 1 || p === total || Math.abs(p - page) <= 1);
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50/60">
      <p className="text-sm text-gray-500 hidden sm:block">
        Page <span className="font-medium text-gray-900">{page}</span> of{' '}
        <span className="font-medium text-gray-900">{total}</span>
      </p>
      <div className="flex items-center gap-1 mx-auto sm:mx-0">
        <button onClick={() => onChange(page - 1)} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {visible.reduce<React.ReactNode[]>((acc, p, i, arr) => {
          if (i > 0 && p - (arr[i - 1] as number) > 1) {
            acc.push(<span key={`e-${p}`} className="px-1 text-gray-400 text-sm">…</span>);
          }
          acc.push(
            <button key={p} onClick={() => onChange(p)} className={`min-w-8 h-8 px-2 rounded-lg border text-sm font-medium transition-colors ${p === page ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
              {p}
            </button>
          );
          return acc;
        }, [])}
        <button onClick={() => onChange(page + 1)} disabled={page === total} className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [adminMembers, setAdminMembers] = useState<AdminMember[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logSearch, setLogSearch] = useState('');
  const [revenueData, setRevenueData] = useState<any>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [maidReports, setMaidReports] = useState<any[]>([]);
  const [crLoading, setCrLoading] = useState(false);
  const [mrLoading, setMrLoading] = useState(false);
  const [crFilter, setCrFilter] = useState('');
  const [mrFilter, setMrFilter] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState<{ type: 'change' | 'report'; id: string; name: string } | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolveStatus, setResolveStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Search + pagination
  const [userSearch, setUserSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [providerPage, setProviderPage] = useState(1);

  // Admin management state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', role: 'support_agent' });
  const [adminFormError, setAdminFormError] = useState('');
  const [adminFormLoading, setAdminFormLoading] = useState(false);


  const router = useRouter();

  // ── Permission helpers ──────────────────────────────────────────────────────
  const can = (permission: string): boolean => {
    if (!user) return false;
    const perms: Record<string, string[]> = {
      super_admin: ['manage_admins', 'view_logs', 'view_revenue', 'manage_referrals', 'manage_services', 'manage_users', 'manage_providers', 'delete_reviews', 'view_dashboard', 'view_users', 'view_bookings', 'update_booking_status', 'assign_provider', 'view_reviews'],
      admin: ['view_logs', 'view_revenue', 'manage_referrals', 'manage_services', 'manage_users', 'manage_providers', 'delete_reviews', 'view_dashboard', 'view_users', 'view_bookings', 'update_booking_status', 'assign_provider', 'view_reviews'],
      support_agent: ['view_dashboard', 'view_users', 'view_bookings', 'update_booking_status', 'assign_provider', 'view_reviews'],
    };
    return (perms[user.role] || []).includes(permission);
  };

  // ── Tabs config ─────────────────────────────────────────────────────────────
  const allTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, permission: 'view_dashboard' },
    { id: 'services', label: 'Services', icon: Wrench, permission: 'view_dashboard' },
    { id: 'users', label: 'Users', icon: Users2, permission: 'view_users' },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck, permission: 'view_bookings' },
    { id: 'providers', label: 'Providers', icon: UserCog, permission: 'view_dashboard' },
    { id: 'reviews', label: 'Reviews', icon: MessageCircle, permission: 'view_reviews' },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp, permission: 'view_revenue' },
    { id: 'referrals', label: 'Referrals', icon: Gift, permission: 'manage_referrals', href: '/admin/referrals' },
    { id: 'change-requests', label: 'Change Requests', icon: RefreshCw, permission: 'view_bookings' },
    { id: 'reports', label: 'Reports', icon: Flag, permission: 'view_bookings' },
    { id: 'logs', label: 'Logs', icon: ClipboardList, permission: 'view_logs' },
    { id: 'admins', label: 'Admins', icon: ShieldCheck, permission: 'manage_admins' },
  ] as Array<{ id: string; label: string; icon: React.ComponentType<{ className?: string }>; permission: string; href?: string }>;

  const tabs = allTabs.filter(t => can(t.permission));

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    [u.name, u.email, u.phone, u.role].some(v => v?.toLowerCase().includes(userSearch.toLowerCase()))
  );
  const pagedUsers = filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);
  const totalUserPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  const filteredBookings = bookings.filter(b =>
    [b.user.name, b.user.email, b.service?.name, b.status, b.paymentStatus, b.serviceProvider?.name]
      .some(v => v?.toLowerCase().includes(bookingSearch.toLowerCase()))
  );
  const pagedBookings = filteredBookings.slice((bookingPage - 1) * PAGE_SIZE, bookingPage * PAGE_SIZE);
  const totalBookingPages = Math.ceil(filteredBookings.length / PAGE_SIZE);

  const filteredProviders = serviceProviders.filter(p =>
    [p.name, p.email, p.phone].some(v => v?.toLowerCase().includes(providerSearch.toLowerCase()))
  );
  const pagedProviders = filteredProviders.slice((providerPage - 1) * PAGE_SIZE, providerPage * PAGE_SIZE);
  const totalProviderPages = Math.ceil(filteredProviders.length / PAGE_SIZE);

  const logPages = Math.ceil(logTotal / 50);

  // ── Auth check ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken');
      const userData = localStorage.getItem('adminUser');
      if (!token || !userData) { router.replace('/auth/admin'); return; }
      try {
        const parsed = JSON.parse(userData);
        if (!VALID_ROLES.includes(parsed.role)) { router.replace('/dashboard'); return; }
        setUser(parsed as AdminUser);
        fetchData(token);
      } catch {
        router.replace('/auth/admin');
      }
    };
    const t = setTimeout(checkAuth, 100);
    return () => clearTimeout(t);
  }, [router]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Data fetchers ─────────────────────────────────────────────────────────────
  const fetchData = async (token?: string) => {
    const t = token || localStorage.getItem('adminToken') || '';
    const headers = { 'Authorization': `Bearer ${t}` };
    try {
      const [svc, usr, bkg, pvd] = await Promise.all([
        fetch('/api/admin/services', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/bookings', { headers }),
        fetch('/api/admin/service-providers', { headers }),
      ]);
      if (svc.ok) setServices((await svc.json()).services || []);
      if (usr.ok) setUsers((await usr.json()).users || []);
      if (bkg.ok) setBookings((await bkg.json()).bookings || []);
      if (pvd.ok) setServiceProviders((await pvd.json()).providers || []);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    const token = localStorage.getItem('adminToken') || '';
    const res = await fetch('/api/admin/admins', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setAdminMembers((await res.json()).admins || []);
  };

  const fetchLogs = async (page = 1, search = '') => {
    const token = localStorage.getItem('adminToken') || '';
    const params = new URLSearchParams({ page: String(page), limit: '50', search });
    const res = await fetch(`/api/admin/logs?${params}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs || []);
      setLogTotal(data.total || 0);
    }
  };

  const fetchRevenue = async () => {
    setRevenueLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || '';
      const res = await fetch('/api/admin/revenue', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setRevenueData(await res.json());
    } finally {
      setRevenueLoading(false);
    }
  };

  const fetchChangeRequests = async (filter = '') => {
    setCrLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || '';
      const q = filter ? `?status=${filter}` : '';
      const res = await fetch(`/api/admin/maid-change-requests${q}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setChangeRequests(d.requests || []); }
    } finally { setCrLoading(false); }
  };

  const fetchMaidReports = async (filter = '') => {
    setMrLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || '';
      const q = filter ? `?status=${filter}` : '';
      const res = await fetch(`/api/admin/maid-reports${q}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setMaidReports(d.reports || []); }
    } finally { setMrLoading(false); }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    setResolvingId(resolveModal.id);
    try {
      const token = localStorage.getItem('adminToken') || '';
      const url = resolveModal.type === 'change'
        ? `/api/admin/maid-change-requests/${resolveModal.id}`
        : `/api/admin/maid-reports/${resolveModal.id}`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: resolveStatus, adminNote: resolveNote }),
      });
      setResolveModal(null); setResolveNote(''); setResolveStatus('');
      if (resolveModal.type === 'change') fetchChangeRequests(crFilter);
      else fetchMaidReports(mrFilter);
    } finally { setResolvingId(null); }
  };

  useEffect(() => {
    if (activeTab === 'admins' && can('manage_admins')) fetchAdmins();
    if (activeTab === 'logs' && can('view_logs')) fetchLogs(logPage, logSearch);
    if (activeTab === 'revenue' && can('view_revenue')) fetchRevenue();
    if (activeTab === 'change-requests') fetchChangeRequests(crFilter);
    if (activeTab === 'reports') fetchMaidReports(mrFilter);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs(logPage, logSearch);
  }, [logPage, logSearch]);

  // ── Admin management actions ───────────────────────────────────────────────
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormLoading(true);
    setAdminFormError('');
    try {
      const token = localStorage.getItem('adminToken') || '';
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(adminForm),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAdminModal(false);
        setAdminForm({ name: '', email: '', password: '', role: 'support_agent' });
        fetchAdmins();
      } else {
        setAdminFormError(data.error || 'Failed to create admin');
      }
    } catch {
      setAdminFormError('Network error');
    } finally {
      setAdminFormLoading(false);
    }
  };

  const handleToggleAdmin = async (id: string, isActive: boolean) => {
    const token = localStorage.getItem('adminToken') || '';
    await fetch(`/api/admin/admins/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchAdmins();
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (!confirm(`Delete admin "${name}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('adminToken') || '';
    await fetch(`/api/admin/admins/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    fetchAdmins();
  };

  const handleToggleProviderStatus = async (id: string, field: 'isVerified' | 'isActive', current: boolean) => {
    const token = localStorage.getItem('adminToken') || '';
    await fetch(`/api/admin/service-providers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ [field]: !current }),
    });
    fetchData();
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    if (!confirm(`Delete maid "${name}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('adminToken') || '';
    await fetch(`/api/admin/service-providers/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/');
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    totalUsers: users.length,
    totalBookings: bookings.length,
    totalRevenue: bookings.reduce((s, b) => b.paymentStatus === 'paid' ? s + b.totalAmount : s, 0),
    activeServices: services.filter(s => s.isActive).length,
    totalProviders: serviceProviders.length,
    verifiedProviders: serviceProviders.filter(p => p.isVerified).length,
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
          <p className="text-sm text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const selectTab = (id: string) => {
    const tab = allTabs.find(t => t.id === id);
    if (tab?.href) { router.push(tab.href); return; }
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-gray-600 flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-gray-200 text-sm font-medium leading-none">{user?.name}</p>
                  <p className={`text-xs mt-0.5 inline-flex px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[user?.role || ''] || ''}`}>
                    {ROLE_LABELS[user?.role || ''] || user?.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 px-2.5 py-1.5 rounded-lg transition-colors ring-1 ring-gray-600"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile sidebar backdrop ──────────────────────────────────────────── */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* ── Mobile sidebar drawer ────────────────────────────────────────────── */}
      <div
        ref={menuRef}
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gray-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-gray-300" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">Admin Panel</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id && !tab.href;
            return (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
                  active
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-gray-700/60 px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ring-2 ring-gray-600">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className={`text-xs mt-0.5 inline-flex px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[user?.role || ''] || ''}`}>
                {ROLE_LABELS[user?.role || ''] || user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full text-sm text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* ── Desktop tab nav ──────────────────────────────────────────────────── */}
        <div className="hidden lg:block mb-8">
          <nav className="flex flex-wrap gap-1 bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-1.5">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => selectTab(tab.id)}
                  className={`flex items-center gap-1.5 py-2 px-3 xl:px-4 rounded-lg text-sm font-medium transition-all ${
                    active ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* OVERVIEW TAB                                                       */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
                { label: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'indigo' },
                { label: 'Total Revenue', value: `₹${stats.totalRevenue}`, icon: IndianRupee, color: 'amber' },
                { label: 'Active Services', value: stats.activeServices, icon: Star, color: 'emerald' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-${color}-100 flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${color}-600`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Bookings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Customer', 'Service', 'Date', 'Amount', 'Status'].map(h => (
                        <th key={h} className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {bookings.slice(0, 5).map(booking => (
                      <tr key={booking._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{booking.user.name}</div>
                          <div className="text-xs text-gray-400">{booking.user.email}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">{booking.service?.name}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(booking.scheduledDate).toLocaleDateString()}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-700">₹{booking.totalAmount}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-lg ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : booking.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600'}`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* SERVICES TAB                                                       */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'services' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Services Management</h2>
              {can('manage_services') && (
                <button
                  onClick={() => router.push('/admin/services/new')}
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 font-medium text-sm transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Service
                </button>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Name & Description', 'Category', 'Price', 'Duration', 'Status', ...(can('manage_services') ? ['Actions'] : [])].map(h => (
                        <th key={h} className={`px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {services.map(service => (
                      <tr key={service._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 sm:px-6 py-4 max-w-xs">
                          <div className="text-sm font-semibold text-gray-900 truncate">{service.name}</div>
                          <div className="text-xs text-gray-400 truncate mt-0.5">{service.description.substring(0, 55)}{service.description.length > 55 ? '…' : ''}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{service.category}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          {service.discountedPrice && service.discountedPrice < service.price ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-bold text-emerald-700">₹{service.discountedPrice}</span>
                              <span className="text-xs text-gray-400 line-through">₹{service.price}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-gray-900">₹{service.price}</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.duration}h</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-lg ${service.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${service.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {service.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {can('manage_services') && (
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-2">
                              <button onClick={() => router.push(`/admin/services/${service._id}/edit`)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">
                                <Edit className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100">
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* USERS TAB                                                          */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Users Management</h2>
              <SearchBar value={userSearch} onChange={v => { setUserSearch(v); setUserPage(1); }} placeholder="Search by name, email, phone…" />
            </div>
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-gray-50/70">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{filteredUsers.length} users found</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Name', 'Email', 'Phone', 'Role', 'Joined', 'Actions'].map(h => (
                        <th key={h} className={`px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {pagedUsers.length === 0 ? (
                      <tr><td colSpan={6} className="py-14 text-center text-sm text-gray-400">No users match your search.</td></tr>
                    ) : pagedUsers.map(u => (
                      <tr key={u._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{u.name}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.phone || '—'}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-lg capitalize ${u.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{u.role}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                          <button onClick={() => router.push(`/admin/users/${u._id}`)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700">
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={userPage} total={totalUserPages} onChange={setUserPage} />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* BOOKINGS TAB                                                       */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'bookings' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Bookings Management</h2>
              <SearchBar value={bookingSearch} onChange={v => { setBookingSearch(v); setBookingPage(1); }} placeholder="Search by customer, service, status…" />
            </div>
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Customer', 'Service', 'Maid Assigned', 'Scheduled', 'Amount', 'Status', 'Payment', 'Actions'].map(h => (
                        <th key={h} className={`px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {pagedBookings.length === 0 ? (
                      <tr><td colSpan={8} className="py-14 text-center text-sm text-gray-400">No bookings match your search.</td></tr>
                    ) : pagedBookings.map(booking => (
                      <tr key={booking._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{booking.user.name}</div>
                          <div className="text-xs text-gray-400">{booking.user.email}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {booking.services && booking.services.length > 1 ? `${booking.services.length} Services` : booking.service?.name || '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          {booking.serviceProvider ? (
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{booking.serviceProvider.name}</div>
                              <div className="text-xs text-gray-400">{booking.serviceProvider.phone}</div>
                            </div>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{new Date(booking.scheduledDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">{booking.scheduledTime}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-700">₹{booking.totalAmount}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-lg ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : booking.status === 'pending' ? 'bg-amber-50 text-amber-700' : booking.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-lg ${booking.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : booking.paymentStatus === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                            {booking.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                          <button onClick={() => router.push(`/admin/bookings/${booking._id}`)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700">
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={bookingPage} total={totalBookingPages} onChange={setBookingPage} />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* PROVIDERS TAB                                                      */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'providers' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Maids &amp; Providers</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <SearchBar value={providerSearch} onChange={v => { setProviderSearch(v); setProviderPage(1); }} placeholder="Search providers…" />
                {can('manage_providers') && (
                  <button
                    onClick={() => router.push('/admin/maids/new')}
                    className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 font-medium text-sm whitespace-nowrap shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Onboard Maid
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
              {[
                { label: 'Total Maids', value: stats.totalProviders, icon: UserCheck, color: 'blue' },
                { label: 'Verified', value: stats.verifiedProviders, icon: BadgeCheck, color: 'emerald' },
                { label: 'Avg Rating', value: serviceProviders.length > 0 ? (serviceProviders.reduce((s, p) => s + p.rating, 0) / serviceProviders.length).toFixed(1) : '0.0', icon: Star, color: 'amber' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-${color}-100 flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 text-${color}-600`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Maid', 'Contact', 'Exp', 'Rating', 'Verified', 'Active', 'Joined', ...(can('manage_providers') ? ['Actions'] : [])].map(h => (
                        <th key={h} className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {pagedProviders.length === 0 ? (
                      <tr>
                        <td colSpan={can('manage_providers') ? 8 : 7} className="px-6 py-16 text-center">
                          <UserPlus className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-sm font-medium text-gray-500">No maids onboarded yet</p>
                          {can('manage_providers') && (
                            <button onClick={() => router.push('/admin/maids/new')} className="mt-4 inline-flex items-center gap-2 text-sm text-gray-900 font-semibold underline underline-offset-2">
                              Onboard your first maid
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : pagedProviders.map(provider => (
                      <tr key={provider._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{provider.name}</div>
                          <div className="text-xs text-gray-400">{provider.services.length} service{provider.services.length !== 1 ? 's' : ''}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{provider.email}</div>
                          <div className="text-xs text-gray-400">{provider.phone}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{provider.experience} yr{provider.experience !== 1 ? 's' : ''}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {provider.totalReviews > 0 ? (
                              <>
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span className="text-sm text-gray-900 font-medium">{provider.rating.toFixed(1)}</span>
                                <span className="text-xs text-gray-400">({provider.totalReviews})</span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No reviews</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          {can('manage_providers') ? (
                            <button
                              onClick={() => handleToggleProviderStatus(provider._id, 'isVerified', provider.isVerified)}
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${provider.isVerified ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                            >
                              {provider.isVerified ? <BadgeCheck className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {provider.isVerified ? 'Verified' : 'Pending'}
                            </button>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-lg ${provider.isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              {provider.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          {can('manage_providers') ? (
                            <button
                              onClick={() => handleToggleProviderStatus(provider._id, 'isActive', provider.isActive)}
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${provider.isActive ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                            >
                              {provider.isActive ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                              {provider.isActive ? 'Active' : 'Inactive'}
                            </button>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-lg ${provider.isActive ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                              {provider.isActive ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(provider.createdAt).toLocaleDateString()}</td>
                        {can('manage_providers') && (
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => router.push(`/admin/maids/${provider._id}`)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProvider(provider._id, provider.name)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={providerPage} total={totalProviderPages} onChange={setProviderPage} />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* REVIEWS TAB                                                        */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'reviews' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Reviews &amp; Ratings</h2>
              <button onClick={() => router.push('/admin/reviews')} className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 font-medium text-sm">
                <MessageSquare className="w-4 h-4" />
                Manage Reviews
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-12 text-center">
              <MessageSquare className="mx-auto h-14 w-14 text-gray-300 mb-5" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">Reviews will appear here once customers start rating services.</p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* REVENUE TAB                                                        */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'revenue' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Revenue</h2>
                <p className="text-sm text-gray-500 mt-1">Financial overview from paid bookings</p>
              </div>
              <button
                onClick={fetchRevenue}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
              >
                <RefreshCw className={`w-4 h-4 ${revenueLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {revenueLoading && !revenueData ? (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
              </div>
            ) : revenueData ? (
              <div className="space-y-6">

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Revenue', value: revenueData.summary.totalRevenue, sub: `${revenueData.summary.totalPaidBookings} paid bookings`, icon: IndianRupee, color: 'emerald', trend: null },
                    { label: 'This Month', value: revenueData.summary.monthRevenue, sub: 'current month', icon: Calendar, color: 'blue', trend: null },
                    { label: 'This Week', value: revenueData.summary.weekRevenue, sub: 'current week', icon: TrendingUp, color: 'indigo', trend: null },
                    { label: 'Today', value: revenueData.summary.todayRevenue, sub: 'today so far', icon: ArrowUpRight, color: 'amber', trend: null },
                  ].map(({ label, value, sub, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
                      <div className={`inline-flex h-9 w-9 rounded-lg bg-${color}-100 items-center justify-center mb-3`}>
                        <Icon className={`w-4 h-4 text-${color}-600`} />
                      </div>
                      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">₹{value.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400 mt-1">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Payment Status Breakdown */}
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-5 sm:p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Status Breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { key: 'paid', label: 'Paid', icon: CheckCircle, colorClass: 'text-emerald-600 bg-emerald-50' },
                      { key: 'pending', label: 'Pending', icon: Clock, colorClass: 'text-amber-600 bg-amber-50' },
                      { key: 'failed', label: 'Failed', icon: XCircle, colorClass: 'text-red-600 bg-red-50' },
                      { key: 'refunded', label: 'Refunded', icon: ArrowDownRight, colorClass: 'text-gray-600 bg-gray-100' },
                    ].map(({ key, label, icon: Icon, colorClass }) => {
                      const d = revenueData.paymentBreakdown[key] || { count: 0, amount: 0 };
                      return (
                        <div key={key} className="flex items-start gap-3">
                          <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className="text-lg font-bold text-gray-900">{d.count}</p>
                            <p className="text-xs text-gray-400">₹{d.amount.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Monthly Revenue Chart */}
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-5 sm:p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-5">Monthly Revenue (Last 12 Months)</h3>
                  {(() => {
                    const data: Array<{ month: string; label: string; amount: number }> = revenueData.monthlyRevenue;
                    const max = Math.max(...data.map((d: any) => d.amount), 1);
                    return (
                      <div className="flex items-end gap-1.5 sm:gap-2 h-48 overflow-x-auto pb-2">
                        {data.map((d: any) => (
                          <div key={d.month} className="flex flex-col items-center gap-1 flex-1 min-w-[36px]">
                            <span className="text-[10px] font-semibold text-gray-700 tabular-nums whitespace-nowrap">
                              {d.amount > 0 ? `₹${(d.amount / 1000).toFixed(0)}k` : ''}
                            </span>
                            <div className="w-full flex items-end justify-center" style={{ height: '140px' }}>
                              <div
                                className="w-full rounded-t-md bg-gray-900 hover:bg-gray-700 transition-colors cursor-default relative group"
                                style={{ height: `${Math.max((d.amount / max) * 140, d.amount > 0 ? 4 : 0)}px` }}
                              >
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  ₹{d.amount.toLocaleString('en-IN')}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{d.label}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Revenue by Category */}
                {revenueData.revenueByCategory.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-5 sm:p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-5">Revenue by Service Category</h3>
                    <div className="space-y-3">
                      {(() => {
                        const cats: Array<{ category: string; amount: number; count: number }> = revenueData.revenueByCategory;
                        const maxAmt = Math.max(...cats.map((c: any) => c.amount), 1);
                        return cats.map((cat: any) => (
                          <div key={cat.category}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700 capitalize">{cat.category}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400">{cat.count} booking{cat.count !== 1 ? 's' : ''}</span>
                                <span className="text-sm font-bold text-gray-900">₹{cat.amount.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gray-900 rounded-full transition-all"
                                style={{ width: `${(cat.amount / maxAmt) * 100}%` }}
                              />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Recent Transactions */}
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Recent Transactions</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Booking ID', 'Service', 'Amount', 'Status', 'Date'].map(h => (
                            <th key={h} className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {revenueData.recentTransactions.length === 0 ? (
                          <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No paid transactions yet.</td></tr>
                        ) : revenueData.recentTransactions.map((t: any) => (
                          <tr key={t._id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs font-mono text-gray-500">#{String(t._id).slice(-8).toUpperCase()}</td>
                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-800">{t.serviceName}</td>
                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm font-bold text-emerald-700">₹{t.amount.toLocaleString('en-IN')}</td>
                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-lg ${t.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : t.status === 'confirmed' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                <CreditCard className="w-3 h-3" />
                                {t.status}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                              {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-12 text-center">
                <TrendingUp className="mx-auto h-14 w-14 text-gray-300 mb-4" />
                <p className="text-gray-500">Failed to load revenue data.</p>
                <button onClick={fetchRevenue} className="mt-4 text-sm text-gray-900 underline">Try again</button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* LOGS TAB                                                           */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── Change Requests tab ──────────────────────────────────────────── */}
        {activeTab === 'change-requests' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Maid Change Requests</h2>
                <p className="text-sm text-gray-500 mt-1">Customers requesting a different maid for their booking</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={crFilter} onChange={e => { setCrFilter(e.target.value); fetchChangeRequests(e.target.value); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button onClick={() => fetchChangeRequests(crFilter)} className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
            {crLoading ? (
              <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" /></div>
            ) : changeRequests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 py-16 text-center">
                <RefreshCw className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No change requests found</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>{['Customer', 'Current Maid', 'Booking', 'Reason', 'Status', 'Submitted', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {changeRequests.map((r: any) => (
                        <tr key={r._id} className="hover:bg-gray-50/60">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-900">{r.userId?.name || '—'}</p>
                            <p className="text-xs text-gray-400">{r.userId?.phone}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-sm text-gray-700">{r.maidId?.name || '—'}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {r.bookingId?.scheduledDate ? new Date(r.bookingId.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <p className="text-sm text-gray-700 truncate" title={r.reason}>{r.reason}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                              r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">
                            {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {r.status === 'pending' && can('manage_providers') && (
                              <div className="flex gap-1.5">
                                <button onClick={() => { setResolveModal({ type: 'change', id: r._id, name: r.userId?.name }); setResolveStatus('approved'); setResolveNote(''); }}
                                  className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100">Approve</button>
                                <button onClick={() => { setResolveModal({ type: 'change', id: r._id, name: r.userId?.name }); setResolveStatus('rejected'); setResolveNote(''); }}
                                  className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100">Reject</button>
                              </div>
                            )}
                            {r.status !== 'pending' && r.adminNote && (
                              <p className="text-xs text-gray-400 italic max-w-[140px] truncate" title={r.adminNote}>{r.adminNote}</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Maid Reports tab ─────────────────────────────────────────────── */}
        {activeTab === 'reports' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Maid Reports</h2>
                <p className="text-sm text-gray-500 mt-1">Complaints and reports submitted by customers</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={mrFilter} onChange={e => { setMrFilter(e.target.value); fetchMaidReports(e.target.value); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400">
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
                <button onClick={() => fetchMaidReports(mrFilter)} className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
            {mrLoading ? (
              <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" /></div>
            ) : maidReports.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 py-16 text-center">
                <Flag className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No reports found</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>{['Customer', 'Reported Maid', 'Category', 'Description', 'Status', 'Submitted', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {maidReports.map((r: any) => {
                        const catLabel: Record<string, string> = { behaviour: 'Unprofessional', quality: 'Poor Quality', theft: 'Theft', no_show: 'No Show', other: 'Other' };
                        const statusStyle: Record<string, string> = { open: 'bg-red-100 text-red-700', under_review: 'bg-amber-100 text-amber-700', resolved: 'bg-emerald-100 text-emerald-700', dismissed: 'bg-gray-100 text-gray-500' };
                        return (
                          <tr key={r._id} className="hover:bg-gray-50/60">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="text-sm font-medium text-gray-900">{r.userId?.name || '—'}</p>
                              <p className="text-xs text-gray-400">{r.userId?.phone}</p>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="text-sm text-gray-700">{r.maidId?.name || '—'}</p>
                              {r.maidId?.totalReviews > 0 ? (
                                <div className="flex items-center gap-0.5 mt-0.5">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span className="text-xs text-gray-400">{r.maidId.rating?.toFixed(1)} ({r.maidId.totalReviews})</span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No reviews</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">{catLabel[r.category] || r.category}</span>
                            </td>
                            <td className="px-4 py-3 max-w-[180px]">
                              <p className="text-sm text-gray-700 truncate" title={r.description}>{r.description}</p>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyle[r.status] || 'bg-gray-100 text-gray-600'}`}>
                                {r.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">
                              {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {r.status !== 'resolved' && r.status !== 'dismissed' && can('manage_providers') && (
                                <div className="flex gap-1.5 flex-wrap">
                                  {r.status === 'open' && (
                                    <button onClick={() => { setResolveModal({ type: 'report', id: r._id, name: r.userId?.name }); setResolveStatus('under_review'); setResolveNote(''); }}
                                      className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100">Review</button>
                                  )}
                                  <button onClick={() => { setResolveModal({ type: 'report', id: r._id, name: r.userId?.name }); setResolveStatus('resolved'); setResolveNote(''); }}
                                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100">Resolve</button>
                                  <button onClick={() => { setResolveModal({ type: 'report', id: r._id, name: r.userId?.name }); setResolveStatus('dismissed'); setResolveNote(''); }}
                                    className="px-2.5 py-1 text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">Dismiss</button>
                                </div>
                              )}
                              {(r.status === 'resolved' || r.status === 'dismissed') && r.adminNote && (
                                <p className="text-xs text-gray-400 italic max-w-[140px] truncate" title={r.adminNote}>{r.adminNote}</p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Activity Logs</h2>
              <div className="flex items-center gap-3">
                <SearchBar value={logSearch} onChange={v => { setLogSearch(v); setLogPage(1); }} placeholder="Search logs…" />
                <button onClick={() => fetchLogs(logPage, logSearch)} className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-gray-50/70">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{logTotal} total events</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Timestamp', 'Admin', 'Role', 'Action', 'Resource', 'IP'].map(h => (
                        <th key={h} className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-14 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <ClipboardList className="w-10 h-10 text-gray-300" />
                            <p className="text-sm text-gray-400">No activity logs yet.</p>
                          </div>
                        </td>
                      </tr>
                    ) : logs.map(log => (
                      <tr key={log._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900 font-medium">{new Date(log.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{log.adminName}</div>
                          <div className="text-xs text-gray-400">{log.adminEmail}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-lg ${ROLE_COLORS[log.adminRole] || 'bg-gray-50 text-gray-700'}`}>
                            {ROLE_LABELS[log.adminRole] || log.adminRole}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                          <span className="inline-flex px-2 py-0.5 text-xs font-mono font-semibold rounded-lg bg-gray-100 text-gray-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700 capitalize">{log.resource}</div>
                          {log.resourceId && <div className="text-xs text-gray-400 font-mono">{log.resourceId.slice(-8)}</div>}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs text-gray-500 font-mono">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={logPage} total={logPages} onChange={p => { setLogPage(p); fetchLogs(p, logSearch); }} />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ADMINS TAB                                                         */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'admins' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Management</h2>
                <p className="text-sm text-gray-500 mt-1">Create and manage admin panel users</p>
              </div>
              <button
                onClick={() => { setShowAdminModal(true); setAdminFormError(''); }}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Admin
              </button>
            </div>

            {/* Role Permission Reference */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                {
                  role: 'super_admin',
                  label: 'Super Admin',
                  desc: 'Full access — manage services, bookings, users, providers, reviews, logs, and other admins.',
                  perms: ['All permissions below', 'Manage other admins', 'View activity logs'],
                },
                {
                  role: 'admin',
                  label: 'Admin',
                  desc: 'Manage most resources — cannot create or delete other admin accounts.',
                  perms: ['Manage services', 'Manage users & bookings', 'Manage providers', 'View activity logs'],
                },
                {
                  role: 'support_agent',
                  label: 'Support Agent',
                  desc: 'Read-only access to users, bookings, and reviews. Can update booking status.',
                  perms: ['View users & bookings', 'Update booking status', 'Assign provider', 'View reviews'],
                },
              ].map(({ role, label, desc, perms }) => (
                <div key={role} className={`rounded-xl p-4 border ${ROLE_COLORS[role]?.replace('ring-1 ', '').replace('ring-', 'border-') || 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${ROLE_COLORS[role]}`}>{label}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{desc}</p>
                  <ul className="space-y-1">
                    {perms.map(p => (
                      <li key={p} className="text-xs text-gray-700 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Admins Table */}
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-gray-50/70">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{adminMembers.length} admin{adminMembers.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                        <th key={h} className={`px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {/* Hardcoded super admin row */}
                    <tr className="bg-purple-50/30">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">System Administrator</div>
                        <div className="text-xs text-gray-400">Hardcoded — environment variables</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'Configured via .env'}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-lg ${ROLE_COLORS['super_admin']}`}>Super Admin</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700">Active</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">System</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-xs text-gray-400 italic">Cannot modify</span>
                      </td>
                    </tr>

                    {adminMembers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <ShieldCheck className="w-10 h-10 text-gray-300" />
                            <p className="text-sm text-gray-400">No sub-admins created yet. Click "Create Admin" to add one.</p>
                          </div>
                        </td>
                      </tr>
                    ) : adminMembers.map(a => (
                      <tr key={a._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{a.name}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{a.email}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-lg ${ROLE_COLORS[a.role] || ''}`}>
                            {ROLE_LABELS[a.role] || a.role}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-lg ${a.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${a.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            {a.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleToggleAdmin(a._id, a.isActive)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${a.isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                            >
                              {a.isActive ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                              {a.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(a._id, a.name)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Admin Modal ────────────────────────────────────────────────── */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Admin User</h3>
              <button onClick={() => setShowAdminModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              {adminFormError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {adminFormError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={adminForm.name}
                  onChange={e => setAdminForm({ ...adminForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="john@maidsforcare.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={adminForm.password}
                  onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={adminForm.role}
                  onChange={e => setAdminForm({ ...adminForm, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                >
                  <option value="support_agent">Support Agent — view only + booking updates</option>
                  <option value="admin">Admin — manage services, users, providers</option>
                  <option value="super_admin">Super Admin — full access including admin management</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminFormLoading}
                  className="flex-1 py-2.5 px-4 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {adminFormLoading ? 'Creating…' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Resolve modal (change request / report) ────────────────────────── */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 capitalize">
                {resolveModal.type === 'change' ? 'Change Request' : 'Maid Report'}
              </h3>
              <button onClick={() => setResolveModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            {resolveModal.type === 'report' ? (
              <select value={resolveStatus} onChange={e => setResolveStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="under_review">Mark Under Review</option>
                <option value="resolved">Mark Resolved</option>
                <option value="dismissed">Dismiss</option>
              </select>
            ) : (
              <select value={resolveStatus} onChange={e => setResolveStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </select>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Admin Note (optional)</label>
              <textarea rows={3} value={resolveNote} onChange={e => setResolveNote(e.target.value)}
                placeholder="Add a note visible to the team…"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setResolveModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleResolve} disabled={!!resolvingId}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {resolvingId && <RefreshCw className="w-4 h-4 animate-spin" />}
                {resolvingId ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
