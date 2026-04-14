import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  User, Phone, Calendar, Car, FileText,
  Hash, Shield, Loader2, CheckCircle, AlertCircle, Plus, Upload, Camera, X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateOfflineBookingMutation,
  useUploadOfflineBookingDocumentMutation,
  type CreateOfflineBookingDto,
  type OfflineBookingDocumentDto,
} from '../../store/api/offlineBookingApi';
import { useGetAllPickupLocationsQuery } from '../../store/api/pickupLocationApi';
import { useGetVehiclesQuery } from '../../store/api/vehicleApi';

const ID_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'voter_id', label: "Voter's ID" },
  { value: 'driving_license', label: 'Driving License' },
];

const DOCUMENT_TYPES = [
  { value: 'id_proof', label: 'ID Proof' },
  { value: 'vehicle_before', label: 'Vehicle (Before)' },
  { value: 'vehicle_after', label: 'Vehicle (After)' },
  { value: 'other', label: 'Other' },
];

const DOCUMENT_TYPE_OPTIONS = {
  id_proof: 'ID Proof',
  vehicle_before: 'Vehicle (Before)',
  vehicle_after: 'Vehicle (After)',
  other: 'Other',
} as const;

interface FormState {
  guestPhone: string;
  guestName: string;
  guestAddress: string;
  hotelName: string;
  hotelAddress: string;
  pickupLocationId: string;
  bookingStartDate: string;
  bookingEndDate: string;
  startTime: string;
  endTime: string;
  totalAmount: string;
  rate: string;
  primaryVehicleId: string;
  vehicleNumbers: string[];
  numberOfVehicles: string;
  numberOfDays: string;
  openingKms: string[];
  closingKms: string[];
  securityAmount: string;
  drivingLicenseNo: string;
  idType: string;
  idNumber: string;
  documents: OfflineBookingDocumentDto[];
}

const INITIAL_FORM: FormState = {
  guestPhone: '',
  guestName: '',
  guestAddress: '',
  hotelName: '',
  hotelAddress: '',
  pickupLocationId: '',
  bookingStartDate: '',
  bookingEndDate: '',
  startTime: '10:00',
  endTime: '18:00',
  totalAmount: '',
  rate: '',
  primaryVehicleId: '',
  vehicleNumbers: [''],
  numberOfVehicles: '1',
  numberOfDays: '',
  openingKms: [''],
  closingKms: [''],
  securityAmount: '',
  drivingLicenseNo: '',
  idType: '',
  idNumber: '',
  documents: [],
};

const calculateBookingDays = (startDate: string, endDate: string): number | null => {
  if (!startDate || !endDate) {
    return null;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return null;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
};

const calculateBookingHours = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): number | null => {
  if (!startDate || !startTime || !endDate || !endTime) {
    return null;
  }

  const start = new Date(`${startDate}T${startTime}:00`);
  const end = new Date(`${endDate}T${endTime}:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }

  const millisecondsPerHour = 60 * 60 * 1000;
  return (end.getTime() - start.getTime()) / millisecondsPerHour;
};

const formatCalculatedAmount = (amount: number): string => {
  return Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
};

const syncArrayLength = (values: string[], targetLength: number): string[] => {
  const normalizedLength = Math.max(1, Math.min(targetLength, 4));
  if (values.length === normalizedLength) {
    return values;
  }

  if (values.length > normalizedLength) {
    return values.slice(0, normalizedLength);
  }

  return [...values, ...Array.from({ length: normalizedLength - values.length }, () => '')];
};

const OfflineBookingForm: React.FC = () => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [successData, setSuccessData] = useState<{ bookingId: number; userId: number } | null>(null);
  const [isTotalAmountEdited, setIsTotalAmountEdited] = useState(false);
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
  const [selectedDocumentLabel, setSelectedDocumentLabel] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createOfflineBooking, { isLoading }] = useCreateOfflineBookingMutation();
  const [uploadOfflineBookingDocument, { isLoading: isUploadingDocument }] = useUploadOfflineBookingDocumentMutation();
  const { data: vehicles = [] } = useGetVehiclesQuery(undefined);
  const { data: pickupLocations = [] } = useGetAllPickupLocationsQuery({ page: 1, size: 100 });

  const calculatedNumberOfDays = useMemo(
    () => calculateBookingDays(form.bookingStartDate, form.bookingEndDate),
    [form.bookingStartDate, form.bookingEndDate]
  );

  const calculatedBookingHours = useMemo(
    () => calculateBookingHours(form.bookingStartDate, form.startTime, form.bookingEndDate, form.endTime),
    [form.bookingStartDate, form.startTime, form.bookingEndDate, form.endTime]
  );

  const calculatedAmount = useMemo(() => {
    const hourlyRate = Number.parseFloat(form.rate);
    if (Number.isNaN(hourlyRate) || hourlyRate < 0 || calculatedBookingHours === null) {
      return null;
    }

    return hourlyRate * calculatedBookingHours;
  }, [form.rate, calculatedBookingHours]);

  const numberOfDaysMismatch = Boolean(
    calculatedNumberOfDays
    && form.numberOfDays
    && parseInt(form.numberOfDays, 10) !== calculatedNumberOfDays
  );

  const hasInvalidDateRange = Boolean(
    form.bookingStartDate
    && form.bookingEndDate
    && calculatedNumberOfDays === null
  );

  const hasInvalidBookingDuration = Boolean(
    form.bookingStartDate
    && form.bookingEndDate
    && form.startTime
    && form.endTime
    && calculatedBookingHours === null
  );

  useEffect(() => {
    if (calculatedAmount === null || isTotalAmountEdited) {
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      totalAmount: formatCalculatedAmount(calculatedAmount),
    }));
  }, [calculatedAmount, isTotalAmountEdited]);

  const updateVehicleCount = (rawValue: string) => {
    setForm((currentForm) => {
      if (rawValue === '') {
        return { ...currentForm, numberOfVehicles: '' };
      }

      const digitsOnly = rawValue.replace(/\D/g, '');
      const normalizedInput = digitsOnly.length > 1 ? digitsOnly.slice(-1) : digitsOnly;
      const vehicleCount = Number.parseInt(normalizedInput, 10);
      if (Number.isNaN(vehicleCount)) {
        return currentForm;
      }

      const normalizedVehicleCount = Math.max(1, Math.min(vehicleCount, 4));

      return {
        ...currentForm,
        numberOfVehicles: normalizedVehicleCount.toString(),
        vehicleNumbers: syncArrayLength(currentForm.vehicleNumbers, normalizedVehicleCount),
        openingKms: syncArrayLength(currentForm.openingKms, normalizedVehicleCount),
        closingKms: syncArrayLength(currentForm.closingKms, normalizedVehicleCount),
      };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'numberOfVehicles') {
      updateVehicleCount(value);
      return;
    }

    if (name === 'totalAmount') {
      setIsTotalAmountEdited(true);
    }

    setForm((currentForm) => {
      const nextForm = { ...currentForm, [name]: value };

      if (name === 'bookingStartDate' || name === 'bookingEndDate') {
        const nextCalculatedDays = calculateBookingDays(nextForm.bookingStartDate, nextForm.bookingEndDate);
        if (nextCalculatedDays) {
          nextForm.numberOfDays = nextCalculatedDays.toString();
        }
      }

      return nextForm;
    });
  };

  const handleVehicleNumberChange = (index: number, value: string) => {
    const updated = [...form.vehicleNumbers];
    updated[index] = value;
    setForm({ ...form, vehicleNumbers: updated });
  };

  const handleVehicleKmChange = (field: 'openingKms' | 'closingKms', index: number, value: string) => {
    const updated = [...form[field]];
    updated[index] = value;
    setForm({ ...form, [field]: updated });
  };

  const handleVehicleCountBlur = () => {
    const normalizedValue = form.numberOfVehicles === ''
      ? '1'
      : Math.max(1, Math.min(Number.parseInt(form.numberOfVehicles, 10) || 1, 4)).toString();

    updateVehicleCount(normalizedValue);
  };

  const removeDocument = (index: number) => {
    setForm({ ...form, documents: form.documents.filter((_, i) => i !== index) });
  };

  const resetDocumentUploadState = () => {
    setShowDocumentUploadModal(false);
    setSelectedDocumentType('');
    setSelectedDocumentFile(null);
    setSelectedDocumentLabel('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDocumentUpload = async () => {
    if (!selectedDocumentFile || !selectedDocumentType) {
      toast.error('Please select a document type and file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedDocumentFile);
    formData.append('documentType', selectedDocumentType);

    try {
      const uploaded = await uploadOfflineBookingDocument(formData).unwrap();
      setForm((currentForm) => ({
        ...currentForm,
        documents: [
          ...currentForm.documents,
          {
            documentType: selectedDocumentType,
            fileUrl: uploaded.fileUrl,
            fileType: uploaded.fileType,
            label: selectedDocumentLabel || selectedDocumentFile.name,
          },
        ],
      }));
      toast.success('Document uploaded successfully.');
      resetDocumentUploadState();
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to upload document.');
    }
  };

  const updateDocumentLabel = (index: number, value: string) => {
    const updated = [...form.documents];
    updated[index] = {
      ...updated[index],
      label: value,
    };
    setForm({ ...form, documents: updated });
  };

  const openDocumentUploadModal = (documentType?: string) => {
    setSelectedDocumentType(documentType ?? '');
    setSelectedDocumentFile(null);
    setSelectedDocumentLabel('');
    setShowDocumentUploadModal(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setSuccessData(null);
    setIsTotalAmountEdited(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedVehicleNumbers = form.vehicleNumbers.map((value) => value.trim());
    const filledVehicleIndexes = trimmedVehicleNumbers
      .map((value, index) => value !== '' ? index : -1)
      .filter((index) => index !== -1);

    const kmWithoutVehicleIndex = trimmedVehicleNumbers.findIndex((value, index) => {
      const hasOpeningKm = form.openingKms[index]?.trim() !== '';
      const hasClosingKm = form.closingKms[index]?.trim() !== '';
      return value === '' && (hasOpeningKm || hasClosingKm);
    });

    const missingKmIndex = filledVehicleIndexes.find((index) => {
      const hasOpeningKm = form.openingKms[index]?.trim() !== '';
      const hasClosingKm = form.closingKms[index]?.trim() !== '';
      return !hasOpeningKm || !hasClosingKm;
    });

    if (!form.guestPhone || form.guestPhone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!form.primaryVehicleId) {
      toast.error('Please select a primary vehicle.');
      return;
    }
    if (filledVehicleIndexes.length === 0) {
      toast.error('Enter at least one vehicle number.');
      return;
    }
    if (kmWithoutVehicleIndex >= 0) {
      toast.error(`Vehicle row ${kmWithoutVehicleIndex + 1} has KM values but no vehicle number.`);
      return;
    }
    if (missingKmIndex !== undefined) {
      toast.error(`Opening and closing KM are required for vehicle row ${missingKmIndex + 1}.`);
      return;
    }
    if (!form.pickupLocationId) {
      toast.error('Please select a pickup location.');
      return;
    }
    if (!form.bookingStartDate || !form.bookingEndDate) {
      toast.error('Please select booking start and end dates.');
      return;
    }
    if (hasInvalidDateRange) {
      toast.error('Drop date must be the same as or after pickup date.');
      return;
    }
    if (hasInvalidBookingDuration) {
      toast.error('Drop time must be after pickup time for the selected booking dates.');
      return;
    }
    if (!form.numberOfDays) {
      toast.error('Number of days is required.');
      return;
    }
    if (numberOfDaysMismatch) {
      toast.error('Number of days does not match the selected date range.');
      return;
    }
    if (!form.totalAmount || parseFloat(form.totalAmount) <= 0) {
      toast.error('Please enter a valid total amount.');
      return;
    }

    const dto: CreateOfflineBookingDto = {
      guestPhone: form.guestPhone.replace(/\D/g, ''),
      guestName: form.guestName || undefined,
      guestAddress: form.guestAddress || undefined,
      hotelName: form.hotelName || undefined,
      hotelAddress: form.hotelAddress || undefined,
      pickupLocationId: parseInt(form.pickupLocationId),
      bookingStartDate: form.bookingStartDate,
      bookingEndDate: form.bookingEndDate,
      startTime: form.startTime + ':00',
      endTime: form.endTime + ':00',
      totalAmount: parseFloat(form.totalAmount),
      rate: parseFloat(form.rate) || 0,
      primaryVehicleId: parseInt(form.primaryVehicleId),
      vehicleNumbers: trimmedVehicleNumbers,
      numberOfVehicles: parseInt(form.numberOfVehicles) || 1,
      numberOfDays: parseInt(form.numberOfDays) || 1,
      openingKm: form.openingKms[0] ? parseInt(form.openingKms[0], 10) : undefined,
      closingKm: form.closingKms[0] ? parseInt(form.closingKms[0], 10) : undefined,
      openingKms: form.openingKms.map((value) => value === '' ? null : parseInt(value, 10)),
      closingKms: form.closingKms.map((value) => value === '' ? null : parseInt(value, 10)),
      securityAmount: form.securityAmount ? parseFloat(form.securityAmount) : undefined,
      drivingLicenseNo: form.drivingLicenseNo || undefined,
      idType: form.idType || undefined,
      idNumber: form.idNumber || undefined,
      documents: form.documents.filter(d => d.fileUrl.trim() !== ''),
    };

    try {
      const result = await createOfflineBooking(dto).unwrap();
      if (result.success) {
        toast.success('Offline booking created successfully!');
        setSuccessData({ bookingId: result.bookingId!, userId: result.userId! });
      } else {
        toast.error(result.message || 'Failed to create booking.');
      }
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to create offline booking. Please try again.');
    }
  };

  if (successData) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Recorded!</h2>
        <p className="text-gray-600 mb-1">Booking ID: <span className="font-semibold text-primary-600">#{successData.bookingId}</span></p>
        <p className="text-gray-600 mb-6">User ID: <span className="font-semibold">{successData.userId}</span></p>
        <button
          onClick={handleReset}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition"
        >
          Add Another Booking
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Guest Information */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-primary-600" />
          Guest Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="guestPhone"
                value={form.guestPhone}
                onChange={handleChange}
                placeholder="9876543210"
                maxLength={10}
                required
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
            <input
              type="text"
              name="guestName"
              value={form.guestName}
              onChange={handleChange}
              placeholder="Full name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              name="guestAddress"
              value={form.guestAddress}
              onChange={handleChange}
              placeholder="Guest address"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
            <input
              type="text"
              name="hotelName"
              value={form.hotelName}
              onChange={handleChange}
              placeholder="Hotel / Stay name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Address</label>
            <input
              type="text"
              name="hotelAddress"
              value={form.hotelAddress}
              onChange={handleChange}
              placeholder="Hotel address"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Booking Dates & Location */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-primary-600" />
          Booking Dates & Location
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="bookingStartDate"
              value={form.bookingStartDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drop Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="bookingEndDate"
              value={form.bookingEndDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drop Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Location <span className="text-red-500">*</span>
            </label>
            <select
              name="pickupLocationId"
              value={form.pickupLocationId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition bg-white"
            >
              <option value="">Select pickup location</option>
              {pickupLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}{location.address ? ` - ${location.address}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Days</label>
            <input
              type="number"
              name="numberOfDays"
              value={form.numberOfDays}
              onChange={handleChange}
              min={1}
              placeholder="1"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
            {calculatedNumberOfDays && !numberOfDaysMismatch && !hasInvalidDateRange && (
              <p className="mt-1 text-xs text-gray-500">
                Calculated from selected dates: {calculatedNumberOfDays} day{calculatedNumberOfDays > 1 ? 's' : ''}
              </p>
            )}
            {hasInvalidDateRange && (
              <p className="mt-1 text-xs text-red-600">
                Drop date must be the same as or after pickup date.
              </p>
            )}
            {numberOfDaysMismatch && calculatedNumberOfDays && (
              <p className="mt-1 text-xs text-red-600">
                Number of days does not match the selected dates. Expected {calculatedNumberOfDays} day{calculatedNumberOfDays > 1 ? 's' : ''}.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Car className="w-5 h-5 mr-2 text-primary-600" />
          Vehicle Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Vehicle <span className="text-red-500">*</span>
            </label>
            <select
              name="primaryVehicleId"
              value={form.primaryVehicleId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition bg-white"
            >
              <option value="">Select vehicle</option>
              {vehicles.map((v: any) => (
                <option key={v.id} value={v.id}>{v.name} — {v.make} {v.model}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Vehicles</label>
            <input
              type="number"
              name="numberOfVehicles"
              value={form.numberOfVehicles}
              onChange={handleChange}
              onBlur={handleVehicleCountBlur}
              onFocus={(e) => e.target.select()}
              min={1}
              max={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Numbers & KM Details</label>
            <div className="space-y-2">
              {form.vehicleNumbers.map((vn, index) => (
                <div key={index} className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 md:grid-cols-3">
                  <input
                    type="text"
                    value={vn}
                    onChange={e => handleVehicleNumberChange(index, e.target.value)}
                    placeholder={`Vehicle No. ${index + 1}`}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition uppercase"
                  />
                  <input
                    type="number"
                    value={form.openingKms[index] ?? ''}
                    onChange={e => handleVehicleKmChange('openingKms', index, e.target.value)}
                    placeholder={`Opening KM ${index + 1}`}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  />
                  <input
                    type="number"
                    value={form.closingKms[index] ?? ''}
                    onChange={e => handleVehicleKmChange('closingKms', index, e.target.value)}
                    placeholder={`Closing KM ${index + 1}`}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  />
                </div>
              ))}
              <p className="text-xs text-gray-500">
                Increasing the number of vehicles will automatically add matching vehicle number, opening KM, and closing KM fields.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Hash className="w-5 h-5 mr-2 text-primary-600" />
          Pricing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate (₹/hour)
            </label>
            <input
              type="number"
              name="rate"
              value={form.rate}
              onChange={handleChange}
              placeholder="0"
              min={0}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
            {calculatedBookingHours !== null && (
              <p className="mt-1 text-xs text-gray-500">
                Total usage time: {calculatedBookingHours.toFixed(2)} hours
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="totalAmount"
              value={form.totalAmount}
              onChange={handleChange}
              placeholder="0.00"
              min={0}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
            {calculatedAmount !== null && (
              <p className="mt-1 text-xs text-gray-500">
                Calculated amount: ₹{formatCalculatedAmount(calculatedAmount)}. Staff can still edit the final amount.
              </p>
            )}
            {hasInvalidBookingDuration && (
              <p className="mt-1 text-xs text-red-600">
                Drop time must be after pickup time for the selected booking dates.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Security Amount (₹)</label>
            <input
              type="number"
              name="securityAmount"
              value={form.securityAmount}
              onChange={handleChange}
              placeholder="0.00"
              min={0}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* ID & Documents */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-primary-600" />
          Identity & Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Driving License No.</label>
            <input
              type="text"
              name="drivingLicenseNo"
              value={form.drivingLicenseNo}
              onChange={handleChange}
              placeholder="DL number"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Taken</label>
            <select
              name="idType"
              value={form.idType}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition bg-white"
            >
              <option value="">Select ID type</option>
              {ID_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
            <input
              type="text"
              name="idNumber"
              value={form.idNumber}
              onChange={handleChange}
              placeholder="ID number"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* File Documents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-700">Attached Files / Photos</label>
            <button
              type="button"
              onClick={() => openDocumentUploadModal()}
              className="flex items-center text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition"
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => openDocumentUploadModal('id_proof')}
              className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <FileText className="w-5 h-5 text-primary-600 mr-3" />
              <span>Upload ID Proof</span>
            </button>
            <button
              type="button"
              onClick={() => openDocumentUploadModal('vehicle_before')}
              className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <Camera className="w-5 h-5 text-green-600 mr-3" />
              <span>Vehicle Before</span>
            </button>
            <button
              type="button"
              onClick={() => openDocumentUploadModal('vehicle_after')}
              className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <Camera className="w-5 h-5 text-blue-600 mr-3" />
              <span>Vehicle After</span>
            </button>
            <button
              type="button"
              onClick={() => openDocumentUploadModal('other')}
              className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <Plus className="w-5 h-5 text-slate-600 mr-3" />
              <span>Other Document</span>
            </button>
          </div>

          {form.documents.length === 0 && (
            <p className="text-sm text-gray-400 italic">No documents uploaded yet.</p>
          )}
          <div className="space-y-3">
            {form.documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 capitalize">
                      {DOCUMENT_TYPE_OPTIONS[doc.documentType as keyof typeof DOCUMENT_TYPE_OPTIONS] || doc.documentType.replace('_', ' ')}
                    </p>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      View uploaded {doc.fileType}
                    </a>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={doc.label || ''}
                    onChange={e => updateDocumentLabel(index, e.target.value)}
                    placeholder="Label (optional)"
                    className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="px-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDocumentUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Upload Document</h3>
              <button
                type="button"
                onClick={resetDocumentUploadState}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={selectedDocumentType}
                  onChange={(e) => setSelectedDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">Select type</option>
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf"
                  onChange={(e) => setSelectedDocumentFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                {selectedDocumentFile && (
                  <p className="text-sm text-gray-500 mt-1">
                    Selected: {selectedDocumentFile.name} ({(selectedDocumentFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input
                  type="text"
                  value={selectedDocumentLabel}
                  onChange={(e) => setSelectedDocumentLabel(e.target.value)}
                  placeholder="Optional label"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetDocumentUploadState}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDocumentUpload}
                  disabled={!selectedDocumentFile || !selectedDocumentType || isUploadingDocument}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isUploadingDocument && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Declaration & Submit */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              <strong>Declaration:</strong> I hereby declare that the vehicle has been received in good condition. Any damage will be borne by the renter. The renter accepts all risks including injury, death, or any risk associated with the use of the vehicle. All disputes subject to Udaipur jurisdiction.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold text-gray-700"
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving Booking...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Save Offline Booking
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default OfflineBookingForm;