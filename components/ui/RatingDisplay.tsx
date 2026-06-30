'use client';

import { Star } from 'lucide-react';

interface Props {
  rating: number;
  totalReviews: number;
  size?: 'xs' | 'sm' | 'md';
  showCount?: boolean;
}

export function RatingDisplay({ rating, totalReviews, size = 'sm', showCount = true }: Props) {
  const hasRating = totalReviews > 0 && rating > 0;

  const starSize = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const textSize = size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-sm' : 'text-base';

  if (!hasRating) {
    return <span className={`${textSize} text-gray-400 italic`}>No reviews yet</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      <Star className={`${starSize} fill-amber-400 text-amber-400`} />
      <span className="font-semibold text-gray-800">{rating.toFixed(1)}</span>
      {showCount && <span className="text-gray-400">({totalReviews})</span>}
    </span>
  );
}

/** Compact inline star row — for card/list use */
export function StarRow({ rating, totalReviews, size = 'sm' }: Omit<Props, 'showCount'>) {
  const hasRating = totalReviews > 0 && rating > 0;
  const starSize = size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const textSize = size === 'xs' ? 'text-xs' : 'text-sm';

  if (!hasRating) {
    return <span className="text-xs text-gray-400 italic">New</span>;
  }

  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${starSize}`} fill={i <= Math.round(rating) ? '#FBBF24' : '#E5E7EB'} stroke="none" />
      ))}
      <span className={`ml-1 font-semibold text-gray-700 ${textSize}`}>{rating.toFixed(1)}</span>
      {totalReviews > 0 && <span className={`text-gray-400 ${textSize}`}>({totalReviews})</span>}
    </span>
  );
}
