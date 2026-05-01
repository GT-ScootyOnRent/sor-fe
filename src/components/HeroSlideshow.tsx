import { useEffect, useState } from 'react';
import { useGetHeroBannersQuery } from '../store/api/heroBannerApi';

const FALLBACK_GRADIENT =
  'bg-[linear-gradient(135deg,#ffb87a,#ff7ac8,#7feaff,#80ffbf)]';

const VERTICAL_LINES_OVERLAY: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(90deg, rgba(255,255,255,.6) 0px, rgba(255,255,255,.6) 1px, transparent 2px, transparent 100px)',
};

export default function HeroSlideshow() {
  const { data: banners = [], isLoading, isError } = useGetHeroBannersQuery();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset to first slide whenever the banner set changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [banners.length]);

  // Auto-rotate using each banner's own durationMs
  useEffect(() => {
    if (banners.length <= 1) return;
    const duration = banners[currentIndex]?.durationMs ?? 5000;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, duration);
    return () => clearTimeout(timer);
  }, [currentIndex, banners]);

  // Preload the next image so the crossfade has nothing to load
  useEffect(() => {
    if (banners.length <= 1) return;
    const nextIdx = (currentIndex + 1) % banners.length;
    const img = new Image();
    img.src = banners[nextIdx].imageUrl;
  }, [currentIndex, banners]);

  // Fallback: loading, error, or no banners → keep the original gradient hero
  if (isLoading || isError || banners.length === 0) {
    return (
      <section
        className={`relative min-h-[500px] md:min-h-[600px] overflow-hidden ${FALLBACK_GRADIENT}`}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={VERTICAL_LINES_OVERLAY}
        />
        <div className="relative z-10 h-full min-h-[500px] md:min-h-[600px] flex items-center justify-center px-4">
          <div className="text-center max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              Your Journey Starts
              <span className="block">With The Perfect Ride</span>
            </h1>
            <p className="text-xl text-gray-900/90 max-w-2xl mx-auto">
              Rent two-wheelers by the hour. Flexible, affordable, and always
              available when you need them.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentIndex];
  const overlayHasText = !!(currentBanner?.title || currentBanner?.subtitle);

  return (
    <section className="relative min-h-[500px] md:min-h-[600px] overflow-hidden bg-black">
      {/* Image layers — crossfade only the images */}
      {banners.map((banner, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive
                ? 'opacity-100 z-0'
                : 'opacity-0 z-0 pointer-events-none'
            }`}
            aria-hidden={!isActive}
          >
            <img
              src={banner.imageUrl}
              alt={banner.title ?? `Hero banner ${idx + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
              loading={idx === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </div>
        );
      })}

      {/* Single text overlay — keyed to currentIndex so the old text is removed
          (no overlap during crossfade) and the new text fades up on mount */}
      {overlayHasText && (
        <>
          <div className="absolute inset-0 bg-black/35 z-10 pointer-events-none" />
          <div
            key={currentIndex}
            className="absolute inset-0 z-20 flex items-center justify-center px-4 pointer-events-none animate-hero-text"
          >
            <div className="text-center max-w-4xl">
              {currentBanner.title && (
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                  {currentBanner.title}
                </h1>
              )}
              {currentBanner.subtitle && (
                <p className="text-lg md:text-2xl text-white/95 drop-shadow-md max-w-2xl mx-auto">
                  {currentBanner.subtitle}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Slide indicators — desktop only (mobile hides them because the search bar overlaps the bottom) */}
      {banners.length > 1 && (
        <div className="hidden md:flex absolute bottom-24 left-1/2 -translate-x-1/2 z-30 gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
