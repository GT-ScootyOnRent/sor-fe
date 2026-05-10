import { useState } from 'react';
import { X, Scissors } from 'lucide-react';
import { useGetHomepagePromoCodeQuery } from '../store/api/promoCodeApi';

export default function HomepageCouponBanner() {
    const [isDismissed, setIsDismissed] = useState(false); // Session only - resets on refresh
    const [showCopiedBadge, setShowCopiedBadge] = useState(false);
    const { data: promo, isLoading } = useGetHomepagePromoCodeQuery();

    const handleDismiss = () => {
        setIsDismissed(true);
    };

    const handleCopyCode = async () => {
        if (!promo?.code) return;

        try {
            await navigator.clipboard.writeText(promo.code);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = promo.code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }

        // Show "copied!" badge then dismiss
        setShowCopiedBadge(true);

        // After 2 seconds, hide the banner (will come back on refresh)
        setTimeout(() => {
            setShowCopiedBadge(false);
            setIsDismissed(true);
        }, 2000);
    };

    // Don't render if dismissed, loading, or no promo
    if (isDismissed || isLoading || !promo) return null;

    // Show "copied!" badge instead of coupon
    if (showCopiedBadge) {
        return (
            <div className="fixed bottom-4 left-4 z-50">
                <div className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg">
                    copied!
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 z-50">
            {/* Dismiss button */}
            <button
                onClick={handleDismiss}
                className="absolute -top-2 -right-2 z-20 p-1 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors shadow-md"
                aria-label="Dismiss coupon banner"
            >
                <X className="w-3.5 h-3.5 text-white" />
            </button>

            {/* Whole coupon is clickable */}
            <button
                onClick={handleCopyCode}
                className="relative flex drop-shadow-xl cursor-pointer hover:scale-[1.02] transition-transform"
                style={{ maxWidth: '340px' }}
            >
                {/* Left side - Primary COUPON sidebar */}
                <div
                    className="w-12 flex items-center justify-center rounded-l-lg relative"
                    style={{
                        background: `
                            radial-gradient(circle at 100% 0%, transparent 10px, #017cee 10px),
                            radial-gradient(circle at 100% 100%, transparent 10px, #017cee 10px)
                        `,
                        backgroundSize: '100% 51%',
                        backgroundPosition: 'top, bottom',
                        backgroundRepeat: 'no-repeat',
                        minHeight: '110px'
                    }}
                >
                    <span className="text-white font-bold text-xs tracking-[0.15em] transform -rotate-90 whitespace-nowrap uppercase">
                        Coupon
                    </span>
                </div>

                {/* Right side - White content */}
                <div
                    className="flex-1 flex flex-col items-center justify-center py-4 px-5 rounded-r-lg relative"
                    style={{
                        background: `
                            radial-gradient(circle at 0% 0%, transparent 10px, white 10px),
                            radial-gradient(circle at 0% 100%, transparent 10px, white 10px)
                        `,
                        backgroundSize: '100% 51%',
                        backgroundPosition: 'top, bottom',
                        backgroundRepeat: 'no-repeat',
                        marginLeft: '-1px'
                    }}
                >
                    {/* Dashed border line */}
                    <div className="absolute left-0 top-3 bottom-3 w-0 border-l-2 border-dashed border-primary-400" />

                    {/* Code box with scissors */}
                    <div className="relative mb-2">
                        <Scissors className="absolute -top-2 -left-1 w-4 h-4 text-gray-600" />
                        <div className="border-2 border-gray-800 border-dashed rounded-lg px-5 py-1.5">
                            <span className="text-xl font-bold text-gray-900 tracking-wider">
                                {promo.code}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-[11px] font-medium text-center leading-snug uppercase tracking-wide">
                        {promo.description || `Use this coupon code and get ${promo.discountType === 'percentage' ? `${promo.discountValue}%` : `₹${promo.discountValue}`} off on your first booking`}
                    </p>
                </div>
            </button>
        </div>
    );
}
