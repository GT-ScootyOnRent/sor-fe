import React, { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import {
  useGetBookingsQuery,
  useUpdateBookingMutation,
} from '../../store/api/bookingApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const BookingsTab: React.FC = () => {
  const [bookingSort, setBookingSort] = useState<{ column: string; direction: 'asc' | 'desc' }>({
    column: 'id', direction: 'desc',
  });

  // ── API Calls ──────────────────────────────────────────────────────────
  const { data: bookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = useGetBookingsQuery({ page: 1, size: 100 });
  const [updateBooking] = useUpdateBookingMutation();

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleUpdateBookingStatus = async (bookingId: number, status: 0 | 1 | 2 | 3) => {
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return;
      await updateBooking({ id: bookingId, booking: { ...booking, status } }).unwrap();
      toast.success('Booking status updated');
      refetchBookings();
    } catch { toast.error('Failed to update booking'); }
  };

  const handleSortBookings = (column: string) => {
    setBookingSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' }
    );
  };

  // ── Sorted Data ────────────────────────────────────────────────────────
  const sortedBookings = [...bookings].sort((a, b) => {
    const aVal = (a as any)[bookingSort.column];
    const bVal = (b as any)[bookingSort.column];
    if (aVal < bVal) return bookingSort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return bookingSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status: number) => {
    const map: Record<number, { text: string; color: string }> = {
      0: { text: 'Pending',   color: 'bg-yellow-100 text-yellow-800' },
      1: { text: 'Confirmed', color: 'bg-green-100 text-green-800' },
      2: { text: 'Completed', color: 'bg-primary-100 text-blue-800' },
      3: { text: 'Cancelled', color: 'bg-red-100 text-red-800' },
    };
    const { text, color } = map[status] ?? { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>{text}</span>;
  };

  const SortIcon = ({ column }: { column: string }) => (
    <button onClick={() => handleSortBookings(column)} className="flex items-center ml-1">
      <ChevronDown className={`w-4 h-4 ${bookingSort.column === column ? 'text-primary-600' : 'text-gray-400'}`} />
    </button>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Booking Management</h1>
      {bookingsLoading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { label: 'Booking ID',  col: 'id'                       },
                  { label: 'Vehicle ID',  col: 'vehicleId'                },
                  { label: 'Customer ID',     col: 'userId'                   },
                  { label: 'F&F Contact', col: 'friendFamilyContactNumber'},
                  { label: 'Start Date',  col: 'bookingStartDate'         },
                  { label: 'Amount',      col: 'totalAmount'              },
                  { label: 'Status',      col: null                       },
                  { label: 'Actions',     col: null                       },
                ].map(({ label, col }) => (
                  <th key={label} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    {col ? (
                      <button onClick={() => handleSortBookings(col)} className="flex items-center">
                        {label}<SortIcon column={col} />
                      </button>
                    ) : label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">#{booking.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Vehicle #{booking.vehicleId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Customer #{booking.userId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {booking.friendFamilyContactNumber || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {String(booking.bookingStartDate)} → {String(booking.bookingEndDate)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{booking.totalAmount}</td>
                  <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {booking.status === 0 && (
                        <>
                          <button onClick={() => handleUpdateBookingStatus(booking.id!, 1)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Confirm">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleUpdateBookingStatus(booking.id!, 3)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Cancel">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {booking.status === 1 && (
                        <button onClick={() => handleUpdateBookingStatus(booking.id!, 2)} className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200">
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sortedBookings.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No bookings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BookingsTab;