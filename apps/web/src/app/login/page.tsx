'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth-context';
import { useAppLanguage } from '@/contexts/i18n-context';
import { SupportedLanguage } from '@/lib/i18n';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const { language, changeLanguage, supportedLanguages } = useAppLanguage();
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await login({ email, password });
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDefaultCredentials = () => {
    setEmail('admin@leaderos.local');
    setPassword('LeaderOS@2026!');
    setError(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative">
      {/* Top right language switch for login page */}
      <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
        {supportedLanguages.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => void changeLanguage(l.code as SupportedLanguage)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              language === l.code
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {l.flag} {l.label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold text-xl mb-3">
            L
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t('auth.loginTitle')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('auth.loginSubtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/60 border border-red-900/80 rounded-lg text-red-300 text-sm flex items-start gap-2">
            <span className="text-base font-bold leading-none">!</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              required
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition shadow-lg shadow-indigo-600/20"
          >
            {isSubmitting ? t('auth.loggingIn') : t('auth.loginButton')}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={handleFillDefaultCredentials}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition underline underline-offset-4"
          >
            Sử dụng tài khoản Leader mặc định (Seed)
          </button>
          <div className="text-xs text-slate-500 mt-2">
            admin@leaderos.local · LeaderOS@2026!
          </div>
        </div>
      </div>
    </main>
  );
}
