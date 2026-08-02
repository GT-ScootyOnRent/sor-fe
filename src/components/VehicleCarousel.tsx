import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VehicleCard from './VehicleCard';

type Props = {
  vehicles: any[];
};

/** Horizontal wheel distance that counts as one slide (a trackpad fires many small events). */
const WHEEL_STEP = 60;
/** Ignore further wheel input while a slide animates, so one flick moves exactly one card. */
const SLIDE_COOLDOWN = 500;
/** Minimum horizontal travel for a touch swipe to register. */
const SWIPE_MIN = 45;

export default function VehicleCarousel({ vehicles }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const total = vehicles?.length ?? 0;

  // Single place that moves the carousel; every input path (arrows, wheel, swipe)
  // goes through it so they all pause auto-rotation identically.
  const step = useCallback(
    (direction: number) => {
      if (total === 0) return;
      setCurrentIndex((prev) => (prev + direction + total) % total);
      setIsAutoPlaying(false);
    },
    [total],
  );

  const goToPrevious = () => step(-1);
  const goToNext = () => step(1);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  // Trackpad / horizontal wheel navigation.
  // Registered natively with { passive: false } because preventDefault() is required to
  // stop the browser turning a two-finger sideways flick into a back-navigation gesture,
  // and React's synthetic wheel listener is passive.
  useEffect(() => {
    const root = carouselRef.current;
    if (!root || total === 0) return;

    let accumulated = 0;
    let locked = false;
    let unlockTimer: number | undefined;

    const handleWheel = (e: WheelEvent) => {
      // Only claim clearly horizontal gestures — vertical ones must still scroll the page.
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();

      if (locked) return;
      accumulated += e.deltaX;
      if (Math.abs(accumulated) < WHEEL_STEP) return;

      step(accumulated > 0 ? 1 : -1);
      accumulated = 0;
      locked = true;
      unlockTimer = window.setTimeout(() => {
        locked = false;
      }, SLIDE_COOLDOWN);
    };

    root.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      root.removeEventListener('wheel', handleWheel);
      window.clearTimeout(unlockTimer);
    };
  }, [step, total]);

  // Touch swipe (phones/tablets). Measured on touchend so vertical page scrolling is
  // never blocked — `touch-action: pan-y` on the root handles the browser side.
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;

    // Needs to be a deliberate, mostly-horizontal swipe.
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return;
    step(dx < 0 ? 1 : -1); // swipe left → next card
  };

  // Auto-rotate
  useEffect(() => {
    if (!isAutoPlaying || total === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, total]);

  // Resume auto-rotation as soon as the user clicks away from the carousel.
  // Clicks *inside* it pause instead (onPointerDownCapture on the root below), which
  // covers Book Now, the Package toggle, arrows, dots, and the pickup/login modals —
  // those render inside the card, so they count as "inside" and keep it paused.
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const root = carouselRef.current;
      if (root && !root.contains(e.target as Node)) setIsAutoPlaying(true);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // Safety guard — kept *after* the hooks so the hook order never changes between
  // renders (an early return above them breaks the Rules of Hooks).
  if (total === 0) return null;

  const getVisibleSlides = () => {
    const total = vehicles.length;

    const farLeftIndex = (currentIndex - 2 + total) % total;
    const leftIndex = (currentIndex - 1 + total) % total;
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

  return (
    <div
      ref={carouselRef}
      // Any interaction inside the carousel pauses auto-rotation. Capture phase so it
      // fires even when a child stops propagation.
      onPointerDownCapture={() => setIsAutoPlaying(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      // pan-y lets the page keep scrolling vertically while we own horizontal gestures;
      // pinch-zoom is listed explicitly so accessibility zoom still works.
      style={{ touchAction: 'pan-y pinch-zoom' }}
      className="bg-gradient-to-br from-gray-50 to-primary-50 py-10 sm:py-16"
    >
      <div className="max-w-7xl mx-auto px-4">

        {/* Title */}
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-800 relative inline-block">
            Our Rental <span className="text-primary-500">Services</span>
            <span className="absolute left-1/2 -translate-x-1/2 -bottom-2 sm:-bottom-3 w-16 sm:w-24 h-1 sm:h-1.5 bg-primary-500 rounded-full" />
          </h2>
        </div>

        {/* Carousel */}
        <div className="relative h-[580px] sm:h-[640px] md:h-[700px] mb-6 sm:mb-8 flex items-center justify-center overflow-hidden">

          {/* Left */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 sm:left-4 md:left-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white border-2 border-gray-300 hover:bg-primary-500 hover:text-white hover:border-primary-500 flex items-center justify-center transition-all shadow-lg hover:scale-110 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
          </button>

          {/* Right */}
          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-4 md:right-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white border-2 border-gray-300 hover:bg-primary-500 hover:text-white hover:border-primary-500 flex items-center justify-center transition-all shadow-lg hover:scale-110 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
          </button>

          {/* Slides - Mobile shows only center, larger screens show 3D effect */}
          <div className="relative h-full w-full flex items-center justify-center" style={{ perspective: '2000px' }}>
            {getVisibleSlides().map((slide) => (
              <div
                key={`${slide.vehicle.id}-${slide.index}`}
                className={`absolute transition-all duration-700 ease-in-out cursor-pointer ${slide.position === 'center'
                  ? 'z-10 scale-100 opacity-100'
                  : slide.position === 'left' || slide.position === 'right'
                    ? 'z-5 scale-85 opacity-70 hidden sm:block'
                    : 'z-0 scale-70 opacity-40 hidden lg:block'
                  }`}
                style={{
                  transform:
                    slide.position === 'center'
                      ? 'translateX(0)'
                      : slide.position === 'left'
                        ? 'translateX(-340px) rotateY(25deg)'
                        : slide.position === 'right'
                          ? 'translateX(340px) rotateY(-25deg)'
                          : slide.position === 'far-left'
                            ? 'translateX(-640px) rotateY(40deg)'
                            : 'translateX(640px) rotateY(-40deg)',
                }}
                onClick={() => slide.position !== 'center' && goToSlide(slide.index)}
              >
                <div className="w-[280px] sm:w-[320px] lg:w-[380px]">
                  <VehicleCard vehicle={slide.vehicle} isActive={slide.position === 'center'} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 sm:gap-3 mt-8 sm:mt-12 flex-wrap px-4">
          {vehicles.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all cursor-pointer min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center ${index === currentIndex
                ? 'bg-primary-500'
                : 'bg-gray-300 hover:bg-gray-400'
                }`}
              style={{
                width: index === currentIndex ? '40px' : '12px',
                height: '12px',
                borderRadius: '9999px',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
