import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, X, RefreshCw, Clock, Loader2, XCircle, Gauge, Navigation, Battery, Wifi } from 'lucide-react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import type { VehicleDto } from '../../store/api/vehicleApi';
import { getLiveData, type MapplsDeviceData } from '../../config/mappls';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;

const MAP_CONTAINER_STYLE = { width: '100%', height: '288px', borderRadius: '12px' };

// Status config
const getDeviceStatusConfig = (statusStr: string) => {
  const s = statusStr?.toLowerCase();
  if (s === 'moving') return { color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500', label: 'Moving' };
  if (s === 'idle') return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', label: 'Idle' };
  if (s === 'stopped') return { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Stopped' };
  return { color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400', label: statusStr };
};

// Vehicle icon for Google Maps marker
const VEHICLE_ICON = {
  url: 'https://maps.google.com/mapfiles/ms/icons/motorcycling.png',
  scaledSize: { width: 40, height: 40, equals: () => false },
};

interface TrackingMapProps {
  lat: number;
  lng: number;
  label: string;
}

const TrackingMap: React.FC<TrackingMapProps> = ({ lat, lng, label }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    id: 'tracking-map-script',
  });

  const center = { lat, lng };

  if (loadError || !GOOGLE_MAPS_KEY) {
    // Fallback: static Google Maps iframe — no API key needed for embed
    return (
      <iframe
        title={`Map - ${label}`}
        width="100%"
        height="288"
        style={{ border: 0, borderRadius: '12px' }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
      />
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-72 rounded-xl bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500 mr-2" />
        <span className="text-gray-500 text-sm">Loading map...</span>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={center}
      zoom={15}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        zoomControl: true,
      }}
    >
      <Marker
        position={center}
        title={label}
        icon={VEHICLE_ICON}
      />
    </GoogleMap>
  );
};

export const TrackingModal: React.FC<{ vehicle: VehicleDto; onClose: () => void }> = ({ vehicle, onClose }) => {
  const [liveData, setLiveData] = useState<MapplsDeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!vehicle.gpsDeviceId) return;
    try {
      setError(null);
      const data = await getLiveData(vehicle.gpsDeviceId);
      if (!data) {
        setError('No data received from device');
        return;
      }
      setLiveData(data);
      setLastRefreshed(new Date());
    } catch {
      setError('Failed to fetch live data');
    } finally {
      setLoading(false);
    }
  }, [vehicle.gpsDeviceId]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const statusConfig = liveData ? getDeviceStatusConfig(liveData.statusStr) : null;

  const hasValidCoords =
    liveData && liveData.latitude !== 0 && liveData.longitude !== 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{vehicle.name}</h2>
              <p className="text-xs text-gray-500">GPS · {vehicle.gpsDeviceId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastRefreshed && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Loading state */}
          {loading && !liveData && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-3" />
              <p className="text-gray-500">Fetching live location...</p>
            </div>
          )}

          {/* Error state */}
          {error && !liveData && (
            <div className="text-center py-16">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {liveData && (
            <>
              {/* Status bar */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border mb-5 ${statusConfig?.color}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusConfig?.dot} animate-pulse`} />
                  <span className="font-semibold text-sm">{statusConfig?.label}</span>
                  <span className="text-xs opacity-70">{liveData.ignitionStatusStr}</span>
                </div>
                <span className="text-xs opacity-70">{liveData.gprsTimeStr}</span>
              </div>

              {/* Map */}
              <div className="mb-5 rounded-xl overflow-hidden border border-gray-200">
                {hasValidCoords ? (
                  <TrackingMap
                    lat={liveData.latitude}
                    lng={liveData.longitude}
                    label={vehicle.name}
                  />
                ) : (
                  <div className="w-full h-72 bg-gray-100 flex flex-col items-center justify-center gap-2">
                    <MapPin className="w-10 h-10 text-gray-300" />
                    <p className="text-sm text-gray-500">GPS coordinates unavailable</p>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="flex items-start gap-2 px-4 py-3 bg-gray-50 rounded-xl mb-5">
                <MapPin className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700">{liveData.address}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary-50 rounded-xl p-4 text-center">
                  <Gauge className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-primary-700">{liveData.speedKph.toFixed(0)}</p>
                  <p className="text-xs text-primary-500 font-medium">km/h</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <Navigation className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{liveData.todayKms.toFixed(1)}</p>
                  <p className="text-xs text-green-500 font-medium">Today's km</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <Battery className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-yellow-700">{liveData.internalBatteryLevel}%</p>
                  <p className="text-xs text-yellow-500 font-medium">Battery</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <Wifi className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-purple-700">{liveData.gprsStateStr}</p>
                  <p className="text-xs text-purple-500 font-medium">GPS · {liveData.gpsStateStr}</p>
                </div>
              </div>

              {/* Power info */}
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 px-1">
                <span>Main Power: {(liveData.mainPower / 1000).toFixed(2)}v</span>
                <span>·</span>
                <span>Last GPS: {liveData.gpsTimeStr}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingModal;