'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({
  page,
  totalPages,
  onChange,
  total,
  limit,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  total?: number;
  limit?: number;
}) {
  if (totalPages <= 1 && !total) return null;
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
      <p className="text-[12.5px] text-slate-500">
        {total !== undefined && limit !== undefined ? (
          <>
            Showing <span className="font-medium text-slate-700">{Math.min((page - 1) * limit + 1, total)}</span>–
            <span className="font-medium text-slate-700">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-medium text-slate-700">{total}</span>
          </>
        ) : (
          `Page ${page} of ${totalPages}`
        )}
      </p>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </Button>
        <span className="px-2 text-[12.5px] text-slate-500">
          {page} / {Math.max(1, totalPages)}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
