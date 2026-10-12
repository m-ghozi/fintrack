import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/src/lib/utils';

export interface CurrencyInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  id?: string;
  name?: string;
}

/**
 * Currency input with thousand separators (Indonesian format).
 * - Displays "5.000.000" while typing
 * - Allows empty display while typing (not forced to "0")
 * - Only accepts numeric input
 * - Validation happens at form submit level
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder,
  error,
  className,
  required,
  disabled,
  min,
  id,
  name,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Sync display value when value changes externally (reset, edit, etc.)
  useEffect(() => {
    if (!isFocused) {
      if (value === undefined || value === null || isNaN(value)) {
        setDisplayValue('');
      } else {
        setDisplayValue(formatNumber(value));
      }
    }
  }, [value, isFocused]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // Strip all non-digit characters
      const digitsOnly = raw.replace(/\D/g, '');

      // If empty, show empty (allow empty display)
      if (!digitsOnly) {
        setDisplayValue('');
        onChange(undefined);
        return;
      }

      // Remove leading zeros
      const trimmed = digitsOnly.replace(/^0+/, '') || '0';
      const numValue = parseInt(trimmed, 10);

      // Format with thousand separators
      setDisplayValue(formatNumber(numValue));
      onChange(numValue);
    },
    [onChange]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Re-sync display with value on blur
    if (value === undefined || value === null || isNaN(value)) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatNumber(value));
    }
  }, [value]);

  return (
    <div className="w-full">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">
          Rp
        </span>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          pattern="[0-9.]*"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-900 dark:text-zinc-100',
            error && 'border-rose-500 focus-visible:ring-rose-500',
            className
          )}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
};

/**
 * Format number with Indonesian thousand separators (dots)
 * e.g., 5000000 -> "5.000.000"
 */
function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}
