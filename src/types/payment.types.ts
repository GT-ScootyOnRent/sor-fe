export interface PaymentDto {
  id: number;
  bookingId: number;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}