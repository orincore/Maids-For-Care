'use client';

import { usePathname, useRouter } from 'next/navigation';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Star,
  Shield,
  Clock,
  Users
} from 'lucide-react';
import { colors, colorCombinations } from '@/lib/colors';

export function Footer() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show footer on auth pages and admin pages
  const hideFooter = pathname?.startsWith('/auth') || pathname?.startsWith('/admin');

  if (hideFooter) return null;

  const currentYear = new Date().getFullYear();

  const serviceCategories = [
    'House Cleaning',
    'Deep Cleaning',
    'Kitchen Cleaning',
    'Bathroom Cleaning',
    'Laundry Service',
    'Cooking Service',
    'Child Care',
    'Elder Care'
  ];

  const quickLinks = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Become a Provider', href: '/service-provider/register' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Profile', href: '/profile' },
  ];

  const supportLinks = [
    { label: 'Sign In', href: '/auth/login' },
    { label: 'Register', href: '/auth/register' },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Verified Professionals',
      description: 'All service providers are background verified'
    },
    {
      icon: Star,
      title: 'Quality Assured',
      description: '100% satisfaction guarantee on all services'
    },
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      description: 'Book services at your convenient time'
    },
    {
      icon: Users,
      title: 'Trusted by Thousands',
      description: 'Join our community of satisfied customers'
    }
  ];

  return (
    <footer style={{ backgroundColor: colors.primary[950], color: colors.text.inverse }}>
      {/* Features Section */}
      <div className="border-b" style={{ borderColor: colors.primary[800] }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4" style={{ backgroundColor: colors.primary[800] }}>
                    <Icon className="w-6 h-6" style={{ color: colors.text.inverse }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.inverse }}>{feature.title}</h3>
                  <p className="text-sm" style={{ color: colors.primary[400] }}>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: colors.text.inverse }}>Maids for Care</h2>
              <p className="mb-6 max-w-md" style={{ color: colors.primary[400] }}>
                Professional home services at your doorstep. We connect you with verified, 
                trusted service providers for all your household needs.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5" style={{ color: colors.primary[400] }} />
                <span style={{ color: colors.primary[300] }}>support@Maids For Care.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5" style={{ color: colors.primary[400] }} />
                <span style={{ color: colors.primary[300] }}>+91 9876543210</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5" style={{ color: colors.primary[400] }} />
                <span style={{ color: colors.primary[300] }}>Mumbai, Maharashtra, India</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4 mt-6">
              {[
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' }
              ].map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                    style={{ backgroundColor: colors.primary[800] }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primary[700]}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary[800]}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text.inverse }}>Our Services</h3>
            <ul className="space-y-3">
              {serviceCategories.map((service, index) => (
                <li key={index}>
                  <button
                    onClick={() => router.push('/services')}
                    className="transition-colors text-sm"
                    style={{ color: colors.primary[400] }}
                    onMouseEnter={(e) => e.currentTarget.style.color = colors.text.inverse}
                    onMouseLeave={(e) => e.currentTarget.style.color = colors.primary[400]}
                  >
                    {service}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text.inverse }}>Company</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => router.push(link.href)}
                    className="transition-colors text-sm"
                    style={{ color: colors.primary[400] }}
                    onMouseEnter={(e) => e.currentTarget.style.color = colors.text.inverse}
                    onMouseLeave={(e) => e.currentTarget.style.color = colors.primary[400]}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text.inverse }}>Support</h3>
            <ul className="space-y-3">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => router.push(link.href)}
                    className="transition-colors text-sm"
                    style={{ color: colors.primary[400] }}
                    onMouseEnter={(e) => e.currentTarget.style.color = colors.text.inverse}
                    onMouseLeave={(e) => e.currentTarget.style.color = colors.primary[400]}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Service Provider CTA */}
      <div className="border-t" style={{ borderColor: colors.primary[800] }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-lg p-6 text-center" style={{ backgroundColor: colors.primary[800] }}>
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.inverse }}>Want to become a service provider?</h3>
            <p className="mb-4" style={{ color: colors.primary[400] }}>
              Join our network of trusted professionals and grow your business
            </p>
            <button
              onClick={() => router.push('/service-provider/register')}
              className="px-6 py-2 rounded-lg font-medium transition-colors"
              style={{ 
                backgroundColor: colors.text.inverse,
                color: colors.primary[950],
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background.secondary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.text.inverse}
            >
              Join as Provider
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t" style={{ borderColor: colors.primary[800] }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm" style={{ color: colors.primary[400] }}>
              © 2026 Maids for care. All rights reserved.
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <button
                onClick={() => router.push('/auth/admin')}
                className="transition-colors text-xs opacity-50"
                style={{ color: colors.primary[600] }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.primary[400];
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.primary[600];
                  e.currentTarget.style.opacity = '0.5';
                }}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}