import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Car, 
  LogIn, 
  LogOut,
  Eye,
  Search,
  Filter,
  Loader2,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetGeofenceAlertsQuery,
  useMarkAlertAsReadMutation,
  useResolveAlertMutation,
  type GeofenceAlertDto,
} from '../../store/api/geofenceApi';

interface GeofenceAlertsTabProps {
  adminCityIds?: number[];
  isSuperAdmin?: boolean;
}

const GeofenceAlertsTab: React.FC<GeofenceAlertsTabProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'unresolved' | 'resolved'>('all');
  const [resolveModalAlert, setResolveModalAlert] = useState<GeofenceAlertDto | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // API queries
  const { data: alerts = [], isLoading, isFetching, refetch } = useGetGeofenceAlertsQuery({ page: 1, size: 100 });
  const [markAsRead] = useMarkAlertAsReadMutation();
  const [resolveAlert, { isLoading: resolving }] = useResolveAlertMutation();

  const handleRefresh = async () => {
    await refetch();
    toast.success('Alerts refreshed');
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      alert.vehicleName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.geofenceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.address?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (filterStatus === 'unread') matchesStatus = !alert.isRead;
    else if (filterStatus === 'unresolved') matchesStatus = !alert.isResolved;
    else if (filterStatus === 'resolved') matchesStatus = alert.isResolved;

    return matchesSearch && matchesStatus;
  });

  const handleMarkAsRead = async (alertId: number) => {
    try {
      await markAsRead(alertId).unwrap();
      toast.success('Marked as read');
    } catch (err: any) {
      toast.error('Failed to mark as read', { description: err?.data?.message });
    }
  };

  const handleResolve = async () => {
    if (!resolveModalAlert) return;
    try {
      await resolveAlert({
        alertId: resolveModalAlert.id,
        dto: { resolutionNotes: resolutionNotes || undefined }
      }).unwrap();
      toast.success('Alert resolved');
      setResolveModalAlert(null);
      setResolutionNotes('');
    } catch (err: any) {
      toast.error('Failed to resolve', { description: err?.data?.message });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAlertTypeIcon = (type: 'entry' | 'exit') => {
    return type === 'entry' ? (
      <LogIn className="w-4 h-4 text-green-600" />
    ) : (
      <LogOut className="w-4 h-4 text-red-600" />
    );
  };

  const getAlertTypeBadge = (type: 'entry' | 'exit') => {
    return type === 'entry' ? (
      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
        Entry
      </span>
    ) : (
      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
        Exit
      </span>
    );
  };

  // Stats
  const unreadCount = alerts.filter(a => !a.isRead).length;
  const unresolvedCount = alerts.filter(a => !a.isResolved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-600" />
            Geofence Alerts
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor vehicle entry and exit events
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              <p className="text-sm text-gray-500">Total Alerts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Eye className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              <p className="text-sm text-gray-500">Unread</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{unresolvedCount}</p>
              <p className="text-sm text-gray-500">Unresolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vehicle, geofence, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Alerts</option>
            <option value="unread">Unread</option>
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No alerts found</p>
          <p className="text-sm text-gray-400 mt-1">
            {filterStatus !== 'all' ? 'Try changing the filter' : 'Alerts will appear when vehicles cross geofence boundaries'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-4 hover:bg-gray-50 transition ${!alert.isRead ? 'bg-blue-50/50' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${alert.alertType === 'entry' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {getAlertTypeIcon(alert.alertType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {alert.vehicleName || `Vehicle #${alert.vehicleId}`}
                      </span>
                      {getAlertTypeBadge(alert.alertType)}
                      {!alert.isRead && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          New
                        </span>
                      )}
                      {alert.isResolved && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {alert.alertType === 'entry' ? 'Entered' : 'Exited'}{' '}
                      <span className="font-medium">{alert.geofenceName || `Geofence #${alert.geofenceId}`}</span>
                    </p>
                    {alert.address && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {alert.address}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(alert.createdAt)}
                    </p>
                    {alert.isResolved && alert.resolutionNotes && (
                      <p className="text-sm text-gray-500 mt-2 p-2 bg-gray-50 rounded-lg flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{alert.resolutionNotes}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!alert.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Mark as read"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {!alert.isResolved && (
                    <button
                      onClick={() => {
                        setResolveModalAlert(alert);
                        setResolutionNotes('');
                      }}
                      className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resolve Alert
              </h3>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Car className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{resolveModalAlert.vehicleName}</span>
                  {getAlertTypeBadge(resolveModalAlert.alertType)}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {resolveModalAlert.geofenceName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution Notes (optional)
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Add any notes about how this alert was handled..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setResolveModalAlert(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center gap-2"
              >
                {resolving && <Loader2 className="w-4 h-4 animate-spin" />}
                Resolve Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeofenceAlertsTab;
