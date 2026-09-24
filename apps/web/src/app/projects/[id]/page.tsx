'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ProjectDto,
  MemberDto,
  ProjectStatus,
  HealthStatus,
  Priority,
  UpdateProjectInput,
  AssignMemberInput,
} from '@leaderos/shared-types';
import { AppLayout } from '@/components/layout/app-layout';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { apiClient } from '@/lib/api-client';
import { ProjectMilestonesTab } from '@/components/projects/project-milestones-tab';
import { ProjectTasksTab } from '@/components/projects/project-tasks-tab';
import { ProjectSnapshotsTab } from '@/components/projects/project-snapshots-tab';
import {
  ArrowLeft,
  Calendar,
  Users,
  UserPlus,
  Trash2,
  CheckCircle,
  TrendingUp,
  FileText,
  Clock,
  Edit,
  Flag,
  CheckSquare,
  Activity,
  LayoutDashboard,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

type TabKey = 'overview' | 'milestones' | 'tasks' | 'snapshots';

export default function ProjectDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  return (
    <AppLayout>
      <ProjectDetailContent projectId={projectId} />
    </AppLayout>
  );
}

function ProjectDetailContent({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const router = useRouter();

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('tasks');

  // Progress update state
  const [progressValue, setProgressValue] = useState<number>(0);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);

  // Member assignment modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [activeMembers, setActiveMembers] = useState<MemberDto[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [projectRole, setProjectRole] = useState<string>('');
  const [allocationPercent, setAllocationPercent] = useState<number>(100);
  const [assignSubmitting, setAssignSubmitting] = useState<boolean>(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Edit Project Details modal
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    description: string;
    status: ProjectStatus;
    health_status: HealthStatus;
    priority: Priority;
    start_date: string;
    target_date: string;
    leader_note: string;
  }>({
    name: '',
    description: '',
    status: 'PLANNING',
    health_status: 'GREEN',
    priority: 'MEDIUM',
    start_date: '',
    target_date: '',
    leader_note: '',
  });
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Removing member state
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // Fetch project details
  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<ProjectDto>(`/projects/${projectId}`);
      setProject(res.data);
      setProgressValue(res.data.manual_progress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải chi tiết dự án');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  // Open Assign Member Modal
  const handleOpenAssign = async () => {
    setAssignError(null);
    setSelectedMemberId('');
    setProjectRole('');
    setAllocationPercent(100);

    try {
      const res = await apiClient<MemberDto[]>('/members', {
        params: { active: true },
      });
      // Lọc ra các thành viên chưa có trong dự án
      const currentMemberIds = new Set(
        (project?.project_members ?? [])
          .filter((pm) => !pm.left_at)
          .map((pm) => pm.member_id),
      );
      const available = res.data.filter((m) => !currentMemberIds.has(m.id));
      setActiveMembers(available);
      if (available.length > 0 && available[0]) {
        setSelectedMemberId(available[0].id);
        setProjectRole(available[0].role);
      }
      setIsAssignModalOpen(true);
    } catch {
      alert('Không thể tải danh sách thành viên khả dụng');
    }
  };

  // Submit member assignment
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !projectRole.trim()) {
      setAssignError('Vui lòng chọn thành viên và nhập vai trò trong dự án.');
      return;
    }

    try {
      setAssignSubmitting(true);
      setAssignError(null);

      const payload: AssignMemberInput = {
        member_id: selectedMemberId,
        project_role: projectRole.trim(),
        allocation_percent: allocationPercent,
      };

      await apiClient(`/projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setIsAssignModalOpen(false);
      await fetchProject();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Không thể phân công thành viên');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Remove member from project
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm(t('projects.removeMemberConfirm'))) {
      return;
    }
    try {
      setRemovingMemberId(memberId);
      await apiClient(`/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
      });
      await fetchProject();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể gỡ thành viên');
    } finally {
      setRemovingMemberId(null);
    }
  };

  // Update progress
  const handleSaveProgress = async (newVal?: number) => {
    const val = newVal !== undefined ? newVal : progressValue;
    try {
      setIsUpdatingProgress(true);
      setProgressMsg(null);
      await apiClient<ProjectDto>(`/projects/${projectId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ manual_progress: val }),
      });
      setProject((prev) => (prev ? { ...prev, manual_progress: val } : prev));
      setProgressMsg('Đã lưu tiến độ thành công!');
      setTimeout(() => setProgressMsg(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể cập nhật tiến độ');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Mark project as completed
  const handleMarkCompleted = async () => {
    if (!confirm('Bạn có chắc chắn muốn đánh dấu dự án này là HOÀN THÀNH (100%)?')) {
      return;
    }
    try {
      setIsUpdatingProgress(true);
      const res = await apiClient<ProjectDto>(`/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'COMPLETED',
          manual_progress: 100,
        }),
      });
      setProject(res.data);
      setProgressValue(100);
      setProgressMsg('Dự án đã được chuyển sang trạng thái Hoàn thành!');
      setTimeout(() => setProgressMsg(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể hoàn thành dự án');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!project) return;
    setEditFormData({
      name: project.name,
      description: project.description ?? '',
      status: project.status,
      health_status: project.health_status,
      priority: project.priority,
      start_date: project.start_date ?? '',
      target_date: project.target_date ?? '',
      leader_note: project.leader_note ?? '',
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  // Submit edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      setEditError('Tên dự án không được để trống.');
      return;
    }

    try {
      setEditSubmitting(true);
      setEditError(null);

      const payload: UpdateProjectInput = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined,
        status: editFormData.status,
        health_status: editFormData.health_status,
        priority: editFormData.priority,
        start_date: editFormData.start_date || undefined,
        target_date: editFormData.target_date || undefined,
        leader_note: editFormData.leader_note.trim() || undefined,
      };

      const res = await apiClient<ProjectDto>(`/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setProject(res.data);
      setIsEditModalOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Không thể lưu thay đổi');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete project
  const handleDeleteProject = async () => {
    if (!confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa dự án này? Thao tác này sẽ lưu trữ dữ liệu an toàn.')) {
      return;
    }
    try {
      await apiClient(`/projects/${projectId}`, { method: 'DELETE' });
      router.push('/projects');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa dự án');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Đang tải chi tiết dự án...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-8 text-center text-red-300">
        <p className="font-semibold text-lg">Không tìm thấy dự án</p>
        <p className="text-sm mt-1 text-red-400">{error ?? 'Dự án không tồn tại hoặc đã bị xóa.'}</p>
        <Link
          href="/projects"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('common.back')}</span>
        </Link>
      </div>
    );
  }

  const activeAssignedMembers = (project.project_members ?? []).filter((pm) => !pm.left_at);
  const assignedMemberDtos: MemberDto[] = activeAssignedMembers
    .map((pm) => pm.member)
    .filter((m): m is MemberDto => m !== undefined && m !== null);

  return (
    <div className="space-y-6">
      {/* Back button & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Dự án</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-850 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
          >
            <Edit className="h-3.5 w-3.5 text-slate-400" />
            <span>Chỉnh sửa thông tin</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteProject}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/50 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Xóa dự án</span>
          </button>
        </div>
      </div>

      {/* Main Project Header Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="rounded bg-slate-800 px-2.5 py-1 text-xs font-mono font-bold text-indigo-300 border border-slate-700">
                {project.code}
              </span>

              {/* Status */}
              <span className="text-xs font-medium px-2.5 py-0.5 rounded border bg-indigo-950/80 text-indigo-300 border-indigo-800">
                {project.status}
              </span>

              {/* Health */}
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded border inline-flex items-center gap-1.5 ${
                  project.health_status === 'GREEN'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                    : project.health_status === 'YELLOW'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                    : 'bg-red-950/60 text-red-300 border-red-800'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    project.health_status === 'GREEN'
                      ? 'bg-emerald-400'
                      : project.health_status === 'YELLOW'
                      ? 'bg-amber-400'
                      : 'bg-red-400 animate-ping'
                  }`}
                />
                Sức khỏe: {project.health_status}
              </span>

              {/* Priority */}
              <span className="text-xs font-medium px-2.5 py-0.5 rounded border bg-slate-800 text-slate-300 border-slate-700">
                Ưu tiên: {project.priority}
              </span>

              {/* Current Progress Pill */}
              <span className="text-xs font-medium px-2.5 py-0.5 rounded border bg-indigo-900/40 text-indigo-200 border-indigo-700/60 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-indigo-400" />
                Tiến độ: <strong className="font-mono text-white">{project.manual_progress}%</strong>
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">{project.name}</h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              {project.description || 'Chưa có mô tả chi tiết cho dự án này.'}
            </p>
          </div>

          {/* Key Dates Badge */}
          <div className="flex flex-col gap-1.5 bg-slate-950/70 border border-slate-800 p-3 rounded-lg text-xs shrink-0 min-w-[200px]">
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Bắt đầu:
              </span>
              <span className="text-slate-200 font-medium">
                {project.start_date ? project.start_date : '—'}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Mục tiêu:
              </span>
              <span className="text-indigo-300 font-medium">
                {project.target_date ? project.target_date : '—'}
              </span>
            </div>
            {project.completed_date ? (
              <div className="flex justify-between text-emerald-400 font-medium pt-1 border-t border-slate-800">
                <span>Hoàn thành:</span>
                <span>{project.completed_date}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Leader Note */}
        {project.leader_note ? (
          <div className="mt-5 rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-xs text-amber-200/90 flex items-start gap-2.5">
            <FileText className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">Ghi chú riêng của Leader:</span>{' '}
              {project.leader_note}
            </div>
          </div>
        ) : null}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition shrink-0 ${
            activeTab === 'tasks'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          <span>Công việc (Tasks)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('milestones')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition shrink-0 ${
            activeTab === 'milestones'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Flag className="h-4 w-4" />
          <span>Cột mốc (Milestones)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition shrink-0 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Tổng quan & Nhân sự ({activeAssignedMembers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('snapshots')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition shrink-0 ${
            activeTab === 'snapshots'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Lịch sử tiến độ (Snapshots)</span>
        </button>
      </div>

      {/* Tab 1: Tasks */}
      {activeTab === 'tasks' && (
        <ProjectTasksTab
          projectId={projectId}
          projectMembers={assignedMemberDtos}
          onTaskChanged={fetchProject}
        />
      )}

      {/* Tab 2: Milestones */}
      {activeTab === 'milestones' && (
        <ProjectMilestonesTab
          projectId={projectId}
          onMilestoneChanged={fetchProject}
        />
      )}

      {/* Tab 3: Overview & Members */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-400" />
                  <span>Điều chỉnh Tiến độ Dự án (Progress Management)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cập nhật tỷ lệ hoàn thành thủ công hoặc xem tiến độ tính tự động từ Tasks.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {project.status !== 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={handleMarkCompleted}
                    disabled={isUpdatingProgress}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-600/50 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-600/30 transition disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Đánh dấu Hoàn thành (100%)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Tiến độ hiện tại:</span>
                <span className="text-2xl font-bold font-mono text-indigo-400">{progressValue}%</span>
              </div>

              {/* Large Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressValue}
                  onChange={(e) => setProgressValue(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>0% (Bắt đầu)</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100% (Hoàn thành)</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  {progressMsg && (
                    <span className="text-xs text-emerald-400 font-medium">{progressMsg}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleSaveProgress()}
                  disabled={isUpdatingProgress || progressValue === project.manual_progress}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 shadow-md shadow-indigo-600/20"
                >
                  {isUpdatingProgress ? 'Đang lưu...' : 'Lưu cập nhật tiến độ'}
                </button>
              </div>
            </div>
          </div>

          {/* Member Assignment Section */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" />
                  <span>Nhân sự tham gia dự án ({activeAssignedMembers.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phân công vai trò cụ thể và tỷ lệ phân bổ thời gian (Allocation %) của từng thành viên.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAssign}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-600/30"
              >
                <UserPlus className="h-4 w-4" />
                <span>Phân công thành viên</span>
              </button>
            </div>

            {/* Member Table */}
            {activeAssignedMembers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center">
                <Users className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-2 text-sm text-slate-400">Dự án này chưa có thành viên nào được phân công.</p>
                <button
                  type="button"
                  onClick={handleOpenAssign}
                  className="mt-3 text-xs text-indigo-400 hover:underline font-medium"
                >
                  + Phân công thành viên đầu tiên
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60">
                <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                  <thead className="bg-slate-950 text-xs font-semibold uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Thành viên</th>
                      <th className="px-4 py-3">Vai trò trong dự án</th>
                      <th className="px-4 py-3">Phân bổ (%)</th>
                      <th className="px-4 py-3">Tham gia từ</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {activeAssignedMembers.map((pm) => (
                      <tr key={pm.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-900/60 text-indigo-300 font-bold text-xs border border-indigo-700/60">
                              {pm.member?.name.charAt(0).toUpperCase() ?? 'M'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-100 text-xs">
                                {pm.member?.name ?? 'Không rõ'}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {pm.member?.role} {pm.member?.level ? `· ${pm.member.level}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="rounded bg-indigo-950/60 px-2 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-800/70">
                            {pm.project_role}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-300">
                          {pm.allocation_percent ? `${pm.allocation_percent}%` : '100%'}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                          {pm.joined_at}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => void handleRemoveMember(pm.member_id)}
                            disabled={removingMemberId === pm.member_id}
                            className="rounded p-1 text-red-400 hover:bg-red-950/50 hover:text-red-300 transition disabled:opacity-50"
                            title="Gỡ khỏi dự án"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Snapshots */}
      {activeTab === 'snapshots' && (
        <ProjectSnapshotsTab projectId={projectId} />
      )}

      {/* Assign Member Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Phân công Thành viên vào Dự án"
        description="Chọn nhân sự và thiết lập vai trò thực tế trong dự án này."
        maxWidth="md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          {assignError ? (
            <div className="rounded-lg bg-red-950/50 border border-red-900 p-3 text-xs text-red-300">
              {assignError}
            </div>
          ) : null}

          {activeMembers.length === 0 ? (
            <div className="rounded-lg bg-slate-950 p-4 text-center text-xs text-slate-400 border border-slate-800">
              Tất cả thành viên đang hoạt động đã được phân công vào dự án này hoặc bạn chưa có thành viên nào trong danh sách.
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Chọn thành viên <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedMemberId(id);
                    const found = activeMembers.find((m) => m.id === id);
                    if (found) {
                      setProjectRole(found.role);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  {activeMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role} {m.level ? `· ${m.level}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Vai trò trong dự án (Project Role) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tech Lead, Core Dev, QA Tester..."
                  value={projectRole}
                  onChange={(e) => setProjectRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Tỷ lệ phân bổ thời gian (Allocation %): <span className="font-mono text-indigo-400">{allocationPercent}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={allocationPercent}
                  onChange={(e) => setAllocationPercent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
                >
                  {assignSubmitting ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Edit Project Details Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa Dự án"
        description="Cập nhật thông tin chi tiết, trạng thái và hạn định của dự án."
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError ? (
            <div className="rounded-lg bg-red-950/50 border border-red-900 p-3 text-xs text-red-300">
              {editError}
            </div>
          ) : null}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Tên dự án <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Mô tả dự án</label>
            <textarea
              rows={2}
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Trạng thái</label>
              <select
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, status: e.target.value as ProjectStatus })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="PLANNING">Lập kế hoạch</option>
                <option value="ACTIVE">Đang chạy</option>
                <option value="ON_HOLD">Tạm hoãn</option>
                <option value="AT_RISK">Có rủi ro</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Sức khỏe</label>
              <select
                value={editFormData.health_status}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, health_status: e.target.value as HealthStatus })
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
                value={editFormData.priority}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, priority: e.target.value as Priority })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
                <option value="CRITICAL">Khẩn cấp</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Ngày bắt đầu</label>
              <input
                type="date"
                value={editFormData.start_date}
                onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Hạn chót mục tiêu</label>
              <input
                type="date"
                value={editFormData.target_date}
                onChange={(e) => setEditFormData({ ...editFormData, target_date: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Ghi chú riêng của Leader</label>
            <textarea
              rows={2}
              value={editFormData.leader_note}
              onChange={(e) => setEditFormData({ ...editFormData, leader_note: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {editSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
