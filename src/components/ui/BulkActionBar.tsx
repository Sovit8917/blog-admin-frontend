'use client';

import { X } from 'lucide-react';
import { Button } from './Button';

export interface BulkAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  onClick: () => void;
  loading?: boolean;
}

/** Floating action bar shown when one or more table rows are selected. */
export function BulkActionBar({
  count,
  onClear,
  actions,
}: {
  count: number;
  onClear: () => void;
  actions: BulkAction[];
}) {
  if (count === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-brand-50/70 px-5 py-2.5">
      <button
        onClick={onClear}
        className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[12.5px] font-medium text-slate-600 shadow-sm hover:bg-slate-50"
      >
        <X className="h-3.5 w-3.5" />
        {count} selected
      </button>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Button key={a.label} size="sm" variant={a.variant ?? 'outline'} onClick={a.onClick} loading={a.loading}>
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {a.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
