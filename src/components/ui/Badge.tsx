import { cn } from '@/lib/utils';

type Tone = 'slate' | 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'rose';

const tones: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export function Badge({
  children,
  tone = 'slate',
  className,
  dot,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case 'PUBLISHED':
    case 'APPROVED':
    case 'CONFIRMED':
    case 'OPEN':
      return 'green';
    case 'DRAFT':
    case 'PENDING':
      return 'amber';
    case 'REJECTED':
    case 'SPAM':
    case 'ARCHIVED':
    case 'CLOSED':
      return 'red';
    case 'SCHEDULED':
    case 'IN_REVIEW':
      return 'blue';
    default:
      return 'slate';
  }
}
