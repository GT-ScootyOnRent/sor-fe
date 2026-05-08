import { Phone } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { useGetPublicContactQuery } from '../store/api/contactApi';
import { DEFAULT_CONTACT, buildTelHref } from '../config/defaultContact';

interface ContactButtonProps {
  className?: string;
}

export default function ContactButton({ className }: ContactButtonProps) {
  const selectedCity = useAppSelector((s) => s.city.selectedCity);
  const { data: contact, isLoading, isError } = useGetPublicContactQuery({
    cityId: selectedCity?.id ?? null,
  });

  // Loading: render a slim skeleton so the header doesn't shift
  if (isLoading) {
    return (
      <span
        aria-hidden
        className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 animate-pulse text-transparent ${className ?? ''}`}
      >
        <Phone className="w-4 h-4" />
        Loading…
      </span>
    );
  }

  // Determine display values: use API contact if available, otherwise fallback to .env defaults
  // Also fallback on error (404, timeout, server error, etc.)
  const hasValidContact = !isError && contact?.name && contact?.phoneNumber;
  const displayName = hasValidContact ? contact.name : DEFAULT_CONTACT.name;
  const displayPhone = hasValidContact ? contact.phoneNumber : DEFAULT_CONTACT.phoneNumber;

  return (
    <a
      href={buildTelHref(displayPhone)}
      aria-label={`Call ${displayName}`}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-primary-500 text-primary-600 font-semibold hover:bg-primary-500 hover:text-white transition-colors ${className ?? ''}`}
    >
      <Phone className="w-4 h-4" />
      <span>{displayName}</span>
    </a>
  );
}
