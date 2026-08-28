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

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-slate-500', className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-5 py-3.5 align-middle text-[13.5px] text-slate-700', className)}>{children}</td>;
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn('border-b border-slate-50 last:border-0 hover:bg-slate-50/60', className)}>{children}</tr>;
}
