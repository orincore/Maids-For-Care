'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Calendar, Star, Plus, Edit, Trash2, MessageSquare, UserCheck, Settings, Eye, Search, ChevronLeft, ChevronRight, X, IndianRupee, LayoutDashboard, Wrench, Users2, CalendarCheck, UserCog, MessageCircle } from 'lucide-react';

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
  services: any[];
  experience: number;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Booking {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  service: {
    name: string;
  };
  services?: Array<{ name: string }>;
  serviceProvider?: {
    name: string;
    phone: string;
    isVerified: boolean;
  };
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // ── Search + pagination state ──────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [providerPage, setProviderPage] = useState(1);
  const PAGE_SIZE = 10;

  const SearchBar = ({
    value, onChange, placeholder,
  }: { value: string; onChange: (v: string) => void; placeholder: string }) => {
    const [showClear, setShowClear] = useState(false);
    return (
      <div className="relative w-full max-w-xs sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setShowClear(e.target.value.length > 0);
          }}
          onFocus={() => setShowClear(value.length > 0)}
          onBlur={() => setShowClear(false)}
          placeholder={placeholder}
          className="relative w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        {showClear && (
          <button
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              onChange('');
              setShowClear(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    [u.name, u.email, u.phone, u.role].some(v =>
      v?.toLowerCase().includes(userSearch.toLowerCase())
    )
  );
  const pagedUsers = filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);
  const totalUserPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  const filteredBookings = bookings.filter(b =>
    [b.user.name, b.user.email, b.service?.name, b.status, b.paymentStatus,
     b.serviceProvider?.name].some(v =>
      v?.toLowerCase().includes(bookingSearch.toLowerCase())
    )
  );
  const pagedBookings = filteredBookings.slice((bookingPage - 1) * PAGE_SIZE, bookingPage * PAGE_SIZE);
  const totalBookingPages = Math.ceil(filteredBookings.length / PAGE_SIZE);

  const filteredProviders = serviceProviders.filter(p =>
    [p.name, p.email, p.phone].some(v =>
      v?.toLowerCase().includes(providerSearch.toLowerCase())
    )
  );
  const pagedProviders = filteredProviders.slice((providerPage - 1) * PAGE_SIZE, providerPage * PAGE_SIZE);
  const totalProviderPages = Math.ceil(filteredProviders.length / PAGE_SIZE);

  // Ensure we're on the client side and the user is authenticated
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAuth = () => {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const userData = localStorage.getItem('adminUser') || localStorage.getItem('user');

      if (!token || !userData) {
        router.replace('/auth/admin');
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);

        if (parsedUser.role !== 'admin') {
          router.replace('/dashboard');
          return;
        }

        setUser(parsedUser);
        fetchData();
      } catch (error) {
        console.error('Admin page - Error parsing user data:', error);
        router.replace('/auth/admin');
      }
    };

    // Small delay to ensure localStorage is ready
    const timeoutId = setTimeout(checkAuth, 100);

    return () => clearTimeout(timeoutId);
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      // Fetch services
      const servicesResponse = await fetch('/api/admin/services', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData.services || []);
      }

      // Fetch users
      const usersResponse = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      // Fetch bookings
      const bookingsResponse = await fetch('/api/admin/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData.bookings || []);
      }

      // Fetch service providers
      const providersResponse = await fetch('/api/admin/service-providers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (providersResponse.ok) {
        const providersData = await providersResponse.json();
        setServiceProviders(providersData.providers || []);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const Pagination = ({
    page, total, onChange,
  }: { page: number; total: number; onChange: (p: number) => void }) => {
    if (total <= 1) return null;
    const pages = Array.from({ length: total }, (_, i) => i + 1);
    const visible = pages.filter(p => p === 1 || p === total || Math.abs(p - page) <= 1);
    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/60">
        <p className="text-sm text-gray-500">
          Page <span className="font-medium text-gray-900">{page}</span> of{' '}
          <span className="font-medium text-gray-900">{total}</span>
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange(page - 1)}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {visible.reduce<React.ReactNode[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) {
              acc.push(<span key={`ellipsis-${p}`} className="px-1 text-gray-400 text-sm">…</span>);
            }
            acc.push(
              <button
                key={p}
                onClick={() => onChange(p)}
                className={`min-w-8 h-8 px-2 rounded-lg border text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            );
            return acc;
          }, [])}
          <button
            onClick={() => onChange(page + 1)}
            disabled={page === total}
            className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = {
    totalUsers: users.length,
    totalBookings: bookings.length,
    totalRevenue: bookings.reduce((sum, booking) => 
      booking.paymentStatus === 'paid' ? sum + booking.totalAmount : sum, 0
    ),
    activeServices: services.filter(s => s.isActive).length,
    totalProviders: serviceProviders.length,
    verifiedProviders: serviceProviders.filter(p => p.isVerified).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-gray-600">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-gray-300 text-sm">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors ring-1 ring-gray-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-1.5">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'services', label: 'Services', icon: Wrench },
              { id: 'users', label: 'Users', icon: Users2 },
              { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
              { id: 'providers', label: 'Providers', icon: UserCog },
              { id: 'reviews', label: 'Reviews', icon: MessageCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Users */}
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 transition-shadow hover:shadow-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Users
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900 mt-1">
                          {stats.totalUsers}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                {/* Total Bookings */}
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 transition-shadow hover:shadow-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-indigo-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Bookings
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900 mt-1">
                          {stats.totalBookings}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 transition-shadow hover:shadow-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <IndianRupee className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Revenue
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900 mt-1">
                          ₹{stats.totalRevenue}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                {/* Active Services */}
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 transition-shadow hover:shadow-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Star className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Services
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900 mt-1">
                          {stats.activeServices}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {bookings.slice(0, 5).map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{booking.user.name}</div>
                          <div className="text-xs text-gray-400">{booking.user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {booking.service.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(booking.scheduledDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-700 tabular-nums">
                          ₹{booking.totalAmount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg ${
                            booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' :
                            booking.status === 'pending'   ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                                                                                                            'bg-gray-50 text-gray-600 ring-1 ring-gray-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              booking.status === 'confirmed' ? 'bg-emerald-500' :
                              booking.status === 'pending'   ? 'bg-amber-500' :
                                                              'bg-gray-400'
                            }`} />
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

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Services Management</h2>
              <button
                onClick={() => router.push('/admin/services/new')}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 font-medium text-sm transition-colors shadow-sm ring-1 ring-gray-700/50"
              >
                <Plus className="w-4 h-4" />
                Add Service
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50/70">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{services.length} service{services.length !== 1 ? 's' : ''} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Name &amp; Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {services.map((service) => (
                      <tr key={service._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap w-full max-w-xs">
                          <div className="text-sm font-semibold text-gray-900 truncate">{service.name}</div>
                          <div className="text-xs text-gray-400 truncate mt-0.5">{service.description.substring(0, 55)}{service.description.length > 55 ? '…' : ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                          {service.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {service.discountedPrice && service.discountedPrice < service.price ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-bold text-emerald-700">₹{service.discountedPrice}</span>
                              <span className="text-xs text-gray-400 line-through">₹{service.price}</span>
                              <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                                -₹{service.price - service.discountedPrice}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-gray-900">₹{service.price}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {service.duration}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg ${
                            service.isActive
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                              : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${service.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {service.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/admin/services/${service._id}/edit`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
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

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
              <SearchBar
                value={userSearch}
                onChange={v => { setUserSearch(v); setUserPage(1); }}
                placeholder="Search by name, email, phone…"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50/70">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {pagedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-14 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="w-10 h-10 text-gray-300" />
                            <p className="text-sm text-gray-400">No users match your search.</p>
                          </div>
                        </td>
                      </tr>
                    ) : pagedUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{u.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.phone || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg capitalize ${
                            u.role === 'admin' ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                          }`}>{u.role}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => router.push(`/admin/users/${u._id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                          >
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

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Bookings Management</h2>
              <SearchBar
                value={bookingSearch}
                onChange={v => { setBookingSearch(v); setBookingPage(1); }}
                placeholder="Search by customer, service, status…"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50/70">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
<th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Maid Assigned</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                       <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200 bg-white">
                     {pagedBookings.length === 0 ? (
                       <tr>
                         <td colSpan={8} className="px-6 py-14 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <CalendarCheck className="w-10 h-10 text-gray-300" />
                            <p className="text-sm text-gray-400">No bookings match your search.</p>
                          </div>
                        </td>
                      </tr>
                    ) : pagedBookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{booking.user.name}</div>
                          <div className="text-xs text-gray-400">{booking.user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {booking.services && booking.services.length > 1 ? (
                            <div>
                              <span className="font-semibold">{booking.services.length} Services:</span>
                              <ul className="text-xs text-gray-400 mt-1 space-y-0.5">
                                {booking.services.map((s, i) => <li key={i}>• {s.name}</li>)}
                              </ul>
                            </div>
                          ) : (
                            booking.service?.name || '—'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {booking.serviceProvider ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-gray-900">{booking.serviceProvider.name}</span>
                                {booking.serviceProvider.isVerified && (
                                  <span className="inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">✓</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400">{booking.serviceProvider.phone}</div>
                            </div>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-200">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{new Date(booking.scheduledDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">{booking.scheduledTime}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-700 tabular-nums">₹{booking.totalAmount}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg ${
                            booking.status === 'confirmed'  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' :
                            booking.status === 'pending'    ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                            booking.status === 'completed'  ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' :
                            booking.status === 'cancelled'  ? 'bg-red-50 text-red-700 ring-1 ring-red-200' :
                                                                 'bg-gray-50 text-gray-600 ring-1 ring-gray-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              booking.status === 'confirmed'  ? 'bg-emerald-500' :
                              booking.status === 'pending'    ? 'bg-amber-500' :
                              booking.status === 'completed'  ? 'bg-blue-500' :
                              booking.status === 'cancelled'  ? 'bg-red-500' :
                                                              'bg-gray-400'
                            }`} />
                            {booking.status}
                          </span>
                        </td>
<td className="px-6 py-4 whitespace-nowrap">
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg ${
                             booking.paymentStatus === 'paid'    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' :
                             booking.paymentStatus === 'pending' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                                                                        'bg-red-50 text-red-700 ring-1 ring-red-200'
                           }`}>
                             <span className={`w-1.5 h-1.5 rounded-full ${
                               booking.paymentStatus === 'paid'    ? 'bg-emerald-500' :
                               booking.paymentStatus === 'pending' ? 'bg-amber-500' :
                                                                   'bg-red-500'
                             }`} />
                             {booking.paymentStatus}
                           </span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                           <button
                             onClick={() => router.push(`/admin/bookings/${booking._id}`)}
                             className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                           >
                             <Eye className="w-3.5 h-3.5" />
                             View Details
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

        {/* Service Providers Tab */}
        {activeTab === 'providers' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Service Providers</h2>
              <div className="flex items-center gap-3">
                <SearchBar
                  value={providerSearch}
                  onChange={v => { setProviderSearch(v); setProviderPage(1); }}
                  placeholder="Search by name, email, phone…"
                />
                <button
                  onClick={() => router.push('/admin/service-providers')}
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 font-medium text-sm transition-colors shadow-sm ring-1 ring-gray-700/50 whitespace-nowrap"
                >
                  <UserCheck className="w-4 h-4" />
                  Manage
                </button>
              </div>
            </div>

            {/* Provider stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Providers</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProviders}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Settings className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Verified</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.verifiedProviders}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <Star className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {serviceProviders.length > 0
                        ? (serviceProviders.reduce((sum, p) => sum + p.rating, 0) / serviceProviders.length).toFixed(1)
                        : '0.0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50/70">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} found</span>
              </div>
              {filteredProviders.length === 0 ? (
                <div className="p-14 text-center flex flex-col items-center gap-3">
                  <UserCheck className="w-10 h-10 text-gray-300" />
                  <p className="text-sm text-gray-400">
                    {serviceProviders.length === 0 ? 'No service providers yet.' : 'No providers match your search.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Experience</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {pagedProviders.map((provider) => (
                          <tr key={provider._id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{provider.name}</div>
                              <div className="text-xs text-gray-400">{provider.services.length} service{provider.services.length !== 1 ? 's' : ''}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700">{provider.email}</div>
                              <div className="text-xs text-gray-400">{provider.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {provider.experience} yr{provider.experience !== 1 ? 's' : ''}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span className="text-sm text-gray-900 font-medium">{provider.rating.toFixed(1)}</span>
                                <span className="text-xs text-gray-400">({provider.totalReviews})</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1.5">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg ${
                                  provider.isVerified ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${provider.isVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                  {provider.isVerified ? 'Verified' : 'Pending'}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg ${
                                  provider.isActive ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${provider.isActive ? 'bg-blue-500' : 'bg-red-500'}`} />
                                  {provider.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(provider.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={providerPage} total={totalProviderPages} onChange={setProviderPage} />
                </>
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Reviews &amp; Ratings</h2>
              <button
                onClick={() => router.push('/admin/reviews')}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 font-medium text-sm transition-colors shadow-sm ring-1 ring-gray-700/50"
              >
                <MessageSquare className="w-4 h-4" />
                Manage Reviews
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Reviews</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">5 Star Reviews</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Low Ratings</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">0.0</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-12 text-center">
              <MessageSquare className="mx-auto h-14 w-14 text-gray-300 mb-5" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">Reviews will appear here once customers start rating services.</p>
              <button
                onClick={() => router.push('/admin/reviews')}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 font-medium text-sm transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Manage Reviews
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}