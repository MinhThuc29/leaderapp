'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  DashboardSummaryDto,
  NeedAttentionItem,
} from '@leaderos/shared-types';
import { apiClient } from '@/lib/api-client';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  FolderKanban,
  LayoutDashboard,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SunMedium,
  Users,
} from 'lucide-react';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

export function DashboardCockpit() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<DashboardSummaryDto>('/dashboard/summary');
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dashboard.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSummary();
  }, []);

  return (
    <div className="space-y-8">
      {/* Cockpit Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-950/80 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-800/80 mb-2">
            <LayoutDashboard className="h-3.5 w-3.5 text-indigo-400" />
            {t('dashboard.title')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('dashboard.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchSummary()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('common.refresh')}</span>
        </button>
      </div>

      {loading && !data ? (
        <div className="text-center py-20 text-slate-500">{t('dashboard.scanning')}</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-900 bg-red-950/40 p-6 text-center text-red-300">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      ) : data ? (
        <>
          {/* ========================================================================= */}
          {/* 1. KHỐI CẢNH BÁO NEED ATTENTION ENGINE (TOP BANNER) */}
          {/* ========================================================================= */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-400" />
                <h2 className="text-sm uppercase tracking-wider font-bold text-foreground">
                  {t('dashboard.needAttention')}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {data.need_attention.critical_count > 0 && (
                  <span className="rounded-full bg-red-950 border border-red-800 px-2.5 py-0.5 text-xs font-bold text-red-400">
                    {data.need_attention.critical_count} CRITICAL
                  </span>
                )}
                {data.need_attention.warning_count > 0 && (
                  <span className="rounded-full bg-amber-950 border border-amber-800 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                    {data.need_attention.warning_count} WARNING
                  </span>
                )}
              </div>
            </div>

            {data.need_attention.total_count === 0 ? (
              <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-emerald-300">
                    {t('dashboard.allClearTitle')}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t('dashboard.allClearDesc')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.need_attention.items.map((item) => (
                  <NeedAttentionCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>

          {/* ========================================================================= */}
          {/* 2. DỰ ÁN ĐANG CHẠY (ACTIVE PROJECTS GRID) */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-indigo-400" />
                <h2 className="text-sm uppercase tracking-wider font-bold text-foreground">
                  {t('dashboard.activeProjects')} ({data.active_projects.length})
                </h2>
              </div>
              <Link
                href="/projects"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>{t('dashboard.seeAll')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {data.active_projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                {t('dashboard.noProjects')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.active_projects.map((proj) => (
                  <Link
                    key={proj.id}
                    href={`/projects/${proj.id}`}
                    className="group rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm hover:border-indigo-600/50 hover:bg-slate-850 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded-lg">
                          {proj.code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {/* Health Indicator */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              proj.health_status === 'GREEN'
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : proj.health_status === 'YELLOW'
                                ? 'bg-amber-950 text-amber-400 border-amber-800'
                                : 'bg-red-950 text-red-400 border-red-800'
                            }`}
                          >
                            {proj.health_status}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-foreground group-hover:text-indigo-300 transition line-clamp-1">
                        {proj.name}
                      </h3>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                          <span>{t('common.progress')}</span>
                          <span className="font-mono font-bold text-foreground">{proj.progress}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              proj.health_status === 'RED'
                                ? 'bg-red-500'
                                : proj.health_status === 'YELLOW'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, proj.progress))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-slate-500" />
                          {proj.members_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                          {t('dashboard.openTasksCount', { count: proj.open_tasks_count })}
                        </span>
                        {proj.overdue_tasks_count > 0 && (
                          <span className="text-red-400 font-semibold">
                            {t('dashboard.overdueCount', { count: proj.overdue_tasks_count })}
                          </span>
                        )}
                      </div>

                      {proj.target_date && (
                        <span>
                          {t('common.dueDateShort', { date: formatDate(proj.target_date) })}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ========================================================================= */}
          {/* 3. WIDGETS TỔNG HỢP: TODAY FOCUS + WEEKLY GOALS + FOLLOW-UPS */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Widget: Today's Focus */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SunMedium className="h-5 w-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      {t('dashboard.myDay')}
                    </h3>
                  </div>
                  <Link
                    href="/today"
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <span>{t('dashboard.seeAll')}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-[11px] text-slate-400 block">{t('tasks.status.TODO')}</span>
                    <span className="font-mono text-xl font-bold text-amber-400 mt-1 block">
                      {data.today_summary.tasks_today_count}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-[11px] text-slate-400 block">{t('dashboard.overdueTasks')}</span>
                    <span
                      className={`font-mono text-xl font-bold mt-1 block ${
                        data.today_summary.overdue_tasks_count > 0 ? 'text-red-400' : 'text-slate-500'
                      }`}
                    >
                      {data.today_summary.overdue_tasks_count}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-[11px] text-slate-400 block">{t('dashboard.completed')}</span>
                    <span className="font-mono text-xl font-bold text-emerald-400 mt-1 block">
                      {data.today_summary.completed_today_count}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('today.subtitle')}
                </p>
              </div>

              <Link
                href="/today"
                className="mt-6 flex items-center justify-center gap-2 w-full rounded-xl bg-slate-800 hover:bg-slate-750 py-2.5 text-xs font-semibold text-slate-200 transition"
              >
                <span>{t('today.title')}</span>
                <ArrowRight className="h-4 w-4 text-indigo-400" />
              </Link>
            </div>

            {/* Widget: Weekly Goal Status */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      {t('dashboard.weeklyPlan')} ({data.weekly_summary.week_number})
                    </h3>
                  </div>
                  <Link
                    href="/weekly"
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <span>{t('dashboard.seeAll')}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>{t('dashboard.completionRate')}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {data.weekly_summary.completed_tasks}/{data.weekly_summary.total_tasks} (
                      {data.weekly_summary.completion_rate}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, data.weekly_summary.completion_rate))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                    {t('weekly.commitments')} ({data.weekly_summary.plans.length}):
                  </span>
                  {data.weekly_summary.plans.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-2">
                      {t('common.noData')}
                    </div>
                  ) : (
                    data.weekly_summary.plans.slice(0, 3).map((wp) => (
                      <div
                        key={wp.id}
                        className="rounded-lg bg-slate-950 p-2.5 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-200 mb-0.5">
                          <span>[{wp.project_code}]</span>
                          <span className="text-emerald-400 font-mono">
                            {wp.completed_tasks}/{wp.total_tasks}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{wp.goal}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Link
                href="/weekly"
                className="mt-6 flex items-center justify-center gap-2 w-full rounded-xl bg-slate-800 hover:bg-slate-750 py-2.5 text-xs font-semibold text-slate-200 transition"
              >
                <span>{t('weekly.title')}</span>
                <ArrowRight className="h-4 w-4 text-indigo-400" />
              </Link>
            </div>

            {/* Widget: Pending Follow-ups */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      {t('dashboard.followUps')} ({data.today_summary.pending_follow_ups_count})
                    </h3>
                  </div>
                  <Link
                    href="/today"
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <span>{t('dashboard.seeAll')}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {data.pending_follow_ups.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-6 text-center">
                      {t('dashboard.noFollowups')}
                    </div>
                  ) : (
                    data.pending_follow_ups.map((fu) => (
                      <div
                        key={fu.id}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-200 block truncate">
                            {fu.title}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {t('dashboard.waitingPrefix')}{' '}
                            <strong className="text-slate-300">{fu.waiting_for}</strong>
                            {fu.project_name ? ` · [${fu.project_name}]` : ''}
                          </span>
                        </div>
                        <span className="text-[11px] text-indigo-400 font-mono shrink-0">
                          {formatDate(fu.follow_up_date)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Link
                href="/today"
                className="mt-6 flex items-center justify-center gap-2 w-full rounded-xl bg-slate-800 hover:bg-slate-750 py-2.5 text-xs font-semibold text-slate-200 transition"
              >
                <span>{t('today.followUpsWaiting')}</span>
                <ArrowRight className="h-4 w-4 text-indigo-400" />
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function NeedAttentionCard({ item }: { item: NeedAttentionItem }) {
  const { t } = useTranslation();
  const isCritical = item.severity === 'CRITICAL';

  const ruleBadge = t(`dashboard.rules.${item.rule_code}`, {
    defaultValue: t('dashboard.ruleBadgeDefault'),
  });

  let actionLink = '/tasks';
  if (item.entity_type === 'PROJECT') {
    actionLink = `/projects/${item.entity_id}`;
  } else if (item.entity_type === 'MILESTONE') {
    actionLink = item.project_id ? `/projects/${item.project_id}` : '/projects';
  } else if (item.entity_type === 'FOLLOW_UP') {
    actionLink = '/today';
  }

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition flex flex-col justify-between ${
        isCritical
          ? 'border-red-900/80 bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-900'
          : 'border-amber-900/80 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isCritical
                  ? 'bg-red-950 text-red-400 border-red-800'
                  : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}
            >
              {item.severity}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {ruleBadge}
            </span>
          </div>

          {item.project_name && (
            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[150px]">
              [{item.project_name}]
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 mb-1.5">
          {item.title}
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
          <strong className="text-slate-400 block mb-0.5">{t('dashboard.reasonLabel')}</strong>
          {item.reason}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400 italic">
          {item.action_hint ?? t('dashboard.defaultActionHint')}
        </span>

        <Link
          href={actionLink}
          className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition"
        >
          <span>{t('dashboard.fixNow')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
