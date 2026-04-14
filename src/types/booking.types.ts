export interface BookingDto {
  id?: number;
  vehicleId: number;
  userId: number;
  pickupLocationId?: number;
  dropLocationId?: number;
  paymentId?: number;
  bookingStartDate: string;
  bookingEndDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: 0 | 1 | 2 | 3; // 0=Pending, 1=Confirmed, 2=Completed, 3=Cancelled
}