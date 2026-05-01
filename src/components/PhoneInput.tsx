import { forwardRef } from 'react';
import { isValidPhoneNumber } from 'libphonenumber-js/min';
import { cn } from './ui/utils';

interface PhoneInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    { id, value, onChange, disabled, hasError, placeholder, className, onKeyDown },
    ref,
  ) {
    return (
      <div
        className={cn(
          'flex items-center w-full border rounded-lg overflow-hidden bg-white transition',
          'focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent',
          disabled && 'opacity-60 cursor-not-allowed',
          hasError ? 'border-red-400' : 'border-gray-300',
          className,
        )}
      >
        <div
          aria-hidden
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-r border-gray-200 text-gray-700 select-none shrink-0"
        >
          <span className="text-base leading-none">🇮🇳</span>
          <span className="text-sm font-medium">+91</span>
        </div>
        <input
          ref={ref}
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          disabled={disabled}
          maxLength={10}
          placeholder={placeholder ?? '9876543210'}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          onKeyDown={onKeyDown}
          className="flex-1 min-w-0 px-3 py-2 outline-none bg-transparent text-gray-900 placeholder:text-gray-400 disabled:cursor-not-allowed"
        />
      </div>
    );
  },
);

export function isValidIndianMobile(nationalNumber: string): boolean {
  if (!/^[6-9]\d{9}$/.test(nationalNumber)) return false;
  return isValidPhoneNumber(`+91${nationalNumber}`, 'IN');
}

export const toE164 = (nationalNumber: string): string => `+91${nationalNumber}`;
