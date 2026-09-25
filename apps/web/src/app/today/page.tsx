'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  TodayResponseDto,
  TaskDto,
  NoteDto,
  ProjectDto,
  MemberDto,
  Priority,
  TaskStatus,
  CreateTaskInput,
  CreateFollowUpInput,
  CreateQuickNoteInput,
  RescheduleTomorrowResultDto,
} from '@leaderos/shared-types';
import { AppLayout } from '@/components/layout/app-layout';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';
import {
  SunMedium,
  CheckSquare,
  Square,
  AlertTriangle,
  Clock,
  Send,
  Calendar,
  Users,
  CheckCircle2,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  CornerDownLeft,
  Hourglass,
} from 'lucide-react';

export default function TodayPage() {
  return (
    <AppLayout>
      <TodayCockpitContent />
    </AppLayout>
  );
}

function TodayCockpitContent() {
  const { t } = useTranslation();
  const [todayData, setTodayData] = useState<TodayResponseDto | null>(null);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Task inputs
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskPriority, setTaskPriority] = useState<Priority>('MEDIUM');
  const [taskWeight, setTaskWeight] = useState<number>(1);
  const [taskProjectId, setTaskProjectId] = useState<string>('');
  const [taskMemberId, setTaskMemberId] = useState<string>('');
  const [taskSubmitting, setTaskSubmitting] = useState<boolean>(false);

  // Quick Note inputs
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteSubmitting, setNoteSubmitting] = useState<boolean>(false);

  // Quick Follow-up inputs
  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState<boolean>(false);
  const [followUpTitle, setFollowUpTitle] = useState<string>('');
  const [followUpWaitingFor, setFollowUpWaitingFor] = useState<string>('');
  const [followUpMemberId, setFollowUpMemberId] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [followUpSubmitting, setFollowUpSubmitting] = useState<boolean>(false);

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [rescheduleMsg, setRescheduleMsg] = useState<string | null>(null);

  // Section toggle
  const [showCompleted, setShowCompleted] = useState<boolean>(true);

  // Fetch all today data in 1 request
  const fetchTodayData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<TodayResponseDto>('/today');
      setTodayData(res.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('today.loadError'),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Fetch projects and members for dropdowns
  const fetchAuxiliary = useCallback(async () => {
    try {
      const [projRes, memRes] = await Promise.all([
        apiClient<ProjectDto[]>('/projects'),
        apiClient<MemberDto[]>('/members'),
      ]);
      setProjects(projRes.data);
      setMembers(memRes.data);
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    void fetchTodayData();
    void fetchAuxiliary();
  }, [fetchTodayData, fetchAuxiliary]);

  // Handle inline toggle task completion
  const handleToggleTask = async (task: TaskDto) => {
    const nextStatus: TaskStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      await apiClient(`/tasks/${task.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          note: nextStatus === 'DONE' ? t('today.doneFromTodayNote') : undefined,
        }),
      });
      await fetchTodayData();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('today.statusChangeError'));
    }
  };

  // Handle single task reschedule to tomorrow
  const handleRescheduleSingle = async (task: TaskDto) => {
    if (!todayData?.date) return;
    try {
      const today = new Date(todayData.date);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      await apiClient(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ due_date: tomorrowStr }),
      });
      await fetchTodayData();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('today.rescheduleError'));
    }
  };

  // Handle batch reschedule all overdue tasks to tomorrow
  const handleRescheduleTomorrow = async () => {
    if (!confirm(t('today.rescheduleAllTomorrow') + '?')) {
      return;
    }
    try {
      setIsRescheduling(true);
      setRescheduleMsg(null);
      const res = await apiClient<RescheduleTomorrowResultDto>(
        '/tasks/reschedule-tomorrow',
        { method: 'POST' },
      );
      setRescheduleMsg(res.data.message);
      await fetchTodayData();
      setTimeout(() => setRescheduleMsg(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : t('today.rescheduleError'));
    } finally {
      setIsRescheduling(false);
    }
  };

  // Quick Task Create
  const handleQuickTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !todayData) return;

    try {
      setTaskSubmitting(true);
      const payload: CreateTaskInput = {
        title: taskTitle.trim(),
        priority: taskPriority,
        weight: Number(taskWeight),
        due_date: todayData.date,
        project_id: taskProjectId || undefined,
        member_id: taskMemberId || undefined,
      };

      await apiClient('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setTaskTitle('');
      await fetchTodayData();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('today.createTaskError'));
    } finally {
      setTaskSubmitting(false);
    }
  };

  // Quick Note Create
  const handleQuickNoteSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!noteContent.trim()) return;

    try {
      setNoteSubmitting(true);
      const payload: CreateQuickNoteInput = {
        content: noteContent.trim(),
      };
      const res = await apiClient<NoteDto>('/notes/quick', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setNoteContent('');
      setTodayData((prev) =>
        prev
          ? {
              ...prev,
              recent_quick_notes: [res.data, ...prev.recent_quick_notes.slice(0, 4)],
            }
          : prev,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : t('today.saveNoteError'));
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Delete Quick Note
  const handleDeleteNote = async (id: string) => {
    try {
      await apiClient(`/notes/${id}`, { method: 'DELETE' });
      setTodayData((prev) =>
        prev
          ? {
              ...prev,
              recent_quick_notes: prev.recent_quick_notes.filter((n) => n.id !== id),
            }
          : prev,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : t('today.deleteNoteError'));
    }
  };

  // Quick Follow-up Create
  const handleQuickFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpTitle.trim() || !followUpWaitingFor.trim()) {
      alert(t('today.followUpValidation'));
      return;
    }

    try {
      setFollowUpSubmitting(true);
      const defaultDate =
        followUpDate ||
        (() => {
          const d = new Date();
          d.setDate(d.getDate() + 2);
          return d.toISOString().split('T')[0] ?? '';
        })();

      const payload: CreateFollowUpInput = {
        title: followUpTitle.trim(),
        waiting_for: followUpWaitingFor.trim(),
        follow_up_date: defaultDate,
        member_id: followUpMemberId || undefined,
      };

      await apiClient('/follow-ups', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setFollowUpTitle('');
      setFollowUpWaitingFor('');
      setFollowUpMemberId('');
      setFollowUpDate('');
      setIsAddFollowUpOpen(false);
      await fetchTodayData();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('today.createFollowUpError'));
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  // Resolve Follow-up
  const handleResolveFollowUp = async (id: string) => {
    try {
      await apiClient(`/follow-ups/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      await fetchTodayData();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('today.updateFollowUpError'));
    }
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'CRITICAL':
        return (
          <span className="rounded bg-critical-bg text-critical-fg border border-critical-border px-1.5 py-0.2 text-[10px] font-bold">
            {t('tasks.priority.CRITICAL')}
          </span>
        );
      case 'HIGH':
        return (
          <span className="rounded bg-warning-bg text-warning-fg border border-warning-border px-1.5 py-0.2 text-[10px] font-bold">
            {t('tasks.priority.HIGH')}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="rounded bg-brand-bg text-brand-fg border border-brand-border px-1.5 py-0.2 text-[10px]">
            {t('tasks.priority.MEDIUM')}
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="rounded bg-neutral-bg text-neutral-fg border border-neutral-border px-1.5 py-0.2 text-[10px]">
            {t('tasks.priority.LOW')}
          </span>
        );
    }
  };

  if (loading && !todayData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  if (error && !todayData) {
    return (
      <div className="rounded-xl border border-red-900 bg-red-950/40 p-8 text-center text-red-300">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-400 mb-2" />
        <p className="font-semibold text-base">{t('common.error')}</p>
        <p className="text-xs mt-1 text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => void fetchTodayData()}
          className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs text-foreground rounded-lg transition"
        >
          {t('common.refresh')}
        </button>
      </div>
    );
  }

  const {
    stats = {
      total_tasks_today: 0,
      completed_tasks_today: 0,
      overdue_tasks_count: 0,
      pending_follow_ups_count: 0,
      completion_percentage: 0,
    },
    overdue_tasks = [],
    today_tasks = [],
    completed_today_tasks = [],
    pending_follow_ups = [],
    recent_quick_notes = [],
    formatted_date = '',
  } = todayData || {};

  return (
    <div className="space-y-6">
      {/* HEADER COCKPIT BANNER */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-950/80 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-800/80 mb-2">
              <SunMedium className="h-3.5 w-3.5 text-amber-400" />
              <span>{formatted_date}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>{t('today.headerQuestion')}</span>
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              {t('today.headerDesc')}
            </p>
          </div>

          {/* KPI & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Progress Badge */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-inner">
              <div className="text-right">
                <div className="text-[11px] text-slate-400 font-medium">{t('today.progressToday')}</div>
                <div className="font-mono text-lg font-bold text-emerald-400">
                  {stats.completed_tasks_today}/{stats.total_tasks_today}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    ({stats.completion_percentage}%)
                  </span>
                </div>
              </div>
              <div className="h-9 w-9 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-300 font-mono text-xs font-bold">
                {stats.completion_percentage}%
              </div>
            </div>

            {/* Reschedule Button */}
            {stats.overdue_tasks_count > 0 && (
              <button
                type="button"
                onClick={() => void handleRescheduleTomorrow()}
                disabled={isRescheduling}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600/20 border border-rose-600/50 px-3.5 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-600/30 transition disabled:opacity-50 shadow-sm"
                title={t('today.rescheduleAllTomorrow')}
              >
                <Clock className="h-4 w-4" />
                <span>{t('today.rescheduleOverdueBtn', { count: stats.overdue_tasks_count })}</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => void fetchTodayData()}
              disabled={loading}
              className="rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-slate-300 hover:bg-slate-700 transition disabled:opacity-50"
              title={t('today.refreshTitle')}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Reschedule Toast/Notice */}
        {rescheduleMsg && (
          <div className="mt-4 rounded-lg bg-emerald-950/60 border border-emerald-800/80 px-3 py-2 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{rescheduleMsg}</span>
          </div>
        )}
      </div>

      {/* MAIN 2-COLUMN COCKPIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: TASKS SECTION (8 cols)                                      */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* QUICK TASK CREATOR BAR */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
            <form onSubmit={handleQuickTaskSubmit} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    placeholder={t('today.quickTaskInputPlaceholder')}
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-3 pr-10 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={taskSubmitting || !taskTitle.trim()}
                    className="absolute right-1.5 top-1.5 h-7 w-7 flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40"
                    title={t('today.createTaskEnter')}
                  >
                    <CornerDownLeft className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Inline task properties selector */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
                {/* Priority */}
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as Priority)}
                  className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="LOW">{t('today.priorityPrefix')}: {t('tasks.priority.LOW')}</option>
                  <option value="MEDIUM">{t('today.priorityPrefix')}: {t('tasks.priority.MEDIUM')}</option>
                  <option value="HIGH">{t('today.priorityPrefix')}: {t('tasks.priority.HIGH')}</option>
                  <option value="CRITICAL">{t('today.priorityPrefix')}: {t('tasks.priority.CRITICAL')}</option>
                </select>

                {/* Weight */}
                <select
                  value={taskWeight}
                  onChange={(e) => setTaskWeight(Number(e.target.value))}
                  className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-300 focus:outline-none font-mono"
                >
                  <option value={1}>{t('today.weightPrefix')}: W1</option>
                  <option value={2}>{t('today.weightPrefix')}: W2</option>
                  <option value={3}>{t('today.weightPrefix')}: W3</option>
                  <option value={4}>{t('today.weightPrefix')}: W4</option>
                  <option value={5}>{t('today.weightPrefix')}: W5</option>
                </select>

                {/* Project */}
                {projects.length > 0 && (
                  <select
                    value={taskProjectId}
                    onChange={(e) => setTaskProjectId(e.target.value)}
                    className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-300 focus:outline-none max-w-[150px] truncate"
                  >
                    <option value="">{t('today.noProjectOption')}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Assignee */}
                {members.length > 0 && (
                  <select
                    value={taskMemberId}
                    onChange={(e) => setTaskMemberId(e.target.value)}
                    className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-300 focus:outline-none max-w-[140px] truncate"
                  >
                    <option value="">{t('today.assigneeLeader')}</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </form>
          </div>

          {/* OVERDUE TASKS SECTION */}
          {overdue_tasks.length > 0 && (
            <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-900/40">
                <h3 className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span>{t('today.attentionOverdue')} ({overdue_tasks.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => void handleRescheduleTomorrow()}
                  className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition"
                >
                  {t('today.rescheduleAllTomorrowArrow')}
                </button>
              </div>

              <div className="space-y-2">
                {overdue_tasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-rose-900/40 bg-slate-950/80 p-3 hover:border-rose-700/60 transition"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => void handleToggleTask(task)}
                        className="mt-0.5 text-slate-500 hover:text-emerald-400 transition shrink-0"
                        title={t('common.confirmAction')}
                      >
                        <Square className="h-4 w-4" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {getPriorityBadge(task.priority)}
                          <span className="font-mono text-[10px] text-slate-400 rounded bg-slate-800 px-1 py-0.2 border border-slate-700">
                            W{task.weight}
                          </span>
                          {task.project && (
                            <Link
                              href={`/projects/${task.project.id}`}
                              className="font-mono text-[10px] text-indigo-300 hover:underline"
                            >
                              [{task.project.code}]
                            </Link>
                          )}
                          <span className="text-[10px] text-rose-400 font-mono font-semibold">
                            {t('today.dueDateLabel')}: {task.due_date}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-100 truncate">
                          {task.title}
                        </div>
                        {task.assignee && (
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Users className="h-2.5 w-2.5" />
                            <span>{task.assignee.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleRescheduleSingle(task)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700 transition"
                        title={t('today.tomorrowSingle')}
                      >
                        {t('today.tomorrowSingle')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TODAY'S TASKS SECTION */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                <CheckSquare className="h-4 w-4 text-indigo-400" />
                <span>{t('today.tasksToday')} ({today_tasks.length})</span>
              </h3>
              <Link
                href="/tasks"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {t('today.seeAllCockpit')}
              </Link>
            </div>

            {today_tasks.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="mx-auto h-7 w-7 text-slate-600 mb-2" />
                <p>{t('today.noTasksToday')}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {t('today.noTasksSubtext')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {today_tasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => void handleToggleTask(task)}
                        className="mt-0.5 text-slate-500 hover:text-emerald-400 transition shrink-0"
                        title={t('common.confirmAction')}
                      >
                        <Square className="h-4 w-4" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {getPriorityBadge(task.priority)}
                          <span className="font-mono text-[10px] text-slate-400 rounded bg-slate-800 px-1 py-0.2 border border-slate-700">
                            W{task.weight}
                          </span>
                          {task.project && (
                            <Link
                              href={`/projects/${task.project.id}`}
                              className="font-mono text-[10px] text-indigo-300 hover:underline"
                            >
                              [{task.project.code}]
                            </Link>
                          )}
                          {task.milestone && (
                            <span className="text-[10px] text-sky-400 bg-sky-950/40 px-1 rounded border border-sky-900/50">
                              {task.milestone.title}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-100 truncate">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {task.description}
                          </div>
                        )}
                        {task.assignee && (
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Users className="h-2.5 w-2.5 text-slate-500" />
                            <span>{task.assignee.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                          task.status === 'DOING'
                            ? 'bg-blue-950/80 text-blue-300 border-blue-800 animate-pulse'
                            : task.status === 'WAITING'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMPLETED TODAY SECTION (COLLAPSIBLE) */}
          {completed_today_tasks.length > 0 && (
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 space-y-2">
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>{t('today.completedToday')} ({completed_today_tasks.length})</span>
                </div>
                {showCompleted ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showCompleted && (
                <div className="space-y-1.5 pt-2">
                  {completed_today_tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-slate-950/40 px-3 py-2 text-xs text-slate-500 border border-slate-800/40 line-through"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => void handleToggleTask(task)}
                          className="text-emerald-400 hover:text-slate-400 transition shrink-0"
                          title={t('common.confirmAction')}
                        >
                          <CheckSquare className="h-4 w-4" />
                        </button>
                        <span className="truncate">{task.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 shrink-0">
                        W{task.weight}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: FOLLOW-UPS & QUICK NOTES (4 cols)                          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* FOLLOW-UPS WIDGET */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                <Hourglass className="h-4 w-4 text-purple-400" />
                <span>{t('today.followUpsWaiting')} ({pending_follow_ups.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddFollowUpOpen(!isAddFollowUpOpen)}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                {isAddFollowUpOpen ? t('common.close') : `+ ${t('common.add')}`}
              </button>
            </div>

            {/* Quick Follow-up Form */}
            {isAddFollowUpOpen && (
              <form
                onSubmit={handleQuickFollowUpSubmit}
                className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2 text-xs"
              >
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">
                    {t('today.waitingContent')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('today.followUpContentExample')}
                    value={followUpTitle}
                    onChange={(e) => setFollowUpTitle(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">
                    {t('today.waitingWho')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('today.followUpWhoExample')}
                    value={followUpWaitingFor}
                    onChange={(e) => setFollowUpWaitingFor(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                {members.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">
                      {t('today.assignMemberOptional')}
                    </label>
                    <select
                      value={followUpMemberId}
                      onChange={(e) => {
                        setFollowUpMemberId(e.target.value);
                        const found = members.find((m) => m.id === e.target.value);
                        if (found && !followUpWaitingFor) {
                          setFollowUpWaitingFor(found.name);
                        }
                      }}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 focus:outline-none"
                    >
                      <option value="">-- {t('common.optional')} --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">
                    {t('today.followUpAskDate')}
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddFollowUpOpen(false)}
                    className="px-2.5 py-1 text-slate-400 hover:text-slate-200"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={followUpSubmitting}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium disabled:opacity-50"
                  >
                    {followUpSubmitting ? t('common.saving') : t('today.saveFollowUp')}
                  </button>
                </div>
              </form>
            )}

            {/* Follow-ups List */}
            {pending_follow_ups.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                {t('today.noFollowups')}
              </div>
            ) : (
              <div className="space-y-2">
                {pending_follow_ups.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-3 bg-slate-950 transition ${
                      item.is_overdue
                        ? 'border-amber-800/80 bg-amber-950/15'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] text-purple-300 font-medium mb-1">
                          <span className="rounded bg-purple-950 px-1.5 py-0.2 border border-purple-800/60">
                            {t('today.waitingForLabel', { name: item.waiting_for })}
                          </span>
                          {item.is_overdue && (
                            <span className="text-amber-400 font-bold">{t('today.overdueAlert')}</span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-200">
                          {item.title}
                        </div>
                        {item.note && (
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                            &ldquo;{item.note}&rdquo;
                          </div>
                        )}
                        <div className="mt-1.5 text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{t('today.askDateLabel', { date: item.follow_up_date })}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleResolveFollowUp(item.id)}
                        className="shrink-0 px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[10px] font-semibold border border-emerald-800/60 transition"
                        title={t('today.resolve')}
                      >
                        {t('today.resolve')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QUICK NOTES WIDGET */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                <FileText className="h-4 w-4 text-amber-400" />
                <span>{t('today.quickNotesTitle')}</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                {t('today.quickNotesTagline')}
              </span>
            </div>

            {/* Fast Textarea Capture */}
            <form onSubmit={handleQuickNoteSubmit} className="space-y-2">
              <textarea
                rows={3}
                placeholder={t('today.quickNoteTextareaPlaceholder')}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    void handleQuickNoteSubmit();
                  }
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={noteSubmitting || !noteContent.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-40"
                >
                  <Send className="h-3 w-3" />
                  <span>{noteSubmitting ? t('common.saving') : t('today.saveQuick')}</span>
                </button>
              </div>
            </form>

            {/* Recent Quick Notes */}
            {recent_quick_notes.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400">
                  {t('today.recentNotesHeader')}
                </div>
                {recent_quick_notes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs group hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="font-semibold text-slate-200 line-clamp-1">
                        {n.title}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDeleteNote(n.id)}
                        className="text-slate-600 hover:text-red-400 transition p-0.5"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
