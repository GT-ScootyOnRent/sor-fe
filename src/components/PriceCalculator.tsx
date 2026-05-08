import { useState } from 'react';
import { Tag, AlertCircle, CheckCircle, HardHat, Gift, Sparkles, X } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import PromoCodeModal from './PromoCodeModal';
import { useValidatePromoCodeMutation, type PromoCodeDto } from '../store/api/promoCodeApi';

const SECOND_HELMET_PRICE = 50; // ₹50 for 2nd helmet (shown as free promo)

interface PriceCalculatorProps {
  basePrice: number; // hourly rate
  hours: number; // total hours
  vehicleName: string;
  onProceedToPayment?: (finalAmount: number) => void;
  isLoading?: boolean;
  isLoggedIn?: boolean;
  minBookingHours?: number;
  includeSecondHelmet?: boolean;
  onSecondHelmetChange?: (value: boolean) => void;
  cityId?: number;
  userId?: number;
  packagePrice?: number | null; // Fixed package price (overrides hourly calculation)
  packageLabel?: string | null; // Package label (e.g., "3 Days")
}

export default function PriceCalculator({
  basePrice,
  hours,
  vehicleName,
  onProceedToPayment,
  isLoading = false,
  isLoggedIn = false,
  minBookingHours = 0,
  includeSecondHelmet = false,
  onSecondHelmetChange,
  cityId,
  userId,
  packagePrice = null,
  packageLabel = null,
}: PriceCalculatorProps) {
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeDto | null>(null);
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
  const [promoCode, setPromoCode] = useState('');

  const [validatePromo, { isLoading: validatingPromo }] = useValidatePromoCodeMutation();

  // Calculate subtotal: use package price if available, otherwise hourly rate
  const subtotal = packagePrice !== null ? packagePrice : basePrice * hours;
  const isPackagePricing = packagePrice !== null;
  const helmetCharge = includeSecondHelmet ? SECOND_HELMET_PRICE : 0;
  const helmetDiscount = includeSecondHelmet ? SECOND_HELMET_PRICE : 0; // Free promo!
  const subtotalAfterHelmet = subtotal + helmetCharge - helmetDiscount; // Helmet cancels out
  const gst = (subtotalAfterHelmet - promoDiscountAmount) * 0.18; // 18% GST
  const total = subtotalAfterHelmet - promoDiscountAmount + gst;

  const canProceed = hours > 0 && hours >= minBookingHours;

  const handleSelectPromo = async (promo: PromoCodeDto) => {
    if (!cityId || !userId) {
      toast.error('Please login to apply promo code');
      setShowPromoModal(false);
      return;
    }

    try {
      const result = await validatePromo({
        code: promo.code,
        userId,
        orderAmount: subtotal,
        cityId,
      }).unwrap();

      if (result.isValid) {
        setAppliedPromo(promo);
        setPromoDiscountAmount(result.discountAmount);
        setPromoCode('');
        setShowPromoModal(false);
        toast.success(`Coupon "${promo.code}" applied!`);
      } else {
        toast.error(result.message || 'Coupon not applicable');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to apply coupon');
    }
  };

  const handleApplyManualPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }
    if (!cityId || !userId) {
      toast.error('Please login to apply promo code');
      return;
    }

    try {
      const result = await validatePromo({
        code: promoCode.trim().toUpperCase(),
        userId,
        orderAmount: subtotal,
        cityId,
      }).unwrap();

      if (result.isValid) {
        setAppliedPromo({
          id: 0,
          code: promoCode.trim().toUpperCase(),
          discountType: 'flat',
          discountValue: result.discountAmount,
          minOrderAmount: 0,
          isActive: true,
        } as PromoCodeDto);
        setPromoDiscountAmount(result.discountAmount);
        setPromoCode('');
        toast.success(`Coupon applied! You save ₹${result.discountAmount}`);
      } else {
        toast.error(result.message || 'Invalid promo code');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to apply coupon');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscountAmount(0);
    toast.success('Coupon removed');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
      <h3 className="text-xl text-black mb-6">Booking Summary</h3>

      {/* Vehicle Details */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <p className="text-sm text-gray-600 mb-1">Vehicle</p>
        <p className="text-black font-medium">{vehicleName}</p>
      </div>

      {/* Add-ons Section */}
      {onSecondHelmetChange && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <HardHat className="w-5 h-5 text-primary-600" />
            <h4 className="font-semibold text-gray-900">Add-ons</h4>
          </div>

          <label className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg cursor-pointer hover:border-green-300 transition-colors">
            <input
              type="checkbox"
              checked={includeSecondHelmet}
              onChange={(e) => onSecondHelmetChange(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">2nd Helmet</span>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                    <Sparkles className="w-3 h-3" />
                    FREE!
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">Extra helmet for pillion rider</p>
              <p className="text-xs text-green-600 font-medium mt-1">Worth ₹{SECOND_HELMET_PRICE} - Yours free!</p>
            </div>
          </label>
        </div>
      )}

      {/* Hourly Rate Info */}
      <div className="mb-6 p-4 bg-primary-50 rounded-lg">
        {isPackagePricing ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">Package Deal</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-600">{packageLabel}</span>
              <span className="text-2xl font-bold text-primary-600">₹{packagePrice}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-600">Hourly Rate</span>
              <span className="text-2xl font-bold text-primary-600">₹{basePrice}</span>
            </div>
            {minBookingHours > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Minimum {minBookingHours} hours booking required
              </p>
            )}
          </>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          {isPackagePricing ? (
            <>
              <span className="text-gray-600">{packageLabel} Package</span>
              <span className="text-black">₹{subtotal.toFixed(2)}</span>
            </>
          ) : (
            <>
              <span className="text-gray-600">Rate × {hours} hours</span>
              <span className="text-black">₹{subtotal.toFixed(2)}</span>
            </>
          )}
        </div>

        {/* 2nd Helmet charges - show when selected */}
        {includeSecondHelmet && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">2nd Helmet</span>
              <span className="text-black">₹{helmetCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" />
                2nd Helmet Discount
              </span>
              <span>-₹{helmetDiscount.toFixed(2)}</span>
            </div>
          </>
        )}

        {promoDiscountAmount > 0 && appliedPromo && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              Promo ({appliedPromo.code})
            </span>
            <span>-₹{promoDiscountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-600">GST (18%)</span>
          <span className="text-black">₹{gst.toFixed(2)}</span>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg text-black font-semibold">Total Amount</span>
            <span className="text-2xl font-bold text-primary-500">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Savings message */}
        {(includeSecondHelmet || promoDiscountAmount > 0) && (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
            <Gift className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              You saved ₹{(includeSecondHelmet ? SECOND_HELMET_PRICE : 0) + promoDiscountAmount}!
            </span>
          </div>
        )}
      </div>

      {/* Promo Code Section */}
      <div className="mb-6">
        {!appliedPromo ? (
          <div>
            {/* Input with Apply button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3A6F9B] focus:border-transparent uppercase"
                disabled={validatingPromo}
              />
              <Button
                onClick={handleApplyManualPromo}
                disabled={!promoCode.trim() || validatingPromo || !cityId}
                className="px-4 bg-[#3A6F9B] hover:bg-[#2d5777] text-white text-sm disabled:opacity-50"
              >
                {validatingPromo ? 'Applying...' : 'Apply'}
              </Button>
            </div>

            {/* View Promocodes link */}
            {cityId && (
              <button
                onClick={() => setShowPromoModal(true)}
                className="mt-2 text-sm text-[#3A6F9B] font-medium underline underline-offset-2 hover:text-[#2d5777] transition-all hover:underline-offset-4"
              >
                View Promocodes
              </button>
            )}
          </div>
        ) : (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">{appliedPromo.code}</p>
                  <p className="text-sm text-green-600">
                    {appliedPromo.discountType === 'percentage'
                      ? `${appliedPromo.discountValue}% off`
                      : `₹${appliedPromo.discountValue} off`}
                    {' '}- Saving ₹{promoDiscountAmount.toFixed(0)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemovePromo}
                className="p-1.5 hover:bg-green-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-green-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Promo Code Modal */}
      {cityId && (
        <PromoCodeModal
          isOpen={showPromoModal}
          onClose={() => setShowPromoModal(false)}
          cityId={cityId}
          onSelectPromo={handleSelectPromo}
          currentOrderAmount={subtotal}
          isApplying={validatingPromo}
        />
      )}

      {/* Validation Warning */}
      {hours > 0 && hours < minBookingHours && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">
            Minimum booking duration is {minBookingHours} hours. Please adjust your dates.
          </p>
        </div>
      )}

      {/* Additional Info */}
      <div className="bg-primary-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-black mb-2">Important Information</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Valid driving license and ID proof required at pickup</li>
          <li>• Security Deposit: ₹2000 collected at pickup (refundable)</li>
        </ul>
      </div>

      {/* Proceed Button */}
      {onProceedToPayment && (
        <Button
          onClick={() => onProceedToPayment?.(total)}
          disabled={!canProceed || isLoading}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white py-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Proceed to Payment'}
        </Button>
      )}

      {/* Info Alert */}
      {isLoggedIn && (
        <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-start">
          <AlertCircle className="w-5 h-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Payment will be processed securely through EaseBuzz after booking confirmation.
          </p>
        </div>
      )}

      {/* Cancellation Policy
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-black mb-2">Cancellation Policy</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Free cancellation up to 24 hours before pickup</li>
          <li>• 50% refund if cancelled 12-24 hours before</li>
          <li>• No refund if cancelled within 12 hours</li>
        </ul>
      </div> */}
    </div>
  );
}