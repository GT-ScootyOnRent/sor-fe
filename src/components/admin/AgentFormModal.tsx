import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Save, Globe, User, Mail, Tag, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateAgentMutation,
  useUpdateAgentMutation,
  type Agent,
} from '../../store/api/agentApi';
import { useGetCitiesQuery } from '../../store/api/cityApi';

// The full form snapshot — also the shape persisted as a draft (localStorage).
export type AgentFormData = {
  name: string;
  email: string;
  phoneNumber: string;
  description: string;
  code: string;
  codeEditedManually: boolean;
  discountType: 'percentage' | 'flat';
  discountValue: string;
  maxDiscountAmount: string;
  minOrderAmount: string;
  validFrom: string; // yyyy-MM-dd
  validUntil: string; // yyyy-MM-dd
  commissionType: 'percentage' | 'flat';
  commissionValue: string;
  isActive: boolean;
  cityIds: number[];
  useAllCitiesMode: boolean;
};

type FormState = AgentFormData;

interface Props {
  agent: Agent | null; // null = create
  initialDraft?: AgentFormData | null; // prefill a New Agent form from a saved draft
  // Called when the modal closes. In create mode it passes the current form snapshot
  // so the parent can auto-save a draft; null in edit mode (edits aren't drafted).
  onClose: (snapshot: AgentFormData | null) => void;
  // Manual "Save as Draft" — persists the current snapshot without creating the agent.
  onSaveDraft: (snapshot: AgentFormData) => void;
  onSuccess: () => void;
}

// Builds "FIRSTWORD-VALUE" — same rule the backend uses, so the preview matches.
const buildCode = (name: string, discountValue: string): string => {
  const firstWord = (name || '').trim().split(' ').filter(Boolean)[0] || '';
  const cleaned = firstWord.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const value = (discountValue || '').trim();
  if (!cleaned || !value) return '';
  return `${cleaned}-${value}`;
};

const toDateInput = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const todayInput = () => new Date().toISOString().slice(0, 10);

export default function AgentFormModal({ agent, initialDraft, onClose, onSaveDraft, onSuccess }: Props) {
  const isEdit = !!agent;
  const { data: allCities = [], isLoading: citiesLoading } = useGetCitiesQuery({ page: 1, size: 100 });
  const [createAgent, { isLoading: creating }] = useCreateAgentMutation();
  const [updateAgent, { isLoading: updating }] = useUpdateAgentMutation();

  const [form, setForm] = useState<FormState>(() => {
    if (agent) {
      return {
        name: agent.name,
        email: agent.email ?? '',
        phoneNumber: agent.phoneNumber?.replace(/^\+91\s*/, '') ?? '',
        description: agent.description ?? '',
        code: agent.code,
        codeEditedManually: true,
        discountType: agent.discountType,
        discountValue: String(agent.discountValue ?? ''),
        maxDiscountAmount: agent.maxDiscountAmount != null ? String(agent.maxDiscountAmount) : '',
        minOrderAmount: String(agent.minOrderAmount ?? 0),
        validFrom: toDateInput(agent.validFrom) || todayInput(),
        validUntil: toDateInput(agent.validUntil),
        commissionType: agent.commissionType,
        commissionValue: String(agent.commissionValue ?? 0),
        isActive: agent.isActive,
        cityIds: agent.cityIds ?? [],
        useAllCitiesMode: (agent.cityIds ?? []).length === 0,
      };
    }
    // Create mode: prefill from a saved draft if one was opened.
    if (initialDraft) return initialDraft;
    return {
      name: '',
      email: '',
      phoneNumber: '',
      description: '',
      code: '',
      codeEditedManually: false,
      discountType: 'percentage',
      discountValue: '',
      maxDiscountAmount: '',
      minOrderAmount: '0',
      validFrom: todayInput(),
      validUntil: '',
      commissionType: 'percentage',
      commissionValue: '',
      isActive: true,
      cityIds: [],
      useAllCitiesMode: true,
    };
  });

  // Live auto-generate the code from name + discount value (unless edited by hand).
  const autoCode = useMemo(() => buildCode(form.name, form.discountValue), [form.name, form.discountValue]);

  // The Coupon Code field only appears once it can actually be generated: i.e. the
  // name has a first word and a valid discount value is entered. When editing, the
  // code already exists, so it's always shown.
  const canShowCode = isEdit || autoCode !== '';
  useEffect(() => {
    if (!form.codeEditedManually) {
      setForm((f) => ({ ...f, code: autoCode }));
    }
  }, [autoCode, form.codeEditedManually]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleCity = (cityId: number) => {
    setForm((f) => {
      if (f.cityIds.includes(cityId)) {
        const next = f.cityIds.filter((id) => id !== cityId);
        return { ...f, cityIds: next, useAllCitiesMode: next.length === 0 };
      }
      return { ...f, cityIds: [...f.cityIds, cityId], useAllCitiesMode: false };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.phoneNumber.trim()) return toast.error('Phone number is required');
    const discountValueNum = parseFloat(form.discountValue);
    if (!form.discountValue || Number.isNaN(discountValueNum) || discountValueNum <= 0)
      return toast.error('Discount value must be greater than 0');
    if (form.discountType === 'percentage' && discountValueNum > 100)
      return toast.error('Percentage discount cannot exceed 100%');
    if (!form.validFrom) return toast.error('Valid From is required');
    if (!form.code.trim()) return toast.error('Coupon code is required');

    // "All Cities" (global) sends an empty array; otherwise at least one city must be picked.
    const finalCityIds = form.useAllCitiesMode ? [] : form.cityIds;
    if (!form.useAllCitiesMode && finalCityIds.length === 0)
      return toast.error('Please select at least one target city (or choose All Cities)');

    const commissionValueNum = parseFloat(form.commissionValue) || 0;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phoneNumber: `+91${form.phoneNumber.trim()}`,
      description: form.description.trim() || null,
      discountType: form.discountType,
      discountValue: discountValueNum,
      maxDiscountAmount:
        form.discountType === 'percentage' && form.maxDiscountAmount
          ? parseFloat(form.maxDiscountAmount)
          : null,
      minOrderAmount: parseFloat(form.minOrderAmount) || 0,
      validFrom: new Date(form.validFrom).toISOString(),
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
      commissionType: form.commissionType,
      commissionValue: commissionValueNum,
      isActive: form.isActive,
      cityIds: finalCityIds,
    };

    try {
      if (isEdit && agent) {
        await updateAgent({ id: agent.id, body: { ...payload, code: form.code.trim().toUpperCase() } }).unwrap();
        toast.success('Agent updated');
      } else {
        await createAgent({ ...payload, code: form.code.trim().toUpperCase() }).unwrap();
        toast.success('Agent created');
      }
      onSuccess();
    } catch (err: any) {
      const data = err?.data;
      let msg = 'Failed to save agent';
      if (data?.error) msg = data.error;
      else if (data?.message) msg = data.message;
      else if (data?.errors) msg = Object.values(data.errors).flat().join('. ');
      toast.error(msg);
    }
  };

  // On close, hand the current form snapshot back so the parent can auto-save a draft.
  // Edits are never drafted, so pass null in edit mode.
  const handleClose = () => onClose(isEdit ? null : form);

  const saving = creating || updating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">{isEdit ? 'Edit Agent' : 'New Agent'}</h2>
          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto overflow-x-hidden flex-1">
          {/* ── Basic Information ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Vijay Tour & Travels"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 [&>div]:min-w-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-xs text-gray-400">(optional)</span></label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="agent@domain.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-600 text-sm">+91</span>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => set('phoneNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  maxLength={10}
                  className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-r-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              placeholder="Notes about this agent..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition resize-none"
            />
          </div>

          {/* ── Coupon Code (appears once name + discount value make a code) ── */}
          {canShowCode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Coupon Code *</label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value.toUpperCase(), codeEditedManually: true }))
                  }
                  placeholder="Auto-generated from name + discount"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated as <span className="font-mono">FIRSTWORD-VALUE</span> (e.g. VIJAY-20). You can edit it; it must be unique.
              </p>
            </div>
          )}

          {/* ── Discount Configuration ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 [&>div]:min-w-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Type *</label>
              <select
                value={form.discountType}
                onChange={(e) => set('discountType', e.target.value as 'percentage' | 'flat')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Value *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.discountValue}
                onChange={(e) => set('discountValue', e.target.value)}
                placeholder={form.discountType === 'percentage' ? '10' : '100'}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 [&>div]:min-w-0">
            {/* Max discount only applies to percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Max Discount (₹) <span className="text-xs text-gray-400">optional</span>
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.maxDiscountAmount}
                onChange={(e) => set('maxDiscountAmount', e.target.value)}
                disabled={form.discountType !== 'percentage'}
                placeholder="e.g. 200"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Order Amount (₹)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.minOrderAmount}
                onChange={(e) => set('minOrderAmount', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* ── Validity ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 [&>div]:min-w-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Valid From *</label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => set('validFrom', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Valid Until <span className="text-xs text-gray-400">optional</span></label>
              <input
                type="date"
                value={form.validUntil}
                min={form.validFrom || undefined}
                onChange={(e) => set('validUntil', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* ── Commission Configuration ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 [&>div]:min-w-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Commission Type</label>
              <select
                value={form.commissionType}
                onChange={(e) => set('commissionType', e.target.value as 'percentage' | 'flat')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Commission Value</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.commissionValue}
                onChange={(e) => set('commissionValue', e.target.value)}
                placeholder={form.commissionType === 'percentage' ? '5' : '50'}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* ── Target Cities (same UX as Announcements) ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Cities *</label>
            <div className="border border-gray-300 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
              {citiesLoading ? (
                <div className="flex items-center gap-2 text-gray-500 text-sm p-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading cities...
                </div>
              ) : (
                <>
                  <label className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer border-b border-gray-100 pb-2 mb-1">
                    <input
                      type="checkbox"
                      checked={form.useAllCitiesMode}
                      onChange={(e) => {
                        if (e.target.checked) setForm((f) => ({ ...f, useAllCitiesMode: true, cityIds: [] }));
                      }}
                      className="accent-purple-600 w-4 h-4"
                    />
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 font-medium">All Cities (Global)</span>
                  </label>
                  {allCities.map((city) => (
                    <label key={city.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!form.useAllCitiesMode && form.cityIds.includes(city.id)}
                        onChange={() => toggleCity(city.id)}
                        className="accent-purple-600 w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">{city.name}</span>
                    </label>
                  ))}
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select "All Cities" for a global coupon, or pick specific cities.
            </p>
          </div>

          {/* ── Status ── */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('isActive', !form.isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-gray-700">{form.isActive ? 'Active' : 'Inactive'}</span>
          </label>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
          {/* Left: manual Save as Draft — only for new agents (not edits) */}
          <div>
            {!isEdit && (
              <button
                type="button"
                onClick={() => onSaveDraft(form)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 border border-amber-300 rounded-xl hover:bg-amber-50 transition"
              >
                <FileText className="w-4 h-4" />
                Save as Draft
              </button>
            )}
          </div>

          {/* Right: cancel / submit */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Save Changes' : 'Create Agent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
