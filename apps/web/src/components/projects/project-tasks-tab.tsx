'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TaskDto,
  MemberDto,
  MilestoneDto,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  Priority,
} from '@leaderos/shared-types';
import { Modal } from '@/components/ui/modal';
import { useTranslation } from 'react-i18next';
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
} from 'lucide-react';

interface ProjectTasksTabProps {
  projectId: string;
  projectMembers?: MemberDto[];
  onTaskChanged?: () => void;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  due_date: string;
  due_time: string;
  weight: number;
  member_id: string;
  milestone_id: string;
}

const initialFormData: TaskFormData = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'TODO',
  due_date: '',
  due_time: '',
  weight: 1,
  member_id: '',
  milestone_id: '',
};

export function ProjectTasksTab({

  projectId,
  projectMembers = [],
  onTaskChanged,
}: ProjectTasksTabProps) {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [milestones, setMilestones] = useState<MilestoneDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [milestoneFilter, setMilestoneFilter] = useState<string>('ALL');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch tasks and milestones
  const fetchTasksAndMilestones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tasksRes, milestonesRes] = await Promise.all([
        apiClient<TaskDto[]>('/tasks', { params: { project_id: projectId } }),
        apiClient<MilestoneDto[]>('/milestones', { params: { project_id: projectId } }),
      ]);
      setTasks(tasksRes.data);
      setMilestones(milestonesRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải công việc của dự án');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchTasksAndMilestones();
  }, [fetchTasksAndMilestones]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormData(initialFormData);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TaskDto) => {
    setEditingTask(t);
    setFormData({
      title: t.title,
      description: t.description ?? '',
      priority: t.priority,
      status: t.status,
      due_date: t.due_date ?? '',
      due_time: t.due_time ?? '',
      weight: t.weight,
      member_id: t.member_id ?? '',
      milestone_id: t.milestone_id ?? '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Tiêu đề công việc không được để trống.');
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
          due_date: formData.due_date || null,
          due_time: formData.due_time || null,
          weight: formData.weight,
          member_id: formData.member_id || null,
          milestone_id: formData.milestone_id || null,
        };
        await apiClient(`/tasks/${editingTask.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        const payload: CreateTaskInput = {
          project_id: projectId,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          priority: formData.priority,
          status: formData.status,
          due_date: formData.due_date || undefined,
          due_time: formData.due_time || undefined,
          weight: formData.weight,
          member_id: formData.member_id || undefined,
          milestone_id: formData.milestone_id || undefined,
        };
        await apiClient('/tasks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      await fetchTasksAndMilestones();
      onTaskChanged?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await apiClient(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchTasksAndMilestones();
      onTaskChanged?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try {
      await apiClient(`/tasks/${id}`, { method: 'DELETE' });
      await fetchTasksAndMilestones();
      onTaskChanged?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa công việc');
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'ALL' && t.member_id !== assigneeFilter) return false;
      if (milestoneFilter !== 'ALL' && t.milestone_id !== milestoneFilter) return false;
      if (overdueOnly && !t.is_overdue) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, assigneeFilter, milestoneFilter, overdueOnly, searchQuery]);

  const renderPriorityBadge = (p: Priority) => {
    const config: Record<Priority, { label: string; cls: string }> = {
      LOW: { label: 'Thấp', cls: 'text-slate-400 bg-slate-800 border-slate-700' },
      MEDIUM: { label: 'Trung bình', cls: 'text-blue-300 bg-blue-950/70 border-blue-800' },
      HIGH: { label: 'Cao', cls: 'text-amber-300 bg-amber-950/70 border-amber-800' },
      CRITICAL: { label: 'Khẩn cấp', cls: 'text-red-300 bg-red-950/80 border-red-800' },
    };
    const c = config[p] ?? { label: p, cls: 'text-slate-300 bg-slate-800 border-slate-700' };
    return (
      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${c.cls}`}>
        {c.label}
      </span>
    );
  };

  const kanbanColumns: Array<{ status: TaskStatus; title: string; color: string }> = [
    { status: 'TODO', title: 'Cần làm (TODO)', color: 'border-slate-700' },
    { status: 'DOING', title: 'Đang làm (DOING)', color: 'border-indigo-700' },
    { status: 'WAITING', title: 'Đang chờ (WAITING)', color: 'border-amber-700' },
    { status: 'DONE', title: 'Hoàn thành (DONE)', color: 'border-emerald-700' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs">Đang tải danh sách công việc...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top action & View toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-indigo-400" />
            <span>Công việc dự án (Tasks - {tasks.length})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Khi công việc chuyển sang <span className="text-emerald-400 font-semibold">DONE</span>, tiến độ dự án sẽ tự động tăng theo trọng số (Weight 1-5).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                viewMode === 'table' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Bảng</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm công việc</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-xs">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo tên task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200 focus:outline-none"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="TODO">Cần làm (TODO)</option>
          <option value="DOING">Đang làm (DOING)</option>
          <option value="WAITING">Đang chờ (WAITING)</option>
          <option value="DONE">Hoàn thành (DONE)</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>

        {/* Priority filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200 focus:outline-none"
        >
          <option value="ALL">Tất cả ưu tiên</option>
          <option value="CRITICAL">Khẩn cấp (Critical)</option>
          <option value="HIGH">Cao (High)</option>
          <option value="MEDIUM">Trung bình (Medium)</option>
          <option value="LOW">Thấp (Low)</option>
        </select>

        {/* Milestone filter */}
        {milestones.length > 0 && (
          <select
            value={milestoneFilter}
            onChange={(e) => setMilestoneFilter(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200 focus:outline-none"
          >
            <option value="ALL">Tất cả cột mốc</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        )}

        {/* Assignee filter */}
        {projectMembers && projectMembers.length > 0 && (
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200 focus:outline-none"
          >
            <option value="ALL">Tất cả nhân sự</option>
            {projectMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}

        {/* Overdue filter */}
        <button
          type="button"
          onClick={() => setOverdueOnly(!overdueOnly)}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 border transition ${
            overdueOnly
              ? 'bg-red-950 text-red-300 border-red-800 font-semibold'
              : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="h-3 w-3" />
          <span>Quá hạn</span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-900/60 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Main View: Table or Kanban */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center">
          <CheckSquare className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-2 text-sm text-slate-300 font-medium">Không tìm thấy công việc nào</p>
          <p className="mt-1 text-xs text-slate-500">
            {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'Không có công việc khớp với bộ lọc hiện tại.'
              : 'Hãy tạo công việc đầu tiên và gắn trọng số để kích hoạt tính tiến độ tự động.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
            <thead className="bg-slate-950/80 font-semibold uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Công việc</th>
                <th className="px-3 py-3">Ưu tiên & Trọng số</th>
                <th className="px-3 py-3">Trạng thái</th>
                <th className="px-3 py-3">Hạn chót</th>
                <th className="px-3 py-3">Phụ trách</th>
                <th className="px-3 py-3">Cột mốc</th>
                <th className="px-3 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition">
                  {/* Title & Description */}
                  <td className="px-4 py-3 max-w-sm">
                    <div className="font-semibold text-white">{t.title}</div>
                    {t.description && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{t.description}</p>
                    )}
                  </td>

                  {/* Priority & Weight */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {renderPriorityBadge(t.priority)}
                      <span
                        className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-indigo-300 border border-slate-700"
                        title="Trọng số công việc (1-5)"
                      >
                        <Scale className="h-2.5 w-2.5" /> w:{t.weight}
                      </span>
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <select
                      value={t.status}
                      onChange={(e) => void handleStatusChange(t.id, e.target.value as TaskStatus)}
                      className={`rounded px-2 py-0.5 text-[11px] font-medium border focus:outline-none ${
                        t.status === 'DONE'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : t.status === 'DOING'
                          ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                          : t.status === 'WAITING'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : t.status === 'CANCELLED'
                          ? 'bg-red-950 text-red-300 border-red-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <option value="TODO">TODO</option>
                      <option value="DOING">DOING</option>
                      <option value="WAITING">WAITING</option>
                      <option value="DONE">DONE</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </td>

                  {/* Due Date & Overdue */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    {t.due_date ? (
                      <div
                        className={`flex items-center gap-1 ${
                          t.is_overdue ? 'text-red-400 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {t.is_overdue && <AlertTriangle className="h-3 w-3" />}
                        <Calendar className="h-3 w-3 text-slate-500" />
                        <span>{t.due_date}</span>
                        {t.due_time && <span className="text-[10px]">({t.due_time})</span>}
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Assignee */}
                  <td className="px-3 py-3 whitespace-nowrap text-slate-300">
                    {t.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-900 text-[10px] text-indigo-200">
                          {t.assignee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs">{t.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Milestone */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    {t.milestone ? (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                        <Flag className="h-2.5 w-2.5 text-indigo-400" />
                        {t.milestone.title}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(t)}
                        title="Sửa công việc"
                        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(t.id)}
                        title="Xóa công việc"
                        className="rounded p-1 text-red-400 hover:bg-red-950/50 hover:text-red-300 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/60 p-3"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-300">{col.title}</span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                  {colTasks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-600">Trống</div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`rounded-lg border p-2.5 text-xs transition ${
                          t.is_overdue
                            ? 'border-red-900/80 bg-red-950/20'
                            : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          {renderPriorityBadge(t.priority)}
                          <span className="font-mono text-[10px] text-indigo-400">
                            w:{t.weight}
                          </span>
                        </div>

                        <div className="font-semibold text-white mb-1.5">{t.title}</div>

                        <div className="space-y-1 text-[11px] text-slate-400">
                          {t.due_date && (
                            <div
                              className={`flex items-center gap-1 ${
                                t.is_overdue ? 'text-red-400 font-semibold' : ''
                              }`}
                            >
                              <Clock className="h-3 w-3" />
                              <span>{t.due_date}</span>
                            </div>
                          )}

                          {t.assignee && (
                            <div className="flex items-center gap-1 text-slate-300">
                              <User className="h-3 w-3 text-slate-500" />
                              <span>{t.assignee.name}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <select
                            value={t.status}
                            onChange={(e) =>
                              void handleStatusChange(t.id, e.target.value as TaskStatus)
                            }
                            className="rounded bg-slate-950 border border-slate-700 text-[10px] px-1 py-0.5 text-slate-300"
                          >
                            <option value="TODO">TODO</option>
                            <option value="DOING">DOING</option>
                            <option value="WAITING">WAITING</option>
                            <option value="DONE">DONE</option>
                          </select>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(t)}
                              className="text-slate-400 hover:text-slate-200 p-0.5"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(t.id)}
                              className="text-red-400 hover:text-red-300 p-0.5"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Chỉnh sửa Công việc' : 'Tạo Công việc mới'}
        description="Thiết lập chi tiết công việc, trọng số và người phụ trách."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-950/50 border border-red-900 p-2.5 text-xs text-red-300">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Tiêu đề công việc <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Viết unit test cho auth service..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Mô tả chi tiết</label>
            <textarea
              rows={2}
              placeholder="Mô tả các yêu cầu kỹ thuật hoặc acceptance criteria..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Độ ưu tiên</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as Priority })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
              >
                <option value="LOW">Thấp (Low)</option>
                <option value="MEDIUM">Trung bình (Medium)</option>
                <option value="HIGH">Cao (High)</option>
                <option value="CRITICAL">Khẩn cấp (Critical)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as TaskStatus })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
              >
                <option value="TODO">Cần làm (TODO)</option>
                <option value="DOING">Đang làm (DOING)</option>
                <option value="WAITING">Đang chờ (WAITING)</option>
                <option value="DONE">Hoàn thành (DONE)</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Trọng số tính tiến độ (Weight): <span className="font-mono text-indigo-400">{formData.weight}</span>
              </label>
              <select
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none font-mono"
              >
                <option value={1}>1 - Nhỏ / Tác vụ nhanh</option>
                <option value={2}>2 - Trung bình</option>
                <option value={3}>3 - Quan trọng</option>
                <option value={4}>4 - Lớn / Phức tạp</option>
                <option value={5}>5 - Cốt lõi / Epic</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Hạn chót (Due date)</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Giờ hạn chót</label>
              <input
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Thành viên phụ trách</label>
              <select
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
              >
                <option value="">-- Chưa chỉ định --</option>
                {projectMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Gắn vào Cột mốc (Milestone)</label>
              <select
                value={formData.milestone_id}
                onChange={(e) => setFormData({ ...formData, milestone_id: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
              >
                <option value="">-- Không gắn cột mốc --</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {formSubmitting
                ? 'Đang lưu...'
                : editingTask
                ? 'Lưu thay đổi'
                : 'Tạo công việc'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
