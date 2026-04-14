
export const calculateTotalPrice = (
  hourlyRate: number,
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): number => {
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);
  const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  return hourlyRate * Math.max(hours, 1);
};

export const calculateDuration = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): number => {
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
};

export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (time: string): string => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};