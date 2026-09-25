'use client';

import { useState } from 'react';
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
  Menu,
  ShieldAlert,
  Scale,
  SunMedium,
  Users,
  X,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export function AppSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isCollapsed, toggleSidebar } = useSidebar();

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
      {/* ========================================================================= */}
      {/* 1. MOBILE TOP BAR (< md) */}
      {/* ========================================================================= */}
      <div className="md:hidden sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-md shadow-indigo-500/20 text-xs">
            L
          </span>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-foreground">LeaderOS</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-foreground transition"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* MOBILE DRAWER BACKDROP */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. SIDEBAR CONTAINER (DESKTOP & MOBILE DRAWER) */}
      {/* ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 md:flex ${
          isCollapsed ? 'md:w-[68px] p-2.5' : 'md:w-56 p-3 sm:p-3.5'
        } ${
          mobileOpen ? 'w-64 translate-x-0 flex shadow-2xl p-4' : '-translate-x-full hidden md:flex'
        }`}
      >
        <div className="space-y-5">
          {/* Brand Header */}
          {isCollapsed ? (
            <div className="hidden md:flex flex-col items-center gap-2 pt-1">
              <Link
                href="/"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 font-bold text-white shadow-lg shadow-indigo-500/25 hover:scale-105 transition"
                title="LeaderOS Cockpit"
              >
                L
              </Link>
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Mở rộng thanh điều hướng"
                aria-label="Mở rộng thanh điều hướng"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-1.5 pt-1">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 group min-w-0"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 font-bold text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition">
                  L
                </span>
                <div className="truncate">
                  <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-foreground leading-none flex items-center gap-1.5">
                    LeaderOS
                    <Sparkles className="h-3 w-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-0.5 block">
                    Cockpit
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-1">
                {/* Desktop Collapse Toggle */}
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Thu gọn thanh điều hướng"
                  aria-label="Thu gọn thanh điều hướng"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>

                {/* Mobile Drawer Close */}
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="md:hidden p-1 text-slate-400 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {isCollapsed ? (
              <div className="hidden md:block h-px w-6 bg-slate-200 dark:border-slate-800 mx-auto my-1.5" />
            ) : (
              <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                {t('navigation.mainNav')}
              </div>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;

              if (isCollapsed) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={item.badge ? `${item.label} (${item.badge})` : item.label}
                    className={`group relative flex h-9 w-9 mx-auto items-center justify-center rounded-xl transition ${
                      item.active
                        ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition ${
                        item.active
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                      }`}
                    />
                    {item.badge && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition ${
                    item.active
                      ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition ${
                        item.active
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="rounded-md bg-amber-50 dark:bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer: Version */}
        {isCollapsed ? (
          <div className="hidden md:flex pt-3 border-t border-slate-200 dark:border-slate-800/80 justify-center">
            <span
              className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/80 cursor-default"
              title={`LeaderOS ${t('navigation.version')}`}
            >
              v1.0
            </span>
          </div>
        ) : (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between px-2">
            <span className="text-[11px] font-medium text-slate-500">LeaderOS</span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/80">
              {t('navigation.version')}
            </span>
          </div>
        )}
      </aside>
    </>
  );
}
