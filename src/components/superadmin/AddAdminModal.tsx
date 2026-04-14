import React, { useState } from 'react';
import { X, Loader2, AlertCircle, User, Mail } from 'lucide-react';
import { useCreateAdminMutation } from '../../store/api/adminApi';
import { useGetCitiesQuery } from '../../store/api/cityApi';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const AddAdminModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const { data: cities, isLoading: loadingCities } = useGetCitiesQuery({});
  const [createAdmin, { isLoading }] = useCreateAdminMutation();

  const [form, setForm] = useState({
    username: '',
    email: '',
    number: '',
    cityIds: [] as number[],
    role: 1,
    isActive: true,
    hasChangedPassword: false,
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCityToggle = (cityId: number) => {
    setForm((prev) => ({
      ...prev,
      cityIds: prev.cityIds.includes(cityId)
        ? prev.cityIds.filter((id) => id !== cityId)
        : [...prev.cityIds, cityId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.username.trim()) { setError('Name is required'); return; }
    if (!form.email.trim()) { setError('Email is required'); return; }
    if (!form.number.trim()) { setError('Mobile number is required'); return; }

    // Validate phone number format (exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(form.number.trim())) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }

    if (form.cityIds.length === 0) { setError('Please select at least one city'); return; }

    try {
      await createAdmin({
        username: form.username.trim(),
        email: form.email.trim(),
        number: `+91${form.number.trim()}`,
        cityIds: form.cityIds,
        role: form.role,
        isActive: form.isActive,
        hasChangedPassword: false,
      }).unwrap();

      toast.success('Admin created! An email invite with temporary password has been sent.');
      onSuccess();
    } catch (err: any) {
      // Handle different error formats from API
      const data = err?.data;
      let errorMessage = 'Failed to create admin. Please try again.';

      if (data?.message) {
        errorMessage = data.message;
      } else if (data?.error) {
        errorMessage = data.error;
      } else if (data?.errors) {
        // FluentValidation returns errors as { errors: { "FieldName": ["error message"] } }
        const errorMessages = Object.values(data.errors).flat();
        errorMessage = errorMessages.join('. ');
      } else if (data?.title && data?.status === 400) {
        // ASP.NET validation problem details format
        errorMessage = data.title;
      }

      setError(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Add New Admin</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="Admin full name"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="admin@domain.com"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              A temporary password will be sent to this email automatically.
            </p>
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-600 text-sm">
                +91
              </span>
              <input
                type="tel"
                value={form.number}
                onChange={(e) => handleChange('number', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                maxLength={10}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-r-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                required
              />
            </div>
          </div>

          {/* City Multi-Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Assigned Cities <span className="text-xs text-gray-400">(select one or more)</span>
            </label>
            {loadingCities ? (
              <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading cities...
              </div>
            ) : (
              <div className="border border-gray-300 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-gray-100">
                {(cities ?? []).map((city: any) => (
                  <label
                    key={city.id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition ${form.cityIds.includes(city.id) ? 'bg-purple-50' : ''
                      }`}
                  >
                    <input
                      type="checkbox"
                      value={city.id}
                      checked={form.cityIds.includes(city.id)}
                      onChange={() => handleCityToggle(city.id)}
                      className="accent-purple-600 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{city.name}</span>
                  </label>
                ))}
              </div>
            )}
            {form.cityIds.length > 0 && (
              <p className="text-xs text-purple-600 mt-1">
                {form.cityIds.length} {form.cityIds.length === 1 ? 'city' : 'cities'} selected
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => handleChange('role', Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition bg-white"
            >
              <option value={1}>Admin</option>
              <option value={2}>SuperAdmin</option>
            </select>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => handleChange('isActive', !form.isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'
                }`} />
            </div>
            <span className="text-sm text-gray-700">
              {form.isActive ? 'Active — admin can log in immediately' : 'Inactive — admin cannot log in'}
            </span>
          </label>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Creating...</>
            ) : (
              'Create Admin & Send Invite'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAdminModal;