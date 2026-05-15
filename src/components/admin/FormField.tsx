import React from 'react';
import { handleNumberInputChange } from '../../utils/numberInput';

// ── FormField — defined outside components to prevent focus loss ───────────
export const FormField = ({
  label, value, onChange, type = 'text', required = false,
  placeholder = '', children, className = '', disabled = false,
}: {
  label: string; value?: any; onChange?: (v: any) => void;
  type?: string; required?: boolean; placeholder?: string;
  children?: React.ReactNode; className?: string; disabled?: boolean;
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children ?? (
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          if (type === 'number') {
            // Strip leading zeros + force-sync DOM (handles React bailout
            // when parsed value equals previous state).
            const next = handleNumberInputChange(e);
            if (next !== null) onChange?.(next);
          } else {
            onChange?.(e.target.value);
          }
        }}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
    )}
  </div>
);