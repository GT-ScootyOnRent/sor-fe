import React, { useState } from 'react';
import {
    UserCog,
    Plus,
    Pencil,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Loader2,
    X,
    Phone,
    Mail,
    Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppSelector } from '../../store/hooks';
import {
    useGetStaffQuery,
    useCreateStaffMutation,
    useUpdateStaffMutation,
    useDeleteStaffMutation,
    type StaffDto,
    type CreateStaffDto,
    type UpdateStaffDto,
} from '../../store/api/adminApi';
import { useGetCitiesQuery } from '../../store/api/cityApi';

interface FormState {
    username: string;
    email: string;
    number: string;
    cityId: number | '';
    canOfflineBook: boolean;
    isActive: boolean;
}

const EMPTY_FORM: FormState = {
    username: '',
    email: '',
    number: '',
    cityId: '',
    canOfflineBook: false,
    isActive: true,
};

const StaffManagementPage: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffDto | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Get current user role
    const { user } = useAppSelector((state) => state.auth);
    const isSuperAdmin = user?.userType === 'superadmin';

    // API calls
    const { data: staff = [], isLoading } = useGetStaffQuery({});
    const { data: cities = [] } = useGetCitiesQuery({});
    const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
    const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
    const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();

    const openCreate = () => {
        setEditingStaff(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEdit = (s: StaffDto) => {
        setEditingStaff(s);
        setForm({
            username: s.username,
            email: s.email,
            number: s.number?.replace(/^\+91\s*/, '') || '',
            cityId: s.cityId,
            canOfflineBook: s.canOfflineBook,
            isActive: s.isActive,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStaff(null);
        setForm(EMPTY_FORM);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.username.trim() || !form.email.trim() || !form.number.trim()) {
            toast.error('Username, email, and phone number are required.');
            return;
        }
        if (!form.cityId) {
            toast.error('Please select a city.');
            return;
        }

        try {
            if (editingStaff) {
                const payload: UpdateStaffDto = {
                    username: form.username.trim(),
                    email: form.email.trim(),
                    number: `+91${form.number.trim()}`,
                    cityId: form.cityId as number,
                    isActive: form.isActive,
                };
                if (isSuperAdmin) {
                    payload.canOfflineBook = form.canOfflineBook;
                }
                await updateStaff({ id: editingStaff.id, staff: payload }).unwrap();
                toast.success('Staff member updated.');
            } else {
                const payload: CreateStaffDto = {
                    username: form.username.trim(),
                    email: form.email.trim(),
                    number: `+91${form.number.trim()}`,
                    cityId: form.cityId as number,
                };
                if (isSuperAdmin) {
                    payload.canOfflineBook = form.canOfflineBook;
                }
                await createStaff(payload).unwrap();
                toast.success('Staff member created. Credentials sent via email.');
            }
            closeModal();
        } catch (err: any) {
            toast.error(err?.data?.error || err?.data?.message || 'Failed to save staff member.');
        }
    };

    const handleToggleActive = async (s: StaffDto) => {
        try {
            await updateStaff({ id: s.id, staff: { isActive: !s.isActive } }).unwrap();
            toast.success(`Staff member ${s.isActive ? 'deactivated' : 'activated'}.`);
        } catch {
            toast.error('Failed to update status.');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteStaff(id).unwrap();
            toast.success('Staff member deleted.');
            setDeleteConfirmId(null);
        } catch {
            toast.error('Failed to delete staff member.');
        }
    };

    const getCityName = (cityId: number) => {
        const city = cities.find((d) => d.id === cityId);
        return city?.name || `City #${cityId}`;
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    // Filter staff by search query
    const filteredStaff = staff.filter(
        (s) =>
            s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.number.includes(searchQuery)
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-sm text-gray-500 mt-1">{staff.length} staff members</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition font-medium"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
            ) : staff.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <UserCog className="w-12 h-12 mb-3 text-gray-400" />
                    <p className="text-lg font-medium">No staff members yet</p>
                    <p className="text-sm">Add your first staff member to get started.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <th className="px-5 py-3 text-left">Staff</th>
                                <th className="px-5 py-3 text-left">Contact</th>
                                <th className="px-5 py-3 text-left">City</th>
                                <th className="px-5 py-3 text-left">Offline Booking</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-left">Joined</th>
                                <th className="px-5 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStaff.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50 transition">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            {s.profilePicUrl ? (
                                                <img
                                                    src={s.profilePicUrl}
                                                    alt={s.username}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                                                    {s.username.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900">{s.username}</p>
                                                <p className="text-xs text-gray-500">ID: #{s.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Mail className="w-3.5 h-3.5" />
                                                <span className="text-xs">{s.email}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Phone className="w-3.5 h-3.5" />
                                                <span className="text-xs">{s.number}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                            {s.cityName || getCityName(s.cityId)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        {s.canOfflineBook ? (
                                            <span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                                Enabled
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                                Disabled
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => handleToggleActive(s)}
                                            className="flex items-center gap-1"
                                        >
                                            {s.isActive ? (
                                                <>
                                                    <ToggleRight className="w-5 h-5 text-green-500" />
                                                    <span className="text-green-600 text-xs font-medium">Active</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                                                    <span className="text-gray-500 text-xs font-medium">Inactive</span>
                                                </>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-5 py-4 text-gray-600 text-xs">
                                        {formatDate(s.createdAt)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEdit(s)}
                                                className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(s.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStaff.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No staff members match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    placeholder="staff@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number *
                                </label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 text-sm">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        value={form.number}
                                        onChange={(e) => setForm({ ...form, number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        placeholder="9876543210"
                                        maxLength={10}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    City *
                                </label>
                                <select
                                    value={form.cityId}
                                    onChange={(e) => setForm({ ...form, cityId: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    required
                                >
                                    <option value="">Select City</option>
                                    {cities.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Offline Booking - SuperAdmin only */}
                            {isSuperAdmin && (
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="canOfflineBook"
                                        checked={form.canOfflineBook}
                                        onChange={(e) => setForm({ ...form, canOfflineBook: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="canOfflineBook" className="text-sm text-gray-700">
                                        Allow offline booking
                                        <span className="block text-xs text-gray-500">
                                            Staff can create bookings without online payment
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* Active status - only for edit */}
                            {editingStaff && (
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="isActive" className="text-sm text-gray-700">
                                        Active
                                        <span className="block text-xs text-gray-500">
                                            Inactive staff cannot log in
                                        </span>
                                    </label>
                                </div>
                            )}
                        </form>

                        {/* Footer */}
                        <div className="flex gap-3 p-6 border-t border-gray-100 flex-shrink-0 bg-white">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isCreating || isUpdating}
                                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {(isCreating || isUpdating) && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                {editingStaff ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Staff Member</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this staff member? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmId)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center justify-center"
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

export default StaffManagementPage;
