import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Search, MapPin, X, Save, Loader2,
  Circle, Hexagon, Car
} from 'lucide-react';
import { toast } from 'sonner';
import { GoogleMap, useJsApiLoader, Polygon, Circle as GoogleCircle, DrawingManager } from '@react-google-maps/api';

import {
  useGetGeofencesQuery,
  useCreateGeofenceMutation,
  useUpdateGeofenceMutation,
  useDeleteGeofenceMutation,
  type GeofenceDto,
  type CreateGeofenceDto,
  type GeoCoordinateDto,
} from '../../store/api/geofenceApi';
import { useGetCitiesQuery } from '../../store/api/cityApi';
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

const GeofencesTab: React.FC<GeofencesTabProps> = ({ adminCityIds = [], isSuperAdmin = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<GeofenceDto | null>(null);
  const [geofenceForm, setGeofenceForm] = useState<CreateGeofenceDto>(EMPTY_GEOFENCE);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapKey, setMapKey] = useState(0); // Force map re-render when clearing
  
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  // API queries
  const { data: geofences = [], isLoading, refetch } = useGetGeofencesQuery();
  const { data: cities = [] } = useGetCitiesQuery({ page: 1, size: 100 });
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

                    {/* Show existing polygon */}
                    {!isDrawing && geofenceForm.fenceType === 'polygon' && geofenceForm.coordinates && geofenceForm.coordinates.length > 0 && (
                      <Polygon
                        paths={geofenceForm.coordinates.map(c => ({ lat: c.lat, lng: c.lng }))}
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
