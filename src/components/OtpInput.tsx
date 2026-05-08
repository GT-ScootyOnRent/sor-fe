import React, { useRef, useEffect } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';

interface OtpInputProps {
    value: string;
    onChange: (value: string) => void;
    length?: number;
    disabled?: boolean;
    autoFocus?: boolean;
    onComplete?: () => void;
}

export default function OtpInput({
    value,
    onChange,
    length = 6,
    disabled = false,
    autoFocus = false,
    onComplete,
}: OtpInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const hasCalledComplete = useRef(false);
    const onCompleteRef = useRef(onComplete);

    // Keep the ref updated with latest callback
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Focus first input on mount if autoFocus
    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [autoFocus]);

    // Reset the hasCalledComplete flag when value becomes incomplete
    useEffect(() => {
        if (value.length < length) {
            hasCalledComplete.current = false;
        }
    }, [value, length]);

    // Call onComplete when all digits are entered (only once)
    useEffect(() => {
        if (value.length === length && onCompleteRef.current && !hasCalledComplete.current) {
            hasCalledComplete.current = true;
            onCompleteRef.current();
        }
    }, [value, length]);

    const handleChange = (index: number, digit: string) => {
        // Only allow digits
        const sanitized = digit.replace(/\D/g, '');
        if (!sanitized && digit !== '') return;

        const newValue = value.split('');
        newValue[index] = sanitized;
        const joined = newValue.join('').slice(0, length);
        onChange(joined);

        // Move to next input if digit was entered
        if (sanitized && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                // If current input is empty, move to previous and clear it
                inputRefs.current[index - 1]?.focus();
                const newValue = value.split('');
                newValue[index - 1] = '';
                onChange(newValue.join(''));
            } else {
                // Clear current input
                const newValue = value.split('');
                newValue[index] = '';
                onChange(newValue.join(''));
            }
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        if (pasted) {
            onChange(pasted);
            // Focus the next empty input or the last one
            const nextIndex = Math.min(pasted.length, length - 1);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    return (
        <div className="flex justify-center gap-2 sm:gap-3">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[index] || ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={handleFocus}
                    disabled={disabled}
                    className={`
            w-10 h-12 sm:w-12 sm:h-14 
            text-center text-xl sm:text-2xl font-semibold
            border-2 rounded-lg
            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-colors
            ${value[index] ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
          `}
                    aria-label={`Digit ${index + 1}`}
                />
            ))}
        </div>
    );
}
