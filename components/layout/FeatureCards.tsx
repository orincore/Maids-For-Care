'use client';

import { useRouter } from 'next/navigation';
import { 
  Home, 
  ChefHat, 
  Baby, 
  Shirt, 
  Clock, 
  Shield, 
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { colors } from '@/lib/colors';

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  price: string;
  features: string[];
  popular?: boolean;
}

const serviceCards: ServiceCard[] = [
  {
    id: 'house-cleaning',
    title: 'House Cleaning',
    description: 'Complete home cleaning service including all rooms, kitchen, and bathrooms.',
    icon: Home,
    price: 'Starting ₹299',
    features: ['Deep cleaning', 'Eco-friendly products', '2-3 hours service', 'Insured staff'],
  },
  {
    id: 'cooking',
    title: 'Cooking Service',
    description: 'Professional cooks for daily meals, special occasions, or meal prep.',
    icon: ChefHat,
    price: 'Starting ₹199',
    features: ['Custom menus', 'Fresh ingredients', 'Dietary preferences', 'Flexible timing'],
    popular: true,
  },
  {
    id: 'childcare',
    title: 'Child Care',
    description: 'Experienced babysitters and nannies for your little ones.',
    icon: Baby,
    price: 'Starting ₹150/hr',
    features: ['Background verified', 'Trained caregivers', 'Activity planning', 'Emergency trained'],
  },
  {
    id: 'laundry',
    title: 'Laundry Service',
    description: 'Washing, ironing, and folding service for all your clothes.',
    icon: Shirt,
    price: 'Starting ₹99',
    features: ['Pickup & delivery', 'Same day service', 'Fabric care', 'Stain removal'],
  },
];

interface TrustCard {
  icon: any;
  title: string;
  description: string;
  stat: string;
}

const trustCards: TrustCard[] = [
  {
    icon: Shield,
    title: 'Verified Professionals',
    description: 'All service providers undergo thorough background verification and training.',
    stat: '100% Verified',
  },
  {
    icon: Star,
    title: 'Quality Guaranteed',
    description: 'We ensure top-quality service with our satisfaction guarantee policy.',
    stat: '4.9/5 Rating',
  },
  {
    icon: Clock,
    title: 'On-Time Service',
    description: 'Punctual and reliable service delivery at your preferred time slot.',
    stat: '98% On-Time',
  },
];

export function ServiceCards() {
  const router = useRouter();

  return (
    <section className="py-16" style={{ backgroundColor: colors.background.secondary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.text.primary }}>
            Our Popular Services
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.text.secondary }}>
            Choose from our wide range of professional home services, all delivered by verified experts.
          </p>
        </div>

        {/* Service Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {serviceCards.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                onClick={() => router.push('/services')}
              >
                {/* Popular Badge */}
                {service.popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <div 
                      className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: colors.primary[950] }}
                    >
                      Popular
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-6">
                  {/* Icon */}
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: colors.background.secondary }}
                  >
                    <Icon className="w-6 h-6" style={{ color: colors.primary[950] }} />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
                    {service.title}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                    {service.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-4">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: colors.success[600] }} />
                        <span style={{ color: colors.text.secondary }}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: colors.border.light }}>
                    <span className="font-semibold" style={{ color: colors.text.primary }}>
                      {service.price}
                    </span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" style={{ color: colors.primary[950] }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/services')}
            className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-lg transition-colors"
            style={{ 
              backgroundColor: colors.primary[950],
              color: colors.text.inverse,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primary[800]}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary[950]}
          >
            View All Services
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </section>
  );
}

export function TrustSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.text.primary }}>
            Why Choose Maids For Care?
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.text.secondary }}>
            We're committed to providing you with the best home service experience through our trusted network of professionals.
          </p>
        </div>

        {/* Trust Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {trustCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="text-center group">
                {/* Icon */}
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: colors.background.secondary }}
                >
                  <Icon className="w-8 h-8" style={{ color: colors.primary[950] }} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3" style={{ color: colors.text.primary }}>
                  {card.title}
                </h3>
                <p className="mb-4" style={{ color: colors.text.secondary }}>
                  {card.description}
                </p>
                
                {/* Stat */}
                <div 
                  className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ 
                    backgroundColor: colors.primary[950],
                    color: colors.text.inverse,
                  }}
                >
                  {card.stat}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}