'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  TaskDto,
  ProjectDto,
  MemberDto,
  MilestoneDto,
  TaskStatus,
  Priority,
  CreateTaskInput,
  UpdateTaskInput,
} from '@leaderos/shared-types';
import { AppLayout } from '@/components/layout/app-layout';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { apiClient } from '@/lib/api-client';
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  User,
  Flag,
  Trash2,
  Edit2,
  Clock,
  LayoutGrid,
  List,
  Scale,
  FolderKanban,
  CheckCircle2,
  Hourglass,
  RefreshCw,
} from 'lucide-react';

interface TaskFormData {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  due_date: string;
  due_time: string;
  weight: number;
  project_id: string;
  member_id: string;
  milestone_id: string;
}

const TASK_STATUS_KEYS: TaskStatus[] = ['TODO', 'DOING', 'WAITING', 'DONE', 'CANCELLED'];

const TASK_PRIORITY_KEYS: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const TASK_WEIGHT_KEYS = [1, 2, 3, 4, 5] as const;

const initialFormData: TaskFormData = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'TODO',
  due_date: '',
  due_time: '',
  weight: 1,
  project_id: '',
  member_id: '',
  milestone_id: '',
};

export default function GlobalTasksPage() {
  return (
    <AppLayout>
      <TasksCockpitContent />
    </AppLayout>
  );
}

function TasksCockpitContent() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState<string>('');
  const [filterProjectId, setFilterProjectId] = useState<string>('ALL');
  const [filterMemberId, setFilterMemberId] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState<boolean>(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal project milestones
  const [projectMilestones, setProjectMilestones] = useState<MilestoneDto[]>([]);

  // Status Note Dialog
  const [statusDialogTask, setStatusDialogTask] = useState<{
    task: TaskDto;
    nextStatus: TaskStatus;
  } | null>(null);
  const [statusNote, setStatusNote] = useState<string>('');
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);

  // Load Projects and Members
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [projRes, memRes] = await Promise.all([
        apiClient<ProjectDto[]>('/projects'),
        apiClient<MemberDto[]>('/members'),
      ]);
      setProjects(projRes.data);
      setMembers(memRes.data);
    } catch {
      // Ignore non-fatal
    }
  }, []);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number | boolean | undefined> = {};
      if (filterProjectId !== 'ALL') params['project_id'] = filterProjectId;
      if (filterMemberId !== 'ALL') params['member_id'] = filterMemberId;
      if (filterStatus !== 'ALL') params['status'] = filterStatus;
      if (filterPriority !== 'ALL') params['priority'] = filterPriority;
      if (filterOverdueOnly) params['overdue'] = true;
      if (search.trim()) params['search'] = search.trim();

      const res = await apiClient<TaskDto[]>('/tasks', { params });
      setTasks(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tasks.loadError'));
    } finally {
      setLoading(false);
    }
  }, [
    filterProjectId,
    filterMemberId,
    filterStatus,
    filterPriority,
    filterOverdueOnly,
    search,
    t,
  ]);

  useEffect(() => {
    void fetchAuxiliaryData();
  }, [fetchAuxiliaryData]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  // Load milestones when modal project changes
  useEffect(() => {
    if (!formData.project_id) {
      setProjectMilestones([]);
      return;
    }
    apiClient<MilestoneDto[]>('/milestones', {
      params: { project_id: formData.project_id },
    })
      .then((res) => setProjectMilestones(res.data))
      .catch(() => setProjectMilestones([]));
  }, [formData.project_id]);

  // Check overdue
  const isTaskOverdue = (task: TaskDto): boolean => {
    if (!task.due_date || task.status === 'DONE' || task.status === 'CANCELLED') {
      return false;
    }
    const today = new Date().toISOString().split('T')[0] ?? '';
    return task.due_date < today;
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = tasks.length;
    const doing = tasks.filter((t) => t.status === 'DOING').length;
    const waiting = tasks.filter((t) => t.status === 'WAITING').length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const overdue = tasks.filter((t) => isTaskOverdue(t)).length;
    return { total, doing, waiting, done, overdue };
  }, [tasks]);

  // Open Create
  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormData({
      ...initialFormData,
      project_id: projects.length > 0 ? projects[0]?.id ?? '' : '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (task: TaskDto) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date ?? '',
      due_time: task.due_time ?? '',
      weight: task.weight,
      project_id: task.project_id ?? '',
      member_id: task.member_id ?? '',
      milestone_id: task.milestone_id ?? '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Modal
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError(t('tasks.titleRequired'));
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (editingTask) {
        const payload: UpdateTaskInput = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          priority: formData.priority,
          status: formData.status,
          due_date: formData.due_date || undefined,
          due_time: formData.due_time || undefined,
          weight: Number(formData.weight),
          project_id: formData.project_id || undefined,
          member_id: formData.member_id || undefined,
          milestone_id: formData.milestone_id || undefined,
        };
        await apiClient(`/tasks/${editingTask.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        const payload: CreateTaskInput = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          priority: formData.priority,
          status: formData.status,
          due_date: formData.due_date || undefined,
          due_time: formData.due_time || undefined,
          weight: Number(formData.weight),
          project_id: formData.project_id || undefined,
          member_id: formData.member_id || undefined,
          milestone_id: formData.milestone_id || undefined,
        };
        await apiClient('/tasks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      await fetchTasks();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('tasks.saveError'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try {
      await apiClient(`/tasks/${id}`, { method: 'DELETE' });
      await fetchTasks();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('tasks.deleteError'));
    }
  };

  // Prompt Quick Status Change
  const promptStatusChange = (task: TaskDto, nextStatus: TaskStatus) => {
    if (task.status === nextStatus) return;
    setStatusDialogTask({ task, nextStatus });
    setStatusNote('');
  };

  // Confirm Quick Status Change
  const confirmStatusChange = async () => {
    if (!statusDialogTask) return;
    try {
      setStatusUpdating(true);
      await apiClient(`/tasks/${statusDialogTask.task.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: statusDialogTask.nextStatus,
          note: statusNote.trim() || undefined,
        }),
      });
      setStatusDialogTask(null);
      await fetchTasks();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('tasks.statusUpdateError'));
    } finally {
      setStatusUpdating(false);
    }
  };

  // Helper styles
  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'CRITICAL':
        return (
          <span className="rounded bg-critical-bg text-critical-fg border border-critical-border px-2 py-0.5 text-[11px] font-semibold">
            {t('tasks.priority.CRITICAL')}
          </span>
        );
      case 'HIGH':
        return (
          <span className="rounded bg-warning-bg text-warning-fg border border-warning-border px-2 py-0.5 text-[11px] font-semibold">
            {t('tasks.priority.HIGH')}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="rounded bg-brand-bg text-brand-fg border border-brand-border px-2 py-0.5 text-[11px] font-medium">
            {t('tasks.priority.MEDIUM')}
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="rounded bg-neutral-bg text-neutral-fg border border-neutral-border px-2 py-0.5 text-[11px]">
            {t('tasks.priority.LOW')}
          </span>
        );
    }
  };

  const kanbanColumns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'TODO', label: t('tasks.status.TODO'), color: 'border-slate-700' },
    { status: 'DOING', label: t('tasks.status.DOING'), color: 'border-blue-700' },
    { status: 'WAITING', label: t('tasks.status.WAITING'), color: 'border-purple-700' },
    { status: 'DONE', label: t('tasks.status.DONE'), color: 'border-emerald-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <CheckSquare className="h-7 w-7 text-indigo-400" />
            <span>{t('tasks.cockpitTitle')}</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {t('tasks.cockpitSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchTasks()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>{t('tasks.createTask')}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="text-xs text-slate-400 font-medium">{t('common.total')}</div>
          <div className="mt-2 text-2xl font-bold font-mono text-foreground">{stats.total}</div>
        </div>

        <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4">
          <div className="text-xs text-blue-400 font-medium flex items-center gap-1">
            <Clock className="h-3 w-3" /> {t('tasks.status.DOING')}
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-300">{stats.doing}</div>
        </div>

        <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-4">
          <div className="text-xs text-purple-400 font-medium flex items-center gap-1">
            <Hourglass className="h-3 w-3" /> {t('tasks.status.WAITING')}
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-purple-300">{stats.waiting}</div>
        </div>

        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> {t('tasks.status.DONE')}
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-300">{stats.done}</div>
        </div>

        <div
          onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
          className={`cursor-pointer rounded-xl border p-4 transition ${
            filterOverdueOnly
              ? 'border-rose-500 bg-rose-950/50 shadow-md shadow-rose-950/40'
              : 'border-rose-900/40 bg-rose-950/20 hover:border-rose-800'
          }`}
        >
          <div className="text-xs text-rose-400 font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {t('today.overdue')}
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-300">{stats.overdue}</div>
        </div>
      </div>

      {/* Filter and View Controls Toolbar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder={t('tasks.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>{t('tasks.viewModeTable')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>{t('tasks.viewModeKanban')}</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">{t('common.project')}:</span>
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">{t('tasks.allProjects')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Member Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">{t('common.member')}:</span>
            <select
              value={filterMemberId}
              onChange={(e) => setFilterMemberId(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">{t('tasks.allMembers')}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">{t('common.status')}:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">{t('common.all')}</option>
              {TASK_STATUS_KEYS.map((st) => (
                <option key={st} value={st}>
                  {t(`tasks.statusFilterOptions.${st}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">{t('common.priority')}:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">{t('common.all')}</option>
              {TASK_PRIORITY_KEYS.map((p) => (
                <option key={p} value={p}>
                  {t(`tasks.priority.${p}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Overdue Checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer ml-auto text-xs text-rose-300 font-medium bg-rose-950/30 px-2.5 py-1.5 rounded-lg border border-rose-900/40 hover:bg-rose-950/50">
            <input
              type="checkbox"
              checked={filterOverdueOnly}
              onChange={(e) => setFilterOverdueOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0"
            />
            <span>{t('tasks.overdueOnly')}</span>
          </label>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg bg-red-950/50 border border-red-900 p-4 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="h-7 w-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">{t('common.loading')}</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <CheckSquare className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">{t('common.noData')}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {t('tasks.emptyHint')}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>{t('tasks.createNow')}</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
              <thead className="bg-slate-950 font-semibold uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">{t('tasks.taskTitle')}</th>
                  <th className="px-4 py-3">{t('common.project')}</th>
                  <th className="px-4 py-3">{t('common.member')}</th>
                  <th className="px-4 py-3">{t('common.priority')}</th>
                  <th className="px-4 py-3">{t('common.weight')}</th>
                  <th className="px-4 py-3">{t('common.dueDate')}</th>
                  <th className="px-4 py-3">{t('common.status')}</th>
                  <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tasks.map((task) => {
                  const overdue = isTaskOverdue(task);
                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-800/40 transition ${
                        overdue ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      {/* Title & Description */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-start gap-2">
                          {overdue && (
                            <span title={t('tasks.overdueTitle')}>
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                            </span>
                          )}
                          <div>
                            <div className="font-semibold text-slate-100">{task.title}</div>
                            {task.description && (
                              <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {task.description}
                              </div>
                            )}
                            {task.milestone && (
                              <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-sky-400 bg-sky-950/50 px-1.5 py-0.5 rounded border border-sky-800/50">
                                <Flag className="h-2.5 w-2.5" />
                                <span>{task.milestone.title}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Project */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {task.project ? (
                          <Link
                            href={`/projects/${task.project.id}`}
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-300 hover:text-indigo-200 hover:underline"
                          >
                            <FolderKanban className="h-3 w-3" />
                            <span>{task.project.code}</span>
                          </Link>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Member / Assignee */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                              {task.assignee.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-slate-300">{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Leader</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getPriorityBadge(task.priority)}
                      </td>

                      {/* Weight */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-300">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] border border-slate-700">
                          <Scale className="h-3 w-3 text-indigo-400" />
                          <span>W{task.weight}</span>
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {task.due_date ? (
                          <div
                            className={`flex items-center gap-1 font-mono ${
                              overdue ? 'text-rose-400 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            <Calendar className="h-3 w-3" />
                            <span>{task.due_date}</span>
                            {task.due_time && (
                              <span className="text-[10px] text-slate-500">
                                {task.due_time}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            promptStatusChange(task, e.target.value as TaskStatus)
                          }
                          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-200 focus:border-indigo-500 focus:outline-none"
                        >
                          {TASK_STATUS_KEYS.map((st) => (
                            <option key={st} value={st}>
                              {t(`tasks.statusShort.${st}`)}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(task)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                            title={t('common.edit')}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteTask(task.id)}
                            className="rounded p-1 text-red-400 hover:bg-red-950/50 hover:text-red-300 transition"
                            title={t('common.delete')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const colTasks = tasks.filter((item) => item.status === col.status);
            return (
              <div
                key={col.status}
                className={`flex flex-col rounded-xl border ${col.color} bg-slate-900/60 p-3 min-h-[450px] shadow-sm`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <span className="font-semibold text-xs text-slate-200">{col.label}</span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300 font-bold">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-[11px] text-slate-600 border border-dashed border-slate-800/80 rounded-lg">
                      {t('tasks.kanbanEmpty')}
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const overdue = isTaskOverdue(task);
                      return (
                        <div
                          key={task.id}
                          className={`rounded-lg border p-3 bg-slate-950 transition hover:border-slate-600 shadow-sm ${
                            overdue
                              ? 'border-rose-800/80 bg-rose-950/15'
                              : 'border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <div className="flex flex-wrap items-center gap-1">
                              {getPriorityBadge(task.priority)}
                              <span className="rounded bg-slate-800/80 px-1.5 py-0.2 text-[10px] font-mono text-slate-300 border border-slate-700">
                                W{task.weight}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(task)}
                                className="text-slate-500 hover:text-slate-300 p-0.5"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteTask(task.id)}
                                className="text-slate-500 hover:text-red-400 p-0.5"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <h4 className="text-xs font-semibold text-slate-100 leading-snug">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Project Code & Milestone */}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {task.project && (
                              <Link
                                href={`/projects/${task.project.id}`}
                                className="inline-flex items-center gap-1 text-[10px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50 hover:underline"
                              >
                                <FolderKanban className="h-2.5 w-2.5" />
                                <span>{task.project.code}</span>
                              </Link>
                            )}
                            {task.milestone && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 bg-sky-950/50 px-1.5 py-0.5 rounded border border-sky-800/50">
                                <Flag className="h-2.5 w-2.5" />
                                <span className="line-clamp-1">{task.milestone.title}</span>
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-900 text-[11px]">
                            {/* Member */}
                            <div className="flex items-center gap-1 text-slate-400">
                              <User className="h-3 w-3 text-slate-500" />
                              <span>{task.assignee?.name ?? 'Leader'}</span>
                            </div>

                            {/* Due date */}
                            {task.due_date ? (
                              <div
                                className={`flex items-center gap-1 font-mono text-[10px] ${
                                  overdue ? 'text-rose-400 font-bold' : 'text-slate-400'
                                }`}
                              >
                                <Clock className="h-3 w-3" />
                                <span>{task.due_date}</span>
                              </div>
                            ) : null}
                          </div>

                          {/* Quick move buttons */}
                          <div className="mt-2.5 pt-2 border-t border-slate-900/80 flex items-center justify-between gap-1 text-[10px]">
                            <span className="text-slate-500">{t('tasks.moveToLabel')}</span>
                            <div className="flex gap-1">
                              {col.status !== 'TODO' && (
                                <button
                                  type="button"
                                  onClick={() => promptStatusChange(task, 'TODO')}
                                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                >
                                  {t('tasks.statusShort.TODO')}
                                </button>
                              )}
                              {col.status !== 'DOING' && (
                                <button
                                  type="button"
                                  onClick={() => promptStatusChange(task, 'DOING')}
                                  className="px-1.5 py-0.5 bg-blue-950 hover:bg-blue-900 text-blue-300 rounded border border-blue-800/60"
                                >
                                  {t('tasks.statusShort.DOING')}
                                </button>
                              )}
                              {col.status !== 'DONE' && (
                                <button
                                  type="button"
                                  onClick={() => promptStatusChange(task, 'DONE')}
                                  className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800/60"
                                >
                                  {t('tasks.moveDone')}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? t('tasks.editTask') : t('tasks.createTask')}
        description={t('tasks.modalDesc')}
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-950/50 border border-red-900 p-3 text-xs text-red-300">
              {formError}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {t('tasks.titleLabel')} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={t('tasks.titlePlaceholder')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">{t('tasks.descLabel')}</label>
            <textarea
              rows={2}
              placeholder={t('tasks.descPlaceholder')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Project & Milestone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t('common.project')}</label>
              <select
                value={formData.project_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    project_id: e.target.value,
                    milestone_id: '',
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">{t('tasks.noProjectOption')}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t('tasks.milestoneLabel')}
              </label>
              <select
                value={formData.milestone_id}
                onChange={(e) => setFormData({ ...formData, milestone_id: e.target.value })}
                disabled={!formData.project_id || projectMilestones.length === 0}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">{t('tasks.noMilestoneOption')}</option>
                {projectMilestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Member & Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t('tasks.assigneeLabel')}
              </label>
              <select
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">{t('tasks.assigneeSelf')}</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t('tasks.weightLabel')}
              </label>
              <select
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-mono"
              >
                {TASK_WEIGHT_KEYS.map((w) => (
                  <option key={w} value={w}>
                    {t(`tasks.weightOptions.${w}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t('common.status')}</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as TaskStatus })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                {TASK_STATUS_KEYS.map((st) => (
                  <option key={st} value={st}>
                    {t(`tasks.statusFormOptions.${st}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t('tasks.priorityLabel')}
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as Priority })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                {TASK_PRIORITY_KEYS.map((p) => (
                  <option key={p} value={p}>
                    {t(`tasks.priorityOptions.${p}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date & time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t('tasks.dueDateLabel')}
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t('tasks.dueTimeLabel')}
              </label>
              <input
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {formSubmitting ? t('common.saving') : editingTask ? t('tasks.updateTask') : t('tasks.saveTask')}
            </button>
          </div>
        </form>
      </Modal>

      {/* QUICK STATUS CHANGE WITH NOTE MODAL */}
      <Modal
        isOpen={!!statusDialogTask}
        onClose={() => setStatusDialogTask(null)}
        title={t('tasks.confirmStatusChange')}
        description={t('tasks.statusChangeDesc', {
          title: statusDialogTask?.task.title ?? '',
          status: statusDialogTask
            ? t(`tasks.statusShort.${statusDialogTask.nextStatus}`)
            : '',
        })}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {t('tasks.statusNoteLabel')}
            </label>
            <textarea
              rows={2}
              placeholder={t('tasks.statusNotePlaceholder')}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStatusDialogTask(null)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => void confirmStatusChange()}
              disabled={statusUpdating}
              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 shadow-md shadow-indigo-600/30"
            >
              {statusUpdating ? t('common.saving') : t('tasks.confirmStatusChange')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
