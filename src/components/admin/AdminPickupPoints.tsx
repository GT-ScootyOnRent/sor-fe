import React, { useState } from 'react';
import { MapPin, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetAllPickupLocationsQuery,
  useCreatePickupLocationMutation,
  useUpdatePickupLocationMutation,
  useDeletePickupLocationMutation,
  type PickupLocationDto,
} from '../../store/api/pickupLocationApi';
import { handleNumberInputChange } from '../../utils/numberInput';
import { useGetCitiesQuery } from '../../store/api/cityApi';

const EMPTY_FORM: Partial<PickupLocationDto> = {
  name: '',
  cityId: 0,
  address: '',
  latitude: undefined,
  longitude: undefined,
  isActive: true,
  displayOrder: 0,
};

const AdminPickupPoints: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<PickupLocationDto | null>(null);
  const [form, setForm] = useState<Partial<PickupLocationDto>>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: locations = [], isLoading } = useGetAllPickupLocationsQuery({});
  const { data: cities = [] } = useGetCitiesQuery({ page: 1, size: 100 });
  const [createLocation, { isLoading: isCreating }] = useCreatePickupLocationMutation();
  const [updateLocation, { isLoading: isUpdating }] = useUpdatePickupLocationMutation();
  const [deleteLocation, { isLoading: isDeleting }] = useDeletePickupLocationMutation();

  const openCreate = () => {
    setEditingLocation(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (loc: PickupLocationDto) => {
    setEditingLocation(loc);
    setForm({ ...loc });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLocation(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.cityId) {
      toast.error('Name and city are required.');
      return;
    }
    try {
      if (editingLocation) {
        await updateLocation({ id: editingLocation.id, body: form }).unwrap();
        toast.success('Pickup location updated.');
      } else {
        await createLocation(form).unwrap();
        toast.success('Pickup location created.');
      }
      closeModal();
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to save pickup location.');
    }
  };

  const handleToggleActive = async (loc: PickupLocationDto) => {
    try {
      await updateLocation({ id: loc.id, body: { ...loc, isActive: !loc.isActive } }).unwrap();
      toast.success(`Location ${loc.isActive ? 'deactivated' : 'activated'}.`);
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteLocation(id).unwrap();
      toast.success('Pickup location deleted.');
      setDeleteConfirmId(null);
    } catch {
      toast.error('Failed to delete location.');
    }
  };

  const getCityName = (id: number) =>
    cities.find((d: any) => d.id === id)?.name ?? `City ${id}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pickup Points</h1>
          <p className="text-sm text-gray-500 mt-1">{locations.length} locations configured</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : locations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <MapPin className="w-12 h-12 mb-3 text-gray-400" />
          <p className="text-lg font-medium">No pickup locations yet</p>
          <p className="text-sm">Add your first location to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-xs">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">City</th>
                <th className="px-6 py-3 text-left">Address</th>
                <th className="px-6 py-3 text-left">Order</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    {loc.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{getCityName(loc.cityId)}</td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{loc.address || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{loc.displayOrder}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggleActive(loc)} className="flex items-center gap-1">
                      {loc.isActive ? (
                        <><ToggleRight className="w-5 h-5 text-green-500" /><span className="text-green-600 text-xs font-medium">Active</span></>
                      ) : (
                        <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-500 text-xs font-medium">Inactive</span></>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(loc)}
                        className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(loc.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingLocation ? 'Edit Pickup Location' : 'Add Pickup Location'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <select
                  value={form.cityId || 0}
                  onChange={(e) => setForm({ ...form, cityId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                >
                  <option value={0}>Select city</option>
                  {cities.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude ?? ''}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude ?? ''}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={form.displayOrder ?? 0}
                  onChange={(e) => {
                    const next = handleNumberInputChange(e);
                    if (next !== null) setForm({ ...form, displayOrder: next });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive ?? true}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 accent-primary-600"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 flex items-center justify-center"
                >
                  {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingLocation ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Location?</h3>
            <p className="text-gray-600 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPickupPoints;