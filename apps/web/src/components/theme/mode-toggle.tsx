'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Sun, Moon } from 'lucide-react';

export function ModeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-xl border border-slate-700/50 bg-slate-800/40 animate-pulse" />
    );
  }

  // 2 modes only: Light or Dark
  const isDark = (resolvedTheme || theme) === 'dark';

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800/80 hover:text-foreground transition-all duration-200 active:scale-95 focus:outline-none"
      title={isDark ? t('theme.light') : t('theme.dark')}
      aria-label={isDark ? t('theme.light') : t('theme.dark')}
    >
      {isDark ? (
        <Moon className="h-4 w-4 text-indigo-400 transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300 rotate-0 scale-100" />
      )}
    </button>
  );
}
