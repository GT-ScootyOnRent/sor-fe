import { X, Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetAgentUsagesQuery,
  useUpdateAgentUsageStatusMutation,
  type Agent,
} from '../../store/api/agentApi';

interface Props {
  agent: Agent;
  onClose: () => void;
}

const inr = (n: number) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/**
 * SuperAdmin-only commission settlement for a single agent. Lists each redemption
 * and lets the SuperAdmin toggle its commission between Pending and Paid.
 */
export default function CommissionSettlementModal({ agent, onClose }: Props) {
  const { data: usages = [], isLoading } = useGetAgentUsagesQuery(agent.id);
  const [updateStatus, { isLoading: updating }] = useUpdateAgentUsageStatusMutation();

  const total = usages.reduce((s, u) => s + u.commissionAmount, 0);
  const paid = usages.filter((u) => u.status === 'paid').reduce((s, u) => s + u.commissionAmount, 0);
  const pending = total - paid;

  const toggle = async (usageId: number, current: 'pending' | 'paid') => {
    const next = current === 'paid' ? 'pending' : 'paid';
    try {
      await updateStatus({ usageId, agentId: agent.id, status: next }).unwrap();
      toast.success(`Marked ${next}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Commission Settlement</h2>
              <p className="text-xs text-gray-400">{agent.name} · {agent.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 flex-shrink-0">
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-700">{inr(total)}</p>
          </div>
          <div className="rounded-xl bg-green-50 border border-green-200 p-3">
            <p className="text-xs text-green-600">Paid</p>
            <p className="text-lg font-bold text-green-700">{inr(paid)}</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-600">Pending</p>
            <p className="text-lg font-bold text-amber-700">{inr(pending)}</p>
          </div>
        </div>

        {/* Usage list */}
        <div className="px-6 pb-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : usages.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No redemptions yet. Commission entries appear here once this agent's coupon is used on a paid booking.
            </div>
          ) : (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-2.5 text-left font-semibold">Date</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Booking</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Order</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Commission</th>
                    <th className="px-4 py-2.5 text-center font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usages.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5 text-gray-600">{new Date(u.usedAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-2.5 text-gray-600">{u.bookingId ? `#${u.bookingId}` : '—'}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{inr(u.orderAmount)}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-800">{inr(u.commissionAmount)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => toggle(u.id, u.status)}
                          disabled={updating}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition disabled:opacity-50 ${
                            u.status === 'paid'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}
                          title="Click to toggle paid / pending"
                        >
                          {u.status === 'paid' ? 'Paid' : 'Pending'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
