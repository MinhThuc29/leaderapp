'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Clock,
  Calendar,
  AlertTriangle,
  Scale,
  CheckCheck,
  ChevronRight,
  CalendarDays,
  SunMedium,
  CheckCircle2,
  X,
  Video,
  Users,
  FileText,
  ExternalLink,
  FolderGit2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { NotificationDto, NotificationListResponse, MeetingDto } from '@leaderos/shared-types';

export function NotificationCenter() {
  const { t } = useTranslation();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'meeting' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    overdue: 0,
    meeting: 0,
  });
  const [_isLoading, setIsLoading] = useState(false);

  // Selected meeting for detailed dialog
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingDto | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from real backend API
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient<NotificationListResponse>('/notifications');
      if (res?.data) {
        setNotifications(res.data.items);
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Không thể tải thông báo:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount and periodic revalidation
  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 45000); // 45s interval
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refetch when opening the popover to ensure real-time accuracy
  useEffect(() => {
    if (isOpen) {
      void fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Counts from real stats or local list fallback
  const unreadCount = stats.unread;
  const overdueCount = stats.overdue;
  const meetingCount = stats.meeting;

  // Filtered list
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'overdue') return n.type === 'overdue';
    if (filter === 'meeting') return n.type === 'meeting';
    if (filter === 'unread') return !n.read;
    return true;
  });

  const handleMarkAllAsRead = async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setStats((prev) => ({ ...prev, unread: 0 }));

    try {
      await apiClient<{ updatedCount: number }>('/notifications/mark-all-read', {
        method: 'PATCH',
      });
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc tất cả:', err);
      void fetchNotifications();
    }
  };

  const handleToggleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const target = notifications.find((n) => n.id === id);
    const newRead = !target?.read;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: newRead } : item))
    );
    setStats((prev) => ({
      ...prev,
      unread: Math.max(0, prev.unread + (newRead ? -1 : 1)),
    }));

    try {
      await apiClient<NotificationDto>(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái đọc:', err);
      void fetchNotifications();
    }
  };

  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const target = notifications.find((n) => n.id === id);

    // Optimistic UI update
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    setStats((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
      unread: target && !target.read ? Math.max(0, prev.unread - 1) : prev.unread,
      overdue: target?.type === 'overdue' ? Math.max(0, prev.overdue - 1) : prev.overdue,
      meeting: target?.type === 'meeting' ? Math.max(0, prev.meeting - 1) : prev.meeting,
    }));

    try {
      await apiClient(`/notifications/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Lỗi khi xoá thông báo:', err);
      void fetchNotifications();
    }
  };

  const handleItemClick = async (item: NotificationDto) => {
    // If unread, mark read in background
    if (!item.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
      }));

      void apiClient<NotificationDto>(`/notifications/${item.id}/read`, {
        method: 'PATCH',
      });
    }

    // If it's a meeting notification with meeting details, open meeting modal
    if (item.type === 'meeting' && item.meeting) {
      setSelectedMeeting(item.meeting);
      setIsOpen(false);
      return;
    }

    // Otherwise navigate to action URL
    if (item.action_url) {
      setIsOpen(false);
      router.push(item.action_url);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition ${
          isOpen
            ? 'bg-gray-200 text-gray-900 border border-gray-300 shadow-sm dark:bg-indigo-600/20 dark:text-indigo-400 dark:border-indigo-500/30'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200'
        }`}
        title={t('navigation.notifications', 'Thông báo & Nhắc nhở')}
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-950 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown with Backdrop */}
      {isOpen && (
        <>
          {/* Backdrop overlay covering the underneath page */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Popover Container */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white text-gray-900 p-0 shadow-2xl ring-1 ring-black/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10 z-50 animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col overflow-hidden max-h-[85vh]">
            {/* Header */}
            <div className="p-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-600/20 dark:text-indigo-400 dark:border-indigo-500/30">
                  <Bell className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">
                    {t('notifications.centerTitle', 'Thông báo & Nhắc nhở')}
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400">
                    {unreadCount > 0
                      ? `${unreadCount} mục cần bạn lưu ý (Dữ liệu SQL)`
                      : 'Hệ thống đã cập nhật đầy đủ'}
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition px-2 py-1 rounded-lg hover:bg-gray-200 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-slate-800"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Đã đọc tất cả</span>
                </button>
              )}
            </div>

            {/* Filter Pills Bar */}
            <div className="flex items-center gap-1.5 p-2 border-b border-gray-200 bg-gray-100/60 overflow-x-auto scrollbar-none dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition shrink-0 ${
                  filter === 'all'
                    ? 'bg-gray-900 text-white font-semibold shadow-sm dark:bg-indigo-600 dark:text-white'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Tất cả ({notifications.length})
              </button>

              <button
                type="button"
                onClick={() => setFilter('overdue')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg transition shrink-0 ${
                  filter === 'overdue'
                    ? 'bg-rose-600 text-white font-semibold shadow-sm'
                    : 'text-rose-600 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-transparent dark:hover:bg-rose-950/40'
                }`}
              >
                <Clock className="h-3 w-3" />
                <span>Trễ hẹn ({overdueCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter('meeting')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg transition shrink-0 ${
                  filter === 'meeting'
                    ? 'bg-purple-600 text-white font-semibold shadow-sm'
                    : 'text-purple-600 bg-purple-50 hover:bg-purple-100 dark:text-purple-400 dark:bg-transparent dark:hover:bg-purple-950/40'
                }`}
              >
                <Calendar className="h-3 w-3" />
                <span>Cuộc họp ({meetingCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition shrink-0 ${
                  filter === 'unread'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm dark:bg-indigo-500/20 dark:text-indigo-300 dark:border dark:border-indigo-500/30'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Chưa đọc ({unreadCount})
              </button>
            </div>

            {/* List of items */}
            <div className="overflow-y-auto max-h-[380px] p-2 space-y-2 bg-gray-50/50 dark:bg-slate-950/40">
              {filteredNotifications.length === 0 ? (
                <div className="py-8 text-center text-gray-500 dark:text-slate-500 text-xs">
                  <CheckCircle2 className="h-8 w-8 text-gray-400 dark:text-slate-600 mx-auto mb-2 opacity-60" />
                  <p>Không có thông báo nào trong danh mục này.</p>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const isOverdue = item.type === 'overdue';
                  const isMeeting = item.type === 'meeting';
                  const isRisk = item.type === 'risk';
                  const isDecision = item.type === 'decision';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`group relative p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 shadow-sm ${
                        !item.read
                          ? 'bg-white border-2 border-indigo-200 hover:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-indigo-600 hover:shadow-md'
                          : 'bg-white/80 border border-gray-200 hover:bg-gray-50 dark:bg-slate-900/80 dark:border-slate-800/80 dark:hover:bg-slate-800/60 opacity-90 hover:opacity-100'
                      }`}
                    >
                      {/* Leading Icon Badge */}
                      <div
                        className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center ${
                          isOverdue
                            ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                            : isMeeting
                            ? 'bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30'
                            : isRisk
                            ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                            : isDecision
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30'
                        }`}
                      >
                        {isOverdue ? (
                          <Clock className="h-4 w-4" />
                        ) : isMeeting ? (
                          <Calendar className="h-4 w-4" />
                        ) : isRisk ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <Scale className="h-4 w-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Type badge */}
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isOverdue
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                                : isMeeting
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30'
                                : isRisk
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                                : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
                            }`}
                          >
                            {isOverdue ? 'Quá hạn' : isMeeting ? 'Cuộc họp' : isRisk ? 'Rủi ro' : 'Quyết định'}
                          </span>

                          {/* Time hint */}
                          {item.time_hint && (
                            <span
                              className={`text-[10px] font-semibold ${
                                isOverdue
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : isMeeting
                                  ? 'text-purple-600 dark:text-purple-300'
                                  : 'text-gray-500 dark:text-slate-400'
                              }`}
                            >
                              {item.time_hint}
                            </span>
                          )}
                        </div>

                        <h5 className="mt-1 text-xs font-semibold text-gray-900 dark:text-slate-100 leading-snug line-clamp-2">
                          {item.title}
                        </h5>

                        <p className="mt-0.5 text-[11px] text-gray-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                            <span>
                              {isMeeting && item.meeting?.meeting_url
                                ? 'Chi tiết & Vào phòng họp'
                                : item.action_label || 'Xem chi tiết'}
                            </span>
                            <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>

                      {/* Unread dot / Dismiss buttons */}
                      <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleToggleRead(item.id, e)}
                          className="p-1 text-gray-400 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded transition"
                          title={item.read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                        >
                          <span
                            className={`block h-2 w-2 rounded-full transition ${
                              !item.read ? 'bg-indigo-600 dark:bg-indigo-400 shadow-sm' : 'bg-gray-300 dark:bg-slate-700 hover:bg-gray-400 dark:hover:bg-slate-500'
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDismiss(item.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 dark:text-slate-500 dark:hover:text-slate-300 rounded dark:hover:bg-slate-700 transition"
                          title="Xóa thông báo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-2.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs dark:border-slate-800 dark:bg-slate-950">
              <Link
                href="/today"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 transition py-1 px-2 rounded-lg hover:bg-gray-200 dark:text-slate-400 dark:hover:text-indigo-300 dark:hover:bg-slate-800"
              >
                <SunMedium className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-medium">Xem việc Hôm nay</span>
              </Link>

              <Link
                href="/weekly"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 transition py-1 px-2 rounded-lg hover:bg-gray-200 dark:text-slate-400 dark:hover:text-indigo-300 dark:hover:bg-slate-800"
              >
                <CalendarDays className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-medium">Lịch tuần này</span>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Meeting Details Modal (When clicked on a real meeting notification) */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedMeeting(null)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-gray-900 dark:text-slate-100 z-10 animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedMeeting(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Badge & Title */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                <Calendar className="h-3 w-3" />
                Dữ liệu Cuộc họp SQL
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                {selectedMeeting.status}
              </span>
            </div>

            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
              {selectedMeeting.title}
            </h3>

            {selectedMeeting.description && (
              <p className="mt-2 text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                {selectedMeeting.description}
              </p>
            )}

            {/* Info Cards */}
            <div className="mt-4 space-y-2.5 rounded-xl bg-gray-50 p-3.5 border border-gray-200 text-xs dark:bg-slate-950/60 dark:border-slate-800/80">
              {/* Time */}
              <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="font-semibold text-gray-900 dark:text-slate-100">Thời gian:</span>
                <span>
                  {new Date(selectedMeeting.start_time).toLocaleString('vi-VN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                  {selectedMeeting.end_time && (
                    <>
                      {' '}
                      -{' '}
                      {new Date(selectedMeeting.end_time).toLocaleTimeString('vi-VN', {
                        timeStyle: 'short',
                      })}
                    </>
                  )}
                </span>
              </div>

              {/* Participant */}
              {selectedMeeting.member && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                  <Users className="h-4 w-4 text-purple-500 shrink-0" />
                  <span className="font-semibold text-gray-900 dark:text-slate-100">Người tham gia:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedMeeting.member.name}
                  </span>
                  <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-700 dark:bg-slate-800 dark:text-slate-300">
                    {selectedMeeting.member.role}
                  </span>
                </div>
              )}

              {/* Linked Project */}
              {selectedMeeting.project && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                  <FolderGit2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="font-semibold text-gray-900 dark:text-slate-100">Dự án:</span>
                  <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">
                    [{selectedMeeting.project.code}]
                  </span>
                  <span>{selectedMeeting.project.name}</span>
                </div>
              )}

              {/* Location */}
              {selectedMeeting.location && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                  <Video className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-gray-900 dark:text-slate-100">Địa điểm:</span>
                  <span>{selectedMeeting.location}</span>
                </div>
              )}
            </div>

            {/* Agenda section */}
            {selectedMeeting.agenda && (
              <div className="mt-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-slate-200 mb-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Chương trình & Nội dung thảo luận (Agenda):</span>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-xs text-gray-700 whitespace-pre-line leading-relaxed dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                  {selectedMeeting.agenda}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedMeeting(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                Đóng
              </button>

              {selectedMeeting.meeting_url ? (
                <a
                  href={selectedMeeting.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Vào phòng họp Meet</span>
                  <ExternalLink className="h-3 w-3 ml-0.5 opacity-80" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMeeting(null);
                    router.push('/weekly');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Xem trên Lịch tuần</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
