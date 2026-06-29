import React from 'react';
import { Star } from 'lucide-react';
import clsx from 'clsx';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readOnly = false,
  size = 18,
}) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-0.5" role={readOnly ? 'img' : 'group'} aria-label={`Rating: ${value} out of 5`}>
      {stars.map((star) => {
        const filled = star <= value;

        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(star)}
            className={clsx(
              'transition-colors',
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-105',
            )}
            aria-label={readOnly ? undefined : `Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              className={clsx(
                filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-300',
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
