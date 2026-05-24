import React, { useState } from 'react';
import { X, MapPin, Plus, Trash2, Loader2, AlertTriangle, Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

import {
  useGetGeofencesQuery,
  useGetVehicleGeofencesQuery,
  useAttachGeofenceToVehicleMutation,
  useDetachGeofenceFromVehicleMutation,
  type AttachGeofenceDto,
} from '../../store/api/geofenceApi';
import type { VehicleDto } from '../../store/api/vehicleApi';

interface VehicleGeofenceModalProps {
  vehicle: VehicleDto;
  onClose: () => void;
}

export const VehicleGeofenceModal: React.FC<VehicleGeofenceModalProps> = ({ vehicle, onClose }) => {
  const [selectedGeofenceId, setSelectedGeofenceId] = useState<number | ''>('');
  const [alertOnExit, setAlertOnExit] = useState(true);
  const [alertOnEntry, setAlertOnEntry] = useState(false);

  // API queries
  const { data: allGeofences = [] } = useGetGeofencesQuery();
  const { data: vehicleGeofences = [], isLoading: loadingAttached, refetch } = useGetVehicleGeofencesQuery(vehicle.id);
  const [attachGeofence, { isLoading: attaching }] = useAttachGeofenceToVehicleMutation();
  const [detachGeofence, { isLoading: detaching }] = useDetachGeofenceFromVehicleMutation();

  // Filter geofences that match vehicle's city and aren't already attached
  const attachedIds = vehicleGeofences.map(vg => vg.geofenceId);
  const availableGeofences = allGeofences.filter(g => 
    g.cityId === vehicle.cityId && !attachedIds.includes(g.id) && g.isActive
  );

  const handleAttach = async () => {
    if (!selectedGeofenceId) {
      toast.error('Please select a geofence');
      return;
    }

    try {
      const dto: AttachGeofenceDto = {
        geofenceId: selectedGeofenceId as number,
        alertOnExit,
        alertOnEntry,
      };
      await attachGeofence({ vehicleId: vehicle.id, dto }).unwrap();
      toast.success('Geofence attached');
      setSelectedGeofenceId('');
      refetch();
    } catch (err: any) {
      toast.error('Failed to attach', { description: err?.data?.message || err?.data });
    }
  };

  const handleDetach = async (geofenceId: number) => {
    if (!window.confirm('Remove this geofence from the vehicle?')) return;

    try {
      await detachGeofence({ vehicleId: vehicle.id, geofenceId }).unwrap();
      toast.success('Geofence removed');
      refetch();
    } catch (err: any) {
      toast.error('Failed to remove', { description: err?.data?.message });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Vehicle Geofences</h2>
              <p className="text-sm text-gray-500">{vehicle.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(80vh-140px)]">
          {/* Add New Geofence */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Attach Geofence</h3>
            
            {availableGeofences.length === 0 ? (
              <p className="text-sm text-gray-500">
                No available geofences for this city. 
                <br />
                <span className="text-xs text-gray-400">Create a geofence in the Geofences tab first.</span>
              </p>
            ) : (
              <>
                <select
                  value={selectedGeofenceId}
                  onChange={(e) => setSelectedGeofenceId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm mb-3"
                >
                  <option value="">Select a geofence...</option>
                  {availableGeofences.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.fenceType})
                    </option>
                  ))}
                </select>

                {/* Alert settings */}
                <div className="flex flex-wrap gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertOnExit}
                      onChange={(e) => setAlertOnExit(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                      Alert on Exit
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertOnEntry}
                      onChange={(e) => setAlertOnEntry(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-blue-500" />
                      Alert on Entry
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleAttach}
                  disabled={!selectedGeofenceId || attaching}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {attaching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Attach Geofence
                </button>
              </>
            )}
          </div>

          {/* Attached Geofences List */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Attached Geofences ({vehicleGeofences.length})
            </h3>

            {loadingAttached ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : vehicleGeofences.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No geofences attached</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vehicleGeofences.map((vg) => {
                  const geofence = allGeofences.find(g => g.id === vg.geofenceId);
                  return (
                    <div
                      key={vg.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {vg.geofenceName || geofence?.name || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {vg.alertOnExit && (
                              <span className="flex items-center gap-0.5 text-orange-600">
                                <AlertTriangle className="w-3 h-3" /> Exit
                              </span>
                            )}
                            {vg.alertOnEntry && (
                              <span className="flex items-center gap-0.5 text-blue-600">
                                <Bell className="w-3 h-3" /> Entry
                              </span>
                            )}
                            {!vg.alertOnExit && !vg.alertOnEntry && (
                              <span className="flex items-center gap-0.5 text-gray-400">
                                <BellOff className="w-3 h-3" /> No alerts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDetach(vg.geofenceId)}
                        disabled={detaching}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleGeofenceModal;
