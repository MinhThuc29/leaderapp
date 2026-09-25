'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth-context';
import { useAppLanguage } from '@/contexts/i18n-context';
import { SupportedLanguage } from '@/lib/i18n';
import { useTheme } from 'next-themes';
import { ModeToggle } from '@/components/theme/mode-toggle';
import {
  Bell,
  HelpCircle,
  MessageSquare,
  ChevronsUpDown,
  Settings,
  Languages,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Check,
  Mail,
  Tag,
  X,
  Send,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export function TopHeader() {
  const { user, logout } = useAuth();
  const { language, changeLanguage, supportedLanguages } = useAppLanguage();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  // Menu states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLanguagesSubOpen, setIsLanguagesSubOpen] = useState(false);
  const [isThemeSubOpen, setIsThemeSubOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteSaving, setQuickNoteSaving] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setIsLanguagesSubOpen(false);
        setIsThemeSubOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notification count from dashboard / today
  useEffect(() => {
    async function fetchBadgeCount() {
      try {
        const res = await apiClient<{ attention_items?: unknown[]; overdue_tasks_count?: number }>(
          '/dashboard/summary',
        );
        if (res.data) {
          const count =
            (res.data.attention_items?.length ?? 0) + (res.data.overdue_tasks_count ?? 0);
          setNotificationCount(count > 0 ? count : 0);
        }
      } catch {
        // Keep default count
      }
    }
    void fetchBadgeCount();
  }, []);

  const handleSelectLanguage = async (code: SupportedLanguage) => {
    await changeLanguage(code);
    setIsLanguagesSubOpen(false);
    setIsProfileOpen(false);
  };

  const handleQuickNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteText.trim()) return;
    try {
      setQuickNoteSaving(true);
      await apiClient('/notes/quick', {
        method: 'POST',
        body: JSON.stringify({ content: quickNoteText.trim() }),
      });
      setQuickNoteText('');
      setIsQuickNoteModalOpen(false);
      alert(t('common.success'));
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setQuickNoteSaving(false);
    }
  };

  // User display name & email (matches screenshot fallback)
  const userName = user?.name || 'Minh Thức Nguyễn';
  const userEmail = user?.email || 'thuc.nm@finepro.net';
  const userInitials = userName
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
        {/* Left area: Brand breadcrumb or Title hint */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="text-slate-200 font-semibold">{t('common.appName')}</span>
            <span>/</span>
            <span className="text-slate-400">{t('profile.team')}</span>
          </div>
        </div>

        {/* Right area: Actions + User Profile (Exact layout from user image) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1. Notification Bell */}
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 transition"
            title={t('navigation.notifications')}
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-slate-950">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {/* 2. Docs & Help */}
          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 transition"
            title={t('navigation.docs')}
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* 3. Feedback / Quick Notes */}
          <button
            type="button"
            onClick={() => setIsQuickNoteModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 transition"
            title={t('navigation.feedback')}
          >
            <MessageSquare className="h-4 w-4" />
          </button>

          {/* 4. Theme Switcher Toggle */}
          <ModeToggle />

          {/* Vertical Divider */}
          <div className="h-5 w-px bg-slate-800 mx-1" />

          {/* 5. User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsLanguagesSubOpen(false);
                setIsThemeSubOpen(false);
              }}
              className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 p-1.5 pr-2.5 hover:bg-slate-850 hover:border-slate-700 transition"
              aria-expanded={isProfileOpen}
            >
              {/* Avatar circular */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-[11px] font-bold text-white shadow-sm ring-1 ring-white/10">
                {userInitials || 'TN'}
              </div>

              {/* Name & Email info */}
              <div className="hidden sm:block text-left min-w-0">
                <div className="text-xs font-semibold text-slate-200 leading-none truncate max-w-[130px]">
                  {userName}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate max-w-[130px]">
                  {userEmail}
                </div>
              </div>

              {/* Caret */}
              <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
            </button>

            {/* Profile Dropdown Popover */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                {/* Large Avatar Header */}
                <div className="flex flex-col items-center text-center pb-4 border-b border-slate-800/80">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 text-lg font-bold text-white shadow-md ring-2 ring-indigo-400/30">
                    {userInitials || 'TN'}
                  </div>

                  {/* Admin Pill Badge (as in the screenshot) */}
                  <div className="mt-2.5 inline-flex items-center rounded-full bg-rose-500/15 px-3 py-0.5 text-[11px] font-bold text-rose-400 border border-rose-500/30">
                    {t('profile.admin')}
                  </div>

                  {/* User Name */}
                  <h4 className="mt-2 text-sm font-bold text-foreground tracking-tight">{userName}</h4>

                  {/* Email with mail icon */}
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <Mail className="h-3 w-3 text-slate-500" />
                    <span>{userEmail}</span>
                  </div>

                  {/* Team Tag with tag icon */}
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <Tag className="h-3 w-3 text-slate-500" />
                    <span>{t('profile.team')}</span>
                  </div>
                </div>

                {/* Menu items */}
                <div className="pt-2 space-y-1">
                  {/* Settings */}
                  <Link
                    href="/dashboard"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 w-full rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-foreground transition"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    <span>{t('profile.settings')}</span>
                  </Link>

                  {/* Languages with Flyout Trigger */}
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      setIsLanguagesSubOpen(true);
                      setIsThemeSubOpen(false);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsLanguagesSubOpen(!isLanguagesSubOpen);
                        setIsThemeSubOpen(false);
                      }}
                      className="flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-foreground transition"
                    >
                      <div className="flex items-center gap-3">
                        <Languages className="h-4 w-4 text-indigo-400" />
                        <span>{t('profile.languages')}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
                      <ChevronLeft className="h-3.5 w-3.5 text-slate-400 sm:hidden" />
                    </button>

                    {/* Flyout Sub-menu (Positioned to the left as in screenshot) */}
                    {isLanguagesSubOpen && (
                      <div
                        className="absolute right-full top-0 mr-2 w-40 rounded-xl border border-slate-700/80 bg-slate-900/98 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-0 slide-in-from-right-2 duration-100"
                        onMouseLeave={() => setIsLanguagesSubOpen(false)}
                      >
                        <div className="space-y-0.5">
                          {supportedLanguages.map((lang) => {
                            const isActive = language === lang.code;
                            return (
                              <button
                                key={lang.code}
                                type="button"
                                onClick={() => void handleSelectLanguage(lang.code)}
                                className={`flex items-center justify-between w-full rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                                  isActive
                                    ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{lang.flag}</span>
                                  <span>{lang.label}</span>
                                </div>
                                {isActive && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Theme with Flyout Trigger */}
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      setIsThemeSubOpen(true);
                      setIsLanguagesSubOpen(false);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsThemeSubOpen(!isThemeSubOpen);
                        setIsLanguagesSubOpen(false);
                      }}
                      className="flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-foreground transition"
                    >
                      <div className="flex items-center gap-3">
                        {theme === 'light' ? (
                          <Sun className="h-4 w-4 text-amber-500" />
                        ) : theme === 'dark' ? (
                          <Moon className="h-4 w-4 text-indigo-400" />
                        ) : (
                          <Laptop className="h-4 w-4 text-slate-400" />
                        )}
                        <span>{t('profile.theme')}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
                      <ChevronLeft className="h-3.5 w-3.5 text-slate-400 sm:hidden" />
                    </button>

                    {/* Flyout Sub-menu for Theme */}
                    {isThemeSubOpen && (
                      <div
                        className="absolute right-full top-0 mr-2 w-44 rounded-xl border border-slate-700/80 bg-slate-900/98 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-0 slide-in-from-right-2 duration-100"
                        onMouseLeave={() => setIsThemeSubOpen(false)}
                      >
                        <div className="space-y-0.5">
                          {[
                            { code: 'light', label: t('theme.light'), icon: Sun, color: 'text-amber-500' },
                            { code: 'dark', label: t('theme.dark'), icon: Moon, color: 'text-indigo-400' },
                            { code: 'system', label: t('theme.system'), icon: Laptop, color: 'text-slate-400' },
                          ].map((item) => {
                            const Icon = item.icon;
                            const isActive = (theme || 'system') === item.code;
                            return (
                              <button
                                key={item.code}
                                type="button"
                                onClick={() => {
                                  setTheme(item.code);
                                  setIsThemeSubOpen(false);
                                  setIsProfileOpen(false);
                                }}
                                className={`flex items-center justify-between w-full rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                                  isActive
                                    ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                                  <span>{item.label}</span>
                                </div>
                                {isActive && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="my-1 border-t border-slate-800/80" />

                  {/* Logout */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      void logout();
                    }}
                    className="flex items-center gap-3 w-full rounded-xl px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('profile.logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Docs / Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-400" />
                {t('navigation.docs')}
              </h3>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="text-slate-400 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>LeaderOS</strong> — {t('docs.subtitle')}
              </p>
              <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800 space-y-2">
                <div>• {t('docs.pillars.capture')}</div>
                <div>• {t('docs.pillars.today')}</div>
                <div>• {t('docs.pillars.weekly')}</div>
                <div>• {t('docs.pillars.management')}</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Note Modal */}
      {isQuickNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
                {t('today.quickNotes')}
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickNoteModalOpen(false)}
                className="text-slate-400 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleQuickNoteSubmit} className="mt-4 space-y-4">
              <textarea
                value={quickNoteText}
                onChange={(e) => setQuickNoteText(e.target.value)}
                placeholder={t('today.typeQuickNote')}
                rows={4}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickNoteModalOpen(false)}
                  className="rounded-xl border border-slate-800 bg-slate-850 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={quickNoteSaving || !quickNoteText.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{quickNoteSaving ? t('common.loading') : t('today.addNote')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
