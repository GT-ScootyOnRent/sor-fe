import React from 'react';
import OfflineBookingForm from '../../components/admin/OfflineBookingForm';

const OfflineBookingPage: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Offline Booking Entry</h1>
        <p className="text-gray-500 mt-1">Enter offline booking details from the physical form into the system.</p>
      </div>
      <OfflineBookingForm />
    </div>
  );
};

export default OfflineBookingPage;