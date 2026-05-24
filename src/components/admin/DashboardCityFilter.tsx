import React from 'react';
import { MapPin } from 'lucide-react';
import { useGetCitiesQuery } from '../../store/api/cityApi';
import { useGetAdminProfileQuery } from '../../store/api/adminApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  setDashboardCity, 
  selectDashboardCityId, 
  selectDashboardCityIdParam 
} from '../../store/slices/dashboardCitySlice';

/**
 * City filter dropdown for dashboards
 * - SuperAdmin: sees all cities
 * - Admin: sees only assigned cities (cityIds)
 * - Staff: should not render this component (has single city)
 */
export default function DashboardCityFilter() {
  const dispatch = useAppDispatch();
  const selectedCityId = useAppSelector(selectDashboardCityId);
  
  const { data: allCities = [], isLoading: citiesLoading } = useGetCitiesQuery({ page: 1, size: 100 });
  const { data: adminProfile, isLoading: profileLoading } = useGetAdminProfileQuery();

  const isSuperAdmin = adminProfile?.role === 2;
  const adminCityIds = adminProfile?.cityIds ?? [];

  // Filter cities based on user role
  const availableCities = isSuperAdmin
    ? allCities.filter(c => c.isActive)
    : allCities.filter(c => c.isActive && adminCityIds.includes(c.id));

  // If admin has only 1 city, don't show filter
  const shouldShowFilter = isSuperAdmin || availableCities.length > 1;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const cityId = value === 'all' ? 'all' : parseInt(value, 10);
    dispatch(setDashboardCity(cityId));
  };

  // Don't render if loading or shouldn't show
  if (citiesLoading || profileLoading) {
    return (
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 animate-pulse">
        <MapPin className="w-4 h-4 text-gray-400" />
        <div className="w-24 h-4 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!shouldShowFilter) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <MapPin className="w-4 h-4 text-gray-500" />
      <select
        value={selectedCityId}
        onChange={handleChange}
        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer min-w-[150px]"
      >
        <option value="all">All Cities</option>
        {availableCities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Hook to get dashboard city filter values from Redux
 */
export function useDashboardCityFilter() {
  const dispatch = useAppDispatch();
  const selectedCityId = useAppSelector(selectDashboardCityId);
  const cityIdParam = useAppSelector(selectDashboardCityIdParam);

  const setSelectedCityId = (cityId: number | 'all') => {
    dispatch(setDashboardCity(cityId));
  };

  return {
    selectedCityId,
    setSelectedCityId,
    cityIdParam, // Use this for API calls (undefined means all)
  };
}
