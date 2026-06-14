import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Search,
  Users,
  Globe,
  Wallet,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetAgentsQuery,
  useDeleteAgentMutation,
  type Agent,
} from '../../store/api/agentApi';
import { useGetAdminProfileQuery } from '../../store/api/adminApi';
import AgentFormModal, { type AgentFormData } from '../../components/admin/AgentFormModal';
import CommissionSettlementModal from '../../components/admin/CommissionSettlementModal';

const inr = (n: number) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatValidity = (a: Agent): string => {
  const from = new Date(a.validFrom).toLocaleDateString('en-IN');
  const until = a.validUntil ? new Date(a.validUntil).toLocaleDateString('en-IN') : 'No expiry';
  return `${from} → ${until}`;
};

// ── Drafts (localStorage, same pattern as Vehicle drafts) ──────────────────────
const AGENT_DRAFTS_KEY = 'agent_drafts';

interface AgentDraft {
  id: string;
  label: string;
  data: AgentFormData;
  savedAt: string;
}

// A new-agent form is considered "worth drafting" if it has any meaningful entry.
const draftHasData = (d: AgentFormData) =>
  !!(d.name.trim() || d.phoneNumber.trim() || d.email.trim() || d.description.trim() || d.discountValue.trim());

export default function AgentManagementPage() {
  const { data: agents = [], isLoading, error } = useGetAgentsQuery();
  const { data: profile } = useGetAdminProfileQuery();
  const [deleteAgent, { isLoading: deleting }] = useDeleteAgentMutation();

  const isSuperAdmin = profile?.role === 2;

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [settlementAgent, setSettlementAgent] = useState<Agent | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Draft state
  const [drafts, setDrafts] = useState<AgentDraft[]>([]);
  const [showDraftDropdown, setShowDraftDropdown] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [initialDraft, setInitialDraft] = useState<AgentFormData | null>(null);
  const [originalDraftData, setOriginalDraftData] = useState<string | null>(null);

  // Load drafts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(AGENT_DRAFTS_KEY);
    if (stored) {
      try {
        setDrafts(JSON.parse(stored));
      } catch {
        setDrafts([]);
      }
    }
  }, []);

  const persistDrafts = (updated: AgentDraft[]) => {
    setDrafts(updated);
    localStorage.setItem(AGENT_DRAFTS_KEY, JSON.stringify(updated));
  };

  // Save (or update) the current new-agent form as a draft.
  const saveDraft = (data: AgentFormData) => {
    const label = data.name.trim() || data.code.trim() || 'Untitled';
    const now = new Date().toISOString();
    if (currentDraftId) {
      persistDrafts(drafts.map((d) => (d.id === currentDraftId ? { ...d, label, data, savedAt: now } : d)));
    } else {
      const newDraft: AgentDraft = { id: Date.now().toString(), label, data, savedAt: now };
      persistDrafts([newDraft, ...drafts]);
    }
  };

  const deleteDraft = (draftId: string) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;
    persistDrafts(drafts.filter((d) => d.id !== draftId));
    toast.success('Draft deleted');
  };

  const deleteAllDrafts = () => {
    if (!window.confirm('Are you sure you want to delete all drafts?')) return;
    setDrafts([]);
    localStorage.removeItem(AGENT_DRAFTS_KEY);
    setShowDraftDropdown(false);
    toast.success('All drafts deleted');
  };

  const openCreate = (draft?: AgentDraft) => {
    setEditingAgent(null);
    if (draft) {
      setInitialDraft(draft.data);
      setCurrentDraftId(draft.id);
      setOriginalDraftData(JSON.stringify(draft.data));
    } else {
      setInitialDraft(null);
      setCurrentDraftId(null);
      setOriginalDraftData(null);
    }
    setShowDraftDropdown(false);
    setShowForm(true);
  };

  const openEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setInitialDraft(null);
    setCurrentDraftId(null);
    setOriginalDraftData(null);
    setShowForm(true);
  };

  // Closing the form: auto-save a draft if a new agent has unsaved data that changed.
  const handleFormClose = (snapshot: AgentFormData | null) => {
    if (!editingAgent && snapshot && draftHasData(snapshot)) {
      const current = JSON.stringify(snapshot);
      if (!originalDraftData || current !== originalDraftData) {
        saveDraft(snapshot);
        toast.success(currentDraftId ? 'Draft updated' : 'Draft auto-saved');
      }
    }
    setShowForm(false);
    setEditingAgent(null);
    setInitialDraft(null);
    setCurrentDraftId(null);
    setOriginalDraftData(null);
  };

  // Manual "Save as Draft" from inside the modal: persist and close (no re-auto-save).
  const handleSaveDraftManual = (snapshot: AgentFormData) => {
    if (!draftHasData(snapshot)) {
      toast.error('Add some details before saving a draft');
      return;
    }
    saveDraft(snapshot);
    toast.success(currentDraftId ? 'Draft updated' : 'Saved as draft');
    setShowForm(false);
    setEditingAgent(null);
    setInitialDraft(null);
    setCurrentDraftId(null);
    setOriginalDraftData(null);
  };

  // Successful create/update: drop the originating draft (if any) and close.
  const handleFormSuccess = () => {
    if (currentDraftId) {
      persistDrafts(drafts.filter((d) => d.id !== currentDraftId));
    }
    setShowForm(false);
    setEditingAgent(null);
    setInitialDraft(null);
    setCurrentDraftId(null);
    setOriginalDraftData(null);
  };

  // Search by name (mirrors existing search implementations)
  const filtered = agents.filter((a) =>
    `${a.name} ${a.code} ${a.email ?? ''} ${a.phoneNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    try {
      await deleteAgent(id).unwrap();
      toast.success('Agent deleted');
      setConfirmDeleteId(null);
    } catch {
      toast.error('Failed to delete agent');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-600">
        <AlertCircle className="w-12 h-12 mb-2" />
        <p>Failed to load agents</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Agent Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">{agents.length} agent{agents.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {drafts.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowDraftDropdown((v) => !v)}
                className="flex items-center gap-2 bg-amber-100 text-amber-700 border border-amber-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-200 transition"
              >
                <FileText className="w-4 h-4" />
                Drafts ({drafts.length})
              </button>
              {showDraftDropdown && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    {drafts.map((draft) => (
                      <div
                        key={draft.id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <button
                          onClick={() => openCreate(draft)}
                          className="flex-1 text-left text-sm text-gray-700 truncate"
                        >
                          <span className="font-medium">{draft.label}</span>
                          <span className="text-xs text-gray-400 block">
                            {new Date(draft.savedAt).toLocaleDateString()}
                          </span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteDraft(draft.id); }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Delete draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={deleteAllDrafts}
                    className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 border-t border-gray-200 font-medium"
                  >
                    Delete All Drafts
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Add Agent
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-semibold">Coupon Code</th>
                <th className="px-4 py-3 text-left font-semibold">Agent Details</th>
                <th className="px-4 py-3 text-left font-semibold">Cities</th>
                <th className="px-4 py-3 text-left font-semibold">Validity</th>
                <th className="px-4 py-3 text-center font-semibold">Usage</th>
                {isSuperAdmin && <th className="px-4 py-3 text-left font-semibold">Commission</th>}
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 8 : 7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No agents found{search ? ' matching your search' : ''}
                  </td>
                </tr>
              ) : (
                filtered.map((agent) => (
                  <tr key={agent.id} className={`hover:bg-gray-50 transition ${!agent.isActive ? 'opacity-60' : ''}`}>
                    {/* Coupon Code */}
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded">{agent.code}</span>
                    </td>

                    {/* Agent Details */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{agent.name}</p>
                      {agent.email && <p className="text-xs text-gray-400">{agent.email}</p>}
                      <p className="text-xs text-gray-500">{agent.phoneNumber}</p>
                    </td>

                    {/* Cities */}
                    <td className="px-4 py-3 max-w-[180px]">
                      {agent.cityIds.length === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                          <Globe className="w-3 h-3" /> All Cities
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs" title={agent.cityNames.join(', ')}>
                          {agent.cityNames.join(', ')}
                        </span>
                      )}
                    </td>

                    {/* Validity */}
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{formatValidity(agent)}</td>

                    {/* Usage */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                        {agent.usageCount}
                      </span>
                    </td>

                    {/* Commission Summary — SuperAdmin only */}
                    {isSuperAdmin && (
                      <td className="px-4 py-3">
                        <div className="space-y-0.5 text-xs">
                          <div className="text-gray-600">Total: <span className="font-semibold text-gray-700">{inr(agent.totalCommission)}</span></div>
                          <div className="text-green-600">Paid: <span className="font-semibold">{inr(agent.paidCommission)}</span></div>
                          <div className="text-amber-600">Pending: <span className="font-semibold">{inr(agent.pendingCommission)}</span></div>
                        </div>
                      </td>
                    )}

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {agent.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {isSuperAdmin && (
                          <button
                            onClick={() => setSettlementAgent(agent)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Commission settlement"
                          >
                            <Wallet className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(agent)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === agent.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(agent.id)}
                              disabled={deleting}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition"
                            >
                              {deleting ? '...' : 'Confirm'}
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
                            onClick={() => setConfirmDeleteId(agent.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
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

      {/* Modals */}
      {showForm && (
        <AgentFormModal
          agent={editingAgent}
          initialDraft={initialDraft}
          onClose={handleFormClose}
          onSaveDraft={handleSaveDraftManual}
          onSuccess={handleFormSuccess}
        />
      )}
      {settlementAgent && isSuperAdmin && (
        <CommissionSettlementModal agent={settlementAgent} onClose={() => setSettlementAgent(null)} />
      )}
    </div>
  );
}
