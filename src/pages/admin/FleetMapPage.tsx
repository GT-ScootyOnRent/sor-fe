import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { Map as MapIcon, RefreshCw, Loader2, Filter, Search, X, Bike, Battery, Gauge, Navigation, Clock, MapPin, Wifi, Zap } from 'lucide-react';
import { useGetVehiclesForAdminQuery, type VehicleDto } from '../../store/api/vehicleApi';
import { useGetCitiesQuery } from '../../store/api/cityApi';
import { getLiveData, type MapplsDeviceData } from '../../config/mappls';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;
const GOOGLE_LIBRARIES: ('drawing' | 'places')[] = ['drawing', 'places'];

// Default center (India)
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
const MAP_CONTAINER_STYLE = { width: '100%', height: 'calc(100vh - 180px)', minHeight: '500px' };

// Status config for markers
const getStatusConfig = (statusStr: string) => {
  const s = statusStr?.toLowerCase();
  if (s === 'moving') return { color: '#22c55e', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'Moving' };
  if (s === 'idle') return { color: '#eab308', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Idle' };
  if (s === 'stopped') return { color: '#ef4444', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Stopped' };
  return { color: '#9ca3af', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', label: 'Offline' };
};

// Motorcycle marker icon (same as TrackingModal)
const VEHICLE_ICON = {
  url: 'https://maps.google.com/mapfiles/ms/icons/motorcycling.png',
  scaledSize: { width: 40, height: 40, equals: () => false },
};

const getMarkerIcon = (_statusStr: string, isLoaded: boolean) => {
  if (!isLoaded) return VEHICLE_ICON;
  return {
    url: 'https://maps.google.com/mapfiles/ms/icons/motorcycling.png',
    scaledSize: new google.maps.Size(40, 40),
  };
};

interface VehicleLiveData {
  vehicle: VehicleDto;
  liveData: MapplsDeviceData | null;
  loading: boolean;
  error: boolean;
}

const FleetMapPage: React.FC = () => {
  const { data: vehicles = [], isLoading: vehiclesLoading } = useGetVehiclesForAdminQuery({});
  const { data: cities = [] } = useGetCitiesQuery({ page: 1, size: 100 });
  
  const [vehicleLiveData, setVehicleLiveData] = useState<Map<number, VehicleLiveData>>(new Map());
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLiveData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    libraries: GOOGLE_LIBRARIES,
    id: 'google-maps-script',
  });

  // Filter vehicles with GPS device
  const trackedVehicles = vehicles.filter(v => v.gpsDeviceId);

  // Fetch live data for all tracked vehicles
  const fetchAllLiveData = useCallback(async () => {
    if (trackedVehicles.length === 0) return;
    
    setRefreshing(true);
    const newData = new Map<number, VehicleLiveData>();
    
    await Promise.all(
      trackedVehicles.map(async (vehicle) => {
        try {
          const liveData = await getLiveData(vehicle.gpsDeviceId!);
          newData.set(vehicle.id, { vehicle, liveData, loading: false, error: !liveData });
        } catch {
          newData.set(vehicle.id, { vehicle, liveData: null, loading: false, error: true });
        }
      })
    );
    
    setVehicleLiveData(newData);
    setLastRefreshed(new Date());
    setRefreshing(false);
  }, [trackedVehicles]);

  // Initial fetch and auto-refresh every 30s
  useEffect(() => {
    if (trackedVehicles.length > 0 && vehicleLiveData.size === 0) {
      fetchAllLiveData();
    }
    
    intervalRef.current = setInterval(fetchAllLiveData, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [trackedVehicles.length]);

  // Get vehicles with valid coordinates
  const vehiclesWithLocation = Array.from(vehicleLiveData.values()).filter(
    v => v.liveData && v.liveData.latitude !== 0 && v.liveData.longitude !== 0
  );

  // Apply filters
  const filteredVehicles = vehiclesWithLocation.filter(v => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = v.vehicle.name.toLowerCase().includes(query);
      const matchesNumber = v.vehicle.registrationNumber?.toLowerCase().includes(query);
      if (!matchesName && !matchesNumber) return false;
    }
    
    // City filter
    if (selectedCity !== 'all' && v.vehicle.cityId !== selectedCity) return false;
    
    // Status filter
    if (selectedStatus !== 'all') {
      const status = v.liveData?.statusStr?.toLowerCase();
      if (status !== selectedStatus.toLowerCase()) return false;
    }
    
    return true;
  });

  // Center map on vehicles
  const centerOnVehicles = useCallback(() => {
    if (!mapRef.current || filteredVehicles.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    filteredVehicles.forEach(v => {
      if (v.liveData) {
        bounds.extend({ lat: v.liveData.latitude, lng: v.liveData.longitude });
      }
    });
    mapRef.current.fitBounds(bounds);
  }, [filteredVehicles]);

  // Stats
  const stats = {
    total: trackedVehicles.length,
    online: vehiclesWithLocation.length,
    moving: vehiclesWithLocation.filter(v => v.liveData?.statusStr === 'Moving').length,
    idle: vehiclesWithLocation.filter(v => v.liveData?.statusStr === 'Idle').length,
    stopped: vehiclesWithLocation.filter(v => v.liveData?.statusStr === 'Stopped').length,
  };

  if (vehiclesLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <span className="ml-3 text-gray-500">Loading vehicles...</span>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <MapIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Map</h1>
            <p className="text-sm text-gray-500">
              {stats.online} of {stats.total} vehicles online
              {lastRefreshed && (
                <span className="ml-2">
                  · Updated {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllLiveData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
              showFilters ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div 
          className={`p-3 rounded-xl border cursor-pointer transition ${
            selectedStatus === 'all' ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
          onClick={() => setSelectedStatus('all')}
        >
          <div className="flex items-center gap-2">
            <Bike className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">All Online</span>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.online}</p>
        </div>
        <div 
          className={`p-3 rounded-xl border cursor-pointer transition ${
            selectedStatus === 'moving' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
          onClick={() => setSelectedStatus(selectedStatus === 'moving' ? 'all' : 'moving')}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-gray-600">Moving</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-green-600">{stats.moving}</p>
        </div>
        <div 
          className={`p-3 rounded-xl border cursor-pointer transition ${
            selectedStatus === 'idle' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
          onClick={() => setSelectedStatus(selectedStatus === 'idle' ? 'all' : 'idle')}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-sm text-gray-600">Idle</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{stats.idle}</p>
        </div>
        <div 
          className={`p-3 rounded-xl border cursor-pointer transition ${
            selectedStatus === 'stopped' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
          onClick={() => setSelectedStatus(selectedStatus === 'stopped' ? 'all' : 'stopped')}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-sm text-gray-600">Stopped</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-red-600">{stats.stopped}</p>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicle name or number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Cities</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
          
          {/* Clear filters */}
          {(searchQuery || selectedCity !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('all');
                setSelectedStatus('all');
              }}
              className="text-sm text-primary-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Map */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loadError || !GOOGLE_MAPS_KEY ? (
          <div className="h-96 flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">Unable to load Google Maps</p>
          </div>
        ) : !isLoaded ? (
          <div className="h-96 flex items-center justify-center bg-gray-50">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500 mr-2" />
            <span className="text-gray-500">Loading map...</span>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={filteredVehicles[0]?.liveData ? 
              { lat: filteredVehicles[0].liveData.latitude, lng: filteredVehicles[0].liveData.longitude } : 
              DEFAULT_CENTER
            }
            zoom={filteredVehicles.length === 1 ? 15 : 10}
            onLoad={map => {
              mapRef.current = map;
              if (filteredVehicles.length > 1) centerOnVehicles();
            }}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              zoomControl: true,
            }}
          >
            {filteredVehicles.map(v => (
              v.liveData && (
                <Marker
                  key={v.vehicle.id}
                  position={{ lat: v.liveData.latitude, lng: v.liveData.longitude }}
                  title={v.vehicle.name}
                  icon={getMarkerIcon(v.liveData.statusStr, isLoaded)}
                  onClick={() => setSelectedVehicle(v)}
                />
              )
            ))}
            
            {/* Info Window */}
            {selectedVehicle && selectedVehicle.liveData && (
              <InfoWindow
                position={{ 
                  lat: selectedVehicle.liveData.latitude, 
                  lng: selectedVehicle.liveData.longitude 
                }}
                onCloseClick={() => setSelectedVehicle(null)}
              >
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{selectedVehicle.vehicle.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      getStatusConfig(selectedVehicle.liveData.statusStr).bg
                    } ${getStatusConfig(selectedVehicle.liveData.statusStr).text}`}>
                      {getStatusConfig(selectedVehicle.liveData.statusStr).label}
                    </span>
                  </div>
                  
                  {selectedVehicle.vehicle.registrationNumber && (
                    <p className="text-sm text-gray-500 mb-2">{selectedVehicle.vehicle.registrationNumber}</p>
                  )}
                  
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Gauge className="w-4 h-4" />
                      <span>{selectedVehicle.liveData.speedKph} km/h</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Navigation className="w-4 h-4" />
                      <span>{selectedVehicle.liveData.heading}°</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Battery className="w-4 h-4" />
                      <span>{selectedVehicle.liveData.internalBatteryLevel}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{selectedVehicle.liveData.gprsTimeStr}</span>
                    </div>
                    {selectedVehicle.liveData.address && (
                      <div className="flex items-start gap-2 text-gray-600 pt-1 border-t border-gray-100">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">{selectedVehicle.liveData.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>

      {/* Vehicle List (below map) */}
      {filteredVehicles.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">
              Vehicles ({filteredVehicles.length})
            </h3>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {filteredVehicles.map(v => {
              const status = getStatusConfig(v.liveData?.statusStr ?? '');
              const live = v.liveData;
              return (
                <div
                  key={v.vehicle.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedVehicle(v);
                    if (mapRef.current && v.liveData) {
                      mapRef.current.panTo({ lat: v.liveData.latitude, lng: v.liveData.longitude });
                      mapRef.current.setZoom(16);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Bike className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{v.vehicle.name}</p>
                        <p className="text-xs text-gray-500">{v.vehicle.registrationNumber}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                  
                  {/* Vehicle Details Grid */}
                  {live && (
                    <div className="grid grid-cols-4 gap-3 mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600">{live.speedKph} km/h</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600">{live.todayKms.toFixed(1)} km today</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Battery className={`w-3.5 h-3.5 ${live.internalBatteryLevel > 20 ? 'text-green-500' : 'text-red-500'}`} />
                        <span className="text-xs text-gray-600">{live.internalBatteryLevel}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wifi className={`w-3.5 h-3.5 ${live.gpsSignal > 0 ? 'text-green-500' : 'text-red-500'}`} />
                        <span className="text-xs text-gray-600">{live.gpsStateStr}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Additional info row */}
                  {live && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Zap className={`w-3 h-3 ${live.ignition === 1 ? 'text-green-500' : 'text-gray-400'}`} />
                        {live.ignitionStatusStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {live.gprsTimeStr}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No vehicles message */}
      {trackedVehicles.length === 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <Bike className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="font-semibold text-yellow-800 mb-1">No GPS-Enabled Vehicles</h3>
          <p className="text-sm text-yellow-600">
            No vehicles have GPS devices configured. Add GPS device IDs to vehicles to track them.
          </p>
        </div>
      )}

      {filteredVehicles.length === 0 && trackedVehicles.length > 0 && !refreshing && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">No Vehicles Match Filters</h3>
          <p className="text-sm text-gray-500">
            Try adjusting your filters or wait for live data to load.
          </p>
        </div>
      )}
    </div>
  );
};

export default FleetMapPage;
