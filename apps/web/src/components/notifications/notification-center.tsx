'use client';

import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';

export type NotificationType = 'overdue' | 'meeting' | 'risk' | 'decision';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timeHint: string;
  read: boolean;
  priority: 'high' | 'medium' | 'normal';
  actionUrl: string;
  actionLabel: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'overdue',
    title: 'Nhiệm vụ quá hạn: Hoàn thiện kiến trúc High-Availability cho Payment Service',
    description: 'Dự án PAY-V2: Hạn chót ngày hôm qua, hiện tại chưa được hoàn thành.',
    timeHint: 'Quá hạn 1 ngày',
    read: false,
    priority: 'high',
    actionUrl: '/tasks',
    actionLabel: 'Xem công việc',
  },
  {
    id: 'notif-2',
    type: 'meeting',
    title: 'Cuộc họp 1-on-1: Trao đổi lộ trình & OKR với Senior Backend Dev',
    description: 'Phòng họp trực tuyến / Bàn thảo luận kỹ thuật. Chuẩn bị agenda đánh giá hiệu suất quý.',
    timeHint: 'Hôm nay lúc 15:30 (Còn 15 phút)',
    read: false,
    priority: 'high',
    actionUrl: '/members',
    actionLabel: 'Xem thành viên',
  },
  {
    id: 'notif-3',
    type: 'overdue',
    title: 'Chờ phản hồi quá hạn: Xác nhận thẩm định mã nguồn bảo mật (Security PR)',
    description: 'Đã gửi yêu cầu tới DevOps Team cách đây 3 ngày nhưng chưa nhận được phản hồi.',
    timeHint: 'Quá hạn 2 ngày',
    read: false,
    priority: 'medium',
    actionUrl: '/today',
    actionLabel: 'Xử lý ngay',
  },
  {
    id: 'notif-4',
    type: 'meeting',
    title: 'Họp điều phối kỹ thuật tuần: Sprint Review & Tech Debt Sync',
    description: 'Rà soát các hạng mục nợ kỹ thuật tồn đọng và thống nhất kế hoạch triển khai sprint tới.',
    timeHint: 'Ngày mai lúc 09:30',
    read: false,
    priority: 'normal',
    actionUrl: '/weekly',
    actionLabel: 'Xem kế hoạch tuần',
  },
  {
    id: 'notif-5',
    type: 'risk',
    title: 'Rủi ro báo động: Cổng thanh toán đối tác tăng độ trễ bất thường',
    description: 'Ma trận rủi ro ghi nhận xác suất Vừa x Ảnh hưởng Nghiêm trọng (Medium x Critical).',
    timeHint: 'Cập nhật 1 giờ trước',
    read: true,
    priority: 'high',
    actionUrl: '/management/risks',
    actionLabel: 'Xem ma trận rủi ro',
  },
  {
    id: 'notif-6',
    type: 'decision',
    title: 'Đến hạn đánh giá lại: Quyết định chuyển sang Monorepo với Turborepo',
    description: 'Định kỳ 3 tháng: Đối chiếu tốc độ build CI/CD thực tế so với kỳ vọng ban đầu.',
    timeHint: 'Hạn: Thứ Sáu tuần này',
    read: true,
    priority: 'normal',
    actionUrl: '/management/decisions',
    actionLabel: 'Đánh giá quyết định',
  },
];

export function NotificationCenter() {
  const { t } = useTranslation();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'meeting' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const containerRef = useRef<HTMLDivElement>(null);

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

  // Counts
  const unreadCount = notifications.filter((n) => !n.read).length;
  const overdueCount = notifications.filter((n) => n.type === 'overdue').length;
  const meetingCount = notifications.filter((n) => n.type === 'meeting').length;

  // Filtered list
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'overdue') return n.type === 'overdue';
    if (filter === 'meeting') return n.type === 'meeting';
    if (filter === 'unread') return !n.read;
    return true;
  });

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: !item.read } : item))
    );
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemClick = (item: NotificationItem) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setIsOpen(false);
    router.push(item.actionUrl);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition ${
          isOpen
            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
            : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
        }`}
        title={t('navigation.notifications', 'Thông báo & Nhắc nhở')}
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-slate-950 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown with Backdrop */}
      {isOpen && (
        <>
          {/* Backdrop overlay covering the underneath page */}
          <div
            className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Popover Container */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900 p-0 shadow-2xl ring-1 ring-black/10 dark:ring-white/10 z-50 animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col overflow-hidden max-h-[85vh]">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Bell className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    {t('notifications.centerTitle', 'Thông báo & Nhắc nhở')}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {unreadCount > 0
                      ? `${unreadCount} mục cần bạn lưu ý`
                      : 'Không có thông báo mới'}
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition px-2 py-1 rounded-lg hover:bg-slate-800"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Đã đọc tất cả</span>
                </button>
              )}
            </div>

            {/* Filter Pills Bar */}
            <div className="flex items-center gap-1.5 p-2 border-b border-slate-800 bg-slate-900 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition shrink-0 ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Tất cả ({notifications.length})
              </button>

              <button
                type="button"
                onClick={() => setFilter('overdue')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg transition shrink-0 ${
                  filter === 'overdue'
                    ? 'bg-rose-500 text-white font-semibold shadow-sm'
                    : 'text-rose-400 hover:bg-rose-950/40'
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
                    : 'text-purple-400 hover:bg-purple-950/40'
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
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Chưa đọc ({unreadCount})
              </button>
            </div>

            {/* List of items */}
            <div className="overflow-y-auto max-h-[380px] p-2 space-y-2 bg-slate-950/40">
              {filteredNotifications.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <CheckCircle2 className="h-8 w-8 text-slate-600 mx-auto mb-2 opacity-60" />
                  <p>Không có thông báo nào trong danh mục này.</p>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const isOverdue = item.type === 'overdue';
                  const isMeeting = item.type === 'meeting';
                  const isRisk = item.type === 'risk';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`group relative p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 shadow-sm ${
                        !item.read
                          ? 'bg-slate-800 border border-slate-700 hover:border-indigo-600 hover:shadow-md'
                          : 'bg-slate-900/80 border border-slate-800/80 hover:bg-slate-800/60 opacity-90 hover:opacity-100'
                      }`}
                    >
                      {/* Leading Icon Badge */}
                      <div
                        className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center ${
                          isOverdue
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isMeeting
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : isRisk
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
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
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : isMeeting
                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isOverdue ? 'Quá hạn' : isMeeting ? 'Cuộc họp' : 'Hệ thống'}
                          </span>

                          {/* Time hint */}
                          <span
                            className={`text-[10px] font-semibold ${
                              isOverdue
                                ? 'text-rose-400'
                                : isMeeting
                                ? 'text-purple-300'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.timeHint}
                          </span>
                        </div>

                        <h5 className="mt-1 text-xs font-semibold text-foreground leading-snug line-clamp-2">
                          {item.title}
                        </h5>

                        <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300">
                            <span>{item.actionLabel}</span>
                            <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>

                      {/* Unread dot / Dismiss buttons */}
                      <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleToggleRead(item.id, e)}
                          className="p-1 text-slate-400 hover:text-indigo-400 rounded transition"
                          title={item.read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                        >
                          <span
                            className={`block h-2 w-2 rounded-full transition ${
                              !item.read ? 'bg-indigo-400 shadow-sm' : 'bg-slate-700 hover:bg-slate-500'
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDismiss(item.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-700 transition"
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
            <div className="p-2.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <Link
                href="/today"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-300 transition py-1 px-2 rounded-lg hover:bg-slate-800"
              >
                <SunMedium className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-medium">Xem việc Hôm nay</span>
              </Link>

              <Link
                href="/weekly"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-300 transition py-1 px-2 rounded-lg hover:bg-slate-800"
              >
                <CalendarDays className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-medium">Lịch tuần này</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
