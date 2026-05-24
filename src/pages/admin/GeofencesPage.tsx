import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MapPin, Bell } from 'lucide-react';
import { useGetAdminProfileQuery } from '../../store/api/adminApi';
import { useGetUnreadAlertCountQuery } from '../../store/api/geofenceApi';
import GeofencesTab from '../../components/admin/GeofencesTab';
import GeofenceAlertsTab from '../../components/admin/GeofenceAlertsTab';

const GeofencesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'geofences' | 'alerts'>('geofences');
  const { data: adminProfile, isLoading } = useGetAdminProfileQuery();
  const { data: unreadCount = 0 } = useGetUnreadAlertCountQuery();
  
  // Wait for profile to load before checking permissions
  if (isLoading) {
    return null;
  }

  const isSuperAdmin = adminProfile?.role === 2;
  const canManageGeofences = isSuperAdmin || adminProfile?.canManageGeofences;

  // Redirect to 404 if no permission
  if (!canManageGeofences) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('geofences')}
          className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition ${
            activeTab === 'geofences'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Geofences
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition ${
            activeTab === 'alerts'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bell className="w-4 h-4" />
          Alerts
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'geofences' ? (
        <GeofencesTab 
          adminCityIds={adminProfile?.cityIds ?? []} 
          isSuperAdmin={isSuperAdmin} 
        />
      ) : (
        <GeofenceAlertsTab 
          adminCityIds={adminProfile?.cityIds ?? []}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  );
};

export default GeofencesPage;
