import React, { useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, AlertCircle, Search, MapPin, Clock } from 'lucide-react';
import {
    useGetCitiesQuery,
    useCreateCityMutation,
    useUpdateCityMutation,
    useDeleteCityMutation,
    useGetStatesQuery,
    type CityDto,
} from '../../store/api/cityApi';
import { toast } from 'sonner';

interface CityForm {
    name: string;
    stateId: number;
    isActive: boolean;
    isComingSoon: boolean;
}

const initialForm: CityForm = {
    name: '',
    stateId: 1,
    isActive: true,
    isComingSoon: false,
};

const CitiesManagementTab: React.FC = () => {
    const { data: cities, isLoading, isError, refetch } = useGetCitiesQuery({ page: 1, size: 100 });
    const { data: states } = useGetStatesQuery({ page: 1, size: 100 });
    const [createCity, { isLoading: isCreating }] = useCreateCityMutation();
    const [updateCity, { isLoading: isUpdating }] = useUpdateCityMutation();
    const [deleteCity, { isLoading: isDeleting }] = useDeleteCityMutation();

    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCity, setEditingCity] = useState<CityDto | null>(null);
    const [form, setForm] = useState<CityForm>(initialForm);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const getStateName = (id: number) =>
        states?.find((s) => s.id === id)?.name ?? `State ${id}`;

    const filtered = (cities ?? []).filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenAdd = () => {
        setEditingCity(null);
        setForm(initialForm);
        setShowModal(true);
    };

    const handleOpenEdit = (city: CityDto) => {
        setEditingCity(city);
        setForm({
            name: city.name,
            stateId: city.stateId,
            isActive: city.isActive,
            isComingSoon: city.isComingSoon,
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast.error('City name is required');
            return;
        }

        try {
            if (editingCity) {
                await updateCity({
                    id: editingCity.id,
                    city: { ...editingCity, ...form },
                }).unwrap();
                toast.success('City updated successfully');
            } else {
                await createCity(form).unwrap();
                toast.success('City created successfully');
            }
            setShowModal(false);
            setForm(initialForm);
            setEditingCity(null);
        } catch {
            toast.error(editingCity ? 'Failed to update city' : 'Failed to create city');
        }
    };

    const handleToggleActive = async (city: CityDto) => {
        try {
            await updateCity({
                id: city.id,
                city: { ...city, isActive: !city.isActive },
            }).unwrap();
            toast.success(`City ${city.isActive ? 'deactivated' : 'activated'} successfully`);
        } catch {
            toast.error('Failed to update city status');
        }
    };

    const handleToggleComingSoon = async (city: CityDto) => {
        try {
            await updateCity({
                id: city.id,
                city: { ...city, isComingSoon: !city.isComingSoon },
            }).unwrap();
            toast.success(`Coming soon ${city.isComingSoon ? 'disabled' : 'enabled'} for ${city.name}`);
        } catch {
            toast.error('Failed to update city');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteCity(id).unwrap();
            toast.success('City deleted successfully');
            setConfirmDeleteId(null);
        } catch {
            toast.error('Failed to delete city');
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">City Management</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {cities?.length ?? 0} {cities?.length === 1 ? 'city' : 'cities'} total
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                    <Plus className="w-4 h-4" />
                    Add City
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by city name..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                />
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                    <span className="ml-2 text-sm text-gray-500">Loading cities...</span>
                </div>
            )}

            {/* Error */}
            {isError && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">Failed to load cities.</p>
                    <button onClick={refetch} className="ml-auto text-sm text-red-600 underline">Retry</button>
                </div>
            )}

            {/* Table */}
            {!isLoading && !isError && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                                    <th className="px-4 py-3 text-left font-semibold">City</th>
                                    <th className="px-4 py-3 text-left font-semibold">State</th>
                                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold">Coming Soon</th>
                                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium">
                                                {search ? 'No cities matching your search' : 'No cities yet'}
                                            </p>
                                            {!search && (
                                                <p className="text-gray-400 text-sm mt-1">
                                                    Click "Add City" to create your first city
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((city) => (
                                        <tr key={city.id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                                    <p className="font-medium text-gray-800">{city.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{getStateName(city.stateId)}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleToggleActive(city)}
                                                    disabled={isUpdating}
                                                    className="flex items-center gap-1.5 text-xs font-medium transition"
                                                    aria-label={city.isActive ? 'Deactivate city' : 'Activate city'}
                                                >
                                                    {city.isActive ? (
                                                        <>
                                                            <ToggleRight className="w-5 h-5 text-green-500" />
                                                            <span className="text-green-600">Active</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                                                            <span className="text-gray-400">Inactive</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleToggleComingSoon(city)}
                                                    disabled={isUpdating}
                                                    className="flex items-center gap-1.5 text-xs font-medium transition"
                                                    aria-label={city.isComingSoon ? 'Disable coming soon' : 'Enable coming soon'}
                                                >
                                                    {city.isComingSoon ? (
                                                        <>
                                                            <Clock className="w-4 h-4 text-amber-500" />
                                                            <span className="text-amber-600">Coming Soon</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="w-4 h-4 text-gray-300" />
                                                            <span className="text-gray-400">No</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenEdit(city)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        aria-label="Edit city"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    {confirmDeleteId === city.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleDelete(city.id)}
                                                                disabled={isDeleting}
                                                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition"
                                                            >
                                                                {isDeleting ? '...' : 'Confirm'}
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDeleteId(null)}
                                                                className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300 transition"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirmDeleteId(city.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            aria-label="Delete city"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800">
                                {editingCity ? 'Edit City' : 'Add City'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            {/* City Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    City Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Surat"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                                />
                            </div>

                            {/* State */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    State <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.stateId}
                                    onChange={(e) => setForm({ ...form, stateId: Number(e.target.value) })}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition bg-white"
                                >
                                    {states?.map((state) => (
                                        <option key={state.id} value={state.id}>
                                            {state.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Toggles */}
                            <div className="flex flex-col gap-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">Active</span>
                                        <p className="text-xs text-gray-400">Show this city in the city selector</p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isComingSoon}
                                        onChange={(e) => setForm({ ...form, isComingSoon: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">Coming Soon</span>
                                        <p className="text-xs text-gray-400">Show "Coming Soon" badge (city not selectable)</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 px-6 pb-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isCreating || isUpdating}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                            >
                                {isCreating || isUpdating ? 'Saving...' : editingCity ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CitiesManagementTab;
