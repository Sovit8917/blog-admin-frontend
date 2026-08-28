import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'brand',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  tone?: 'brand' | 'green' | 'amber' | 'violet';
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] font-medium text-slate-500">{label}</p>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-none text-slate-900">{value}</p>
      {sub && <p className="mt-2 text-[12px] text-slate-400">{sub}</p>}
    </div>
  );
}
