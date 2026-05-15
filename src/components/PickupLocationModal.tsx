import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Loader2, AlertCircle, Navigation } from 'lucide-react';
import { useGetActivePickupLocationsByCityQuery } from '../store/api/pickupLocationApi';
import type { PickupLocationDto } from '../store/api/pickupLocationApi';

interface PickupLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    cityId: number;
    cityName: string;
    onContinue: (location: PickupLocationDto) => void;
}

export default function PickupLocationModal({
    isOpen,
    onClose,
    cityId,
    cityName,
    onContinue,
}: PickupLocationModalProps) {
    const { data: locations = [], isLoading, error } = useGetActivePickupLocationsByCityQuery(cityId, {
        skip: !isOpen || !cityId,
    });

    const openDirections = (location: PickupLocationDto) => {
        if (location.latitude && location.longitude) {
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`,
                '_blank'
            );
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-gray-100">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Select Pickup Location</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        <MapPin className="inline w-3.5 h-3.5 mr-1" />
                                        {cityName}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-5">
                                {isLoading && (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                                        <p className="mt-3 text-gray-600">Loading locations...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <AlertCircle className="w-10 h-10 text-red-500" />
                                        <p className="mt-3 text-gray-800 font-medium">Failed to load locations</p>
                                        <p className="text-sm text-gray-500">Please try again later</p>
                                    </div>
                                )}

                                {!isLoading && !error && locations.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <MapPin className="w-10 h-10 text-gray-400" />
                                        <p className="mt-3 text-gray-800 font-medium">No pickup locations available</p>
                                        <p className="text-sm text-gray-500">This city doesn't have any pickup points yet</p>
                                    </div>
                                )}

                                {!isLoading && !error && locations.length > 0 && (
                                    <div className="space-y-3">
                                        {locations.map((location) => (
                                            <div
                                                key={location.id}
                                                onClick={() => onContinue(location)}
                                                className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all border-gray-200 hover:border-primary-500 hover:bg-primary-50"
                                            >
                                                <div className="mt-1 w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900">{location.name}</p>
                                                    {location.address && (
                                                        <p className="text-sm text-gray-500 mt-0.5">{location.address}</p>
                                                    )}
                                                </div>
                                                {location.latitude && location.longitude && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            openDirections(location);
                                                        }}
                                                        className="flex-shrink-0 p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                                                        title="Get Directions"
                                                    >
                                                        <Navigation className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
