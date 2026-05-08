import { useState } from 'react';
import { X, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { useGetAvailablePromoCodesForCityQuery, type PromoCodeDto } from '../store/api/promoCodeApi';

interface PromoCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    cityId: number;
    onSelectPromo: (promo: PromoCodeDto) => void;
    currentOrderAmount: number;
    isApplying?: boolean;
}

function PromoCard({
    promo,
    currentOrderAmount,
    onApply,
    isApplying,
}: {
    promo: PromoCodeDto;
    currentOrderAmount: number;
    onApply: () => void;
    isApplying: boolean;
}) {
    const [expanded, setExpanded] = useState(false);

    const formatDiscount = () => {
        if (promo.discountType === 'percentage') {
            return `${promo.discountValue}%`;
        }
        return `₹${promo.discountValue}`;
    };

    const calculateSavings = () => {
        if (promo.discountType === 'percentage') {
            const discount = (currentOrderAmount * promo.discountValue) / 100;
            return promo.maxDiscountAmount ? Math.min(discount, promo.maxDiscountAmount) : discount;
        }
        return promo.discountValue;
    };

    const isApplicable = currentOrderAmount >= promo.minOrderAmount;
    const savings = calculateSavings();

    const hasMoreDetails = promo.description || promo.minOrderAmount > 0 || promo.maxDiscountAmount;

    return (
        <div className={`bg-white border rounded-lg overflow-hidden ${!isApplicable ? 'opacity-60' : 'border-gray-200'}`}>
            <div className="flex">
                {/* Left colored badge */}
                <div className="w-20 flex-shrink-0 bg-[#3A6F9B] flex flex-col items-center justify-center text-white py-4">
                    <span className="text-xl font-bold">{formatDiscount()}</span>
                    <span className="text-xs font-medium">OFF</span>
                </div>

                {/* Content */}
                <div className="flex-1 p-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{promo.code}</h3>
                            {isApplicable && currentOrderAmount > 0 ? (
                                <p className="text-[#3A6F9B] text-sm font-semibold">
                                    Save ₹{Math.round(savings)} on this order
                                </p>
                            ) : (
                                <p className="text-red-500 text-sm font-medium">
                                    Add ₹{promo.minOrderAmount - currentOrderAmount} more
                                </p>
                            )}
                        </div>

                        {/* Apply Button */}
                        <button
                            onClick={onApply}
                            disabled={!isApplicable || isApplying}
                            className={`px-4 py-1 text-sm font-bold transition-colors ${isApplicable
                                    ? 'text-[#3A6F9B] hover:text-[#2d5777]'
                                    : 'text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            APPLY
                        </button>
                    </div>

                    {/* Expandable details */}
                    {hasMoreDetails && (
                        <>
                            {expanded && (
                                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                                    {promo.description && (
                                        <p>Use code {promo.code} & get {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `₹${promo.discountValue}`} off{promo.minOrderAmount > 0 ? ` on orders above ₹${promo.minOrderAmount}` : ''}. {promo.maxDiscountAmount ? `Maximum discount: ₹${promo.maxDiscountAmount}.` : ''}</p>
                                    )}
                                    {!promo.description && (
                                        <>
                                            {promo.minOrderAmount > 0 && <p>Minimum order: ₹{promo.minOrderAmount}</p>}
                                            {promo.maxDiscountAmount && <p>Maximum discount: ₹{promo.maxDiscountAmount}</p>}
                                        </>
                                    )}
                                </div>
                            )}
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="flex items-center gap-1 mt-2 text-xs text-gray-500 hover:text-gray-700 font-medium"
                            >
                                {expanded ? (
                                    <>
                                        <ChevronUp className="w-3 h-3" />
                                        LESS
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-3 h-3" />
                                        MORE
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PromoCodeModal({
    isOpen,
    onClose,
    cityId,
    onSelectPromo,
    currentOrderAmount,
    isApplying = false,
}: PromoCodeModalProps) {
    const { data: promoCodes = [], isLoading, isFetching } = useGetAvailablePromoCodesForCityQuery(cityId, {
        skip: !isOpen || !cityId,
    });

    if (!isOpen) return null;

    const showLoader = isLoading || isFetching;

    // Separate applicable and non-applicable promos
    const applicablePromos = promoCodes.filter(p => currentOrderAmount >= p.minOrderAmount);
    const nonApplicablePromos = promoCodes.filter(p => currentOrderAmount < p.minOrderAmount);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-gray-100 rounded-xl shadow-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-white rounded-t-xl border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Apply Coupon</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {showLoader ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-10 h-10 border-3 border-[#3A6F9B] border-t-transparent rounded-full animate-spin mb-3" />
                            <p className="text-sm text-gray-500">Loading coupons...</p>
                        </div>
                    ) : promoCodes.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-lg">
                            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No coupons available</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Applicable promos first */}
                            {applicablePromos.length > 0 && (
                                <>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Available offers</p>
                                    {applicablePromos.map((promo) => (
                                        <PromoCard
                                            key={promo.id}
                                            promo={promo}
                                            currentOrderAmount={currentOrderAmount}
                                            onApply={() => onSelectPromo(promo)}
                                            isApplying={isApplying}
                                        />
                                    ))}
                                </>
                            )}

                            {/* Non-applicable promos */}
                            {nonApplicablePromos.length > 0 && (
                                <>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4">More offers</p>
                                    {nonApplicablePromos.map((promo) => (
                                        <PromoCard
                                            key={promo.id}
                                            promo={promo}
                                            currentOrderAmount={currentOrderAmount}
                                            onApply={() => onSelectPromo(promo)}
                                            isApplying={isApplying}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
