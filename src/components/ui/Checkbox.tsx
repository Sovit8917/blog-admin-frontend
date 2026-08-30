'use client';

import { cn } from '@/lib/utils';

export function Checkbox({
  checked,
  indeterminate,
  onChange,
  className,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate && !checked;
      }}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500',
        className,
      )}
    />
  );
}
