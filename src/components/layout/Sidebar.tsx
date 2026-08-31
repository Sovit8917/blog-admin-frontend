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
  Code2,
  ClipboardList,
  Gauge,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { usePermissions } from '@/lib/permissions-store';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  // Ceiling role list — SUPER_ADMIN always included, plus whichever staff
  // roles the app allows onto this page under ANY permission setting.
  // For matrix-governed pages (resource is set) this should list every
  // staff role the matrix could grant, so the Super-Admin's 'view' toggle
  // is the thing that actually decides visibility — not this array. For
  // pages the matrix doesn't govern (Users, Settings, Audit Log, …), this
  // array is the real (and only) gate, as before.
  roles: string[];
  // Key into the Super-Admin permissions matrix (see lib/services/permissions.ts).
  // Omit for pages the matrix doesn't govern.
  resource?: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'], resource: 'dashboard' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/posts', label: 'Posts', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'], resource: 'posts' },
      { href: '/categories', label: 'Categories', icon: FolderTree, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'], resource: 'categories' },
      { href: '/tags', label: 'Tags', icon: Tag, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'], resource: 'tags' },
      { href: '/comments', label: 'Comments', icon: MessageSquare, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'], resource: 'comments' },
      { href: '/media', label: 'Media Library', icon: ImageIcon, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'], resource: 'media' },
    ],
  },
  {
    label: 'Job Board',
    items: [
      {
        href: '/employer-dashboard',
        label: 'Employer Dashboard',
        icon: Gauge,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'],
      },
      { href: '/jobs', label: 'Jobs', icon: Briefcase, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'], resource: 'jobs' },
      {
        href: '/applications',
        label: 'Applications',
        icon: ClipboardList,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'],
        resource: 'applications',
      },
      { href: '/companies', label: 'Companies', icon: Building2, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'], resource: 'companies' },
      { href: '/skills', label: 'Skills', icon: Sparkles, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'], resource: 'skills' },
      {
        href: '/developer-resources',
        label: 'Developer Resources',
        icon: Code2,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'],
        resource: 'developer-resources',
      },
    ],
  },
  {
    label: 'Monetization',
    items: [
      { href: '/ads', label: 'Ads', icon: Megaphone, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'], resource: 'ads' },
      { href: '/affiliate-links', label: 'Affiliate Links', icon: Link2, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'], resource: 'affiliate-links' },
      { href: '/sponsors', label: 'Sponsors', icon: Award, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'], resource: 'sponsors' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { href: '/newsletter', label: 'Newsletter', icon: Mail, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'], resource: 'newsletter' },
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
      { href: '/permissions', label: 'Permissions', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
      { href: '/settings', label: 'Settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);
  const { can } = usePermissions();

  // A page whose resource has `view` turned off for this role is hidden from
  // the nav entirely — Super Admin's matrix controls page visibility directly
  // via the 'view' permission, not just individual create/update/delete buttons.
  function resourceVisible(resource?: string) {
    if (!resource) return true;
    return can(resource, 'view');
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
          <BookOpenText className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[13.5px] font-semibold leading-tight text-slate-900">Devnexa</p>
          <p className="text-[11px] leading-tight text-slate-400">Content Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group, gi) => {
          const visibleItems = group.items.filter(
            (item) => (!role || item.roles.includes(role)) && (role === 'SUPER_ADMIN' || resourceVisible(item.resource)),
          );
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
        <p className="text-[11px] text-slate-400">
          Signed in as <span className="font-medium text-slate-500">{role ? role.replace('_', ' ').toLowerCase() : '—'}</span>
        </p>
      </div>
    </aside>
  );
}
