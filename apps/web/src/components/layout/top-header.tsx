'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth-context';
import { useAppLanguage } from '@/contexts/i18n-context';
import { SupportedLanguage } from '@/lib/i18n';
import { useTheme } from 'next-themes';
import { useSidebar } from '@/contexts/sidebar-context';
import { ModeToggle } from '@/components/theme/mode-toggle';
import { NotificationCenter } from '@/components/notifications/notification-center';
import {
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
  PanelLeft,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export function TopHeader() {
  const { user, logout } = useAuth();
  const { language, changeLanguage, supportedLanguages } = useAppLanguage();
  const { theme, setTheme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { t } = useTranslation();
  const router = useRouter();

  // Menu states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLanguagesSubOpen, setIsLanguagesSubOpen] = useState(false);
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
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-md">
        {/* Left area: Brand Logo + FIXED SINGLE TOGGLE BUTTON (EXACTLY AS IN USER SCREENSHOT) */}
        <div className="flex items-center gap-2.5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 font-bold text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition">
              L
            </span>
          </Link>

          {/* Fixed Sidebar Toggle Button (standing completely still at 1 position) */}
          <button
            type="button"
            onClick={toggleSidebar}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
              !isCollapsed
                ? 'bg-gray-200/90 text-gray-900 border-gray-300 shadow-sm dark:bg-indigo-600/20 dark:text-indigo-400 dark:border-indigo-500/30'
                : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-900 hover:border-gray-200 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
            title={isCollapsed ? 'Mở thanh công cụ' : 'Thu vào thanh công cụ'}
            aria-label="Đóng mở thanh công cụ"
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          {/* Brand breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium pl-1">
            <span className="text-gray-800 dark:text-slate-200 font-bold tracking-tight">{t('common.appName')}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-500 dark:text-slate-400">{t('profile.team')}</span>
          </div>
        </div>

        {/* Right area: Actions + User Profile (Exact layout from user image) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1. Notification Center (Overdue deadlines & meeting reminders) */}
          <NotificationCenter />

          {/* 2. Docs & Help */}
          <button
            type="button"
            onClick={() => router.push('/docs')}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200 transition"
            title={t('navigation.docs')}
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* 3. Feedback / Quick Notes */}
          <button
            type="button"
            onClick={() => setIsQuickNoteModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200 transition"
            title={t('navigation.feedback')}
          >
            <MessageSquare className="h-4 w-4" />
          </button>

          {/* 4. Theme Switcher Toggle */}
          <ModeToggle />

          {/* Vertical Divider */}
          <div className="h-5 w-px bg-gray-200 dark:bg-slate-800 mx-1" />

          {/* 5. User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsLanguagesSubOpen(false);
              }}
              className="flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-slate-800/80 bg-gray-50/80 dark:bg-slate-900/60 p-1.5 pr-2.5 hover:bg-gray-100 dark:hover:bg-slate-850 hover:border-gray-300 dark:hover:border-slate-700 transition"
              aria-expanded={isProfileOpen}
            >
              {/* Avatar circular */}
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-[11px] font-bold text-white shadow-sm ring-1 ring-white/10">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={userName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  userInitials || 'TN'
                )}
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
              <>
                {/* Backdrop overlay covering underneath page */}
                <div
                  className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsLanguagesSubOpen(false);
                  }}
                  aria-hidden="true"
                />

                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl ring-1 ring-white/10 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                  {/* Large Avatar Header */}
                  <div className="flex flex-col items-center text-center pb-4 border-b border-slate-800">
                    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 text-lg font-bold text-white shadow-md ring-2 ring-indigo-400/30">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={userName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        userInitials || 'TN'
                      )}
                    </div>

                    {/* Admin Pill Badge */}
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
                      <span>{user?.title || t('profile.team')}</span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="pt-2 space-y-1">
                    {/* Settings */}
                    <Link
                      href="/settings"
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
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsLanguagesSubOpen(!isLanguagesSubOpen);
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
                          className="absolute right-full top-0 mr-2 w-40 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl ring-1 ring-white/10 z-50 animate-in fade-in-0 slide-in-from-right-2 duration-100"
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
                                      : 'text-slate-300 hover:bg-slate-800 hover:text-foreground'
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

                    {/* Theme Quick Toggle Row */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextTheme = theme === 'dark' ? 'light' : 'dark';
                        setTheme(nextTheme);
                      }}
                      className="flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-foreground transition"
                    >
                      <div className="flex items-center gap-3">
                        {theme === 'dark' ? (
                          <Moon className="h-4 w-4 text-indigo-400" />
                        ) : (
                          <Sun className="h-4 w-4 text-amber-500" />
                        )}
                        <span>{t('profile.theme')}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {theme === 'dark' ? t('theme.dark') : t('theme.light')}
                      </span>
                    </button>

                    {/* Divider */}
                    <div className="my-1 border-t border-slate-800" />

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
              </>
            )}
          </div>
        </div>
      </header>

      {/* Docs / Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsHelpModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-400" />
                {t('navigation.docs')}
              </h3>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsQuickNoteModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
                {t('today.quickNotes')}
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickNoteModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
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
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-foreground placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickNoteModalOpen(false)}
                  className="rounded-xl border border-slate-800 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
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
