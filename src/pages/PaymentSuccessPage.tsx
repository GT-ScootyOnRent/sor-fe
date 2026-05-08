import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, MapPin, CreditCard, ClipboardList, Car } from 'lucide-react';
import { Button } from '../components/ui/button';
import Header from '../components/Header';
import { useGetBookingByIdQuery } from '../store/api/bookingApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'sonner';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get('bookingId') || searchParams.get('udf1');
  const txnId = searchParams.get('txnid');
  const amount = searchParams.get('amount');

  const { data: booking, isLoading } = useGetBookingByIdQuery(
    parseInt(bookingId || '0'),
    { skip: !bookingId }
  );

  useEffect(() => {
    toast.success('Payment Successful!', { description: 'Your booking is confirmed.' });
  }, []);

  if (isLoading) return <LoadingSpinner fullScreen message="Loading booking details..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-primary-50">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-2xl">

        {/* Success Banner */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-14 h-14 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">Your payment was successful and your ride is booked.</p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-white">
            <h2 className="text-lg font-bold">Booking Details</h2>
          </div>

          <div className="p-6 space-y-4">
            {/* IDs */}
            <div className="grid grid-cols-2 gap-4">
              {(booking as any)?.vehicleRegistrationNumber && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Car className="w-4 h-4 text-gray-500" />
                    <p className="text-xs text-gray-400">Vehicle No</p>
                  </div>
                  <p className="font-bold text-gray-900 text-lg">
                    {(booking as any).vehicleRegistrationNumber}
                  </p>
                </div>
              )}
              <div className={`bg-gray-50 rounded-xl p-4 ${!(booking as any)?.vehicleRegistrationNumber ? 'col-span-2' : ''}`}>
                <p className="text-xs text-gray-400 mb-1">Transaction ID</p>
                <p className="font-semibold text-gray-900 text-sm break-all">
                  {(booking as any)?.transactionId || txnId || '—'}
                </p>
              </div>
            </div>

            {/* Vehicle */}
            {booking && (
              <>
                <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl">
                  {(booking as any).vehiclePrimaryImageUrl && (
                    <img
                      src={(booking as any).vehiclePrimaryImageUrl}
                      alt={(booking as any).vehicleName}
                      className="w-20 h-20 object-cover rounded-xl"
                    />
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Vehicle</p>
                    <p className="font-bold text-gray-900">
                      {(booking as any).vehicleName || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(booking as any).vehicleMake} {(booking as any).vehicleModel}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl">
                    <Calendar className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Pickup</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {booking.bookingStartDate}
                      </p>
                      <p className="text-xs text-gray-500">{booking.startTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl">
                    <Calendar className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Return</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {booking.bookingEndDate}
                      </p>
                      <p className="text-xs text-gray-500">{booking.endTime}</p>
                    </div>
                  </div>
                </div>

                {/* Pickup Location */}
                {(booking as any).pickupLocationName && (
                  <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl">
                    <MapPin className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Pickup Location</p>
                      <p className="font-semibold text-gray-900">
                        {(booking as any).pickupLocationName}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Amount */}
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-800">Amount Paid</span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                ₹{Number(booking?.totalAmount || amount || 0).toFixed(2)}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-gray-600">Booking Status</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                ✓ Confirmed
              </span>
            </div>
          </div>
        </div>

        {/* Important Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          <p className="font-semibold mb-1">📋 Remember to bring at pickup:</p>
          <ul className="list-disc list-inside space-y-1 text-amber-700">
            <li>Valid driving license (original)</li>
            <li>Government-issued ID (Aadhaar / PAN)</li>
            <li>Security deposit ₹2,000 at pickup (refundable)</li>
          </ul>
        </div>

        {/* Actions */}
        <Button
          onClick={() => navigate(`/booking-form/${booking?.id || bookingId}`)}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold text-lg"
        >
          <ClipboardList className="w-5 h-5 mr-2" />
          Fill the Booking Form
        </Button>
      </div>
    </div>
  );
}
