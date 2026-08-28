'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Tag,
  MessageSquare,
  UserPlus2,
  Users,
  Image as ImageIcon,
  Settings,
  BookOpenText,
  Briefcase,
  Building2,
  Sparkles,
  Megaphone,
  Link2,
  Award,
  Mail,
  BarChart3,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: string[];
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'] },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/posts', label: 'Posts', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'] },
      { href: '/categories', label: 'Categories', icon: FolderTree, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
      { href: '/tags', label: 'Tags', icon: Tag, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'] },
      { href: '/comments', label: 'Comments', icon: MessageSquare, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
      { href: '/media', label: 'Media Library', icon: ImageIcon, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'] },
    ],
  },
  {
    label: 'Job Board',
    items: [
      { href: '/jobs', label: 'Jobs', icon: Briefcase, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'] },
      { href: '/companies', label: 'Companies', icon: Building2, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'] },
      { href: '/skills', label: 'Skills', icon: Sparkles, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'] },
    ],
  },
  {
    label: 'Monetization',
    items: [
      { href: '/ads', label: 'Ads', icon: Megaphone, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { href: '/affiliate-links', label: 'Affiliate Links', icon: Link2, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
      { href: '/sponsors', label: 'Sponsors', icon: Award, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    label: 'Growth',
    items: [
      { href: '/newsletter', label: 'Newsletter', icon: Mail, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
      { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/users', label: 'Users', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
      {
        href: '/employer-requests',
        label: 'Employer Requests',
        icon: UserPlus2,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      { href: '/audit-log', label: 'Audit Log', icon: History, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { href: '/settings', label: 'Settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
          <BookOpenText className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[13.5px] font-semibold leading-tight text-slate-900">Blog Admin</p>
          <p className="text-[11px] leading-tight text-slate-400">Content Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group, gi) => {
          const visibleItems = group.items.filter((item) => !role || item.roles.includes(role));
          if (visibleItems.length === 0) return null;
          return (
            <div key={gi} className="space-y-0.5">
              {group.label && (
                <p className="px-3 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
              )}
              {visibleItems.map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
                      active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    <Icon className={cn('h-[17px] w-[17px]', active ? 'text-brand-600' : 'text-slate-400')} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 px-4 py-3">
        <p className="text-[11px] text-slate-400">Blog Admin Console · Phase 2</p>
      </div>
    </aside>
  );
}
