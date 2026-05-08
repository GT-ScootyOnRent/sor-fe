import React, { useState } from 'react';
import {
  Plus, Edit, Trash2, Search, CheckCircle, XCircle,
  Image, MapPin, X, Save, Loader2, Star,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useGetVehiclesQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  type VehicleDto,
} from '../../store/api/vehicleApi';
import { useGetCitiesQuery } from '../../store/api/cityApi';
import {
  useGetVehicleImagesByVehicleIdQuery,
  useCreateVehicleImageMutation,
  useUpdateVehicleImageMutation,
  useDeleteVehicleImageMutation,
} from '../../store/api/vehicleImageApi';
import { uploadVehicleImage } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { TrackingModal } from './Trackingmodal';
import { FormField } from './FormField';

// ── Vehicle Form Initial State ─────────────────────────────────────────────
const EMPTY_VEHICLE: Omit<VehicleDto, 'id'> = {
  name: '', make: '', model: '', registrationNumber: '', cityId: 0,
  isAvailable: true, featured: false,
  pricePerHour: 0, pricePerDay: 0, minBookingHours: 4,
  kmLimit: 100, excessKmCharge: 5, lateReturnCharge: 80,
  rating: 0, fuelType: 'Petrol', vehicleType: 'Scooter',
  kmTravelled: 0, gpsDeviceId: '',
  packages: { fourHours: 0, oneDay: 0, threeDays: 0, sevenDays: 0, fifteenDays: 0, monthly: 0 },
  specs: { mileage: '', engineCapacity: '', topSpeed: '', weight: '' },
};

type VehicleModalTab = 'details' | 'images';

const VehiclesTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleDto | null>(null);
  const [vehicleForm, setVehicleForm] = useState<Omit<VehicleDto, 'id'>>(EMPTY_VEHICLE);
  const [vehicleModalTab, setVehicleModalTab] = useState<VehicleModalTab>('details');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [trackingVehicle, setTrackingVehicle] = useState<VehicleDto | null>(null);

  // ── API Calls ──────────────────────────────────────────────────────────
  const { data: vehicles = [], isLoading: vehiclesLoading, refetch: refetchVehicles } = useGetVehiclesQuery(undefined);
  const { data: cities = [] } = useGetCitiesQuery({ page: 1, size: 100 });

  const {
    data: vehicleImages = [],
    isLoading: imagesLoading,
    refetch: refetchImages,
  } = useGetVehicleImagesByVehicleIdQuery(editingVehicle?.id ?? 0, {
    skip: !editingVehicle?.id,
  });

  const [createVehicle, { isLoading: creating }] = useCreateVehicleMutation();
  const [updateVehicle, { isLoading: updating }] = useUpdateVehicleMutation();
  const [deleteVehicle] = useDeleteVehicleMutation();
  const [createVehicleImage] = useCreateVehicleImageMutation();
  const [updateVehicleImage] = useUpdateVehicleImageMutation();
  const [deleteVehicleImage] = useDeleteVehicleImageMutation();

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm(EMPTY_VEHICLE);
    setVehicleModalTab('details');
    setShowVehicleModal(true);
  };

  const handleOpenEditVehicle = (vehicle: VehicleDto) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      name: vehicle.name, make: vehicle.make, model: vehicle.model,
      registrationNumber: vehicle.registrationNumber ?? '',
      cityId: vehicle.cityId, isAvailable: vehicle.isAvailable,
      featured: vehicle.featured, pricePerHour: vehicle.pricePerHour,
      pricePerDay: vehicle.pricePerDay, minBookingHours: vehicle.minBookingHours,
      kmLimit: vehicle.kmLimit, excessKmCharge: vehicle.excessKmCharge,
      lateReturnCharge: vehicle.lateReturnCharge, rating: vehicle.rating,
      fuelType: vehicle.fuelType, vehicleType: vehicle.vehicleType,
      kmTravelled: vehicle.kmTravelled,
      gpsDeviceId: vehicle.gpsDeviceId ?? '',
      packages: vehicle.packages ?? EMPTY_VEHICLE.packages,
      specs: vehicle.specs ?? EMPTY_VEHICLE.specs,
    });
    setVehicleModalTab('details');
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = async () => {
    if (!vehicleForm.name || !vehicleForm.make || !vehicleForm.model) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!vehicleForm.cityId) {
      toast.error('Please select a city');
      return;
    }
    try {
      if (editingVehicle) {
        await updateVehicle({ id: editingVehicle.id, vehicle: { ...vehicleForm, id: editingVehicle.id } }).unwrap();
        toast.success('Vehicle updated successfully');
        setVehicleModalTab('images');
      } else {
        const newVehicle = await createVehicle(vehicleForm as VehicleDto).unwrap();
        toast.success('Vehicle added! Now you can add images.');
        setEditingVehicle(newVehicle);
        setVehicleModalTab('images');
        refetchVehicles();
      }
    } catch (err: any) {
      toast.error('Failed to save vehicle', { description: err?.data?.message || 'Try again' });
    }
  };

  const handleUploadVehicleImage = async (file?: File) => {
    if (!file || !editingVehicle?.id) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { toast.error('Only JPEG, PNG, WebP allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    setIsUploadingImage(true);
    try {
      const imageUrl = await uploadVehicleImage(file, editingVehicle.id);
      const isPrimary = vehicleImages.length === 0;
      const displayOrder = vehicleImages.length;
      await createVehicleImage({ vehicleId: editingVehicle.id, imageUrl, isPrimary, displayOrder }).unwrap();
      toast.success('Image uploaded successfully!');
      refetchImages();
      refetchVehicles();
    } catch (err: any) {
      toast.error('Upload failed', { description: err?.message || 'Try again' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSetPrimaryImage = async (image: any) => {
    try {
      await updateVehicleImage({ id: image.id, image: { ...image, isPrimary: true } }).unwrap();
      toast.success('Primary image updated');
      refetchImages();
      refetchVehicles();
    } catch { toast.error('Failed to set primary image'); }
  };

  const handleDeleteVehicleImage = async (image: any) => {
    if (!confirm('Delete this image?')) return;
    try {
      await deleteVehicleImage(image.id).unwrap();
      toast.success('Image deleted');
      refetchImages();
      refetchVehicles();
    } catch { toast.error('Failed to delete image'); }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await deleteVehicle(id).unwrap();
      toast.success('Vehicle deleted');
      refetchVehicles();
    } catch { toast.error('Failed to delete vehicle'); }
  };

  // ── Filtered Data ──────────────────────────────────────────────────────
  const filteredVehicles = vehicles.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.make.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Vehicle Management</h1>
        <button
          onClick={handleOpenAddVehicle}
          className="bg-primary-600 text-white px-4 lg:px-6 py-2 rounded-lg hover:bg-primary-700 transition flex items-center justify-center text-sm lg:text-base"
        >
          <Plus className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />Add Vehicle
        </button>
      </div>

      <div className="flex gap-4 mb-4 lg:mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm lg:text-base"
          />
        </div>
      </div>

      {vehiclesLoading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  {['Vehicle', 'Reg No', 'Make', 'Type', 'Rate/Hr', 'Status', 'Km Travelled', 'Actions'].map((h) => (
                    <th key={h} className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <p className="font-medium text-gray-900 text-sm lg:text-base">{vehicle.name}</p>
                      <p className="text-xs text-gray-500">{vehicle.model}</p>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600 font-mono">
                      {vehicle.registrationNumber || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600">{vehicle.make}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600">{vehicle.vehicleType}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-semibold text-primary-600">₹{vehicle.pricePerHour}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      {vehicle.isAvailable
                        ? <span className="flex items-center text-green-600 text-xs lg:text-sm"><CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />Available</span>
                        : <span className="flex items-center text-red-500 text-xs lg:text-sm"><XCircle className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />Inactive</span>}
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600">{vehicle.kmTravelled.toLocaleString()} km</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="flex space-x-1 lg:space-x-2">
                        <button
                          onClick={() => handleOpenEditVehicle(vehicle)}
                          className="p-1.5 lg:p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Edit vehicle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { handleOpenEditVehicle(vehicle); setVehicleModalTab('images'); }}
                          className="p-1.5 lg:p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="Manage images"
                        >
                          <Image className="w-4 h-4" />
                        </button>
                        {vehicle.gpsDeviceId && (
                          <button
                            onClick={() => setTrackingVehicle(vehicle)}
                            className="p-1.5 lg:p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Track vehicle"
                          >
                            <MapPin className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="p-1.5 lg:p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete vehicle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredVehicles.length === 0 && (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No vehicles found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════ VEHICLE MODAL ════ */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              <button onClick={() => setShowVehicleModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs — Images only when editing */}
            {editingVehicle && (
              <div className="flex border-b border-gray-200 px-4 lg:px-6 bg-white sticky top-[57px] lg:top-[73px] z-10 overflow-x-auto">
                {(['details', 'images'] as VehicleModalTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setVehicleModalTab(tab)}
                    className={`flex items-center gap-2 px-3 lg:px-4 py-2.5 lg:py-3 text-xs lg:text-sm font-semibold capitalize border-b-2 transition mr-2 whitespace-nowrap ${vehicleModalTab === tab
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {tab === 'images'
                      ? <><Image className="w-4 h-4" />Images ({vehicleImages.length})</>
                      : <><Edit className="w-4 h-4" />Details</>}
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">

              {/* ── DETAILS TAB ── */}
              {vehicleModalTab === 'details' && (
                <>
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Vehicle Name" value={vehicleForm.name} onChange={(v) => setVehicleForm({ ...vehicleForm, name: v })} required placeholder="e.g. Honda Activa 6G" />
                      <FormField label="Registration No" value={vehicleForm.registrationNumber ?? ''} onChange={(v) => setVehicleForm({ ...vehicleForm, registrationNumber: v })} placeholder="e.g. MH01AB1234" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField label="Make / Brand" value={vehicleForm.make} onChange={(v) => setVehicleForm({ ...vehicleForm, make: v })} required placeholder="e.g. Honda" />
                      <FormField label="Model" value={vehicleForm.model} onChange={(v) => setVehicleForm({ ...vehicleForm, model: v })} required placeholder="e.g. Activa 6G" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <FormField label="Vehicle Type">
                        <select value={vehicleForm.vehicleType} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm">
                          <option value="Scooter">Scooter</option>
                          <option value="Bike">Bike</option>
                          <option value="Sports">Sports</option>
                        </select>
                      </FormField>
                      <FormField label="Fuel Type">
                        <select value={vehicleForm.fuelType} onChange={(e) => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm">
                          <option value="Petrol">Petrol</option>
                          <option value="Electric">Electric</option>
                        </select>
                      </FormField>
                      <FormField label="City">
                        <select value={vehicleForm.cityId} onChange={(e) => setVehicleForm({ ...vehicleForm, cityId: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm">
                          <option value={0}>Select city</option>
                          {cities.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </FormField>
                    </div>
                  </div>

                  {/* GPS Device */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">GPS Tracking</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="GPS Device ID"
                        value={vehicleForm.gpsDeviceId ?? ''}
                        onChange={(v) => setVehicleForm({ ...vehicleForm, gpsDeviceId: v })}
                        placeholder="e.g. MMI847368"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Enter the Mappls InTouch device ID. A 📍 Track button will appear on this vehicle once saved.
                    </p>
                  </div>

                  {/* Pricing */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pricing</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField label="Price/Hour (₹)" value={vehicleForm.pricePerHour} onChange={(v) => setVehicleForm({ ...vehicleForm, pricePerHour: v })} type="number" required />
                      <FormField label="Price/Day (₹)" value={vehicleForm.pricePerDay} onChange={(v) => setVehicleForm({ ...vehicleForm, pricePerDay: v })} type="number" />
                      <FormField label="Min Booking Hrs" value={vehicleForm.minBookingHours} onChange={(v) => setVehicleForm({ ...vehicleForm, minBookingHours: v })} type="number" />
                      <FormField label="KM Limit/Day" value={vehicleForm.kmLimit} onChange={(v) => setVehicleForm({ ...vehicleForm, kmLimit: v })} type="number" />
                      <FormField label="Excess KM Charge" value={vehicleForm.excessKmCharge} onChange={(v) => setVehicleForm({ ...vehicleForm, excessKmCharge: v })} type="number" />
                      <FormField label="Late Return/Hr" value={vehicleForm.lateReturnCharge} onChange={(v) => setVehicleForm({ ...vehicleForm, lateReturnCharge: v })} type="number" />
                    </div>
                  </div>

                  {/* Packages */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Packages (₹)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {([
                        ['4 Hours', 'fourHours'], ['1 Day', 'oneDay'], ['3 Days', 'threeDays'],
                        ['7 Days', 'sevenDays'], ['15 Days', 'fifteenDays'], ['Monthly', 'monthly'],
                      ] as [string, keyof NonNullable<typeof vehicleForm.packages>][]).map(([label, key]) => (
                        <FormField
                          key={key} label={label}
                          value={vehicleForm.packages?.[key] ?? 0}
                          onChange={(v) => setVehicleForm({ ...vehicleForm, packages: { ...vehicleForm.packages!, [key]: v } })}
                          type="number"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Specs */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Specifications</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField label="Mileage" value={vehicleForm.specs?.mileage} onChange={(v) => setVehicleForm({ ...vehicleForm, specs: { ...vehicleForm.specs!, mileage: v } })} placeholder="45 km/l" />
                      <FormField label="Engine" value={vehicleForm.specs?.engineCapacity} onChange={(v) => setVehicleForm({ ...vehicleForm, specs: { ...vehicleForm.specs!, engineCapacity: v } })} placeholder="110cc" />
                      <FormField label="Top Speed" value={vehicleForm.specs?.topSpeed} onChange={(v) => setVehicleForm({ ...vehicleForm, specs: { ...vehicleForm.specs!, topSpeed: v } })} placeholder="90 km/h" />
                      <FormField label="Weight" value={vehicleForm.specs?.weight} onChange={(v) => setVehicleForm({ ...vehicleForm, specs: { ...vehicleForm.specs!, weight: v } })} placeholder="107 kg" />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Settings</h3>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={vehicleForm.isAvailable} onChange={(e) => setVehicleForm({ ...vehicleForm, isAvailable: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
                        <span className="text-sm text-gray-700">Available for booking</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={vehicleForm.featured} onChange={(e) => setVehicleForm({ ...vehicleForm, featured: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
                        <span className="text-sm text-gray-700">Featured on homepage</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* ── IMAGES TAB ── */}
              {vehicleModalTab === 'images' && editingVehicle && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Vehicle Images</h3>
                      <p className="text-xs text-gray-400 mt-0.5">First uploaded image is set as primary automatically</p>
                    </div>
                    <label className={`flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 cursor-pointer transition ${isUploadingImage ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      {isUploadingImage
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</>
                        : <><Plus className="w-4 h-4" />Upload Image</>}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={isUploadingImage} onChange={(e) => handleUploadVehicleImage(e.target.files?.[0])} />
                    </label>
                  </div>

                  {imagesLoading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-500 mr-2" />
                      <span className="text-gray-500 text-sm">Loading images...</span>
                    </div>
                  )}

                  {!imagesLoading && vehicleImages.length === 0 && (
                    <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-xl">
                      <Image className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No images yet</p>
                      <p className="text-gray-400 text-sm mt-1">Upload images using the button above</p>
                    </div>
                  )}

                  {!imagesLoading && vehicleImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {vehicleImages.map((image) => (
                        <div key={image.id} className="relative group rounded-xl overflow-hidden border-2 border-gray-200 hover:border-primary-400 transition">
                          <img
                            src={image.imageUrl}
                            alt="Vehicle"
                            className="w-full h-36 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image'; }}
                          />
                          {image.isPrimary && (
                            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Star className="w-3 h-3 fill-white" /> Primary
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                            {!image.isPrimary && (
                              <button onClick={() => handleSetPrimaryImage(image)} className="flex items-center gap-1 px-2 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition">
                                <Star className="w-3 h-3" /> Set Primary
                              </button>
                            )}
                            <button onClick={() => handleDeleteVehicleImage(image)} className="flex items-center gap-1 px-2 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition">
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                          <div className="px-3 py-1.5 bg-white text-xs text-gray-500 flex justify-between">
                            <span>Order: {image.displayOrder}</span>
                            <span className="text-gray-400">#{image.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
              {vehicleModalTab === 'images' ? (
                <button onClick={() => setShowVehicleModal(false)} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                  Done
                </button>
              ) : (
                <>
                  <button onClick={() => setShowVehicleModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveVehicle}
                    disabled={creating || updating}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center disabled:opacity-50"
                  >
                    {(creating || updating)
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                      : <><Save className="w-4 h-4 mr-2" />{editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}</>}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ════ TRACKING MODAL ════ */}
      {trackingVehicle && (
        <TrackingModal
          vehicle={trackingVehicle}
          onClose={() => setTrackingVehicle(null)}
        />
      )}
    </div>
  );
};

export default VehiclesTab;