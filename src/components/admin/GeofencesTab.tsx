import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Search, MapPin, X, Save, Loader2,
  Circle, Hexagon, Car, Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import { GoogleMap, useJsApiLoader, Polygon, Circle as GoogleCircle, DrawingManager } from '@react-google-maps/api';
import union from '@turf/union';
import difference from '@turf/difference';
import { polygon as turfPolygon, featureCollection } from '@turf/helpers';

import {
  useGetGeofencesQuery,
  useCreateGeofenceMutation,
  useUpdateGeofenceMutation,
  useDeleteGeofenceMutation,
  type GeofenceDto,
  type CreateGeofenceDto,
  type GeoCoordinateDto,
} from '../../store/api/geofenceApi';
import { useGetCitiesQuery, useGetStatesQuery } from '../../store/api/cityApi';
import { LoadingSpinner } from '../LoadingSpinner';
import { FormField } from './FormField';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;
const GOOGLE_LIBRARIES: ('drawing' | 'places')[] = ['drawing', 'places'];

const MAP_CONTAINER_STYLE = { width: '100%', height: '400px', borderRadius: '12px' };
const DEFAULT_CENTER = { lat: 26.9124, lng: 75.7873 }; // Jaipur as default

// City coordinates for map centering (common Indian cities)
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'mumbai': { lat: 19.076, lng: 72.8777 },
  'delhi': { lat: 28.6139, lng: 77.209 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'hyderabad': { lat: 17.385, lng: 78.4867 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'udaipur': { lat: 24.5854, lng: 73.7125 },
  'jodhpur': { lat: 26.2389, lng: 73.0243 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'goa': { lat: 15.2993, lng: 74.124 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'kochi': { lat: 9.9312, lng: 76.2673 },
};

// Empty geofence form
const EMPTY_GEOFENCE: CreateGeofenceDto = {
  name: '',
  description: '',
  cityId: 0,
  fenceType: 'polygon',
  coordinates: [],
  centerLat: undefined,
  centerLng: undefined,
  radiusMeters: 500,
  isActive: true,
};

interface GeofencesTabProps {
  adminCityIds?: number[];
  isSuperAdmin?: boolean;
}

// A searchable area result with a usable boundary ring (from Nominatim/OSM)
interface AreaSearchResult {
  id: string;
  label: string;
  kind: string;
  ring: GeoCoordinateDto[];
  // For 'location' (pinpoint) results, the searched point so the ring can be
  // rebuilt when the radius slider changes.
  center?: GeoCoordinateDto;
}

const GeofencesTab: React.FC<GeofencesTabProps> = ({ adminCityIds = [], isSuperAdmin = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<GeofenceDto | null>(null);
  const [geofenceForm, setGeofenceForm] = useState<CreateGeofenceDto>(EMPTY_GEOFENCE);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapKey, setMapKey] = useState(0); // Force map re-render when clearing
  const [autoFilling, setAutoFilling] = useState(false);

  // Area search (highlight an arbitrary place, then use it as the boundary)
  const [areaQuery, setAreaQuery] = useState('');
  const [areaSearching, setAreaSearching] = useState(false);
  const [areaResults, setAreaResults] = useState<AreaSearchResult[]>([]);
  const [highlightedArea, setHighlightedArea] = useState<GeoCoordinateDto[] | null>(null);
  const [highlightedLabel, setHighlightedLabel] = useState('');
  // Search mode: 'area' highlights a whole locality boundary; 'location' drops a
  // pinpoint and builds a circle of `locationRadius` metres around it.
  const [searchMode, setSearchMode] = useState<'area' | 'location'>('area');
  const [locationRadius, setLocationRadius] = useState(500);
  const [highlightedCenter, setHighlightedCenter] = useState<GeoCoordinateDto | null>(null);

  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  // API queries
  const { data: geofences = [], isLoading, refetch } = useGetGeofencesQuery();
  const { data: cities = [] } = useGetCitiesQuery({ page: 1, size: 100 });
  const { data: states = [] } = useGetStatesQuery({ page: 1, size: 100 });
  const [createGeofence, { isLoading: creating }] = useCreateGeofenceMutation();
  const [updateGeofence, { isLoading: updating }] = useUpdateGeofenceMutation();
  const [deleteGeofence] = useDeleteGeofenceMutation();

  // Google Maps loader
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    libraries: GOOGLE_LIBRARIES,
    id: 'google-maps-script',
  });

  // Filter cities based on admin permissions
  const allowedCities = isSuperAdmin 
    ? cities 
    : cities.filter(city => adminCityIds.includes(city.id));

  // Filter geofences by search and admin's cities
  const filteredGeofences = geofences.filter(g => {
    // Filter by admin's cities (unless superadmin)
    if (!isSuperAdmin && adminCityIds.length > 0 && !adminCityIds.includes(g.cityId)) {
      return false;
    }
    // Filter by search
    return g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.cityName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handlers
  const handleOpenAdd = () => {
    setEditingGeofence(null);
    setGeofenceForm(EMPTY_GEOFENCE);
    setAreaQuery('');
    setAreaResults([]);
    setHighlightedArea(null);
    setHighlightedLabel('');
    setHighlightedCenter(null);
    setShowModal(true);
  };

  const handleOpenEdit = (geofence: GeofenceDto) => {
    setEditingGeofence(geofence);
    setGeofenceForm({
      name: geofence.name,
      description: geofence.description,
      cityId: geofence.cityId,
      fenceType: geofence.fenceType,
      coordinates: geofence.coordinates || [],
      centerLat: geofence.centerLat,
      centerLng: geofence.centerLng,
      radiusMeters: geofence.radiusMeters,
      isActive: geofence.isActive,
    });
    
    // Center map on geofence
    if (geofence.fenceType === 'circle' && geofence.centerLat && geofence.centerLng) {
      setMapCenter({ lat: geofence.centerLat, lng: geofence.centerLng });
    } else if (geofence.coordinates && geofence.coordinates.length > 0) {
      setMapCenter({ lat: geofence.coordinates[0].lat, lng: geofence.coordinates[0].lng });
    }

    setAreaQuery('');
    setAreaResults([]);
    setHighlightedArea(null);
    setHighlightedLabel('');
    setHighlightedCenter(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this geofence? Vehicles using it will be detached.')) return;
    try {
      await deleteGeofence(id).unwrap();
      toast.success('Geofence deleted');
      refetch();
    } catch (err: any) {
      toast.error('Failed to delete', { description: err?.data?.message });
    }
  };

  const handleSave = async () => {
    if (!geofenceForm.name.trim()) {
      toast.error('Please enter a geofence name');
      return;
    }
    if (!geofenceForm.cityId) {
      toast.error('Please select a city');
      return;
    }
    if (geofenceForm.fenceType === 'polygon' && (!geofenceForm.coordinates || geofenceForm.coordinates.length < 3)) {
      toast.error('Please draw at least 3 points for polygon');
      return;
    }
    if (geofenceForm.fenceType === 'circle' && (!geofenceForm.centerLat || !geofenceForm.centerLng)) {
      toast.error('Please place a circle on the map');
      return;
    }

    try {
      if (editingGeofence) {
        await updateGeofence({ id: editingGeofence.id, geofence: geofenceForm }).unwrap();
        toast.success('Geofence updated');
      } else {
        await createGeofence(geofenceForm).unwrap();
        toast.success('Geofence created');
      }
      setShowModal(false);
      refetch();
    } catch (err: any) {
      toast.error('Failed to save', { description: err?.data?.message });
    }
  };

  // Map drawing handlers
  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const coords: GeoCoordinateDto[] = [];
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coords.push({ lat: point.lat(), lng: point.lng() });
    }
    setGeofenceForm(prev => ({ ...prev, coordinates: coords }));
    polygonRef.current = polygon;
    setIsDrawing(false);
  }, []);

  const onCircleComplete = useCallback((circle: google.maps.Circle) => {
    const center = circle.getCenter();
    if (center) {
      setGeofenceForm(prev => ({
        ...prev,
        centerLat: center.lat(),
        centerLng: center.lng(),
        radiusMeters: Math.round(circle.getRadius()),
      }));
    }
    circleRef.current = circle;
    setIsDrawing(false);
  }, []);

  const clearDrawing = () => {
    // Remove polygon from map
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    // Remove circle from map
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }
    // Reset form data
    setGeofenceForm(prev => ({
      ...prev,
      coordinates: [],
      centerLat: undefined,
      centerLng: undefined,
      radiusMeters: 500,
    }));
    // Stop drawing mode
    setIsDrawing(false);
    // Force map re-render to clear any leftover overlays
    setMapKey(prev => prev + 1);
  };

  // Reduce a dense boundary ring to a manageable number of points
  const decimate = (pts: GeoCoordinateDto[], max = 80): GeoCoordinateDto[] => {
    if (pts.length <= max) return pts;
    const step = Math.ceil(pts.length / max);
    const out: GeoCoordinateDto[] = [];
    for (let i = 0; i < pts.length; i += step) out.push(pts[i]);
    return out;
  };

  // Auto-fill the geofence with the selected city's real boundary (OpenStreetMap/Nominatim).
  // Falls back to the city bounding box if no boundary polygon is available.
  const autoFillCityBoundary = async () => {
    const city = cities.find(c => c.id === geofenceForm.cityId);
    if (!city) { toast.error('Please select a city first'); return; }
    const state = states.find(s => s.id === city.stateId);
    setAutoFilling(true);

    type NomResult = {
      geojson?: { type: string; coordinates: unknown };
      class?: string;
      type?: string;
      osm_type?: string;
      addresstype?: string;
      display_name?: string;
      extratags?: { admin_level?: string };
    };

    const ringFromGeo = (geo?: { type: string; coordinates: unknown }): number[][] | null => {
      if (!geo) return null;
      if (geo.type === 'Polygon') {
        return (geo.coordinates as number[][][])[0] ?? null;
      }
      if (geo.type === 'MultiPolygon') {
        let best: number[][] = [];
        (geo.coordinates as number[][][][]).forEach((poly) => {
          if (poly[0] && poly[0].length > best.length) best = poly[0];
        });
        return best.length ? best : null;
      }
      return null;
    };

    // Prefer the CITY/municipal boundary (admin_level 8) over the larger
    // district (5/6) or state (4) boundary.
    const levelOf = (d?: NomResult): number => {
      const lvl = Number(d?.extratags?.admin_level);
      if (!Number.isNaN(lvl)) return lvl;
      if (d?.addresstype === 'city' || d?.addresstype === 'municipality' || d?.addresstype === 'town') return 8;
      return 99;
    };

    // Fetch results from a query and return the best matching boundary.
    // Returns { ring, level } so the caller can decide if it's city-level enough.
    const fetchBest = async (search: string): Promise<{ ring: number[][]; level: number } | null> => {
      const qs = new URLSearchParams({
        q: search,
        format: 'json',
        polygon_geojson: '1',
        extratags: '1',
        addressdetails: '1',
        limit: '15',
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${qs.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const data = (await res.json()) as NomResult[];
      const candidates = (data ?? []).filter(
        d => d.osm_type === 'relation' && (d.class === 'boundary' || d.type === 'administrative') && ringFromGeo(d.geojson)
      );
      if (!candidates.length) return null;
      // Closest to admin_level 8 (the city) wins.
      const sorted = [...candidates].sort((a, b) => Math.abs(levelOf(a) - 8) - Math.abs(levelOf(b) - 8));
      const best = sorted[0];
      const ring = ringFromGeo(best.geojson)!;
      return { ring, level: levelOf(best) };
    };

    try {
      // Try queries in priority order. Indian city limits are usually tagged as a
      // "Municipal Corporation" / "Nagar Nigam" (admin_level 8) relation, which a plain
      // "City, State" search does NOT return (it returns the bigger district instead).
      const queries = [
        `${city.name} Municipal Corporation, ${state?.name ?? ''}, India`,
        `${city.name} Nagar Nigam, ${state?.name ?? ''}, India`,
        `${city.name}, ${state?.name ?? ''}, India`,
      ].map(q => q.replace(/\s*,\s*,/g, ',').trim());

      let ring: number[][] | null = null;
      let fallbackRing: number[][] | null = null;

      for (const q of queries) {
        const result = await fetchBest(q);
        if (!result) continue;
        if (!fallbackRing) fallbackRing = result.ring; // remember first hit as a backup
        if (result.level === 8) { ring = result.ring; break; } // exact city boundary
      }

      // Use the city-level boundary if found, else the best thing we got.
      ring = ring ?? fallbackRing;

      if (ring && ring.length >= 3) {
        const coords = decimate(ring.map(([lng, lat]) => ({ lat, lng })));
        const cLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
        const cLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
        if (geofenceForm.fenceType === 'circle') {
          const { center, radius } = ringToCircle(coords);
          setGeofenceForm(prev => ({ ...prev, centerLat: center.lat, centerLng: center.lng, radiusMeters: radius }));
          setMapCenter(center);
          setMapKey(k => k + 1);
          toast.success(`Auto-filled ${city.name} as a circle (~${(radius / 1000).toFixed(1)} km). Adjust the radius if needed.`);
          return;
        }
        setGeofenceForm(prev => ({ ...prev, fenceType: 'polygon', coordinates: coords }));
        setMapCenter({ lat: cLat, lng: cLng });
        setMapKey(k => k + 1);
        toast.success(`Auto-filled ${city.name} boundary (${coords.length} points). Drag points to adjust if needed.`);
        return;
      }

      toast.error(`Exact boundary not found for ${city.name}. Please draw it manually.`);
    } catch {
      toast.error('Failed to fetch city boundary');
    } finally {
      setAutoFilling(false);
    }
  };

  // ── Area search: find any place by name and highlight its boundary ──────

  // Convert a polygon ring into a bounding circle (centroid + max distance).
  const ringToCircle = (ring: GeoCoordinateDto[]): { center: GeoCoordinateDto; radius: number } => {
    const cLat = ring.reduce((s, c) => s + c.lat, 0) / ring.length;
    const cLng = ring.reduce((s, c) => s + c.lng, 0) / ring.length;
    const center = { lat: cLat, lng: cLng };
    const R = 6371000; // earth radius (m)
    const toRad = (d: number) => (d * Math.PI) / 180;
    let radius = 0;
    ring.forEach((p) => {
      const dLat = toRad(p.lat - cLat);
      const dLng = toRad(p.lng - cLng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(cLat)) * Math.cos(toRad(p.lat)) * Math.sin(dLng / 2) ** 2;
      const dist = 2 * R * Math.asin(Math.sqrt(a));
      if (dist > radius) radius = dist;
    });
    return { center, radius: Math.round(Math.min(Math.max(radius, 50), 50000)) };
  };

  // Build a 32-point circular ring around a center point with the given radius
  // (metres). Used by the "Location (pinpoint)" search mode.
  const circleRing = (center: GeoCoordinateDto, radiusMeters: number, steps = 32): GeoCoordinateDto[] => {
    const R = 6371000; // earth radius (m)
    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;
    const latR = toRad(center.lat);
    const lngR = toRad(center.lng);
    const angDist = radiusMeters / R;
    const ring: GeoCoordinateDto[] = [];
    for (let i = 0; i < steps; i++) {
      const bearing = (i / steps) * 2 * Math.PI;
      const lat = Math.asin(
        Math.sin(latR) * Math.cos(angDist) +
        Math.cos(latR) * Math.sin(angDist) * Math.cos(bearing),
      );
      const lng =
        lngR +
        Math.atan2(
          Math.sin(bearing) * Math.sin(angDist) * Math.cos(latR),
          Math.cos(angDist) - Math.sin(latR) * Math.sin(lat),
        );
      ring.push({ lat: toDeg(lat), lng: toDeg(lng) });
    }
    return ring;
  };

  const ringFromAnyGeo = (geo?: { type: string; coordinates: unknown }): number[][] | null => {
    if (!geo) return null;
    if (geo.type === 'Polygon') {
      return (geo.coordinates as number[][][])[0] ?? null;
    }
    if (geo.type === 'MultiPolygon') {
      let best: number[][] = [];
      (geo.coordinates as number[][][][]).forEach((poly) => {
        if (poly[0] && poly[0].length > best.length) best = poly[0];
      });
      return best.length ? best : null;
    }
    return null;
  };

  const searchArea = async () => {
    const q = areaQuery.trim();
    if (!q) { toast.error('Type an area or place name to search'); return; }
    setAreaSearching(true);
    setAreaResults([]);

    // ── Location (pinpoint) mode ──────────────────────────────────────────────
    // Use Google Places Text Search (the `places` library is already loaded for
    // the map). Google's POI database covers landmarks/spots that OpenStreetMap
    // (used for Area mode) often misses, so a single place like "Rayta hills"
    // resolves correctly.
    if (searchMode === 'location') {
      try {
        const city = cities.find(c => c.id === geofenceForm.cityId);
        const state = city ? states.find(s => s.id === city.stateId) : undefined;
        const suffix = [city?.name, state?.name, 'India'].filter(Boolean).join(', ');

        let lastStatus: string = 'UNKNOWN';
        const placesText = (query: string): Promise<google.maps.places.PlaceResult[]> =>
          new Promise((resolve) => {
            try {
              const svc = new google.maps.places.PlacesService(document.createElement('div'));
              svc.textSearch({ query }, (res, status) => {
                lastStatus = String(status);
                if (status === google.maps.places.PlacesServiceStatus.OK && res) resolve(res);
                else resolve([]);
              });
            } catch (err) {
              lastStatus = err instanceof Error ? err.message : 'EXCEPTION';
              resolve([]);
            }
          });

        const toLocationResults = (res: google.maps.places.PlaceResult[]): AreaSearchResult[] =>
          res
            .filter(r => r.geometry?.location)
            .slice(0, 10)
            .map((r, idx) => {
              const center = {
                lat: r.geometry!.location!.lat(),
                lng: r.geometry!.location!.lng(),
              };
              return {
                id: r.place_id ?? String(idx),
                label: [r.name, r.formatted_address].filter(Boolean).join(' · ') || q,
                kind: (r.types && r.types[0]) ? r.types[0].replace(/_/g, ' ') : 'location',
                ring: circleRing(center, locationRadius),
                center,
              } as AreaSearchResult;
            });

        // Pass 1: as typed. Pass 2: bias to the selected city/state if empty.
        let results = toLocationResults(await placesText(q));
        if (!results.length && suffix) {
          results = toLocationResults(await placesText(`${q}, ${suffix}`));
        }
        if (!results.length) {
          // Keep the user-facing message generic; log the real status for devs.
          if (lastStatus !== 'ZERO_RESULTS' && lastStatus !== 'OK') {
            console.warn('[Geofence] Places search failed:', lastStatus);
          }
          toast.error('No place found. Try the exact name shown on Google Maps.');
        }
        setAreaResults(results);
      } catch {
        toast.error('Failed to search location');
      } finally {
        setAreaSearching(false);
      }
      return;
    }

    type NomSearch = {
      place_id?: number;
      display_name?: string;
      type?: string;
      addresstype?: string;
      lat?: string;
      lon?: string;
      boundingbox?: [string, string, string, string]; // [south, north, west, east]
      geojson?: { type: string; coordinates: unknown };
    };

    const queryNominatim = async (search: string): Promise<NomSearch[]> => {
      const qs = new URLSearchParams({
        q: search,
        format: 'json',
        polygon_geojson: '1',
        addressdetails: '1',
        limit: '10',
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${qs.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      return (await res.json()) as NomSearch[];
    };

    // Build a rectangular ring from a bounding box (fallback when no polygon)
    const boxRing = (south: number, north: number, west: number, east: number): GeoCoordinateDto[] => ([
      { lat: south, lng: west },
      { lat: south, lng: east },
      { lat: north, lng: east },
      { lat: north, lng: west },
    ]);

    const toResults = (data: NomSearch[]): AreaSearchResult[] => {
      const results: AreaSearchResult[] = [];
      (data ?? []).forEach((d, idx) => {
        let ring: GeoCoordinateDto[] | null = null;
        const raw = ringFromAnyGeo(d.geojson);
        if (raw && raw.length >= 3) {
          ring = decimate(raw.map(([lng, lat]) => ({ lat, lng })));
        } else if (d.boundingbox && d.boundingbox.length === 4) {
          const [s, n, w, e] = d.boundingbox.map(Number);
          ring = boxRing(s, n, w, e);
        } else if (d.lat && d.lon) {
          const lat = Number(d.lat);
          const lng = Number(d.lon);
          const dLat = 0.009; // ~1 km
          const dLng = 0.009 / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
          ring = boxRing(lat - dLat, lat + dLat, lng - dLng, lng + dLng);
        }
        if (!ring || ring.length < 3) return;
        results.push({
          id: String(d.place_id ?? idx),
          label: d.display_name ?? q,
          kind: d.addresstype ?? d.type ?? 'area',
          ring,
        });
      });
      return results;
    };

    try {
      const city = cities.find(c => c.id === geofenceForm.cityId);
      const state = city ? states.find(s => s.id === city.stateId) : undefined;
      const suffix = [city?.name, state?.name, 'India'].filter(Boolean).join(', ');

      // Pass 1: search the term as typed (anywhere). If the user already typed a
      // place outside the city, this finds it.
      let results = toResults(await queryNominatim(q));

      // Pass 2: if nothing found, bias towards the selected city/state to help
      // short/ambiguous local names resolve.
      if (!results.length && suffix) {
        results = toResults(await queryNominatim(`${q}, ${suffix}`));
      }

      if (!results.length) {
        toast.error('No results found for that search. Try a more specific name.');
      }
      setAreaResults(results);
    } catch {
      toast.error('Failed to search area');
    } finally {
      setAreaSearching(false);
    }
  };

  const selectAreaResult = (result: AreaSearchResult) => {
    setHighlightedArea(result.ring);
    setHighlightedLabel(result.label);
    setHighlightedCenter(result.center ?? null);
    setAreaResults([]);
    const cLat = result.ring.reduce((s, c) => s + c.lat, 0) / result.ring.length;
    const cLng = result.ring.reduce((s, c) => s + c.lng, 0) / result.ring.length;
    setMapCenter({ lat: cLat, lng: cLng });
    setMapKey(k => k + 1);
  };

  // Pinpoint mode: when the radius slider changes after a location is selected,
  // rebuild the highlighted circle around the same center.
  useEffect(() => {
    if (searchMode !== 'location' || !highlightedCenter) return;
    setHighlightedArea(circleRing(highlightedCenter, locationRadius));
    setMapKey(k => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationRadius]);

  const useHighlightedAsBoundary = () => {
    if (!highlightedArea) return;
    if (geofenceForm.fenceType === 'circle') {
      const { center, radius } = ringToCircle(highlightedArea);
      setGeofenceForm(prev => ({ ...prev, centerLat: center.lat, centerLng: center.lng, radiusMeters: radius }));
      setHighlightedArea(null);
      setHighlightedLabel('');
      setHighlightedCenter(null);
      setMapCenter(center);
      setMapKey(k => k + 1);
      toast.success(`Circle set from search (~${(radius / 1000).toFixed(1)} km). Adjust the radius if needed.`);
      return;
    }
    setGeofenceForm(prev => ({ ...prev, fenceType: 'polygon', coordinates: highlightedArea }));
    setHighlightedArea(null);
    setHighlightedLabel('');
    setHighlightedCenter(null);
    setMapKey(k => k + 1);
    toast.success('Boundary set from search. Drag points to adjust if needed.');
  };

  // Convert a ring (open) into a closed GeoJSON polygon feature for turf.
  const ringToTurf = (ring: GeoCoordinateDto[]) => {
    const coords = ring.map(c => [c.lng, c.lat] as [number, number]);
    if (coords.length && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
      coords.push(coords[0]); // close the ring
    }
    return turfPolygon([coords]);
  };

  // From a turf geometry pick the largest outer ring as a flat GeoCoordinateDto[].
  const largestRingFromTurf = (geom: ReturnType<typeof union>): GeoCoordinateDto[] | null => {
    if (!geom) return null;
    const g = geom.geometry;
    let best: number[][] = [];
    if (g.type === 'Polygon') {
      best = g.coordinates[0] as number[][];
    } else if (g.type === 'MultiPolygon') {
      (g.coordinates as number[][][][]).forEach(poly => {
        if (poly[0] && poly[0].length > best.length) best = poly[0] as number[][];
      });
    }
    if (best.length < 4) return null;
    return decimate(best.map(([lng, lat]) => ({ lat, lng })));
  };

  const addHighlightedToGeofence = () => {
    if (!highlightedArea) return;
    const existing = geofenceForm.coordinates;
    // No existing polygon → behave like "use as boundary".
    if (!existing || existing.length < 3) {
      useHighlightedAsBoundary();
      return;
    }
    try {
      const merged = union(featureCollection([ringToTurf(existing), ringToTurf(highlightedArea)]));
      if (!merged) { toast.error('Could not merge the areas'); return; }
      // A geofence stores a SINGLE ring. If the searched area does not touch/overlap
      // the existing polygon, union returns a MultiPolygon which we cannot store.
      if (merged.geometry.type === 'MultiPolygon' && merged.geometry.coordinates.length > 1) {
        toast.error('That area is separate from the current geofence. It must touch or overlap to be added.');
        return;
      }
      const ring = largestRingFromTurf(merged);
      if (!ring) { toast.error('Could not merge the areas'); return; }
      setGeofenceForm(prev => ({ ...prev, fenceType: 'polygon', coordinates: ring }));
      setHighlightedArea(null);
      setHighlightedLabel('');
      setHighlightedCenter(null);
      setMapKey(k => k + 1);
      toast.success('Area added to geofence.');
    } catch {
      toast.error('Failed to add area to geofence');
    }
  };

  const removeHighlightedFromGeofence = () => {
    if (!highlightedArea) return;
    const existing = geofenceForm.coordinates;
    if (!existing || existing.length < 3) {
      toast.error('Nothing to remove from — draw or set a boundary first');
      return;
    }
    try {
      const diff = difference(featureCollection([ringToTurf(existing), ringToTurf(highlightedArea)]));
      if (!diff) {
        toast.error('Removing this area would leave nothing');
        return;
      }
      const ring = largestRingFromTurf(diff);
      if (!ring) { toast.error('Could not subtract the area'); return; }
      setGeofenceForm(prev => ({ ...prev, fenceType: 'polygon', coordinates: ring }));
      setHighlightedArea(null);
      setHighlightedLabel('');
      setHighlightedCenter(null);
      setMapKey(k => k + 1);
      toast.success('Area removed from geofence.');
    } catch {
      toast.error('Failed to remove area from geofence');
    }
  };

  const clearHighlight = () => {
    setHighlightedArea(null);
    setHighlightedLabel('');
    setHighlightedCenter(null);
    setMapKey(k => k + 1);
  };

  // Update map center when city changes
  useEffect(() => {
    if (geofenceForm.cityId && cities.length > 0) {
      const selectedCity = cities.find(c => c.id === geofenceForm.cityId);
      if (selectedCity) {
        const cityKey = selectedCity.name.toLowerCase();
        const coords = CITY_COORDINATES[cityKey];
        if (coords) {
          setMapCenter(coords);
        }
      }
    }
  }, [geofenceForm.cityId, cities]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Geofences</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage geographic boundaries for vehicles</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Geofence
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search geofences..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Geofences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGeofences.map((geofence) => (
          <div
            key={geofence.id}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  geofence.fenceType === 'circle' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-purple-100 text-purple-600'
                }`}>
                  {geofence.fenceType === 'circle' ? <Circle className="w-5 h-5" /> : <Hexagon className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{geofence.name}</h3>
                  <p className="text-xs text-gray-500">{geofence.cityName}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                geofence.isActive 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {geofence.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {geofence.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{geofence.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Car className="w-4 h-4" />
                {geofence.vehicleCount} vehicles
              </span>
              <span className="capitalize">{geofence.fenceType}</span>
              {geofence.fenceType === 'circle' && geofence.radiusMeters && (
                <span>{geofence.radiusMeters}m radius</span>
              )}
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleOpenEdit(geofence)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(geofence.id)}
                className="flex items-center justify-center p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredGeofences.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No geofences found</p>
            <button onClick={handleOpenAdd} className="mt-3 text-primary-600 hover:underline">
              Create your first geofence
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingGeofence ? 'Edit Geofence' : 'Create Geofence'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Geofence Name"
                  value={geofenceForm.name}
                  onChange={(v) => setGeofenceForm({ ...geofenceForm, name: v })}
                  required
                  placeholder="e.g. Mumbai City Center"
                />
                <FormField label="City" required>
                  <select
                    value={geofenceForm.cityId}
                    onChange={(e) => setGeofenceForm({ ...geofenceForm, cityId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  >
                    <option value={0}>Select city</option>
                    {allowedCities.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField
                label="Description"
                value={geofenceForm.description || ''}
                onChange={(v) => setGeofenceForm({ ...geofenceForm, description: v })}
                placeholder="Optional description"
              />

              {/* Fence Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fence Type</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setGeofenceForm({ ...geofenceForm, fenceType: 'polygon' }); clearDrawing(); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition ${
                      geofenceForm.fenceType === 'polygon'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Hexagon className="w-5 h-5" />
                    Polygon
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGeofenceForm({ ...geofenceForm, fenceType: 'circle' }); clearDrawing(); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition ${
                      geofenceForm.fenceType === 'circle'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Circle className="w-5 h-5" />
                    Circle
                  </button>
                </div>
              </div>

              {/* Map */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Draw Geofence on Map
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={autoFillCityBoundary}
                      disabled={autoFilling || !geofenceForm.cityId}
                      title={geofenceForm.cityId ? 'Auto-select the city boundary' : 'Select a city first'}
                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                    >
                      {autoFilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      Auto-fill City
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDrawing(true)}
                      className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                      {isDrawing ? 'Drawing...' : 'Start Drawing'}
                    </button>
                    <button
                      type="button"
                      onClick={clearDrawing}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Area / Location search — find a place and highlight a boundary */}
                <div className="mb-3">
                  {/* Mode toggle: whole area vs single pinpoint + radius */}
                  <div className="inline-flex rounded-lg border border-gray-200 p-0.5 mb-2 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => { setSearchMode('area'); setAreaResults([]); clearHighlight(); }}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                        searchMode === 'area' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Area
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSearchMode('location'); setAreaResults([]); clearHighlight(); }}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                        searchMode === 'location' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Location (pinpoint)
                    </button>
                  </div>
                  <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={areaQuery}
                          onChange={(e) => setAreaQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchArea(); } }}
                          placeholder={searchMode === 'location'
                            ? 'Search a place, address or landmark to pinpoint…'
                            : 'Search an area, locality or place to highlight…'}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                      </div>
                      {searchMode === 'location' && (
                        <div className="relative">
                          <input
                            type="number"
                            min={50}
                            max={50000}
                            step={50}
                            value={locationRadius}
                            onChange={(e) => setLocationRadius(Math.min(50000, Math.max(50, Number(e.target.value) || 0)))}
                            title="Radius in metres around the pinpoint"
                            className="w-24 pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">m</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={searchArea}
                        disabled={areaSearching || !areaQuery.trim()}
                        className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                      >
                        {areaSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Search
                      </button>
                    </div>
                    {searchMode === 'location' && (
                      <p className="mt-1.5 text-xs text-gray-500">
                        Drops a circle of {locationRadius >= 1000 ? `${(locationRadius / 1000).toFixed(1)} km` : `${locationRadius} m`} around the chosen point. Use it to add or exclude a spot that isn’t a full area.
                      </p>
                    )}


                    {/* Results dropdown */}
                    {areaResults.length > 0 && (
                      <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-56 overflow-y-auto bg-white shadow-sm">
                        {areaResults.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => selectAreaResult(r)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 transition flex items-start gap-2"
                          >
                            <MapPin className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                            <span className="min-w-0">
                              <span className="block text-sm text-gray-800 truncate">{r.label}</span>
                              <span className="block text-xs text-gray-400 capitalize">{r.kind}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Highlighted-area action banner */}
                    {highlightedArea && (
                      <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-orange-800 min-w-0">
                          <span className="font-semibold">Previewing:</span>{' '}
                          <span className="truncate">{highlightedLabel}</span>
                        </p>
                        <div className="flex gap-2 flex-shrink-0">
                          {geofenceForm.fenceType === 'circle' ? (
                            <button
                              type="button"
                              onClick={useHighlightedAsBoundary}
                              className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                            >
                              Use as boundary
                            </button>
                          ) : geofenceForm.coordinates && geofenceForm.coordinates.length >= 3 ? (
                            <>
                              <button
                                type="button"
                                onClick={addHighlightedToGeofence}
                                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                              >
                                Add to geofence
                              </button>
                              <button
                                type="button"
                                onClick={removeHighlightedFromGeofence}
                                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                              >
                                Remove from geofence
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={useHighlightedAsBoundary}
                              className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                            >
                              Use as boundary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={clearHighlight}
                            className="px-3 py-1.5 text-sm border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100 transition"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                {loadError && (
                  <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
                    <p className="text-red-500">Failed to load Google Maps</p>
                  </div>
                )}

                {!isLoaded && !loadError && (
                  <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                  </div>
                )}

                {isLoaded && !loadError && (
                  <GoogleMap
                    key={mapKey}
                    mapContainerStyle={MAP_CONTAINER_STYLE}
                    center={mapCenter}
                    zoom={13}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: true,
                      fullscreenControl: true,
                    }}
                  >
                    {isDrawing && (
                      <DrawingManager
                        onPolygonComplete={geofenceForm.fenceType === 'polygon' ? onPolygonComplete : undefined}
                        onCircleComplete={geofenceForm.fenceType === 'circle' ? onCircleComplete : undefined}
                        options={{
                          drawingControl: true,
                          drawingControlOptions: {
                            position: google.maps.ControlPosition.TOP_CENTER,
                            drawingModes: [
                              geofenceForm.fenceType === 'polygon'
                                ? google.maps.drawing.OverlayType.POLYGON
                                : google.maps.drawing.OverlayType.CIRCLE,
                            ],
                          },
                          polygonOptions: {
                            fillColor: '#8B5CF6',
                            fillOpacity: 0.3,
                            strokeColor: '#8B5CF6',
                            strokeWeight: 2,
                            editable: true,
                          },
                          circleOptions: {
                            fillColor: '#3B82F6',
                            fillOpacity: 0.3,
                            strokeColor: '#3B82F6',
                            strokeWeight: 2,
                            editable: true,
                          },
                        }}
                      />
                    )}

                    {/* Show existing polygon (editable: drag vertices to fine-tune) */}
                    {!isDrawing && geofenceForm.fenceType === 'polygon' && geofenceForm.coordinates && geofenceForm.coordinates.length > 0 && (
                      <Polygon
                        editable
                        paths={geofenceForm.coordinates.map(c => ({ lat: c.lat, lng: c.lng }))}
                        onLoad={(polygon) => {
                          const sync = () => {
                            const path = polygon.getPath();
                            const coords: GeoCoordinateDto[] = [];
                            for (let i = 0; i < path.getLength(); i++) {
                              const p = path.getAt(i);
                              coords.push({ lat: p.lat(), lng: p.lng() });
                            }
                            setGeofenceForm(prev => ({ ...prev, coordinates: coords }));
                          };
                          const path = polygon.getPath();
                          path.addListener('set_at', sync);
                          path.addListener('insert_at', sync);
                          path.addListener('remove_at', sync);
                        }}
                        options={{
                          fillColor: '#8B5CF6',
                          fillOpacity: 0.3,
                          strokeColor: '#8B5CF6',
                          strokeWeight: 2,
                        }}
                      />
                    )}

                    {/* Show existing circle */}
                    {!isDrawing && geofenceForm.fenceType === 'circle' && geofenceForm.centerLat && geofenceForm.centerLng && (
                      <GoogleCircle
                        center={{ lat: geofenceForm.centerLat, lng: geofenceForm.centerLng }}
                        radius={geofenceForm.radiusMeters || 500}
                        options={{
                          fillColor: '#3B82F6',
                          fillOpacity: 0.3,
                          strokeColor: '#3B82F6',
                          strokeWeight: 2,
                        }}
                      />
                    )}

                    {/* Highlighted area preview from search (non-editable) */}
                    {highlightedArea && highlightedArea.length > 0 && (
                      <Polygon
                        paths={highlightedArea.map(c => ({ lat: c.lat, lng: c.lng }))}
                        options={{
                          fillColor: '#F97316',
                          fillOpacity: 0.15,
                          strokeColor: '#F97316',
                          strokeWeight: 2,
                          clickable: false,
                          zIndex: 5,
                        }}
                      />
                    )}
                  </GoogleMap>
                )}

                {/* Coordinate info */}
                {geofenceForm.fenceType === 'polygon' && geofenceForm.coordinates && geofenceForm.coordinates.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {geofenceForm.coordinates.length} points drawn
                  </p>
                )}
                {geofenceForm.fenceType === 'circle' && geofenceForm.centerLat && (
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-xs text-gray-500">
                      Center: {geofenceForm.centerLat?.toFixed(6)}, {geofenceForm.centerLng?.toFixed(6)}
                    </p>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Radius (m):</label>
                      <input
                        type="number"
                        value={geofenceForm.radiusMeters || 500}
                        onChange={(e) => setGeofenceForm({ ...geofenceForm, radiusMeters: Number(e.target.value) })}
                        className="w-20 px-2 py-1 text-xs border border-gray-200 rounded"
                        min={50}
                        max={50000}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={geofenceForm.isActive}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, isActive: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <span className="text-sm text-gray-700">Geofence is active</span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={creating || updating}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
              >
                {(creating || updating) && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                {editingGeofence ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeofencesTab;
