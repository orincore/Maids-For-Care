'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Menu, X, LogOut, Settings, Bell, Home, Briefcase,
  Calendar, Star, ChevronDown, Search, MapPin, Gift,
  ChevronRight, Navigation,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Mumbai');
  const [locationType, setLocationType] = useState<'auto' | 'pincode' | null>(null);
  const [pincode, setPincode] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showPincodeInput, setShowPincodeInput] = useState(false);
  const [mobilePincodeInput, setMobilePincodeInput] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const hideNavbar = pathname?.startsWith('/auth') || pathname?.startsWith('/admin');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    const savedLocationType = localStorage.getItem('locationType');
    const savedPincode = localStorage.getItem('userPincode');
    if (savedLocation) setSelectedLocation(savedLocation);
    else if (savedPincode) {
      const cityName = localStorage.getItem('userCity');
      if (cityName) setSelectedLocation(cityName);
    }
    if (savedLocationType === 'pincode' && savedPincode) { setLocationType('pincode'); setPincode(savedPincode); }
    else if (savedLocationType === 'auto') setLocationType('auto');
  }, []);

  useEffect(() => {
    if (session?.user?.id) fetchNotificationCount();
  }, [session]);

  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const popularServices = [
    'House Cleaning', 'Deep Cleaning', 'Kitchen Cleaning', 'Bathroom Cleaning',
    'Daily Cooking', 'Party Cooking', 'Meal Prep', 'Child Care', 'Baby Sitting',
    'Elder Care', 'Laundry Service', 'Ironing', 'Carpet Cleaning', 'Sofa Cleaning',
  ];

  const fetchNotificationCount = async () => {
    try {
      const res = await fetch('/api/user/notifications', { headers: { 'user-id': session!.user.id } });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications?.filter((n: any) => !n.isRead).length || 0);
      }
    } catch {}
  };

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    router.push(`/services?search=${encodeURIComponent(query.trim())}&location=${encodeURIComponent(selectedLocation)}`);
    setSearchQuery('');
    setIsSearchFocused(false);
    setIsMenuOpen(false);
  };

  const navigate = (href: string) => {
    router.push(href);
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
      navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude, longitude } }) => {
          try {
            const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const d = await r.json();
            const postalCode = d.postcode || d.postalCode;
            if (postalCode && /^\d{6}$/.test(postalCode)) {
              const cr = await fetch(`https://api.postalpincode.in/pincode/${postalCode}`);
              const cd = await cr.json();
              if (cd[0]?.Status === 'Success' && cd[0]?.PostOffice?.length > 0) {
                const cityName = cd[0].PostOffice[0].Name;
                setSelectedLocation(cityName);
                setLocationType('auto');
                localStorage.setItem('userLocation', cityName);
                localStorage.setItem('locationType', 'auto');
                localStorage.setItem('userPincode', postalCode);
                localStorage.setItem('userCity', cityName);
                setIsLocationOpen(false);
                setIsDetectingLocation(false);
                window.location.reload();
                return;
              }
            }
            const city = d.city || d.locality || d.district || d.principalSubdivision || 'Unknown';
            const state = d.principalSubdivision || '';
            const display = state && state !== city ? `${city}, ${state}` : city;
            setSelectedLocation(display);
            setLocationType('auto');
            localStorage.setItem('userLocation', display);
            localStorage.setItem('locationType', 'auto');
            setIsLocationOpen(false);
            window.location.reload();
          } catch { alert('Unable to detect location. Enter pincode manually.'); }
        },
        () => alert('Location access denied. Enter pincode manually.')
      );
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handlePincodeSubmit = async (closeMobile = false) => {
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) { alert('Enter a valid 6-digit pincode'); return; }
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const cityName = data[0].PostOffice[0].Name || '';
        const loc = cityName || `Pincode: ${pincode}`;
        setSelectedLocation(loc);
        setLocationType('pincode');
        localStorage.setItem('userLocation', loc);
        localStorage.setItem('locationType', 'pincode');
        localStorage.setItem('userPincode', pincode);
        localStorage.setItem('userCity', cityName);
        setIsLocationOpen(false);
        setShowPincodeInput(false);
        setMobilePincodeInput(false);
        if (closeMobile) setIsMenuOpen(false);
        window.location.reload();
      } else {
        alert('Invalid pincode. Please try again.');
      }
    } catch {
      const loc = `Location (${pincode})`;
      setSelectedLocation(loc);
      setLocationType('pincode');
      localStorage.setItem('userLocation', loc);
      localStorage.setItem('locationType', 'pincode');
      localStorage.setItem('userPincode', pincode);
      setIsLocationOpen(false);
      setShowPincodeInput(false);
      setMobilePincodeInput(false);
      window.location.reload();
    }
  };

  const filteredServices = popularServices.filter(s =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/service-provider/register', label: 'Become a Provider' },
  ];

  if (hideNavbar) return null;

  return (
    <>
      {/* ══════════════════════════════════════════════
          Desktop & Tablet Navbar
      ══════════════════════════════════════════════ */}
      <nav className={`hidden md:block bg-white sticky top-0 z-50 transition-shadow duration-200 ${scrolled ? 'shadow-md border-b border-gray-100' : 'shadow-sm border-b border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center h-[68px] gap-6">

            {/* ── Logo ── */}
            <button onClick={() => router.push('/')} className="hover:opacity-80 transition-opacity flex-shrink-0 mr-2">
              <img src="/logo/MFC_logo-bg.png" alt="Maids For Care" className="h-11 w-auto" />
            </button>

            {/* ── Nav links ── */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navLinks.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <button
                    key={href}
                    onClick={() => router.push(href)}
                    className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'text-gray-900'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gray-900 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Unified Search Pill ── */}
            <div className="flex-1 max-w-xl mx-auto relative" ref={searchRef}>
              <div className={`flex items-center h-10 bg-white border rounded-xl transition-all duration-150 ${
                isSearchFocused
                  ? 'border-gray-400 shadow-md ring-2 ring-gray-100'
                  : 'border-gray-300 shadow-sm hover:border-gray-400'
              }`}>
                {/* Location button */}
                <button
                  onClick={() => { setIsLocationOpen(!isLocationOpen); setIsSearchFocused(false); }}
                  className="flex items-center gap-1.5 pl-3 pr-3 h-full border-r border-gray-200 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0 group"
                >
                  <MapPin className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                  <span className="text-sm font-medium max-w-[100px] truncate">{selectedLocation}</span>
                  <ChevronDown className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Search input */}
                <input
                  type="text"
                  placeholder="Search for services…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => { setIsSearchFocused(true); setIsLocationOpen(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSearch(searchQuery); }}
                  className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none min-w-0"
                />

                {/* Search button */}
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="flex items-center justify-center w-9 h-8 mr-1 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors flex-shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Location dropdown */}
              {isLocationOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-50 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Choose Location</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={detectLocation}
                      disabled={isDetectingLocation}
                      className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${locationType === 'auto' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Navigation className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Detect automatically</p>
                        <p className="text-xs text-gray-400">{isDetectingLocation ? 'Detecting…' : 'Use your current location'}</p>
                      </div>
                      {locationType === 'auto' && <span className="ml-auto text-xs text-green-600 font-semibold">Active</span>}
                    </button>

                    {!showPincodeInput ? (
                      <button
                        onClick={() => setShowPincodeInput(true)}
                        className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${locationType === 'pincode' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-purple-500" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Enter pincode</p>
                          <p className="text-xs text-gray-400">{pincode ? `Current: ${pincode}` : '6-digit postal code'}</p>
                        </div>
                        {locationType === 'pincode' && <span className="ml-auto text-xs text-green-600 font-semibold">Active</span>}
                      </button>
                    ) : (
                      <div className="px-2 py-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. 400001"
                            value={pincode}
                            onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-900"
                            autoFocus
                          />
                          <button
                            onClick={() => handlePincodeSubmit()}
                            disabled={pincode.length !== 6}
                            className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-gray-700 transition-colors"
                          >
                            Set
                          </button>
                        </div>
                        <button onClick={() => setShowPincodeInput(false)} className="text-xs mt-2 text-gray-400 hover:text-gray-600">← Back</button>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500 truncate">{selectedLocation}</p>
                  </div>
                </div>
              )}

              {/* Search suggestions */}
              {isSearchFocused && searchQuery && filteredServices.length > 0 && (
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-50 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Suggestions</p>
                  </div>
                  <div className="p-2">
                    {filteredServices.slice(0, 6).map(s => (
                      <button
                        key={s}
                        onClick={() => handleSearch(s)}
                        className="flex items-center w-full gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Search className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right side ── */}
            <div className="flex items-center gap-1 flex-shrink-0">

              {/* Refer & Earn — only when logged in */}
              {session && (
                <button
                  onClick={() => router.push('/referrals')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    pathname === '/referrals'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-purple-600 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  <Gift className="w-4 h-4" />
                  <span className="hidden lg:inline">Refer &amp; Earn</span>
                </button>
              )}

              {status === 'loading' ? (
                <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse ml-1" />
              ) : session ? (
                <>
                  {/* Bell */}
                  <button
                    onClick={() => router.push('/profile?tab=notifications')}
                    className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <Bell className="w-[18px] h-[18px]" />
                    {notifications > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                    )}
                  </button>

                  {/* Avatar + dropdown */}
                  <div className="relative ml-1">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className={`flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border transition-all ${
                        isProfileOpen
                          ? 'border-gray-300 bg-gray-50 shadow-sm'
                          : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <UserAvatar src={session.user.image} name={session.user.name} size="sm" />
                      <span className="text-sm font-medium text-gray-900 max-w-[80px] truncate">
                        {session.user.name?.split(' ')[0]}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 top-[calc(100%+6px)] w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                        {/* User info */}
                        <div className="px-4 py-3.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">{session.user.name}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{session.user.email}</p>
                        </div>
                        <div className="h-px bg-gray-100 mx-3" />
                        {/* Menu items */}
                        <div className="p-1.5">
                          {[
                            { href: '/dashboard', label: 'Dashboard', icon: Calendar },
                            { href: '/referrals', label: 'Refer & Earn', icon: Gift, purple: true },
                            { href: '/profile', label: 'Profile Settings', icon: Settings },
                            { href: '/service-provider', label: 'Provider Dashboard', icon: Briefcase },
                          ].map(({ href, label, icon: Icon, purple }) => (
                            <button
                              key={href}
                              onClick={() => navigate(href)}
                              className={`flex items-center w-full gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                                purple
                                  ? 'text-purple-700 hover:bg-purple-50'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <Icon className="w-4 h-4 flex-shrink-0" />
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="h-px bg-gray-100 mx-3" />
                        <div className="p-1.5">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center w-full gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4 flex-shrink-0" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 ml-1">
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/auth/register')}
                    className="px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Click-outside backdrop */}
        {(isProfileOpen || isLocationOpen || isSearchFocused) && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsProfileOpen(false);
              setIsLocationOpen(false);
              setIsSearchFocused(false);
              setShowPincodeInput(false);
            }}
          />
        )}
      </nav>

      {/* ══════════════════════════════════════════════
          Mobile top bar
      ══════════════════════════════════════════════ */}
      <nav className={`md:hidden bg-white sticky top-0 z-50 border-b transition-shadow duration-200 ${scrolled ? 'border-gray-200 shadow-md' : 'border-gray-100 shadow-sm'}`}>
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={() => router.push('/')} className="hover:opacity-80 transition-opacity">
            <img src="/logo/MFC_logo-bg.png" alt="Maids For Care" className="h-10 w-auto" />
          </button>
          <div className="flex items-center gap-1">
            {session && (
              <button
                onClick={() => router.push('/profile?tab=notifications')}
                className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </button>
            )}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          Mobile Full-Screen Side Panel
      ══════════════════════════════════════════════ */}
      <div className={`fixed inset-0 z-[60] md:hidden transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMenuOpen(false)}
        />

        <div className={`absolute right-0 top-0 h-full w-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <img src="/logo/MFC_logo-bg.png" alt="Maids For Care" className="h-10 w-auto" />
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User strip */}
          {session && (
            <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
              <UserAvatar src={session.user.image} name={session.user.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{session.user.name}</p>
                <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="px-4 pt-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search services…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(searchQuery); }}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-900 placeholder-gray-400 bg-gray-50"
              />
            </div>
            {searchQuery && filteredServices.length > 0 && (
              <div className="mt-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {filteredServices.slice(0, 4).map(s => (
                  <button key={s} onClick={() => handleSearch(s)}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    <Search className="w-3 h-3 mr-2 text-gray-300" />{s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="px-4 pb-3">
            <button
              onClick={() => setIsLocationOpen(!isLocationOpen)}
              className="flex items-center justify-between w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="truncate">{selectedLocation}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLocationOpen && (
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                <button onClick={detectLocation} disabled={isDetectingLocation}
                  className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm text-gray-900 hover:bg-white transition-colors">
                  <Navigation className="w-4 h-4 mr-3 text-gray-500" />
                  <div className="text-left">
                    <p className="font-medium">Auto Detect</p>
                    <p className="text-xs text-gray-400">{isDetectingLocation ? 'Detecting…' : 'Use current location'}</p>
                  </div>
                </button>
                {!mobilePincodeInput ? (
                  <button onClick={() => setMobilePincodeInput(true)}
                    className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm text-gray-900 hover:bg-white transition-colors">
                    <MapPin className="w-4 h-4 mr-3 text-gray-500" />
                    <div className="text-left">
                      <p className="font-medium">Enter Pincode</p>
                      <p className="text-xs text-gray-400">{pincode ? `Current: ${pincode}` : '6-digit pincode'}</p>
                    </div>
                  </button>
                ) : (
                  <div className="px-1 pt-1">
                    <div className="flex gap-2">
                      <input type="text" placeholder="6-digit pincode" value={pincode}
                        onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-900 bg-white"
                        autoFocus />
                      <button onClick={() => handlePincodeSubmit(true)} disabled={pincode.length !== 6}
                        className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold disabled:opacity-40">
                        Set
                      </button>
                    </div>
                    <button onClick={() => setMobilePincodeInput(false)} className="text-xs mt-1.5 text-gray-400 hover:underline">Cancel</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nav links */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2 pt-1 pb-1">Navigation</p>
            {[
              { href: '/', label: 'Home', icon: Home },
              { href: '/services', label: 'Services', icon: Briefcase },
              { href: '/service-provider/register', label: 'Become a Provider', icon: Star },
            ].map(({ href, label, icon: Icon }) => (
              <button key={href} onClick={() => navigate(href)}
                className={`flex items-center w-full gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname === href ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                <Icon className="w-5 h-5 shrink-0" />
                <span>{label}</span>
                {pathname === href && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
              </button>
            ))}

            {session && (
              <>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2 pt-4 pb-1">My Account</p>
                {[
                  { href: '/dashboard', label: 'Dashboard', icon: Calendar },
                  { href: '/profile', label: 'Profile Settings', icon: Settings },
                  { href: '/service-provider', label: 'Provider Dashboard', icon: Briefcase },
                ].map(({ href, label, icon: Icon }) => (
                  <button key={href} onClick={() => navigate(href)}
                    className={`flex items-center w-full gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      pathname === href ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
                    }`}>
                    <Icon className="w-5 h-5 shrink-0" /><span>{label}</span>
                  </button>
                ))}
                <button onClick={() => navigate('/referrals')}
                  className={`flex items-center w-full gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all mt-1 ${
                    pathname === '/referrals' ? 'bg-purple-100 text-purple-700' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}>
                  <Gift className="w-5 h-5 shrink-0" />
                  <span>Refer &amp; Earn</span>
                  <span className="ml-auto text-[10px] font-bold bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">Earn</span>
                </button>
              </>
            )}

            {!session && status !== 'loading' && (
              <>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2 pt-4 pb-1">Account</p>
                <button onClick={() => navigate('/auth/login')}
                  className="flex items-center w-full gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  <Star className="w-5 h-5 shrink-0" /><span>Sign In</span>
                </button>
                <button onClick={() => navigate('/auth/register')}
                  className="flex items-center justify-center w-full gap-2 px-3 py-3 rounded-xl text-sm font-bold bg-gray-900 text-white hover:bg-gray-700 transition-colors mt-1">
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Sign out */}
          {session && (
            <div className="border-t border-gray-100 px-4 py-4">
              <button onClick={handleSignOut}
                className="flex items-center w-full gap-3 px-3 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors">
                <LogOut className="w-5 h-5 shrink-0" /><span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
