import { Phone } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { useGetPublicContactQuery } from '../store/api/contactApi';

interface ContactButtonProps {
  className?: string;
}

const buildTelHref = (raw: string) => `tel:${raw.replace(/[^\d+]/g, '')}`;

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

  // Error or 404: hide silently (Acceptance Criteria allows fallback or hide)
  if (isError || !contact) return null;

  return (
    <a
      href={buildTelHref(contact.phoneNumber)}
      aria-label={`Call ${contact.name} at ${contact.phoneNumber}`}
      title={`${contact.name} · ${contact.phoneNumber}`}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-primary-500 text-primary-600 font-semibold hover:bg-primary-500 hover:text-white transition-colors ${className ?? ''}`}
    >
      <Phone className="w-4 h-4" />
      <span>Support</span>
    </a>
  );
}
