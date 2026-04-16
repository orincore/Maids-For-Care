'use client';

import { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { colors } from '@/lib/colors';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  service: string;
  rating: number;
  comment: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Priya Sharma",
    location: "Mumbai",
    service: "House Cleaning",
    rating: 5,
    comment: "Excellent service! The cleaning lady was very professional and thorough. My house has never been cleaner. Highly recommend Maids For Care for anyone looking for reliable home services.",
    avatar: "PS"
  },
  {
    id: 2,
    name: "Rajesh Kumar",
    location: "Delhi",
    service: "Cooking Service",
    rating: 5,
    comment: "The cook they provided is amazing! She prepares delicious, healthy meals according to our preferences. The booking process was so easy and the service is very reliable.",
    avatar: "RK"
  },
  {
    id: 3,
    name: "Anita Patel",
    location: "Bangalore",
    service: "Child Care",
    rating: 5,
    comment: "I was worried about leaving my kids with someone new, but the babysitter was wonderful. She's experienced, caring, and my children love her. Great background verification process.",
    avatar: "AP"
  },
  {
    id: 4,
    name: "Vikram Singh",
    location: "Pune",
    service: "Laundry Service",
    rating: 5,
    comment: "Super convenient laundry service! They pick up and deliver on time, and my clothes come back perfectly clean and pressed. Saves me so much time during busy weeks.",
    avatar: "VS"
  },
  {
    id: 5,
    name: "Meera Reddy",
    location: "Hyderabad",
    service: "Elder Care",
    rating: 5,
    comment: "The caregiver for my mother is compassionate and professional. She provides excellent care and companionship. I feel so much more at peace knowing mom is in good hands.",
    avatar: "MR"
  },
  {
    id: 6,
    name: "Arjun Mehta",
    location: "Chennai",
    service: "Deep Cleaning",
    rating: 5,
    comment: "Booked deep cleaning for my apartment before moving in. The team was punctual, efficient, and did an outstanding job. Every corner was spotless. Worth every penny!",
    avatar: "AM"
  }
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const testimonialsPerPage = 3;
  const totalPages = Math.ceil(testimonials.length / testimonialsPerPage);

  const nextTestimonials = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const prevTestimonials = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const currentTestimonials = testimonials.slice(
    currentIndex * testimonialsPerPage,
    (currentIndex + 1) * testimonialsPerPage
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-current' : ''}`}
        style={{ color: colors.warning[500] }}
      />
    ));
  };

  return (
    <section className="py-16" style={{ backgroundColor: colors.background.secondary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.text.primary }}>
            What Our Customers Say
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.text.secondary }}>
            Don't just take our word for it. Here's what our satisfied customers have to say about our services.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="relative">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
              >
                {/* Quote Icon */}
                <div className="mb-4">
                  <Quote className="w-8 h-8" style={{ color: colors.primary[950] }} />
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  {renderStars(testimonial.rating)}
                  <span className="ml-2 text-sm font-medium" style={{ color: colors.text.secondary }}>
                    {testimonial.rating}.0
                  </span>
                </div>

                {/* Comment */}
                <p className="mb-6 leading-relaxed" style={{ color: colors.text.secondary }}>
                  "{testimonial.comment}"
                </p>

                {/* Customer Info */}
                <div className="flex items-center">
                  {/* Avatar */}
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-4"
                    style={{ backgroundColor: colors.primary[950] }}
                  >
                    {testimonial.avatar}
                  </div>
                  
                  {/* Details */}
                  <div>
                    <h4 className="font-semibold" style={{ color: colors.text.primary }}>
                      {testimonial.name}
                    </h4>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      {testimonial.location} • {testimonial.service}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {totalPages > 1 && (
            <>
              <button
                onClick={prevTestimonials}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: colors.primary[950] }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primary[800]}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary[950]}
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={nextTestimonials}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: colors.primary[950] }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primary[800]}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary[950]}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}
        </div>

        {/* Dots Indicator */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-black' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                style={{
                  backgroundColor: index === currentIndex ? colors.primary[950] : colors.primary[300]
                }}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { number: "10,000+", label: "Happy Customers" },
            { number: "50,000+", label: "Services Completed" },
            { number: "4.9/5", label: "Average Rating" },
            { number: "500+", label: "Verified Professionals" }
          ].map((stat, index) => (
            <div key={index}>
              <div className="text-3xl font-bold mb-2" style={{ color: colors.primary[950] }}>
                {stat.number}
              </div>
              <div className="text-sm" style={{ color: colors.text.secondary }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}