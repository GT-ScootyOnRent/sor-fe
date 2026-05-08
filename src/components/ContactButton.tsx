import { Phone } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { useGetPublicContactQuery } from '../store/api/contactApi';
import { DEFAULT_CONTACT, buildTelHref } from '../config/defaultContact';

interface ContactButtonProps {
  className?: string;
}

// Same visual shape as the Profile button (shadcn Button outline variant):
//   h-10, px-4, py-2, rounded-md, border, text-sm font-medium.
// `min-w-[120px]` keeps the width consistent with Profile so the two buttons
// read as a balanced pair in the header.
const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-md ' +
  'text-sm font-medium transition-colors min-w-[120px] max-w-[200px]';

export default function ContactButton({ className }: ContactButtonProps) {
  const selectedCity = useAppSelector((s) => s.city.selectedCity);
  const { data: contact, isLoading, isError } = useGetPublicContactQuery({
    cityId: selectedCity?.id ?? null,
  });

  // Loading skeleton — matches the final shape so the header doesn't shift.
  // Visibility (mobile vs desktop) is handled by the parent in Header.tsx.
  if (isLoading) {
    return (
      <span
        aria-hidden
        className={`${BASE_CLASSES} border border-gray-200 bg-gray-100 animate-pulse text-transparent ${className ?? ''}`}
      >
        <Phone className="w-4 h-4" />
        Loading…
      </span>
    );
  }

  const hasValidContact = !isError && contact?.name && contact?.phoneNumber;
  const displayName = hasValidContact ? contact.name : DEFAULT_CONTACT.name;
  const displayPhone = hasValidContact ? contact.phoneNumber : DEFAULT_CONTACT.phoneNumber;

  return (
    <a
      href={buildTelHref(displayPhone)}
      aria-label={`Call ${displayName}`}
      className={`${BASE_CLASSES} border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white ${className ?? ''}`}
    >
      <Phone className="w-4 h-4 shrink-0" />
      <span className="truncate">{displayName}</span>
    </a>
  );
}
