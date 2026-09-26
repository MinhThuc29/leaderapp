'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSidebar } from '@/contexts/sidebar-context';
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  ShieldAlert,
  Scale,
  SunMedium,
  Users,
  X,
} from 'lucide-react';

export function AppSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebar();

  const navItems = [
    {
      href: '/',
      label: t('navigation.dashboard'),
      icon: LayoutDashboard,
      active: pathname === '/' || pathname.startsWith('/dashboard'),
      badge: null,
    },
    {
      href: '/today',
      label: t('navigation.today'),
      icon: SunMedium,
      active: pathname.startsWith('/today'),
      badge: 'My Day',
    },
    {
      href: '/weekly',
      label: t('navigation.weekly'),
      icon: CalendarDays,
      active: pathname.startsWith('/weekly'),
      badge: null,
    },
    {
      href: '/tasks',
      label: t('navigation.tasks'),
      icon: CheckSquare,
      active: pathname.startsWith('/tasks'),
      badge: null,
    },
    {
      href: '/projects',
      label: t('navigation.projects'),
      icon: FolderKanban,
      active: pathname.startsWith('/projects'),
      badge: null,
    },
    {
      href: '/members',
      label: t('navigation.members'),
      icon: Users,
      active: pathname.startsWith('/members'),
      badge: null,
    },
    {
      href: '/knowledge/notes',
      label: t('navigation.knowledge'),
      icon: BookOpen,
      active: pathname.startsWith('/knowledge'),
      badge: null,
    },
    {
      href: '/management/risks',
      label: t('navigation.risks'),
      icon: ShieldAlert,
      active: pathname.startsWith('/management/risks'),
      badge: null,
    },
    {
      href: '/management/decisions',
      label: t('navigation.decisions'),
      icon: Scale,
      active: pathname.startsWith('/management/decisions'),
      badge: null,
    },
    {
      href: '/docs',
      label: t('navigation.docs'),
      icon: HelpCircle,
      active: pathname.startsWith('/docs'),
      badge: null,
    },
  ];

  return (
    <>
      {/* MOBILE DRAWER BACKDROP */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 dark:bg-black/75 backdrop-blur-sm md:hidden transition-opacity"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* ========================================================================= */}
      {/* SIDEBAR CONTAINER (DESKTOP & MOBILE DRAWER) */}
      {/* ========================================================================= */}
      <aside
        className={`bg-slate-900 border-slate-800 transition-all duration-200 ease-in-out shrink-0 flex flex-col justify-between ${
          /* Desktop states: w-16 when collapsed (keeping icons), w-56 when expanded */
          isCollapsed
            ? 'md:w-16 md:p-2 md:py-3 md:border-r md:sticky md:top-14 md:h-[calc(100vh-3.5rem)]'
            : 'md:w-56 md:p-3 md:border-r md:sticky md:top-14 md:h-[calc(100vh-3.5rem)]'
        } ${
          /* Mobile drawer states */
          isMobileOpen
            ? 'fixed inset-y-0 left-0 z-50 w-64 p-4 border-r shadow-2xl flex translate-x-0'
            : 'fixed inset-y-0 left-0 z-50 w-64 p-4 border-r shadow-2xl -translate-x-full md:translate-x-0 hidden md:flex'
        }`}
      >
        <div className="space-y-3 overflow-y-auto pr-0.5">
          {/* Mobile Drawer Header with Close Button */}
          <div className="md:hidden flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('navigation.mainNav')}
            </span>
            <button
              type="button"
              onClick={closeMobileSidebar}
              className="p-1 text-slate-400 hover:text-foreground rounded-lg"
              aria-label="Đóng menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Desktop Section Header: divider in collapsed mode, title in expanded mode */}
          <div className="hidden md:block">
            {isCollapsed ? (
              <div className="h-px w-6 bg-slate-800 mx-auto my-1.5" />
            ) : (
              <div className="px-2 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                {t('navigation.mainNav')}
              </div>
            )}
          </div>

          {/* Navigation Links: centered icons when collapsed, full row when expanded */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  title={isCollapsed ? (item.badge ? `${item.label} (${item.badge})` : item.label) : undefined}
                  className={`group relative flex items-center rounded-xl transition ${
                    isCollapsed
                      ? 'h-10 w-10 mx-auto justify-center'
                      : 'justify-between px-2.5 py-2 text-xs font-medium'
                  } ${
                    item.active
                      ? 'bg-gray-200/90 text-gray-900 font-semibold border border-gray-300 shadow-sm dark:bg-indigo-600/20 dark:text-indigo-300 dark:border-indigo-500/30'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                    <Icon
                      className={`h-4 w-4 shrink-0 transition ${
                        item.active
                          ? 'text-gray-900 dark:text-indigo-400'
                          : 'text-gray-400 group-hover:text-gray-700 dark:text-slate-400 dark:group-hover:text-slate-300'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {item.badge && (
                    isCollapsed ? (
                      <span
                        className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900"
                        title={item.badge}
                      />
                    ) : (
                      <span className="rounded-md bg-warning-bg px-1.5 py-0.5 text-[10px] font-bold text-warning-fg border border-warning-border shrink-0">
                        {item.badge}
                      </span>
                    )
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer: Version */}
        <div
          className={`pt-3 border-t border-slate-800/80 flex items-center ${
            isCollapsed ? 'justify-center px-1' : 'justify-between px-2'
          }`}
        >
          {!isCollapsed && <span className="text-[11px] font-medium text-slate-500">LeaderOS</span>}
          <span
            className="text-[10px] font-bold text-gray-700 bg-gray-100 border border-gray-200 dark:text-indigo-400 dark:bg-indigo-950/80 dark:border-indigo-800/80 px-2 py-0.5 rounded"
            title={`LeaderOS ${t('navigation.version')}`}
          >
            {t('navigation.version')}
          </span>
        </div>
      </aside>
    </>
  );
}
