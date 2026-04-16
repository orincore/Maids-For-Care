'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  Bell, 
  Home,
  Briefcase,
  Calendar,
  Star,
  ChevronDown,
  Search,
  MapPin,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { colors } from '@/lib/colors';

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
  const [notifications, setNotifications] = useState(0);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Don't show navbar on auth pages and admin pages
  const hideNavbar = pathname?.startsWith('/auth') || pathname?.startsWith('/admin');

  // Load saved location preference on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    const savedLocationType = localStorage.getItem('locationType');
    const savedPincode = localStorage.getItem('userPincode');
    
    if (savedLocation) {
      setSelectedLocation(savedLocation);
    } else if (savedPincode) {
      // Fallback: construct location from stored pincode if location not saved
      const cityName = localStorage.getItem('userCity');
      if (cityName) {
        setSelectedLocation(cityName);
      }
    }
    
    if (savedLocationType === 'pincode' && savedPincode) {
      setLocationType('pincode');
      setPincode(savedPincode);
    } else if (savedLocationType === 'auto') {
      setLocationType('auto');
    }
  }, []);

  // Popular services for search suggestions
  const popularServices = [
    'House Cleaning', 'Deep Cleaning', 'Kitchen Cleaning', 'Bathroom Cleaning',
    'Daily Cooking', 'Party Cooking', 'Meal Prep', 'Child Care', 'Baby Sitting',
    'Elder Care', 'Laundry Service', 'Ironing', 'Carpet Cleaning', 'Sofa Cleaning'
  ];

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotificationCount();
    }
  }, [session]);

  const fetchNotificationCount = async () => {
    try {
      const response = await fetch('/api/user/notifications', {
        headers: {
          'user-id': session!.user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const unreadCount = data.notifications?.filter((n: any) => !n.isRead).length || 0;
        setNotifications(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/services?search=${encodeURIComponent(query.trim())}&location=${encodeURIComponent(selectedLocation)}`);
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  };

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Try to get pincode from coordinates first (more accurate for India)
          try {
            const pincodeResponse = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const pincodeData = await pincodeResponse.json();
            
            // Try to extract pincode from the response
            const postalCode = pincodeData.postcode || pincodeData.postalCode;
            
            if (postalCode && /^\d{6}$/.test(postalCode)) {
              // Got a valid Indian pincode, now get the exact city name
              const cityResponse = await fetch(`https://api.postalpincode.in/pincode/${postalCode}`);
              const cityData = await cityResponse.json();
              
              if (cityData[0]?.Status === 'Success' && cityData[0]?.PostOffice?.length > 0) {
                const postOffice = cityData[0].PostOffice[0];
                // Use PostOffice Name as the city (specific area/locality)
                const cityName = postOffice.Name;
                const displayLocation = `${cityName}`;
                
                setSelectedLocation(displayLocation);
                setLocationType('auto');
                localStorage.setItem('userLocation', displayLocation);
                localStorage.setItem('locationType', 'auto');
                localStorage.setItem('userPincode', postalCode);
                localStorage.setItem('userCity', cityName);
                localStorage.setItem('userCoords', JSON.stringify({ latitude, longitude }));
                setIsLocationOpen(false);
                setIsDetectingLocation(false);
                return;
              }
            }
          } catch (e) {
            console.log('Pincode detection failed, falling back to city name');
          }
          
          // Fallback: use reverse geocoding city name
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            
            // For India, prefer these fields in order
            const city = data.city || 
                         data.locality || 
                         data.district || 
                         data.principalSubdivision || 
                         'Unknown';
            const state = data.principalSubdivision || '';
            const displayLocation = state && state !== city ? `${city}, ${state}` : city;
            
            setSelectedLocation(displayLocation);
            setLocationType('auto');
            localStorage.setItem('userLocation', displayLocation);
            localStorage.setItem('locationType', 'auto');
            localStorage.setItem('userCoords', JSON.stringify({ latitude, longitude }));
            setIsLocationOpen(false);
          } catch (error) {
            console.error('Error getting location name:', error);
            alert('Unable to detect your location. Please enter pincode manually.');
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to access your location. Please enter pincode manually.');
        }
      );
    } catch (error) {
      console.error('Error detecting location:', error);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handlePincodeSubmit = async () => {
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      alert('Please enter a valid 6-digit pincode');
      return;
    }

    // Get location from pincode using India Post API
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        
        // Use only the PostOffice Name as city (specific locality/area name)
        const cityName = postOffice.Name || '';
        
        // Format: "CityName" - just the city, no district or state
        let locationString;
        if (cityName) {
          locationString = `${cityName}`;
        } else {
          locationString = `Pincode: ${pincode}`;
        }
        
        setSelectedLocation(locationString);
        setLocationType('pincode');
        localStorage.setItem('userLocation', locationString);
        localStorage.setItem('locationType', 'pincode');
        localStorage.setItem('userPincode', pincode);
        localStorage.setItem('userCity', cityName);
        setIsLocationOpen(false);
        setShowPincodeInput(false);
      } else {
        alert('Invalid pincode. Please try again.');
      }
    } catch (error) {
      console.error('Error validating pincode:', error);
      // Fallback: just save the pincode with error indicator
      const fallbackLocation = `Location (${pincode})`;
      setSelectedLocation(fallbackLocation);
      setLocationType('pincode');
      localStorage.setItem('userLocation', fallbackLocation);
      localStorage.setItem('locationType', 'pincode');
      localStorage.setItem('userPincode', pincode);
      setIsLocationOpen(false);
      setShowPincodeInput(false);
    }
  };

  const filteredServices = popularServices.filter(service =>
    service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/services', label: 'Services', icon: Briefcase },
    { href: '/service-provider/register', label: 'Become a Provider', icon: Star },
  ];

  if (hideNavbar) return null;

  return (
    <nav className="bg-white/95 backdrop-blur shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-1">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <button onClick={() => router.push('/')} className="hover:opacity-85 transition-opacity flex items-center">
              <img src="/logo/MFC_logo-bg.png" alt="Maids For Care" className="h-14 w-auto" />
            </button>
          </div>

          {/* Search Bar and Location Selector - Desktop */}
          <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-8">
            {/* Location Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="flex items-center space-x-2 px-4 py-2 border-r border-gray-200 text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <MapPin className={`w-4 h-4 ${locationType ? 'text-gray-700' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">{selectedLocation}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Location Dropdown */}
              {isLocationOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-3">
                    <div className="text-xs font-medium mb-3 px-1 text-gray-500">
                      Select Location
                    </div>
                    
                    {/* Auto Detect Option */}
                    <button
                      onClick={detectLocation}
                      disabled={isDetectingLocation}
                      className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-colors mb-2 text-gray-900 ${locationType === 'auto' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                    >
                      <MapPin className="w-4 h-4 mr-3 text-gray-700" />
                      <div className="text-left">
                        <div className="font-medium">Auto Detect Location</div>
                        <div className="text-xs text-gray-400">
                          {isDetectingLocation ? 'Detecting...' : 'Use my current location'}
                        </div>
                      </div>
                    </button>

                    {/* Enter Pincode Option */}
                    {!showPincodeInput ? (
                      <button
                        onClick={() => setShowPincodeInput(true)}
                        className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-gray-900 ${locationType === 'pincode' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                      >
                        <Search className="w-4 h-4 mr-3 text-gray-700" />
                        <div className="text-left">
                          <div className="font-medium">Enter Pincode Manually</div>
                          <div className="text-xs text-gray-400">
                            {pincode ? `Current: ${pincode}` : 'Type your 6-digit pincode'}
                          </div>
                        </div>
                      </button>
                    ) : (
                      <div className="px-3 py-2">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Enter 6-digit pincode"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 text-gray-900"
                            autoFocus
                          />
                          <Button
                            onClick={handlePincodeSubmit}
                            disabled={pincode.length !== 6}
                            className="px-3 py-2 bg-black text-white hover:bg-gray-800 rounded-lg disabled:opacity-50"
                          >
                            Set
                          </Button>
                        </div>
                        <button
                          onClick={() => setShowPincodeInput(false)}
                          className="text-xs mt-2 hover:underline text-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Current Location Display */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs px-1 text-gray-400">Current Location</div>
                      <div className="text-sm font-medium px-1 mt-1 text-gray-900">
                        {selectedLocation}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative flex-1">
              <div className="relative border border-gray-200 rounded-xl">
                <input
                  type="text"
                  placeholder="Search for services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchQuery);
                    }
                  }}
                  className="w-full px-4 py-2 pr-10 border-0 focus:outline-none text-sm rounded-xl text-gray-900 placeholder-gray-400"
                />
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors text-gray-400 hover:text-gray-700"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Search Suggestions */}
              {isSearchFocused && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-2">
                    {filteredServices.length > 0 ? (
                      <>
                        <div className="text-xs font-medium mb-2 px-2 text-gray-500">
                          Popular Services
                        </div>
                        {filteredServices.slice(0, 6).map((service) => (
                          <button
                            key={service}
                            onClick={() => handleSearch(service)}
                            className="flex items-center w-full px-2 py-2 text-left text-sm rounded-lg transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          >
                            <Search className="w-3 h-3 mr-2" />
                            {service}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-2 py-4 text-center text-sm text-gray-400">
                        No services found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar for Medium Screens */}
          <div className="hidden md:flex lg:hidden items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
                className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 text-gray-900 placeholder-gray-400"
              />
              <button
                onClick={() => handleSearch(searchQuery)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors text-gray-400 hover:text-gray-700"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-gray-900 bg-gray-100'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : session ? (
              <>
                {/* Notifications */}
                <button
                  onClick={() => router.push('/profile?tab=notifications')}
                  className="relative p-2 rounded-xl transition-colors text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Bell className="w-5 h-5" />
                  {notifications > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0"
                    >
                      {notifications > 9 ? '9+' : notifications}
                    </Badge>
                  )}
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-2 rounded-xl transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <UserAvatar src={session.user.image} name={session.user.name} size="sm" />
                    <span className="hidden sm:block text-sm font-medium">
                      {session.user.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900">
                            {session.user.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {session.user.email}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => {
                            router.push('/dashboard');
                            setIsProfileOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Calendar className="w-4 h-4 mr-3" />
                          Dashboard
                        </button>
                        
                        <button
                          onClick={() => {
                            router.push('/profile');
                            setIsProfileOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Profile Settings
                        </button>
                        
                        <button
                          onClick={() => {
                            router.push('/service-provider');
                            setIsProfileOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Briefcase className="w-4 h-4 mr-3" />
                          Provider Dashboard
                        </button>
                        
                        <div className="border-t border-gray-200">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-2 text-sm transition-colors text-rose-600 hover:bg-rose-50"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/auth/login')}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push('/auth/register')}
                  className="bg-black text-white hover:bg-gray-800 rounded-lg px-4 py-2 font-semibold transition-all"
                >
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="md:hidden p-2 rounded-xl transition-colors text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-xl transition-colors text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile Search */}
              <div className="px-3 py-2">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search for services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch(searchQuery);
                          setIsMenuOpen(false);
                        }
                      }}
                      className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 text-gray-900 placeholder-gray-400"
                    />
                    <button
                      onClick={() => { handleSearch(searchQuery); setIsMenuOpen(false); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile Location Selector */}
                <button
                  onClick={() => setIsLocationOpen(!isLocationOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900"
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-700" />
                    <span>{selectedLocation}</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Mobile Location Options */}
                {isLocationOpen && (
                  <div className="mt-2 p-3 border border-gray-200 rounded-xl bg-gray-100">
                    <button
                      onClick={() => { detectLocation(); setIsMenuOpen(false); }}
                      disabled={isDetectingLocation}
                      className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-colors mb-2 text-gray-900 ${locationType === 'auto' ? 'bg-white' : 'hover:bg-white'}`}
                    >
                      <MapPin className="w-4 h-4 mr-3 text-gray-700" />
                      <div className="text-left">
                        <div className="font-medium">Auto Detect Location</div>
                        <div className="text-xs text-gray-400">{isDetectingLocation ? 'Detecting...' : 'Use my current location'}</div>
                      </div>
                    </button>

                    {!showPincodeInput ? (
                      <button
                        onClick={() => setShowPincodeInput(true)}
                        className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-gray-900 ${locationType === 'pincode' ? 'bg-white' : 'hover:bg-white'}`}
                      >
                        <Search className="w-4 h-4 mr-3 text-gray-700" />
                        <div className="text-left">
                          <div className="font-medium">Enter Pincode Manually</div>
                          <div className="text-xs text-gray-400">{pincode ? `Current: ${pincode}` : 'Type your 6-digit pincode'}</div>
                        </div>
                      </button>
                    ) : (
                      <div className="px-1 py-2">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Enter 6-digit pincode"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 text-gray-900"
                            autoFocus
                          />
                          <Button
                            onClick={() => { handlePincodeSubmit(); setIsMenuOpen(false); }}
                            disabled={pincode.length !== 6}
                            className="px-3 py-2 bg-black text-white hover:bg-gray-800 rounded-lg disabled:opacity-50"
                          >
                            Set
                          </Button>
                        </div>
                        <button onClick={() => setShowPincodeInput(false)} className="text-xs mt-2 hover:underline text-gray-400">
                          Cancel
                        </button>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-400">Current Location</div>
                      <div className="text-sm font-medium mt-1 text-gray-900">{selectedLocation}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Navigation Links */}
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <button
                    key={link.href}
                    onClick={() => { router.push(link.href); setIsMenuOpen(false); }}
                    className={`flex items-center w-full space-x-3 px-3 py-2 rounded-xl text-base font-medium transition-colors ${
                      isActive ? 'text-gray-900 bg-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </button>
                );
              })}

              {session && (
                <div className="border-t border-gray-200 pt-3 mt-3 space-y-1">
                  <button
                    onClick={() => { router.push('/dashboard'); setIsMenuOpen(false); }}
                    className="flex items-center w-full space-x-3 px-3 py-2 rounded-xl text-base font-medium transition-colors text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => { router.push('/profile'); setIsMenuOpen(false); }}
                    className="flex items-center w-full space-x-3 px-3 py-2 rounded-xl text-base font-medium transition-colors text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Profile</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(isProfileOpen || isMenuOpen || isLocationOpen || isSearchFocused) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileOpen(false);
            setIsMenuOpen(false);
            setIsLocationOpen(false);
            setIsSearchFocused(false);
            setShowPincodeInput(false);
          }}
        />
      )}
    </nav>
  );
}