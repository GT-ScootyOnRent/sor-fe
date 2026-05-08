import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Calendar, Home, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

interface FormSubmittedModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FormSubmittedModal({ isOpen, onClose }: FormSubmittedModalProps) {
    const navigate = useNavigate();

    const handleMyBookings = () => {
        onClose();
        navigate('/profile');
    };

    const handleGoHome = () => {
        onClose();
        navigate('/');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                            {/* Close Button */}
                            <div className="flex justify-end p-4 pb-0">
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="px-6 pb-6 text-center">
                                {/* Success Icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                                >
                                    <CheckCircle className="w-12 h-12 text-green-600" />
                                </motion.div>

                                {/* Title */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-2xl font-bold text-gray-900 mb-2"
                                >
                                    Details Submitted!
                                </motion.h2>

                                {/* Description */}
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-gray-600 mb-6"
                                >
                                    Your booking details have been saved successfully. We'll see you at the pickup location!
                                </motion.p>

                                {/* Important Note */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left"
                                >
                                    <p className="text-sm font-semibold text-amber-800 mb-2">📋 Remember to bring:</p>
                                    <ul className="text-sm text-amber-700 space-y-1">
                                        <li>• Original Driving License</li>
                                        <li>• Government ID (Aadhaar/PAN)</li>
                                        <li>• Security deposit ₹2,000 (refundable)</li>
                                    </ul>
                                </motion.div>

                                {/* Action Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    <Button
                                        onClick={handleMyBookings}
                                        className="bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-semibold"
                                    >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        My Bookings
                                    </Button>
                                    <Button
                                        onClick={handleGoHome}
                                        variant="outline"
                                        className="border-gray-300 py-3 rounded-xl font-semibold"
                                    >
                                        <Home className="w-4 h-4 mr-2" />
                                        Go Home
                                    </Button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
