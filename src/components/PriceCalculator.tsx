import { useState } from 'react';
import { Tag, AlertCircle, CheckCircle, HardHat, Gift, Sparkles, X, Wallet } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import PromoCodeModal, { type CouponItem } from './PromoCodeModal';
import { type PromoCodeDto } from '../store/api/promoCodeApi';
import { useValidateCouponMutation } from '../store/api/couponApi';
import { calculatePackageBasedPrice } from '../store/api/vehiclePackageApi';

const SECOND_HELMET_PRICE = 50; // ₹50 for 2nd helmet (shown as free promo)
const SECURITY_DEPOSIT = 2000; // ₹2000 refundable security deposit

interface PriceCalculatorProps {
  hours: number; // total hours
  vehicleName: string;
  onProceedToPayment?: (finalAmount: number) => void;
  isLoading?: boolean;
  isLoggedIn?: boolean;
  minBookingHours?: number;
  includeSecondHelmet?: boolean;
  onSecondHelmetChange?: (value: boolean) => void;
  paySecurityAtPickup?: boolean;
  onSecurityDepositModeChange?: (payAtPickup: boolean) => void;
  cityId?: number;
  userId?: number;
  // Fired when an agent referral code is applied (so the parent can record usage on payment success)
  onAgentApplied?: (info: { code: string; orderAmount: number } | null) => void;
  // Package-based pricing
  selectedDurations?: number[];
  priceOverrides?: Record<string, number>;
  pricePerHour?: number;
  freeHoursPerDay?: number;
}

export default function PriceCalculator({
  hours,
  vehicleName,
  onProceedToPayment,
  isLoading = false,
  isLoggedIn = false,
  minBookingHours = 0,
  includeSecondHelmet = false,
  onSecondHelmetChange,
  paySecurityAtPickup = false,
  onSecurityDepositModeChange,
  cityId,
  userId,
  onAgentApplied,
  selectedDurations = [],
  priceOverrides = {},
  pricePerHour = 0,
  freeHoursPerDay = 6,
}: PriceCalculatorProps) {
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeDto | null>(null);
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
  const [promoCode, setPromoCode] = useState('');

  // Single unified endpoint: resolves promo OR agent codes in one request.
  const [validateCoupon, { isLoading: validatingPromo }] = useValidateCouponMutation();

  // Calculate subtotal using package-based pricing
  const subtotal = calculatePackageBasedPrice(
    hours,
    selectedDurations,
    priceOverrides,
    pricePerHour,
    freeHoursPerDay
  );
  const helmetCharge = includeSecondHelmet ? SECOND_HELMET_PRICE : 0;
  const helmetDiscount = includeSecondHelmet ? SECOND_HELMET_PRICE : 0; // Free promo!
  const securityDeposit = paySecurityAtPickup ? 0 : SECURITY_DEPOSIT; // Add to online payment if not paying at pickup
  const subtotalAfterHelmet = subtotal + helmetCharge - helmetDiscount; // Helmet cancels out
  const total = subtotalAfterHelmet - promoDiscountAmount + securityDeposit;

  const canProceed = hours > 0;

  const handleSelectPromo = async (promo: CouponItem) => {
    if (!cityId || !userId) {
      toast.error('Please login to apply promo code');
      setShowPromoModal(false);
      return;
    }

    try {
      const result = await validateCoupon({ code: promo.code, userId, orderAmount: subtotal, cityId }).unwrap();
      if (result.isValid) {
        setAppliedPromo(promo);
        setPromoDiscountAmount(result.discountAmount);
        setPromoCode('');
        setShowPromoModal(false);
        // Agent coupons must be recorded as used on payment success; promos are not.
        onAgentApplied?.(result.isAgent ? { code: result.code, orderAmount: subtotal } : null);
        toast.success(`Coupon "${promo.code}" applied!`);
      } else {
        toast.error(result.message || 'Coupon not applicable');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to apply coupon');
    }
  };

  const handleApplyManualPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a promo code');
      return;
    }
    if (!cityId || !userId) {
      toast.error('Please login to apply promo code');
      return;
    }

    // Single call — the backend resolves promo OR agent codes and tells us which matched.
    try {
      const result = await validateCoupon({ code, userId, orderAmount: subtotal, cityId }).unwrap();
      if (result.isValid) {
        applyCoupon(result.code || code, result.discountAmount, result.isAgent);
        return;
      }
      toast.error(result.message || 'Invalid coupon code');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.data?.error || 'Invalid coupon code');
    }
  };

  // Shared helper to set applied coupon state. isAgent => report to parent for usage recording.
  const applyCoupon = (code: string, discountAmount: number, isAgent: boolean) => {
    setAppliedPromo({
      id: 0,
      code,
      discountType: 'flat',
      discountValue: discountAmount,
      minOrderAmount: 0,
      isActive: true,
    } as PromoCodeDto);
    setPromoDiscountAmount(discountAmount);
    setPromoCode('');
    onAgentApplied?.(isAgent ? { code, orderAmount: subtotal } : null);
    toast.success(`Coupon applied! You save ₹${discountAmount}`);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscountAmount(0);
    onAgentApplied?.(null);
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

      {/* Security Deposit Option */}
      {onSecurityDepositModeChange && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5 text-primary-600" />
            <h4 className="font-semibold text-gray-900">Security Deposit</h4>
          </div>

          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
            <input
              type="checkbox"
              checked={paySecurityAtPickup}
              onChange={(e) => onSecurityDepositModeChange(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Pay ₹{SECURITY_DEPOSIT} at pickup (Cash)</span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">
                {paySecurityAtPickup 
                  ? 'Carry ₹2,000 cash to pay at pickup location' 
                  : 'Security deposit included in online payment'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Fully refundable after ride completion</p>
            </div>
          </label>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Amount</span>
          <span className="text-black">₹{subtotal.toFixed(2)}</span>
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

        {/* Security Deposit */}
        <div className="flex justify-between">
          <span className="text-gray-600 flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5" />
            Security Deposit
            <span className="text-xs text-gray-400">(refundable)</span>
          </span>
          {paySecurityAtPickup ? (
            <span className="text-amber-600 text-sm">Pay at pickup</span>
          ) : (
            <span className="text-black">₹{SECURITY_DEPOSIT.toFixed(2)}</span>
          )}
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent uppercase"
                disabled={validatingPromo}
              />
              <Button
                onClick={handleApplyManualPromo}
                disabled={!promoCode.trim() || validatingPromo || !cityId}
                className="px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm disabled:opacity-50"
              >
                {validatingPromo ? 'Applying...' : 'Apply'}
              </Button>
            </div>

            {/* View Promocodes link */}
            {cityId && (
              <button
                onClick={() => setShowPromoModal(true)}
                className="mt-2 text-sm text-primary-600 font-medium underline underline-offset-2 hover:text-primary-700 transition-all hover:underline-offset-4"
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

      {/* Additional Info */}
      <div className="bg-primary-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-black mb-2">Important Information</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Valid driving license and ID proof required at pickup</li>
          {paySecurityAtPickup ? (
            <li>• Carry ₹2,000 cash as refundable security deposit</li>
          ) : (
            <li>• Security deposit (₹2,000) included - refund within 3 working days after ride</li>
          )}
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