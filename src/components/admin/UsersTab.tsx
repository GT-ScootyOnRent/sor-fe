import React, { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  useGetUsersQuery,
  useDeleteUserMutation,
} from '../../store/api/userApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const UsersTab: React.FC = () => {
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // ── API Calls ──────────────────────────────────────────────────────────
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useGetUsersQuery({ page: 1, size: 100 });
  const [deleteUser] = useDeleteUserMutation();

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id).unwrap();
      toast.success('User deleted');
      refetchUsers();
    } catch { toast.error('Failed to delete user'); }
  };

  // ── Filtered Data ──────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) =>
    u.userNumber.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">User Management</h1>
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by phone number..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>
      {usersLoading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['User ID', 'Phone Number', 'City ID', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">#{user.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 text-primary-600 font-semibold text-sm">
                        {user.userNumber.slice(-2)}
                      </div>
                      {user.userNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.cityId ?? 'N/A'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersTab;