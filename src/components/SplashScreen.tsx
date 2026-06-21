import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setSelectedCity } from "../store/slices/citySlice";
import { useGetCitiesQuery, type CityDto } from "../store/api/cityApi";

interface SplashScreenProps {
  onComplete: () => void;
}

const ZOOM_MS = 1700;

// Native Desktop-4 canvas. The composed scene image and all clickable
// hotspots live in this coordinate space and scale together.
const STAGE_W = 1440;
const STAGE_H = 1024;

interface DesignCity {
  key: string; // lowercase name used to match API cities
  name: string;
  tagline: string;
  monument: string; // image used for the mobile card
  // Clickable hotspot over the monument + label (native canvas px).
  rect: { left: number; top: number; width: number; height: number };
  // The baked city card position (native canvas px) — used to overlay a
  // "Coming Soon" card on top of inactive cities.
  card: { left: number; top: number; width: number; height: number };
  cx: number; // hotspot centre x (native px) — zoom focus
  cy: number; // hotspot centre y (native px)
}

const DESIGN_CITIES: DesignCity[] = [
  {
    key: "jaipur",
    name: "Jaipur",
    tagline: "The Pink City",
    monument: "/splash/monument-jaipur.png",
    rect: { left: 1040, top: 425, width: 130, height: 112 },
    card: { left: 1082, top: 484, width: 80, height: 46 },
    cx: 1105,
    cy: 481,
  },
  {
    key: "jodhpur",
    name: "Jodhpur",
    tagline: "The Blue City",
    monument: "/splash/monument-jodhpur.png",
    rect: { left: 735, top: 470, width: 140, height: 122 },
    card: { left: 780, top: 539, width: 89, height: 48 },
    cx: 805,
    cy: 531,
  },
  {
    key: "udaipur",
    name: "Udaipur",
    tagline: "The City of Lakes",
    monument: "/splash/monument-udaipur.png",
    rect: { left: 788, top: 693, width: 143, height: 114 },
    card: { left: 841, top: 757, width: 85, height: 45 },
    cx: 859,
    cy: 750,
  },
];

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const dispatch = useAppDispatch();
  const selectedCity = useAppSelector((s) => s.city.selectedCity);
  const { data: apiCities } = useGetCitiesQuery({ page: 1, size: 100 });

  const [viewport, setViewport] = useState({
    vw: typeof window !== "undefined" ? window.innerWidth : 1440,
    vh: typeof window !== "undefined" ? window.innerHeight : 1024,
  });
  const [zoomKey, setZoomKey] = useState<string | null>(null);
  const phase: "idle" | "zooming" = zoomKey ? "zooming" : "idle";
  const completedRef = useRef(false);

  // Track viewport so the scene re-fits on resize / orientation change.
  useEffect(() => {
    const update = () =>
      setViewport({ vw: window.innerWidth, vh: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  // Contain-fit: keep the whole composition visible on any screen (nothing
  // is cropped). Side/top bands are filled with a matching background so the
  // gaps read as part of the design.
  const fitScale = Math.min(viewport.vw / STAGE_W, viewport.vh / STAGE_H);

  // Map API cities by lowercase name for quick lookup.
  const apiByKey = useMemo(() => {
    const m: Record<string, CityDto> = {};
    (apiCities ?? []).forEach((c) => {
      m[c.name.trim().toLowerCase()] = c;
    });
    return m;
  }, [apiCities]);

  const triggerZoom = useCallback(
    (dc: DesignCity) => {
      if (completedRef.current) return;
      setZoomKey(dc.key);
      window.setTimeout(() => {
        if (completedRef.current) return;
        completedRef.current = true;
        onComplete();
      }, ZOOM_MS);
    },
    [onComplete]
  );

  const handleSelect = (dc: DesignCity) => {
    const api = apiByKey[dc.key];
    if (!api || !api.isActive || api.isComingSoon) return;
    dispatch(setSelectedCity({ id: api.id, name: api.name }));
    triggerZoom(dc);
  };

  // Returning users: a city is already stored -> auto-zoom straight into it
  // (no waiting for a selection). First-time users (no city) wait for a pick.
  useEffect(() => {
    if (!selectedCity) return;
    const dc = DESIGN_CITIES.find(
      (c) => c.key === selectedCity.name.trim().toLowerCase()
    );
    if (!dc) {
      const t = window.setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      }, 900);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => triggerZoom(dc), 700);
    return () => window.clearTimeout(t);
    // Intentionally run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCity = zoomKey
    ? DESIGN_CITIES.find((c) => c.key === zoomKey)!
    : null;
  const focusX = activeCity ? activeCity.cx : STAGE_W / 2;
  const focusY = activeCity ? activeCity.cy : STAGE_H / 2;

  const complete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  // Use a phone-friendly layout on narrow / portrait screens so the cities are
  // always large and tappable (the desktop artwork is landscape-only).
  const isMobile = viewport.vw < 768 || viewport.vh > viewport.vw;

  const handleMobileSelect = (dc: DesignCity) => {
    const api = apiByKey[dc.key];
    if (!api || !api.isActive || api.isComingSoon) return;
    dispatch(setSelectedCity({ id: api.id, name: api.name }));
    if (completedRef.current) return;
    setZoomKey(dc.key);
    window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete();
    }, 650);
  };

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex flex-col overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #eef3fb 0%, #e4ecf8 55%, #d7e6f6 100%)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-8">
          <div className="flex items-center gap-2">
            <img
              src="/logo-3d.svg"
              alt="ScootyOnRent"
              className="h-10 w-10 select-none"
            />
            <span className="text-xl font-bold">
              <span style={{ color: "#080808" }}>Scooty</span>
              <span style={{ color: "#2383f4" }}>onrent</span>
            </span>
          </div>

          <h1
            className="mt-5 font-bold"
            style={{ fontSize: "clamp(30px, 9vw, 44px)", lineHeight: 1.05, color: "#080808" }}
          >
            Your <span style={{ color: "#0087ff" }}>City</span>
            <br />
            Your <span style={{ color: "#0087ff" }}>Ride</span>
          </h1>
          <p className="mt-2 text-[15px]" style={{ color: "#453b3b" }}>
            Choose from trusted scooters across Rajasthan.
          </p>
        </div>

        {/* City list */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-6">
          <div className="mx-auto flex max-w-md flex-col gap-4">
            {DESIGN_CITIES.map((dc) => {
              const api = apiByKey[dc.key];
              const selectable = !!api && api.isActive && !api.isComingSoon;
              const isChosen = zoomKey === dc.key;
              return (
                <motion.button
                  key={dc.key}
                  type="button"
                  onClick={() => handleMobileSelect(dc)}
                  disabled={!selectable || phase === "zooming"}
                  whileTap={selectable ? { scale: 0.97 } : undefined}
                  animate={isChosen ? { scale: 1.04 } : { scale: 1 }}
                  className="flex items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-[0_8px_22px_rgba(0,0,0,0.12)]"
                  style={{
                    opacity: selectable ? 1 : 0.7,
                    cursor: selectable ? "pointer" : "not-allowed",
                  }}
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#eef3fb]">
                    <img
                      src={dc.monument}
                      alt={dc.name}
                      className="h-14 w-14 select-none object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-bold" style={{ color: "#080808" }}>
                      {dc.name}
                    </div>
                    <div
                      className="text-xs font-medium"
                      style={{ color: selectable ? "#2383f4" : "#9aa3af" }}
                    >
                      {selectable ? dc.tagline : "Coming Soon"}
                    </div>
                  </div>
                  {selectable && (
                    <svg
                      className="h-5 w-5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#0087ff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {phase === "idle" && (
          <button
            type="button"
            onClick={complete}
            className="pb-5 text-center text-sm text-gray-500/80"
          >
            Skip
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #eef3fb 0%, #e4ecf8 55%, #d7e6f6 100%)",
      }}
    >
      {/* Cover-fit stage, centred in the viewport */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate(-50%, -50%) scale(${fitScale})`,
          transformOrigin: "center center",
        }}
      >
        {/* Zoom layer: centres the chosen city, then scales into it */}
        <motion.div
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transformOrigin: `${focusX}px ${focusY}px`,
          }}
          animate={{
            x: phase === "zooming" ? STAGE_W / 2 - focusX : 0,
            y: phase === "zooming" ? STAGE_H / 2 - focusY : 0,
            scale: phase === "zooming" ? 9 : 1,
          }}
          transition={{ duration: ZOOM_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Full composed Desktop-4 artwork (pixel-perfect from Figma) */}
          <img
            src="/splash/desktop4-full.png"
            alt="Choose your city"
            className="absolute inset-0 h-full w-full select-none"
            draggable={false}
          />

          {/* City interactions: hotspot click + Coming-Soon overlay */}
          {DESIGN_CITIES.map((dc) => {
            const api = apiByKey[dc.key];
            const selectable = !!api && api.isActive && !api.isComingSoon;
            return (
              <div key={dc.key}>
                {/* Clickable hotspot */}
                <button
                  type="button"
                  aria-label={dc.name}
                  onClick={() => handleSelect(dc)}
                  disabled={!selectable || phase === "zooming"}
                  className="absolute rounded-2xl"
                  style={{
                    left: dc.rect.left,
                    top: dc.rect.top,
                    width: dc.rect.width,
                    height: dc.rect.height,
                    cursor: selectable ? "pointer" : "not-allowed",
                    background: "transparent",
                  }}
                />

                {/* Coming-Soon card covers the baked card for inactive cities */}
                {!selectable && (
                  <div
                    className="absolute flex flex-col items-center justify-center rounded-[15px] bg-white text-center leading-none shadow-[0_8px_22px_rgba(0,0,0,0.2)]"
                    style={{
                      left: dc.card.left,
                      top: dc.card.top,
                      width: dc.card.width,
                      height: dc.card.height,
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{ fontSize: 15, fontWeight: 700, color: "#080808" }}
                    >
                      {dc.name}
                    </span>
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 600,
                        color: "#9aa3af",
                        marginTop: 2,
                      }}
                    >
                      Coming Soon
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Subtle skip escape hatch */}
      {phase === "idle" && (
        <button
          type="button"
          onClick={complete}
          className="absolute bottom-4 right-5 z-20 text-sm text-gray-500/80 transition-colors hover:text-gray-700"
        >
          Skip
        </button>
      )}
    </motion.div>
  );
};

export default SplashScreen;
