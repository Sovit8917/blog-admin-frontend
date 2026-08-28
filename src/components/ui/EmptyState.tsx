import { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-1 text-[14px] font-medium text-slate-700">{title}</p>
      {description && <p className="max-w-sm text-[12.5px] text-slate-400">{description}</p>}
      {action}
    </div>
  );
}
