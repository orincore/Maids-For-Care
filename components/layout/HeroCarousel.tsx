'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Shield, Clock, Users } from 'lucide-react';
import { colors } from '@/lib/colors';

interface CarouselSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  cta: string;
  ctaLink: string;
}

const slides: CarouselSlide[] = [
  {
    id: 1,
    title: "Professional Home Cleaning",
    subtitle: "Trusted & Verified Maids",
    description: "Book experienced, background-verified cleaning professionals for your home. Quality service guaranteed.",
    image: "/api/placeholder/800/400",
    cta: "Book Cleaning Service",
    ctaLink: "/services"
  },
  {
    id: 2,
    title: "Cooking & Meal Prep",
    subtitle: "Delicious Home-Cooked Meals",
    description: "Professional cooks who prepare fresh, healthy meals according to your preferences and dietary needs.",
    image: "/api/placeholder/800/400",
    cta: "Find a Cook",
    ctaLink: "/services"
  },
  {
    id: 3,
    title: "Child & Elder Care",
    subtitle: "Compassionate Care Services",
    description: "Experienced caregivers for your loved ones. Reliable, caring, and professional support when you need it.",
    image: "/api/placeholder/800/400",
    cta: "Book Care Service",
    ctaLink: "/services"
  },
  {
    id: 4,
    title: "Become a Service Provider",
    subtitle: "Join Our Network",
    description: "Start your own business with Maids For Care. Connect with customers and grow your service business.",
    image: "/api/placeholder/800/400",
    cta: "Join as Provider",
    ctaLink: "/service-provider/register"
  }
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative h-[600px] overflow-hidden">
      {/* Slides */}
      <div className="relative h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
              index === currentSlide ? 'translate-x-0' : 
              index < currentSlide ? '-translate-x-full' : 'translate-x-full'
            }`}
          >
            {/* Background with gradient overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary[800]} 0%, ${colors.primary[950]} 100%)`,
              }}
            />
            
            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Text Content */}
                  <div className="text-white space-y-6">
                    <div className="space-y-2">
                      <p className="text-lg font-medium opacity-90">{slide.subtitle}</p>
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                        {slide.title}
                      </h1>
                    </div>
                    
                    <p className="text-xl opacity-90 max-w-lg">
                      {slide.description}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <a
                        href={slide.ctaLink}
                        className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg transition-colors"
                        style={{ 
                          backgroundColor: colors.text.inverse,
                          color: colors.primary[950],
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background.secondary}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.text.inverse}
                      >
                        {slide.cta}
                      </a>
                      
                      <a
                        href="/services"
                        className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg border-2 transition-colors"
                        style={{ 
                          borderColor: colors.text.inverse,
                          color: colors.text.inverse,
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.text.inverse;
                          e.currentTarget.style.color = colors.primary[950];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = colors.text.inverse;
                        }}
                      >
                        View All Services
                      </a>
                    </div>
                  </div>
                  
                  {/* Feature Cards */}
                  <div className="hidden lg:block">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { icon: Shield, title: "Verified", desc: "Background checked" },
                        { icon: Star, title: "Rated 4.9/5", desc: "Customer satisfaction" },
                        { icon: Clock, title: "24/7 Support", desc: "Always available" },
                        { icon: Users, title: "10k+ Customers", desc: "Trusted by many" }
                      ].map((feature, idx) => (
                        <div
                          key={idx}
                          className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white"
                        >
                          <feature.icon className="w-8 h-8 mb-2" />
                          <h3 className="font-semibold">{feature.title}</h3>
                          <p className="text-sm opacity-80">{feature.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      <button
        onClick={nextSlide}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide 
                ? 'bg-white' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{
            width: isAutoPlaying ? `${((currentSlide + 1) / slides.length) * 100}%` : '0%'
          }}
        />
      </div>
    </div>
  );
}