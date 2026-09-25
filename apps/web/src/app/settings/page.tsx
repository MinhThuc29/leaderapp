'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from 'next-themes';
import { useAppLanguage } from '@/contexts/i18n-context';
import { SupportedLanguage } from '@/lib/i18n';
import {
  User,
  Camera,
  Upload,
  Link2,
  Trash2,
  KeyRound,
  ShieldCheck,
  Check,
  Loader2,
  Sparkles,
  Globe,
  Sun,
  Moon,
  Mail,
  Phone,
  Briefcase,
  FileText,
  AlertCircle,
  CheckCircle2,
  Laptop,
  ArrowLeft,
  Home,
} from 'lucide-react';

// 6 Modern, 100% Offline SVG Data URI Avatar Presets
const AVATAR_PRESETS = [
  {
    id: 'tech-leader',
    name: 'Tech Leader',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%236366f1'/%3E%3Cstop offset='100%25' stop-color='%23a855f7'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='50' fill='url(%23g1)'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23ffffff' opacity='0.95'/%3E%3Cpath d='M22 84 C22 64 36 56 50 56 C64 56 78 64 78 84 Z' fill='%23ffffff' opacity='0.95'/%3E%3Cpolygon points='50,12 55,24 68,24 57,32 61,44 50,36 39,44 43,32 32,24 45,24' fill='%23fef08a'/%3E%3C/svg%3E",
  },
  {
    id: 'architect',
    name: 'Architect',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23059669'/%3E%3Cstop offset='100%25' stop-color='%2306b6d4'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='50' fill='url(%23g2)'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23ffffff' opacity='0.95'/%3E%3Cpath d='M22 84 C22 64 36 56 50 56 C64 56 78 64 78 84 Z' fill='%23ffffff' opacity='0.95'/%3E%3Ccircle cx='50' cy='28' r='5' fill='%2367e8f9'/%3E%3C/svg%3E",
  },
  {
    id: 'staff-eng',
    name: 'Staff Eng',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g3' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f59e0b'/%3E%3Cstop offset='100%25' stop-color='%23ea580c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='50' fill='url(%23g3)'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23ffffff' opacity='0.95'/%3E%3Cpath d='M22 84 C22 64 36 56 50 56 C64 56 78 64 78 84 Z' fill='%23ffffff' opacity='0.95'/%3E%3Cpolygon points='52,14 43,28 49,28 46,40 56,26 50,26' fill='%23ffffff'/%3E%3C/svg%3E",
  },
  {
    id: 'vp-eng',
    name: 'VP of Eng',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g4' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e11d48'/%3E%3Cstop offset='100%25' stop-color='%239333ea'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='50' fill='url(%23g4)'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23ffffff' opacity='0.95'/%3E%3Cpath d='M22 84 C22 64 36 56 50 56 C64 56 78 64 78 84 Z' fill='%23ffffff' opacity='0.95'/%3E%3Ccircle cx='50' cy='38' r='8' fill='%23fecdd3'/%3E%3C/svg%3E",
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g5' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%233b82f6'/%3E%3Cstop offset='100%25' stop-color='%231d4ed8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='50' fill='url(%23g5)'/%3E%3Ctext x='50' y='62' font-family='sans-serif' font-size='36' font-weight='bold' fill='%23ffffff' text-anchor='middle'%3ELD%3C/text%3E%3C/svg%3E",
  },
  {
    id: 'innovator',
    name: 'Innovator',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g6' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%230284c7'/%3E%3Cstop offset='100%25' stop-color='%230f766e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='50' fill='url(%23g6)'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23ffffff' opacity='0.95'/%3E%3Cpath d='M22 84 C22 64 36 56 50 56 C64 56 78 64 78 84 Z' fill='%23ffffff' opacity='0.95'/%3E%3Cpolygon points='50,22 58,38 42,38' fill='%2338bdf8'/%3E%3C/svg%3E",
  },
];

export default function SettingsPage() {
  const { user, updateProfile, changePassword } = useAuth();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { language, changeLanguage, supportedLanguages } = useAppLanguage();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  // Profile Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Custom URL Input state
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // Status & feedback
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when user profile is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setTitle(user.title || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatar_url || null);
    }
  }, [user]);

  // Client-side image compressor & square cropper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileFeedback({
        type: 'error',
        message: 'Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WebP, SVG)!',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Create canvas for scaling and square centering
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400; // 400x400 max, sharp for high-DPI
        let width = img.width;
        let height = img.height;

        // Crop square from center
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        const targetDim = Math.min(minDim, MAX_SIZE);
        canvas.width = targetDim;
        canvas.height = targetDim;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetDim, targetDim);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarUrl(compressedDataUrl);
          setProfileFeedback(null);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);

    // Reset input value so re-selecting same file triggers event
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileFeedback({ type: 'error', message: 'Họ tên không được để trống!' });
      return;
    }
    if (!email.trim()) {
      setProfileFeedback({ type: 'error', message: 'Email không được để trống!' });
      return;
    }

    try {
      setProfileSaving(true);
      setProfileFeedback(null);
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        title: title.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      });

      setProfileFeedback({
        type: 'success',
        message: t('settings.saveSuccess', 'Cập nhật hồ sơ cá nhân thành công!'),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('settings.saveError');
      setProfileFeedback({ type: 'error', message: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', message: 'Vui lòng nhập mật khẩu hiện tại!' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({
        type: 'error',
        message: t('settings.passwordMinLength', 'Mật khẩu mới phải có tối thiểu 6 ký tự!'),
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        message: t('settings.passwordMismatch', 'Mật khẩu xác nhận không khớp!'),
      });
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordFeedback(null);
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setPasswordFeedback({
        type: 'success',
        message: t('settings.changePasswordSuccess', 'Đổi mật khẩu thành công!'),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('settings.changePasswordError');
      setPasswordFeedback({ type: 'error', message: msg });
    } finally {
      setPasswordSaving(false);
    }
  };

  const userInitials = (name || user?.name || 'Leader')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="mb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>{t('settings.backToHome', 'Quay lại trang chủ')}</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <User className="h-6 w-6 text-indigo-500" />
            {t('settings.title', 'Cài đặt & Hồ sơ cá nhân')}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {t('settings.subtitle', 'Quản lý thông tin tài khoản Leader, ảnh đại diện và tùy biến hệ thống.')}
          </p>
        </div>

        <Link
          href="/"
          className="self-start sm:self-center inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-foreground transition shadow-sm group"
        >
          <Home className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>{t('settings.backToHome', 'Quay lại trang chủ')}</span>
        </Link>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-800/80 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition ${
            activeTab === 'profile'
              ? 'border-b-2 border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <User className="h-4 w-4" />
          <span>{t('settings.tabProfile', 'Hồ sơ cá nhân')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition ${
            activeTab === 'security'
              ? 'border-b-2 border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>{t('settings.tabSecurity', 'Bảo mật & Mật khẩu')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition ${
            activeTab === 'preferences'
              ? 'border-b-2 border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>{t('settings.tabPreferences', 'Tùy chọn & Hệ thống')}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PERSONAL PROFILE */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Feedback banner */}
          {profileFeedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                profileFeedback.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              {profileFeedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{profileFeedback.message}</span>
            </div>
          )}

          {/* Card 1: Avatar Manager */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Camera className="h-4 w-4 text-indigo-400" />
              {t('settings.avatarSection', 'Ảnh đại diện (Avatar)')}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {t(
                'settings.avatarHint',
                'Hỗ trợ định dạng JPG, PNG, WebP hoặc SVG. Tự động tối ưu dung lượng khi tải lên.'
              )}
            </p>

            <div className="mt-5 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Live Preview Avatar */}
              <div className="relative group shrink-0">
                <div className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-indigo-500/40 shadow-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-extrabold ring-4 ring-slate-800">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name || 'Avatar'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{userInitials || 'TN'}</span>
                  )}
                </div>

                {/* Quick overlay trigger for upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-[11px] font-semibold"
                  title={t('settings.uploadPhoto', 'Tải ảnh từ máy')}
                >
                  <Camera className="h-5 w-5" />
                  <span>Đổi ảnh</span>
                </button>
              </div>

              {/* Upload & Preset controls */}
              <div className="flex-1 space-y-4 w-full text-center sm:text-left">
                {/* File picker button */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{t('settings.uploadPhoto', 'Tải ảnh từ máy')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
                  >
                    <Link2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>{t('settings.enterUrl', 'Nhập URL ảnh')}</span>
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(null)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t('settings.removeAvatar', 'Xóa ảnh đại diện')}</span>
                    </button>
                  )}
                </div>

                {/* Optional URL input field */}
                {showUrlInput && (
                  <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-700 bg-slate-950/60 max-w-lg">
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder={t('settings.urlPlaceholder', 'https://example.com/avatar.jpg')}
                      className="flex-1 bg-transparent px-2 text-xs text-foreground placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customUrl.trim()) {
                          setAvatarUrl(customUrl.trim());
                          setShowUrlInput(false);
                          setCustomUrl('');
                        }
                      }}
                      className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 transition"
                    >
                      {t('settings.applyUrl', 'Áp dụng')}
                    </button>
                  </div>
                )}

                {/* Preset Avatars */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-center sm:justify-start gap-1.5">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>{t('settings.presets', 'Hoặc chọn từ bộ sưu tập avatar mẫu:')}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAvatarUrl(preset.url)}
                        className={`group relative h-10 w-10 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 ${
                          avatarUrl === preset.url
                            ? 'border-indigo-400 ring-2 ring-indigo-500/50 scale-105'
                            : 'border-slate-700 hover:border-indigo-400'
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Personal Information Form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-400" />
              {t('settings.personalInfo', 'Thông tin cá nhân')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <span>{t('settings.fullName', 'Họ và tên')} *</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('settings.fullNamePlaceholder', 'VD: Nguyễn Văn Leader')}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-foreground placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Title / Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                  <span>{t('settings.titleRole', 'Chức danh / Vị trí')}</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('settings.titleRolePlaceholder', 'VD: Engineering Leader / VP of Tech')}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-foreground placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>{t('settings.email', 'Email đăng nhập')} *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-foreground placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>{t('settings.phone', 'Số điện thoại')}</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('settings.phonePlaceholder', 'VD: +84 987 654 321')}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-foreground placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Bio / Philosophy */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span>{t('settings.bio', 'Tiểu sử / Triết lý lãnh đạo')}</span>
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t(
                  'settings.bioPlaceholder',
                  'Chia sẻ phương châm làm việc, triết lý kỹ thuật hoặc phong cách lãnh đạo...'
                )}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-foreground placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition resize-y"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 active:scale-98 transition disabled:opacity-50"
            >
              {profileSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('settings.saving', 'Đang lưu...')}</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>{t('settings.saveProfile', 'Lưu thông tin hồ sơ')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SECURITY & PASSWORD */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="space-y-6 animate-in fade-in-50 duration-200">
          {passwordFeedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                passwordFeedback.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              {passwordFeedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              {t('settings.securitySection', 'Đổi mật khẩu tài khoản')}
            </h3>
            <p className="text-xs text-slate-400">
              {t(
                'settings.securityHint',
                'Để bảo vệ tài khoản Leader, hãy sử dụng mật khẩu mạnh tối thiểu 6 ký tự.'
              )}
            </p>

            <div className="space-y-4 max-w-md pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {t('settings.currentPassword', 'Mật khẩu hiện tại')} *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('settings.currentPasswordPlaceholder', 'Nhập mật khẩu hiện tại...')}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-foreground placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {t('settings.newPassword', 'Mật khẩu mới')} *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('settings.newPasswordPlaceholder', 'Tối thiểu 6 ký tự...')}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-foreground placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {t('settings.confirmPassword', 'Xác nhận mật khẩu mới')} *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.confirmPasswordPlaceholder', 'Nhập lại mật khẩu mới...')}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-foreground placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 active:scale-98 transition disabled:opacity-50"
              >
                {passwordSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('settings.saving', 'Đang cập nhật...')}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>{t('settings.updatePassword', 'Cập nhật mật khẩu')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PREFERENCES & SYSTEM */}
      {/* ========================================================================= */}
      {activeTab === 'preferences' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Card 1: Theme & Language */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-400" />
              {t('settings.preferencesSection', 'Tùy chọn giao diện & ngôn ngữ')}
            </h3>

            {/* Theme mode 2 options */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">
                {t('settings.themeMode', 'Chế độ giao diện')}
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold transition ${
                    theme === 'light'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800/80 hover:text-foreground'
                  }`}
                >
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>{t('theme.light', 'Chế độ Sáng')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold transition ${
                    theme === 'dark'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800/80 hover:text-foreground'
                  }`}
                >
                  <Moon className="h-4 w-4 text-indigo-400" />
                  <span>{t('theme.dark', 'Chế độ Tối')}</span>
                </button>
              </div>
            </div>

            {/* Language selector */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-medium text-slate-300">
                {t('settings.language', 'Ngôn ngữ hiển thị')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {supportedLanguages.map((lang) => {
                  const isActive = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => changeLanguage(lang.code as SupportedLanguage)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800/80 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </div>
                      {isActive && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: System Architecture Info */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Laptop className="h-4 w-4 text-slate-400" />
              {t('settings.systemInfo', 'Thông tin hệ thống')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
                <span className="text-[11px] font-medium text-slate-500 block">
                  {t('settings.systemVersion', 'Phiên bản LeaderOS')}
                </span>
                <span className="text-xs font-bold text-indigo-400 mt-1 block">v1.0 (Production)</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
                <span className="text-[11px] font-medium text-slate-500 block">
                  {t('settings.systemRole', 'Vai trò tài khoản')}
                </span>
                <span className="text-xs font-bold text-rose-400 mt-1 block">Leader / Administrator</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
                <span className="text-[11px] font-medium text-slate-500 block">
                  {t('settings.systemSingleLeader', 'Mô hình vận hành')}
                </span>
                <span className="text-xs font-bold text-emerald-400 mt-1 block">Single Leader Monorepo</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
