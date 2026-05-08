import { useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSelectedCity, closeCityModal } from '../store/slices/citySlice';
import { useGetCitiesQuery } from '../store/api/cityApi';

export default function CitySelectorModal() {
    const dispatch = useAppDispatch();
    const { isModalOpen, selectedCity } = useAppSelector((state) => state.city);
    const { data: cities = [], isLoading } = useGetCitiesQuery({ page: 1, size: 100 });

    // Show modal on first visit if no city selected
    useEffect(() => {
        if (!selectedCity && !isModalOpen) {
            // Small delay to ensure app is loaded
            const timer = setTimeout(() => {
                dispatch({ type: 'city/openCityModal' });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [selectedCity, isModalOpen, dispatch]);

    const handleSelectCity = (city: { id: number; name: string; isComingSoon?: boolean }) => {
        // Don't allow selection of coming soon cities
        if (city.isComingSoon) return;
        dispatch(setSelectedCity({ id: city.id, name: city.name }));
    };

    // Don't render if modal is closed
    if (!isModalOpen) return null;

    // Filter only active cities (both regular and coming soon will show)
    const activeCities = cities.filter((d) => d.isActive);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[100]">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden shadow-2xl sm:mx-4">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Select Your City</h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">Choose a city to see available vehicles</p>
                        </div>
                        {/* Only show close button if city already selected (for changing city later) */}
                        {selectedCity && (
                            <button
                                onClick={() => dispatch(closeCityModal())}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        )}
                    </div>
                </div>

                {/* City Grid */}
                <div className="p-4 sm:p-5 overflow-y-auto max-h-[70vh] sm:max-h-[60vh]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        </div>
                    ) : activeCities.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No cities available
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                            {activeCities.map((city) => (
                                <button
                                    key={city.id}
                                    onClick={() => handleSelectCity(city)}
                                    disabled={city.isComingSoon}
                                    className={`p-3 rounded-xl border-2 text-center transition-all relative ${city.isComingSoon
                                        ? 'border-amber-200 bg-amber-50 cursor-not-allowed opacity-80'
                                        : selectedCity?.id === city.id
                                            ? 'border-primary-500 bg-primary-50 text-primary-700 hover:scale-105'
                                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50 hover:scale-105'
                                        }`}
                                >
                                    <span className={`text-sm font-medium truncate block ${city.isComingSoon ? 'text-amber-700' : ''
                                        }`}>
                                        {city.name}
                                    </span>
                                    {city.isComingSoon && (
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            <Clock className="w-3 h-3 text-amber-500" />
                                            <span className="text-xs text-amber-600 font-medium">Coming Soon</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
