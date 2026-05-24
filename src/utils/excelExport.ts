import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 * @param data - Array of objects to export
 * @param filename - Name of the file (without extension)
 * @param sheetName - Name of the worksheet
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName: string = 'Sheet1'
): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${date}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, fullFilename);
}

/**
 * Format bookings data for Excel export
 */
export function formatBookingsForExport(bookings: any[]): Record<string, unknown>[] {
  return bookings.map((b) => ({
    'Booking ID': b.id,
    'Vehicle ID': b.vehicleId,
    'Vehicle Name': b.vehicleName || '',
    'Vehicle Reg. No.': b.vehicleRegistrationNumber || '',
    'Customer ID': b.userId,
    'Start Date': b.bookingStartDate,
    'Start Time': b.startTime,
    'End Date': b.bookingEndDate,
    'End Time': b.endTime,
    'Total Amount (₹)': b.totalAmount,
    'Status': getStatusText(b.status),
    'Payment Status': b.paymentStatus || 'N/A',
    'Transaction ID': b.transactionId || '',
    'Pickup Location': b.pickupLocationName || '',
    'F&F Contact': b.friendFamilyContactNumber || '',
    'Security Deposit Mode': b.securityDepositMode || '',
    'Second Helmet': b.includeSecondHelmet ? 'Yes' : 'No',
    'Created At': b.createdAt ? new Date(b.createdAt).toLocaleString() : '',
  }));
}

/**
 * Format payments data for Excel export (from bookings with payment info)
 */
export function formatPaymentsForExport(bookings: any[]): Record<string, unknown>[] {
  return bookings.map((b) => ({
    'Booking ID': b.id,
    'Transaction ID': b.transactionId || 'N/A',
    'Payment Status': b.paymentStatus || 'Pending',
    'Amount (₹)': b.totalAmount,
    'Customer ID': b.userId,
    'Vehicle': b.vehicleName || `Vehicle #${b.vehicleId}`,
    'Booking Status': getStatusText(b.status),
    'Security Deposit Mode': b.securityDepositMode || 'N/A',
    'Booking Date': b.bookingStartDate,
    'Created At': b.createdAt ? new Date(b.createdAt).toLocaleString() : '',
  }));
}

/**
 * Format users/customers data for Excel export
 */
export function formatUsersForExport(users: any[]): Record<string, unknown>[] {
  return users.map((u) => ({
    'Customer ID': u.id,
    'Phone Number': u.userNumber || u.phone || '',
    'Name': u.name || '',
    'Email': u.email || '',
    'City ID': u.cityId || '',
    'Created At': u.createdAt ? new Date(u.createdAt).toLocaleString() : '',
  }));
}

function getStatusText(status: number): string {
  const map: Record<number, string> = {
    0: 'Pending',
    1: 'Confirmed',
    2: 'Completed',
    3: 'Cancelled',
  };
  return map[status] ?? 'Unknown';
}
