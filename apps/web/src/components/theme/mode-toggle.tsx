'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const options = [
    {
      value: 'light',
      label: t('theme.light'),
      icon: Sun,
    },
    {
      value: 'dark',
      label: t('theme.dark'),
      icon: Moon,
    },
    {
      value: 'system',
      label: t('theme.system'),
      icon: Laptop,
    },
  ];

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-xl border border-slate-700/50 bg-slate-800/40 animate-pulse" />
    );
  }

  const currentTheme = theme || 'system';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 transition focus:outline-none"
        title={t('theme.title')}
        aria-label={t('theme.title')}
      >
        {currentTheme === 'light' ? (
          <Sun className="h-4 w-4 text-amber-500 transition-transform duration-200 rotate-0 scale-100" />
        ) : currentTheme === 'dark' ? (
          <Moon className="h-4 w-4 text-indigo-400 transition-transform duration-200 rotate-0 scale-100" />
        ) : (
          <Laptop className="h-4 w-4 text-slate-400 transition-transform duration-200 rotate-0 scale-100" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-slate-700/80 bg-slate-900/98 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t('theme.title')}
          </div>
          <div className="space-y-0.5 mt-0.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isActive = currentTheme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTheme(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full rounded-xl px-2.5 py-2 text-xs font-medium transition ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        opt.value === 'light'
                          ? 'text-amber-500'
                          : opt.value === 'dark'
                          ? 'text-indigo-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>{opt.label}</span>
                  </div>
                  {isActive && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
