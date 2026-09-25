'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MilestoneDto,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  MilestoneStatus,
} from '@leaderos/shared-types';
import { Modal } from '@/components/ui/modal';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import {
  Calendar,
  Flag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
} from 'lucide-react';

interface ProjectMilestonesTabProps {
  projectId: string;
  onMilestoneChanged?: () => void;
}

interface MilestoneFormData {
  title: string;
  description: string;
  status: MilestoneStatus;
  target_date: string;
  completed_date: string;
  progress: number;
  order: number;
}

const MILESTONE_STATUS_CLS: Record<MilestoneStatus, string> = {
  NOT_STARTED: 'bg-neutral-bg text-neutral-fg border-neutral-border',
  IN_PROGRESS: 'bg-brand-bg text-brand-fg border-brand-border',
  BLOCKED: 'bg-warning-bg text-warning-fg border-warning-border',
  COMPLETED: 'bg-success-bg text-success-fg border-success-border',
  CANCELLED: 'bg-danger-bg text-danger-fg border-danger-border',
};

const MILESTONE_STATUS_KEYS = Object.keys(MILESTONE_STATUS_CLS) as MilestoneStatus[];

const initialFormData: MilestoneFormData = {
  title: '',
  description: '',
  status: 'NOT_STARTED',
  target_date: '',
  completed_date: '',
  progress: 0,
  order: 0,
};

export function ProjectMilestonesTab({
  projectId,
  onMilestoneChanged,
}: ProjectMilestonesTabProps) {
  const { t } = useTranslation();
  const [milestones, setMilestones] = useState<MilestoneDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneDto | null>(null);
  const [formData, setFormData] = useState<MilestoneFormData>(initialFormData);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchMilestones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<MilestoneDto[]>('/milestones', {
        params: { project_id: projectId },
      });
      setMilestones(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projects.milestones.loadError'));
    } finally {
      setLoading(false);
    }
  }, [projectId, t]);

  useEffect(() => {
    void fetchMilestones();
  }, [fetchMilestones]);

  const handleOpenCreate = () => {
    setEditingMilestone(null);
    setFormData(initialFormData);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: MilestoneDto) => {
    setEditingMilestone(m);
    setFormData({
      title: m.title,
      description: m.description ?? '',
      status: m.status,
      target_date: m.target_date,
      completed_date: m.completed_date ?? '',
      progress: m.progress,
      order: m.order,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.target_date) {
      setFormError(t('projects.milestones.validationError'));
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (editingMilestone) {
        const payload: UpdateMilestoneInput = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          status: formData.status,
          target_date: formData.target_date,
          completed_date: formData.completed_date || undefined,
          progress: formData.progress,
          order: formData.order,
        };
        await apiClient(`/milestones/${editingMilestone.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        const payload: CreateMilestoneInput = {
          project_id: projectId,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          status: formData.status,
          target_date: formData.target_date,
          progress: formData.progress,
          order: formData.order,
        };
        await apiClient('/milestones', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      await fetchMilestones();
      onMilestoneChanged?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('common.genericError'));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleQuickComplete = async (m: MilestoneDto) => {
    try {
      await apiClient(`/milestones/${m.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'COMPLETED',
          completed_date: new Date().toISOString().split('T')[0],
          progress: 100,
        }),
      });
      await fetchMilestones();
      onMilestoneChanged?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('projects.milestones.completeError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try {
      await apiClient(`/milestones/${id}`, { method: 'DELETE' });
      await fetchMilestones();
      onMilestoneChanged?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('projects.milestones.deleteError'));
    }
  };

  const renderStatusBadge = (status: MilestoneStatus, isOverdue?: boolean) => {
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-danger-bg px-2 py-0.5 text-[11px] font-semibold text-danger-fg border border-danger-border">
          <AlertCircle className="h-3 w-3" />
          {t('projects.milestones.overdue')}
        </span>
      );
    }

    const cls =
      MILESTONE_STATUS_CLS[status] ?? 'bg-neutral-bg text-neutral-fg border-neutral-border';
    return (
      <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium border ${cls}`}>
        {t(`projects.milestones.statuses.${status}`, { defaultValue: status })}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs">{t('projects.milestones.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-900/60 bg-red-950/30 text-center text-xs text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Flag className="h-4 w-4 text-indigo-400" />
            <span>{t('projects.milestones.sectionTitle')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('projects.milestones.sectionDesc')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{t('projects.addMilestone')}</span>
        </button>
      </div>

      {/* Milestones list */}
      {milestones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center">
          <Flag className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-2 text-sm text-slate-300 font-medium">
            {t('projects.milestones.emptyTitle')}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {t('projects.milestones.emptyDesc')}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/50 px-3 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-600/40 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t('projects.milestones.createFirst')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl border p-4 transition ${
                m.is_overdue
                  ? 'border-red-900/60 bg-red-950/20'
                  : m.status === 'COMPLETED'
                  ? 'border-emerald-950 bg-emerald-950/10'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 font-mono">#{m.order}</span>
                    <h4 className="text-sm font-semibold text-foreground">{m.title}</h4>
                    {renderStatusBadge(m.status, m.is_overdue)}
                  </div>
                  {m.description ? (
                    <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
                  ) : null}
                </div>

                {/* Right metadata & actions */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>{t('projects.milestones.targetPrefix', { date: m.target_date })}</span>
                  </div>

                  {m.completed_date ? (
                    <div className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{t('projects.milestones.donePrefix', { date: m.completed_date })}</span>
                    </div>
                  ) : null}

                  {m.tasks_count !== undefined && m.tasks_count > 0 ? (
                    <div className="flex items-center gap-1 text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      <CheckSquare className="h-3 w-3 text-indigo-400" />
                      <span>
                        {m.tasks_done_count ?? 0}/{m.tasks_count} tasks
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                    {m.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => void handleQuickComplete(m)}
                        title={t('projects.milestones.markComplete')}
                        className="rounded p-1 text-emerald-400 hover:bg-emerald-950/50 transition"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(m)}
                      title={t('projects.milestones.editTitle')}
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(m.id)}
                      title={t('projects.milestones.deleteTitle')}
                      className="rounded p-1 text-red-400 hover:bg-red-950/50 hover:text-red-300 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Milestone Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingMilestone
            ? t('projects.milestones.modalEditTitle')
            : t('projects.milestones.modalCreateTitle')
        }
        description={t('projects.milestones.modalDesc')}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <div className="rounded-lg bg-red-950/50 border border-red-900 p-2.5 text-xs text-red-300">
              {formError}
            </div>
          ) : null}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {t('projects.milestones.titleLabel')} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={t('projects.milestones.titlePlaceholder')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {t('projects.milestones.descLabel')}
            </label>
            <textarea
              rows={2}
              placeholder={t('projects.milestones.descPlaceholder')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t('projects.milestones.targetDateLabel')} <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t('common.status')}</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as MilestoneStatus })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                {MILESTONE_STATUS_KEYS.map((st) => (
                  <option key={st} value={st}>
                    {t(`projects.milestones.statuses.${st}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t('projects.milestones.orderLabel')}
              </label>
              <input
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {editingMilestone && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  {t('projects.milestones.completedDateLabel')}
                </label>
                <input
                  type="date"
                  value={formData.completed_date}
                  onChange={(e) => setFormData({ ...formData, completed_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {formSubmitting
                ? t('common.saving')
                : editingMilestone
                ? t('common.saveChanges')
                : t('projects.milestones.createSubmit')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
