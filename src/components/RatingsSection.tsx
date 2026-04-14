import { Star } from 'lucide-react';

interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
}

export default function RatingsSection() {
  const reviews: Review[] = [
    {
      id: 1,
      name: 'Amit Sharma',
      rating: 5,
      comment: 'Excellent service! The bike was in perfect condition and the staff was very helpful. Will definitely rent again.',
    },
    {
      id: 2,
      name: 'Priya Verma',
      rating: 5,
      comment: 'Great experience! Easy booking process and well-maintained scooters. Highly recommended for city tours.',
    },
    {
      id: 3,
      name: 'Rajesh Kumar',
      rating: 4,
      comment: 'Good service overall. The bike was clean and ran smoothly. Pickup location was convenient.',
    },
    {
      id: 4,
      name: 'Sneha Patel',
      rating: 5,
      comment: 'Amazing bikes and affordable prices! The Royal Enfield was a dream to ride. Customer support was excellent.',
    },
    {
      id: 5,
      name: 'Vikram Singh',
      rating: 5,
      comment: 'Best rental service in the city! Professional staff, transparent pricing, and quality vehicles.',
    },
    {
      id: 6,
      name: 'Ananya Desai',
      rating: 4,
      comment: 'Very satisfied with the service. The electric scooter was eco-friendly and perfect for short trips.',
    },
  ];

  // Duplicate reviews for seamless marquee
  const duplicatedReviews = [...reviews, ...reviews, ...reviews];

  return (
    <div className="bg-white py-16 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl text-black mb-12 text-center">Customer Reviews</h2>

        {/* Marquee Container */}
        <div className="relative">
          <div className="flex gap-6 animate-marquee hover:pause">
            {duplicatedReviews.map((review, index) => (
              <div
                key={`${review.id}-${index}`}
                className="flex-shrink-0 w-[350px] bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
              >
                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-gray-700 text-center mb-4 min-h-[100px] leading-relaxed">
                  "{review.comment}"
                </p>

                <h3 className="text-black text-center">
                  {review.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .animate-marquee {
          animation: marquee 30s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
