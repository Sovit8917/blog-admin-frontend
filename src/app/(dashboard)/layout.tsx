'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { PageSpinner } from '@/components/ui/Spinner';
import { usePathname } from 'next/navigation';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/posts': 'Posts',
  '/categories': 'Categories',
  '/tags': 'Tags',
  '/comments': 'Comments',
  '/media': 'Media Library',
  '/users': 'Users',
  '/settings': 'Settings',
  '/jobs': 'Jobs',
  '/companies': 'Companies',
  '/skills': 'Skills',
  '/ads': 'Ads',
  '/affiliate-links': 'Affiliate Links',
  '/sponsors': 'Sponsors',
  '/newsletter': 'Newsletter',
  '/analytics': 'Analytics',
  '/audit-log': 'Audit Log',
  '/permissions': 'Permissions',
};

function resolveTitle(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  const base = '/' + (pathname.split('/')[1] || '');
  if (TITLES[base]) {
    if (pathname.endsWith('/new')) return `New ${TITLES[base].replace(/s$/, '')}`;
    if (pathname !== base) return `Edit ${TITLES[base].replace(/s$/, '')}`;
  }
  return 'Blog Admin';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { checking } = useRequireAuth();
  const pathname = usePathname();

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <PageSpinner label="Checking your session…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-60">
        <Topbar title={resolveTitle(pathname)} />
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
