'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ProjectDto,
  TaskDto,
  WeeklyPlanDto,
  WeeklyPlanStatus,
} from '@leaderos/shared-types';
import { apiClient } from '@/lib/api-client';
import { AppLayout } from '@/components/layout/app-layout';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  FolderKanban,
  Target,
  Trophy,
  AlertTriangle,
  Sparkles,
  Edit2,
  Trash2,
  RefreshCw,
  FileText,
  User,
  X,
} from 'lucide-react';

/** ACTIVE comes first because it is the default state for a newly created plan. */
const PLAN_STATUS_KEYS: WeeklyPlanStatus[] = ['ACTIVE', 'DRAFT', 'COMPLETED'];

function getISOWeekAndYear(d = new Date()): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

export default function WeeklyPage() {
  return (
    <AppLayout>
      <WeeklyContent />
    </AppLayout>
  );
}

function WeeklyContent() {
  const { t } = useTranslation();
  const currentISO = getISOWeekAndYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentISO.year);
  const [selectedWeek, setSelectedWeek] = useState<number>(currentISO.week);

  const [plans, setPlans] = useState<WeeklyPlanDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterProjectId, setFilterProjectId] = useState<string>('ALL');

  // Modals state
  const [showCreatePlanModal, setShowCreatePlanModal] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<WeeklyPlanDto | null>(null);
  const [reviewingPlan, setReviewingPlan] = useState<WeeklyPlanDto | null>(null);
  const [assigningTaskPlan, setAssigningTaskPlan] = useState<WeeklyPlanDto | null>(null);
  const [projectTasks, setProjectTasks] = useState<TaskDto[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form states for Plan
  const [planProjectId, setPlanProjectId] = useState<string>('');
  const [planGoal, setPlanGoal] = useState<string>('');
  const [planStatus, setPlanStatus] = useState<WeeklyPlanStatus>('ACTIVE');

  // Form states for Review
  const [reviewSummary, setReviewSummary] = useState<string>('');
  const [reviewAchievements, setReviewAchievements] = useState<string>('');
  const [reviewChallenges, setReviewChallenges] = useState<string>('');
  const [reviewImprovements, setReviewImprovements] = useState<string>('');

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        week: selectedWeek.toString(),
      });
      if (filterProjectId !== 'ALL') {
        params.append('projectId', filterProjectId);
      }
      const res = await apiClient<WeeklyPlanDto[]>(`/weekly-plans?${params.toString()}`);
      setPlans(res.data);
    } catch (err) {
      console.error('Failed to load weekly plans', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedWeek, filterProjectId]);

  const fetchProjects = async () => {
    try {
      const res = await apiClient<ProjectDto[]>('/projects');
      setProjects(res.data.filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED'));
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  useEffect(() => {
    void fetchProjects();
  }, []);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  // Navigate week
  const handlePrevWeek = () => {
    if (selectedWeek <= 1) {
      setSelectedYear((y) => y - 1);
      setSelectedWeek(52);
    } else {
      setSelectedWeek((w) => w - 1);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeek >= 52) {
      setSelectedYear((y) => y + 1);
      setSelectedWeek(1);
    } else {
      setSelectedWeek((w) => w + 1);
    }
  };

  const handleCurrentWeek = () => {
    const cur = getISOWeekAndYear();
    setSelectedYear(cur.year);
    setSelectedWeek(cur.week);
  };

  // Toggle Task Status directly in Weekly Plan
  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
      await apiClient(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchPlans();
    } catch (err) {
      console.error('Failed to toggle task status', err);
    }
  };

  // Remove Task from Weekly Plan
  const handleRemoveTask = async (planId: string, taskId: string) => {
    try {
      await apiClient(`/weekly-plans/${planId}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      await fetchPlans();
    } catch (err) {
      console.error('Failed to remove task from plan', err);
    }
  };

  // Delete Weekly Plan
  const handleDeletePlan = async (planId: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try {
      await apiClient(`/weekly-plans/${planId}`, {
        method: 'DELETE',
      });
      await fetchPlans();
    } catch (err) {
      console.error('Failed to delete weekly plan', err);
    }
  };

  // Open Create Plan Modal
  const openCreateModal = () => {
    setEditingPlan(null);
    setPlanProjectId(projects[0]?.id ?? '');
    setPlanGoal('');
    setPlanStatus('ACTIVE');
    setShowCreatePlanModal(true);
  };

  // Open Edit Plan Modal
  const openEditModal = (plan: WeeklyPlanDto) => {
    setEditingPlan(plan);
    setPlanProjectId(plan.project_id);
    setPlanGoal(plan.goal);
    setPlanStatus(plan.status);
    setShowCreatePlanModal(true);
  };

  // Save Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planGoal.trim()) {
      alert(t('weekly.goalRequired'));
      return;
    }

    try {
      setSubmitting(true);
      if (editingPlan) {
        await apiClient(`/weekly-plans/${editingPlan.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            goal: planGoal.trim(),
            status: planStatus,
          }),
        });
      } else {
        await apiClient('/weekly-plans', {
          method: 'POST',
          body: JSON.stringify({
            project_id: planProjectId,
            year: selectedYear,
            week_number: selectedWeek,
            goal: planGoal.trim(),
            status: planStatus,
          }),
        });
      }
      setShowCreatePlanModal(false);
      await fetchPlans();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('weekly.savePlanError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Open Assign Tasks Modal
  const openAssignTaskModal = async (plan: WeeklyPlanDto) => {
    setAssigningTaskPlan(plan);
    try {
      const res = await apiClient<TaskDto[]>(`/tasks?projectId=${plan.project_id}`);
      const assignedIds = new Set((plan.tasks ?? []).map((t) => t.task_id));
      setProjectTasks(res.data.filter((t) => !assignedIds.has(t.id)));
      setSelectedTaskIds([]);
    } catch (err) {
      console.error('Failed to load project tasks', err);
    }
  };

  // Submit Assign Tasks
  const handleAssignTasksSubmit = async () => {
    if (!assigningTaskPlan || selectedTaskIds.length === 0) return;
    try {
      setSubmitting(true);
      await apiClient(`/weekly-plans/${assigningTaskPlan.id}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ task_ids: selectedTaskIds }),
      });
      setAssigningTaskPlan(null);
      await fetchPlans();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('weekly.assignError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Open Review Modal
  const openReviewModal = (plan: WeeklyPlanDto) => {
    setReviewingPlan(plan);
    if (plan.review) {
      setReviewSummary(plan.review.summary);
      setReviewAchievements(plan.review.achievements ?? '');
      setReviewChallenges(plan.review.challenges ?? '');
      setReviewImprovements(plan.review.improvements ?? '');
    } else {
      setReviewSummary('');
      setReviewAchievements('');
      setReviewChallenges('');
      setReviewImprovements('');
    }
  };

  // Save Review
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingPlan || !reviewSummary.trim()) {
      alert(t('weekly.summaryRequired'));
      return;
    }
    try {
      setSubmitting(true);
      await apiClient(`/weekly-plans/${reviewingPlan.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          summary: reviewSummary.trim(),
          achievements: reviewAchievements.trim() || undefined,
          challenges: reviewChallenges.trim() || undefined,
          improvements: reviewImprovements.trim() || undefined,
        }),
      });
      setReviewingPlan(null);
      await fetchPlans();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('weekly.saveReviewError'));
    } finally {
      setSubmitting(false);
    }
  };

  const isCurrentWeekSelected =
    selectedYear === currentISO.year && selectedWeek === currentISO.week;

  return (
    <div className="space-y-8">
      {/* Top Header & Week Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-indigo-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t('weekly.pageTitle')}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">{t('weekly.pageSubtitle')}</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
        >
          <Plus className="h-4 w-4" />
          <span>{t('weekly.newPlanButton')}</span>
        </button>
      </div>

      {/* Week Navigator Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            title={t('weekly.prevWeek')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="px-3 py-1 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
            <span className="text-base font-bold text-foreground tracking-wide">
              {t('weekly.weekOfYear', { week: selectedWeek, year: selectedYear })}
            </span>
            {isCurrentWeekSelected && (
              <span className="rounded-full bg-emerald-950 border border-emerald-800/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                {t('weekly.currentWeek')}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextWeek}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            title={t('weekly.nextWeek')}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {!isCurrentWeekSelected && (
            <button
              type="button"
              onClick={handleCurrentWeek}
              className="ml-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-indigo-300 transition"
            >
              {t('weekly.backToThisWeek')}
            </button>
          )}
        </div>

        {/* Project Filter */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">{t('common.filterProjectLabel')}</label>
          <select
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">{t('common.allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.code}] {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void fetchPlans()}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition"
            title={t('common.refresh')}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Plans List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">{t('weekly.loading')}</div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">
            {t('weekly.emptyTitle', { week: selectedWeek, year: selectedYear })}
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">{t('weekly.emptyDesc')}</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>{t('weekly.createFirst')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-md overflow-hidden"
            >
              {/* Plan Header */}
              <div className="border-b border-slate-800/80 bg-slate-850/60 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/projects/${plan.project_id}`}
                        className="text-base font-bold text-foreground hover:text-brand transition"
                      >
                        [{plan.project_code}] {plan.project_name}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          plan.status === 'COMPLETED'
                            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                            : plan.status === 'ACTIVE'
                            ? 'bg-indigo-950/80 border-indigo-800 text-indigo-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {t(`weekly.planStatuses.${plan.status}`, { defaultValue: plan.status })}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {t('weekly.dateRange', {
                        start: formatDate(plan.start_date),
                        end: formatDate(plan.end_date),
                      })}
                    </span>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-3">
                  {/* Progress Indicator */}
                  <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400">{t('weekly.weekProgress')}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {plan.completed_tasks}/{plan.total_tasks} ({plan.completion_rate}%)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditModal(plan)}
                    className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                    title={t('weekly.editGoalTitle')}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDeletePlan(plan.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                    title={t('weekly.deletePlanTitle')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Goal Box */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950/20 border-b border-slate-800/80">
                <div className="flex items-start gap-2.5">
                  <Target className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-indigo-400 block mb-0.5">
                      {t('weekly.goalSectionLabel')}
                    </span>
                    <p className="text-sm font-medium text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {plan.goal}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, plan.completion_rate))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tasks in Weekly Plan */}
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs uppercase font-bold text-slate-300 tracking-wider">
                      {t('weekly.committedTasks', { count: plan.tasks?.length ?? 0 })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void openAssignTaskModal(plan)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t('weekly.addTaskButton')}</span>
                  </button>
                </div>

                {plan.tasks && plan.tasks.length > 0 ? (
                  <div className="divide-y divide-slate-800/60 rounded-xl border border-slate-800 bg-slate-950/50 overflow-hidden">
                    {plan.tasks.map((wpt) => {
                      const isDone = wpt.task?.status === 'DONE';
                      return (
                        <div
                          key={wpt.id}
                          className="flex items-center justify-between p-3 hover:bg-slate-900/60 transition gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => void handleToggleTaskStatus(wpt.task_id, wpt.task?.status ?? 'TODO')}
                              className="text-slate-400 hover:text-emerald-400 transition shrink-0"
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                              ) : (
                                <Circle className="h-5 w-5 text-slate-500" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <span
                                className={`text-sm font-medium block truncate ${
                                  isDone ? 'line-through text-slate-500' : 'text-slate-200'
                                }`}
                              >
                                {wpt.task?.title ?? t('weekly.taskNotFound')}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                                {wpt.task?.due_date && (
                                  <span>
                                    {t('common.dueDateShort', {
                                      date: formatDate(wpt.task.due_date),
                                    })}
                                  </span>
                                )}
                                {wpt.task?.assignee && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3 text-slate-500" />
                                    {wpt.task.assignee.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {wpt.task?.priority && (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  wpt.task.priority === 'CRITICAL'
                                    ? 'bg-red-950 text-red-400 border-red-800'
                                    : wpt.task.priority === 'HIGH'
                                    ? 'bg-amber-950 text-amber-400 border-amber-800'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {t(`tasks.priority.${wpt.task.priority}`, {
                                  defaultValue: wpt.task.priority,
                                })}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => void handleRemoveTask(plan.id, wpt.task_id)}
                              className="p-1 text-slate-500 hover:text-red-400 transition"
                              title={t('weekly.removeTaskTitle')}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500 italic bg-slate-950/40 rounded-xl border border-slate-800/80">
                    {t('weekly.noTasksAssigned')}
                  </div>
                )}
              </div>

              {/* Weekly Review Section */}
              <div className="border-t border-slate-800/80 bg-slate-950/60 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-400" />
                    <span className="text-xs uppercase font-bold text-amber-300 tracking-wider">
                      {t('weekly.reviewSectionTitle')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openReviewModal(plan)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>
                      {plan.review
                        ? t('weekly.updateReviewButton')
                        : t('weekly.createReviewButton')}
                    </span>
                  </button>
                </div>

                {plan.review ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block mb-1">
                        {t('weekly.leaderSummaryLabel')}
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {plan.review.summary}
                      </p>
                    </div>

                    {(plan.review.achievements ||
                      plan.review.challenges ||
                      plan.review.improvements) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                        {plan.review.achievements && (
                          <div className="rounded-lg bg-emerald-950/30 border border-emerald-900/50 p-2.5">
                            <span className="font-semibold text-emerald-400 flex items-center gap-1 mb-1">
                              <Trophy className="h-3.5 w-3.5" />
                              {t('weekly.achievementsShort')}
                            </span>
                            <p className="text-slate-300 leading-relaxed">
                              {plan.review.achievements}
                            </p>
                          </div>
                        )}

                        {plan.review.challenges && (
                          <div className="rounded-lg bg-amber-950/30 border border-amber-900/50 p-2.5">
                            <span className="font-semibold text-amber-400 flex items-center gap-1 mb-1">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {t('weekly.challengesShort')}
                            </span>
                            <p className="text-slate-300 leading-relaxed">
                              {plan.review.challenges}
                            </p>
                          </div>
                        )}

                        {plan.review.improvements && (
                          <div className="rounded-lg bg-indigo-950/30 border border-indigo-900/50 p-2.5">
                            <span className="font-semibold text-indigo-400 flex items-center gap-1 mb-1">
                              <Sparkles className="h-3.5 w-3.5" />
                              {t('weekly.improvementsShort')}
                            </span>
                            <p className="text-slate-300 leading-relaxed">
                              {plan.review.improvements}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {t('weekly.noReviewYet')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: Create or Edit Plan */}
      {/* ========================================================================= */}
      {showCreatePlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 dark:bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setShowCreatePlanModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-foreground">
                {editingPlan ? t('weekly.modalEditTitle') : t('weekly.modalCreateTitle')}
              </h2>
              <button
                type="button"
                onClick={() => setShowCreatePlanModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t('common.project')}
                </label>
                <select
                  value={planProjectId}
                  onChange={(e) => setPlanProjectId(e.target.value)}
                  disabled={!!editingPlan}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {t('common.year')}
                  </label>
                  <input
                    type="number"
                    value={selectedYear}
                    disabled
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {t('weekly.weekNumberLabel')}
                  </label>
                  <input
                    type="number"
                    value={selectedWeek}
                    disabled
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t('weekly.goalLabel')}
                </label>
                <textarea
                  rows={3}
                  value={planGoal}
                  onChange={(e) => setPlanGoal(e.target.value)}
                  placeholder={t('weekly.goalPlaceholder')}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t('common.status')}
                </label>
                <select
                  value={planStatus}
                  onChange={(e) => setPlanStatus(e.target.value as WeeklyPlanStatus)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PLAN_STATUS_KEYS.map((st) => (
                    <option key={st} value={st}>
                      {t(`weekly.planStatusOptions.${st}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreatePlanModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  {submitting ? t('common.saving') : t('weekly.savePlan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: Assign Tasks to Plan */}
      {/* ========================================================================= */}
      {assigningTaskPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 dark:bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setAssigningTaskPlan(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-foreground">
                  {t('weekly.assignModalTitle')}
                </h2>
                <p className="text-xs text-slate-400">
                  {t('weekly.assignModalProject', {
                    code: assigningTaskPlan.project_code,
                    name: assigningTaskPlan.project_name,
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningTaskPlan(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {projectTasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  {t('weekly.noOpenTasks')}
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950 p-2">
                  {projectTasks.map((item) => {
                    const checked = selectedTaskIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 p-2.5 hover:bg-slate-900/60 rounded-lg cursor-pointer transition text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTaskIds((prev) => [...prev, item.id]);
                            } else {
                              setSelectedTaskIds((prev) => prev.filter((id) => id !== item.id));
                            }
                          }}
                          className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-200 block truncate">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {item.due_date
                              ? `${t('common.dueDateShort', { date: formatDate(item.due_date) })} · `
                              : ''}
                            {t('weekly.taskPriorityPrefix', {
                              value: t(`tasks.priority.${item.priority}`, {
                                defaultValue: item.priority,
                              }),
                            })}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningTaskPlan(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleAssignTasksSubmit}
                  disabled={submitting || selectedTaskIds.length === 0}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  {submitting
                    ? t('weekly.assigning')
                    : t('weekly.assignCount', { count: selectedTaskIds.length })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: Weekly Review */}
      {/* ========================================================================= */}
      {reviewingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 dark:bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setReviewingPlan(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-foreground">
                  {t('weekly.reviewModalTitle')}
                </h2>
                <p className="text-xs text-slate-400">
                  {t('weekly.reviewModalMeta', {
                    code: reviewingPlan.project_code,
                    name: reviewingPlan.project_name,
                    week: reviewingPlan.week_number,
                    year: reviewingPlan.year,
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingPlan(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t('weekly.summaryLabel')}
                </label>
                <textarea
                  rows={2}
                  value={reviewSummary}
                  onChange={(e) => setReviewSummary(e.target.value)}
                  placeholder={t('weekly.summaryPlaceholder')}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1 block mb-1">
                  <Trophy className="h-3.5 w-3.5" />
                  {t('weekly.achievementsLabel')}
                </label>
                <textarea
                  rows={2}
                  value={reviewAchievements}
                  onChange={(e) => setReviewAchievements(e.target.value)}
                  placeholder={t('weekly.achievementsPlaceholder')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-400 flex items-center gap-1 block mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {t('weekly.challengesLabel')}
                </label>
                <textarea
                  rows={2}
                  value={reviewChallenges}
                  onChange={(e) => setReviewChallenges(e.target.value)}
                  placeholder={t('weekly.challengesPlaceholder')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-indigo-400 flex items-center gap-1 block mb-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('weekly.improvementsLabel')}
                </label>
                <textarea
                  rows={2}
                  value={reviewImprovements}
                  onChange={(e) => setReviewImprovements(e.target.value)}
                  placeholder={t('weekly.improvementsPlaceholder')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewingPlan(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  {submitting ? t('common.saving') : t('weekly.saveReviewButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
