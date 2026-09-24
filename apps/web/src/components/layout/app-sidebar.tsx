'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth-context';
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  ShieldAlert,
  Scale,
  SunMedium,
  Users,
  X,
  Sparkles,
} from 'lucide-react';

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE TOP BAR (< md) */}
      {/* ========================================================================= */}
      <div className="md:hidden sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-md shadow-indigo-500/20 text-xs">
            L
          </span>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">LeaderOS</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* MOBILE DRAWER BACKDROP */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. SIDEBAR CONTAINER (DESKTOP & MOBILE DRAWER) */}
      {/* ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex-col justify-between border-r border-slate-800 bg-slate-900/95 p-4 backdrop-blur transition-transform duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 md:flex ${
          mobileOpen ? 'translate-x-0 flex' : '-translate-x-full hidden md:flex'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 group"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 font-bold text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition">
                L
              </span>
              <div>
                <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none flex items-center gap-1.5">
                  LeaderOS
                  <Sparkles className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-0.5 block">
                  Cockpit
                </span>
              </div>
            </Link>

            {/* Mobile close button inside drawer */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Leader Badge */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('navigation.singleLeader')}</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/80">
              v1.0
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('navigation.mainNav')}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                    item.active
                      ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 transition ${
                        item.active
                          ? 'text-indigo-400'
                          : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/20">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer: User profile & Logout */}
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {user?.name ?? 'Engineering Leader'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-900/40 hover:text-red-200 transition"
            title={t('navigation.logout')}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{t('navigation.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
