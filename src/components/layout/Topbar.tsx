'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/auth-store';
import { usePermissionsStore } from '@/lib/permissions-store';
import { logout as logoutRequest } from '@/lib/services/auth';
import { initials } from '@/lib/utils';
import { Badge } from '../ui/Badge';

const ROLE_TONE: Record<string, 'violet' | 'blue' | 'green' | 'slate'> = {
  SUPER_ADMIN: 'violet',
  ADMIN: 'blue',
  EDITOR: 'green',
  AUTHOR: 'slate',
};

export function Topbar({ title }: { title: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logoutRequest();
    clear();
    usePermissionsStore.getState().clear();
    toast.success('Signed out');
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-8">
      <h1 className="text-[16px] font-semibold text-slate-900">{title}</h1>

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 transition-colors hover:border-slate-200 hover:bg-slate-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[12px] font-semibold text-brand-700">
            {initials(user?.name || user?.username)}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-[13px] font-medium leading-tight text-slate-800">{user?.name || user?.username}</p>
            {user?.role && (
              <Badge tone={ROLE_TONE[user.role] || 'slate'} className="mt-0.5">
                {user.role.replace('_', ' ')}
              </Badge>
            )}
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-slide-up">
              <div className="px-2.5 py-2">
                <p className="truncate text-[12.5px] font-medium text-slate-700">{user?.email}</p>
              </div>
              <div className="my-1 h-px bg-slate-100" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
