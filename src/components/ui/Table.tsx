import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-slate-100 bg-slate-50/60">{children}</thead>;
}

export function Th({
  children,
  className,
  sortKey,
  activeSort,
  onSort,
}: {
  children: React.ReactNode;
  className?: string;
  /** If provided along with onSort, renders this header as a clickable sort control. */
  sortKey?: string;
  activeSort?: { sortBy: string; sortOrder: 'asc' | 'desc' };
  onSort?: (key: string) => void;
}) {
  if (!sortKey || !onSort) {
    return (
      <th className={cn('px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-slate-500', className)}>
        {children}
      </th>
    );
  }
  const isActive = activeSort?.sortBy === sortKey;
  const Icon = isActive ? (activeSort!.sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={cn('px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-slate-500', className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 transition-colors hover:text-slate-700',
          isActive && 'text-slate-800',
        )}
      >
        {children}
        <Icon className={cn('h-3 w-3', isActive ? 'text-slate-600' : 'text-slate-300')} />
      </button>
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-5 py-3.5 align-middle text-[13.5px] text-slate-700', className)}>{children}</td>;
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn('border-b border-slate-50 last:border-0 hover:bg-slate-50/60', className)}>{children}</tr>;
}

/** Shared sort-state helper: click a sortable column to sort asc, click again to flip, click a different column to switch to it (desc first). */
export function useTableSort(defaultSortBy: string, defaultSortOrder: 'asc' | 'desc' = 'desc') {
  return { defaultSortBy, defaultSortOrder };
}
