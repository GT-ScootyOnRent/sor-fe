import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VehicleCard from './VehicleCard';
import { useGetFeaturedVehiclesQuery } from '../store/api/vehicleApi';
import { useAppSelector } from '../store/hooks';

export default function VehicleCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Get selected city from Redux
  const selectedCity = useAppSelector((state) => state.city.selectedCity);

  // ✅ Pass cityId to featured vehicles API
  const { data: vehicles = [], isLoading, error } = useGetFeaturedVehiclesQuery(
    selectedCity ? { cityId: selectedCity.id } : undefined
  );

  // Auto-rotate carousel every 6 seconds
  useEffect(() => {
    if (!isAutoPlaying || vehicles.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % vehicles.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, vehicles.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => ((prev - 1 + vehicles.length) % vehicles.length));
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % vehicles.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  // Calculate visible slides (5 vehicles)
  const getVisibleSlides = () => {
    if (vehicles.length === 0) return [];

    const total = vehicles.length;
    const farLeftIndex = ((currentIndex - 2 + total) % total);
    const leftIndex = ((currentIndex - 1 + total) % total);
    const rightIndex = (currentIndex + 1) % total;
    const farRightIndex = (currentIndex + 2) % total;

    return [
      { vehicle: vehicles[farLeftIndex], position: 'far-left', index: farLeftIndex },
      { vehicle: vehicles[leftIndex], position: 'left', index: leftIndex },
      { vehicle: vehicles[currentIndex], position: 'center', index: currentIndex },
      { vehicle: vehicles[rightIndex], position: 'right', index: rightIndex },
      { vehicle: vehicles[farRightIndex], position: 'far-right', index: farRightIndex },
    ];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading featured vehicles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 py-16 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-500 mb-4">Failed to load vehicles. Please try again later.</p>
          {/* <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Retry
          </button> */}
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 py-16 flex items-center justify-center">
        <p className="text-gray-600">No featured vehicles available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
       <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 relative inline-block">
            Our Rental <span className="text-primary-500">Services</span>
            <span className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-24 h-1.5 bg-primary-500 rounded-full" />
          </h2>
        </div>

        {/* 3D Carousel Container with closer buttons */}
        <div className="relative h-[640px] md:h-[700px] mb-8 flex items-center justify-center overflow-hidden">
          {/* Left Arrow - Positioned closer */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-white border-2 border-gray-300 hover:bg-primary-500 hover:text-white hover:border-primary-500 flex items-center justify-center transition-all shadow-lg hover:scale-110"
            aria-label="Previous vehicle"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* Right Arrow - Positioned closer */}
          <button
            onClick={goToNext}
            className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-white border-2 border-gray-300 hover:bg-primary-500 hover:text-white hover:border-primary-500 flex items-center justify-center transition-all shadow-lg hover:scale-110"
            aria-label="Next vehicle"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Carousel Items - Cards spread wider to reach buttons */}
          <div className="relative h-full w-full flex items-center justify-center" style={{ perspective: '2000px' }}>
            {getVisibleSlides().map((slide) => (
              <div
                key={`${slide.vehicle.id}-${slide.index}`}
                className={`absolute transition-all duration-700 ease-in-out cursor-pointer ${slide.position === 'center'
                  ? 'z-10 scale-100 opacity-100'
                  : slide.position === 'left' || slide.position === 'right'
                    ? 'z-5 scale-85 opacity-70'
                    : 'z-0 scale-70 opacity-40'
                  }`}
                style={{
                  transform:
                    slide.position === 'center'
                      ? 'translateX(0) translateZ(0px) rotateY(0deg) scale(1)'
                      : slide.position === 'left'
                        ? 'translateX(-440px) translateZ(-150px) rotateY(25deg) scale(0.85)'
                        : slide.position === 'right'
                          ? 'translateX(440px) translateZ(-150px) rotateY(-25deg) scale(0.85)'
                          : slide.position === 'far-left'
                            ? 'translateX(-780px) translateZ(-300px) rotateY(40deg) scale(0.7)'
                            : 'translateX(780px) translateZ(-300px) rotateY(-40deg) scale(0.7)',
                }}
                onClick={() => slide.position !== 'center' && goToSlide(slide.index)}
              >
                <div className="w-[300px] sm:w-[360px] lg:w-[420px]">
                  <VehicleCard vehicle={slide.vehicle} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center gap-3 mt-12">
          {vehicles.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all ${index === currentIndex
                ? 'bg-primary-500 w-10 h-3 rounded-full'
                : 'bg-gray-300 hover:bg-gray-400 w-3 h-3 rounded-full'
                }`}
              aria-label={`Go to vehicle ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
