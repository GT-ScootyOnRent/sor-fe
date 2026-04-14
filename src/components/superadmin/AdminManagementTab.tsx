import React, { useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, AlertCircle, Search } from 'lucide-react';
import {
  useGetAdminsQuery,
  useDeleteAdminMutation,
  useUpdateAdminMutation,
  type AdminDto,
} from '../../store/api/adminApi';
import { useGetCitiesQuery } from '../../store/api/cityApi';
import { toast } from 'sonner';
import AddAdminModal from './AddAdminModal';
import EditAdminModal from './EditAdminModal';

const AdminManagementTab: React.FC = () => {
  const { data: admins, isLoading, isError, refetch } = useGetAdminsQuery({});
  const { data: cities } = useGetCitiesQuery({});
  const [deleteAdmin, { isLoading: isDeleting }] = useDeleteAdminMutation();
  const [updateAdmin, { isLoading: isUpdating }] = useUpdateAdminMutation();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminDto | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const getCityName = (id: number) =>
    cities?.find((d: any) => d.id === id)?.name ?? `City ${id}`;

  const getCityNames = (admin: AdminDto) => {
    const ids = admin.cityIds ?? (admin.cityId ? [admin.cityId] : []);
    if (ids.length === 0) return '—';
    return ids.map(id => getCityName(id)).join(', ');
  };

  const filtered = (admins ?? []).filter((a) =>
    `${a.username} ${a.email} ${a.number}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleActive = async (admin: AdminDto) => {
    try {
      await updateAdmin({
        id: admin.id,
        admin: { ...admin, isActive: !admin.isActive },
      }).unwrap();
      toast.success(`Admin ${admin.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch {
      toast.error('Failed to update admin status');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAdmin(id).unwrap();
      toast.success('Admin deleted successfully');
      setConfirmDeleteId(null);
    } catch {
      toast.error('Failed to delete admin');
    }
  };

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Admin Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {admins?.length ?? 0} admin{admins?.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or mobile..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          <span className="ml-2 text-sm text-gray-500">Loading admins...</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">Failed to load admins.</p>
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
                  <th className="px-4 py-3 text-left font-semibold">Admin</th>
                  <th className="px-4 py-3 text-left font-semibold">Mobile</th>
                  <th className="px-4 py-3 text-left font-semibold">Cities</th>
                  <th className="px-4 py-3 text-left font-semibold">Role</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No admins found{search ? ' matching your search' : ''}
                    </td>
                  </tr>
                ) : (
                  filtered.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{admin.username}</p>
                        <p className="text-xs text-gray-400">{admin.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{admin.number || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={getCityNames(admin)}>{getCityNames(admin)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${admin.role === 2
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}>
                          {admin.role === 2 ? 'SuperAdmin' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(admin)}
                          disabled={isUpdating}
                          className="flex items-center gap-1.5 text-xs font-medium transition"
                          aria-label={admin.isActive ? 'Deactivate admin' : 'Activate admin'}
                        >
                          {admin.isActive ? (
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingAdmin(admin)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            aria-label="Edit admin"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {confirmDeleteId === admin.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(admin.id)}
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
                              onClick={() => setConfirmDeleteId(admin.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              aria-label="Delete admin"
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

      {/* Modals */}
      {showAddModal && (
        <AddAdminModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); refetch(); }}
        />
      )}
      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSuccess={() => { setEditingAdmin(null); refetch(); }}
        />
      )}
    </div>
  );
};

export default AdminManagementTab;