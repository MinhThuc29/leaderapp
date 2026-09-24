'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ProjectDto,
  CreateProjectInput,
  ProjectStatus,
  HealthStatus,
  Priority,
} from '@leaderos/shared-types';
import { AppLayout } from '@/components/layout/app-layout';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { apiClient } from '@/lib/api-client';
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  Users,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function ProjectsPage() {
  return (
    <AppLayout>
      <ProjectsContent />
    </AppLayout>
  );
}

interface ProjectFormData {
  name: string;
  code: string;
  description: string;
  status: ProjectStatus;
  health_status: HealthStatus;
  priority: Priority;
  start_date: string;
  target_date: string;
  leader_note: string;
}

const initialFormData: ProjectFormData = {
  name: '',
  code: '',
  description: '',
  status: 'PLANNING',
  health_status: 'GREEN',
  priority: 'MEDIUM',
  start_date: '',
  target_date: '',
  leader_note: '',
};

function ProjectsContent() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [healthFilter, setHealthFilter] = useState<string>('ALL');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<ProjectDto[]>('/projects');
      setProjects(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const handleOpenCreate = () => {
    setFormData(initialFormData);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError(t('projects.validationError'));
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const payload: CreateProjectInput = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        health_status: formData.health_status,
        priority: formData.priority,
        start_date: formData.start_date || undefined,
        target_date: formData.target_date || undefined,
        leader_note: formData.leader_note.trim() || undefined,
      };

      await apiClient<ProjectDto>('/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setIsModalOpen(false);
      await fetchProjects();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tạo dự án');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (healthFilter !== 'ALL' && p.health_status !== healthFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCode = p.code.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        return matchName || matchCode || matchDesc;
      }

      return true;
    });
  }, [projects, statusFilter, healthFilter, searchQuery]);

  // Helper badge renderers
  const renderHealthBadge = (health: HealthStatus) => {
    switch (health) {
      case 'GREEN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t('projects.health.GREEN')}
          </span>
        );
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {t('projects.health.YELLOW')}
          </span>
        );
      case 'RED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/80">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
            {t('projects.health.RED')}
          </span>
        );
    }
  };

  const renderStatusBadge = (status: ProjectStatus) => {
    const config: Record<ProjectStatus, { label: string; color: string }> = {
      PLANNING: { label: 'Lập kế hoạch', color: 'bg-blue-950 text-blue-300 border-blue-800' },
      ACTIVE: { label: 'Đang chạy', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
      ON_HOLD: { label: 'Tạm hoãn', color: 'bg-slate-800 text-slate-300 border-slate-700' },
      AT_RISK: { label: 'Có rủi ro', color: 'bg-amber-950 text-amber-300 border-amber-800' },
      COMPLETED: { label: 'Hoàn thành', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
      CANCELLED: { label: 'Đã hủy', color: 'bg-red-950 text-red-300 border-red-800' },
    };
    const c = config[status] ?? { label: status, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    return (
      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${c.color}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FolderKanban className="h-6 w-6 text-indigo-400" />
            <span>{t('projects.title')}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t('projects.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <Plus className="h-4 w-4" />
          <span>{t('projects.createProject')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder={t('projects.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-4 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">{t('common.status')}:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">{t('projects.allStatuses')} ({projects.length})</option>
              <option value="ACTIVE">Đang chạy</option>
              <option value="PLANNING">Lập kế hoạch</option>
              <option value="AT_RISK">Có rủi ro</option>
              <option value="ON_HOLD">Tạm hoãn</option>
              <option value="COMPLETED">Hoàn thành</option>
            </select>
          </div>

          {/* Health Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">{t('projects.filterHealth')}:</span>
            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">{t('projects.allHealth')}</option>
              <option value="GREEN">Khỏe mạnh (Xanh)</option>
              <option value="YELLOW">Cần chú ý (Vàng)</option>
              <option value="RED">Nguy cấp (Đỏ)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Đang tải danh sách dự án...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-6 text-center text-red-300">
          <p className="font-semibold">{t('common.error')}</p>
          <p className="text-sm mt-1 text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => void fetchProjects()}
            className="mt-4 px-4 py-1.5 text-xs bg-red-900/60 hover:bg-red-800 text-white rounded-lg transition"
          >
            {t('common.refresh')}
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-3 text-base font-semibold text-slate-300">{t('projects.noProjectsFound')}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchQuery || statusFilter !== 'ALL' || healthFilter !== 'ALL'
              ? 'Không có dự án phù hợp với bộ lọc hiện tại.'
              : 'Bắt đầu khởi tạo dự án đầu tiên để theo dõi tiến độ và điều phối thành viên.'}
          </p>
          {!searchQuery && statusFilter === 'ALL' && healthFilter === 'ALL' && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
            >
              <Plus className="h-4 w-4" />
              <span>{t('projects.createProject')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const memberCount = project.project_members?.length ?? 0;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm hover:border-slate-700 hover:bg-slate-850 hover:shadow-md transition"
              >
                <div>
                  {/* Card top: Code, Status & Health */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono font-semibold text-indigo-300 border border-slate-700">
                        {project.code}
                      </span>
                      {renderHealthBadge(project.health_status)}
                    </div>
                    {renderStatusBadge(project.status)}
                  </div>

                  {/* Project Name & Description */}
                  <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                    {project.description || 'Chưa có mô tả dự án.'}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                        {t('common.progress')}
                      </span>
                      <span className="font-semibold text-slate-200">
                        {project.manual_progress}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          project.manual_progress === 100
                            ? 'bg-emerald-500'
                            : project.manual_progress >= 60
                            ? 'bg-indigo-500'
                            : project.manual_progress >= 30
                            ? 'bg-amber-500'
                            : 'bg-slate-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, project.manual_progress))}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer metadata: Target date & Members count */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>{project.target_date ? project.target_date : 'Chưa có hạn'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      <span>{memberCount} nhân sự</span>
                      <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Khởi tạo Dự án Mới"
        description="Thiết lập thông tin dự án, mã code định danh và mục tiêu ban đầu."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError ? (
            <div className="rounded-lg bg-red-950/50 border border-red-900 p-3 text-xs text-red-300">
              {formError}
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t('projects.projectName')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Cải tiến Hệ thống Thanh toán v2"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t('projects.projectCode')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: PAY-V2"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono uppercase text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">{t('common.description')}</label>
            <textarea
              rows={2}
              placeholder="Mục tiêu kinh doanh, phạm vi công việc..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Trạng thái ban đầu</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="PLANNING">Lập kế hoạch</option>
                <option value="ACTIVE">Đang chạy (Active)</option>
                <option value="ON_HOLD">Tạm hoãn (On Hold)</option>
                <option value="AT_RISK">Có rủi ro (At Risk)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Sức khỏe (Health)</label>
              <select
                value={formData.health_status}
                onChange={(e) =>
                  setFormData({ ...formData, health_status: e.target.value as HealthStatus })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="GREEN">Xanh (Khỏe mạnh)</option>
                <option value="YELLOW">Vàng (Cần theo dõi)</option>
                <option value="RED">Đỏ (Nguy cấp)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Độ ưu tiên</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="LOW">Thấp (Low)</option>
                <option value="MEDIUM">Trung bình (Medium)</option>
                <option value="HIGH">Cao (High)</option>
                <option value="CRITICAL">Khẩn cấp (Critical)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t('projects.startDate')}</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Hạn chót mục tiêu (Target Date)</label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Ghi chú của Leader</label>
            <textarea
              rows={2}
              placeholder="Ghi chú cá nhân của Leader về dự án này..."
              value={formData.leader_note}
              onChange={(e) => setFormData({ ...formData, leader_note: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {formSubmitting ? t('common.saving') : t('projects.createProject')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
