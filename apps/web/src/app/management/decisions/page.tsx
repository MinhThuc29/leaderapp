'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DecisionDto,
  ProjectDto,
  DecisionStatus,
  CreateDecisionInput,
  ReviewDecisionInput,
} from '@leaderos/shared-types';
import { AppLayout } from '@/components/layout/app-layout';
import { ManagementNavTabs } from '@/components/management/management-nav-tabs';
import { Modal } from '@/components/ui/modal';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Edit2,
  Trash2,
  GitCommit,
  Award,
  FileCheck,
} from 'lucide-react';

const STATUS_MAP: Record<DecisionStatus, { label: string; badge: string }> = {
  DECIDED: { label: 'Đã quyết định', badge: 'bg-blue-950 text-blue-400 border-blue-800' },
  REVIEW_PENDING: { label: 'Cần đánh giá lại', badge: 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse' },
  REVIEWED: { label: 'Đã đánh giá', badge: 'bg-emerald-950 text-emerald-400 border-emerald-800' },
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

export default function DecisionsPage() {
  return (
    <AppLayout>
      <ManagementNavTabs />
      <DecisionsContent />
    </AppLayout>
  );
}

function DecisionsContent() {
  const { t } = useTranslation();
  const [decisions, setDecisions] = useState<DecisionDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<DecisionDto | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingDecision, setReviewingDecision] = useState<DecisionDto | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Forms
  const [decisionFormData, setDecisionFormData] = useState<CreateDecisionInput>({
    title: '',
    project_id: '',
    context: '',
    options_considered: '',
    decision: '',
    reason: '',
    expected_result: '',
    decision_date: new Date().toISOString().split('T')[0],
    review_date: '',
    status: 'DECIDED',
  });

  const [reviewFormData, setReviewFormData] = useState<ReviewDecisionInput>({
    actual_result: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [projRes, decRes] = await Promise.all([
        apiClient<ProjectDto[]>('/projects'),
        apiClient<DecisionDto[]>(`/decisions${selectedProject ? `?projectId=${selectedProject}` : ''}`),
      ]);

      setProjects(projRes.data ?? []);
      setDecisions(decRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải nhật ký quyết định');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Filtered decisions
  const filteredDecisions = useMemo(() => {
    return decisions.filter((d) => {
      if (selectedStatus && d.status !== selectedStatus) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = d.title.toLowerCase().includes(q);
        const matchesContext = d.context.toLowerCase().includes(q);
        const matchesDecision = d.decision.toLowerCase().includes(q);
        const matchesReason = d.reason.toLowerCase().includes(q);
        const matchesExpected = d.expected_result.toLowerCase().includes(q);
        const matchesActual = d.actual_result?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContext && !matchesDecision && !matchesReason && !matchesExpected && !matchesActual) {
          return false;
        }
      }
      return true;
    });
  }, [decisions, selectedStatus, searchQuery]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingDecision(null);
    // Suggest review date after 3 months
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    setDecisionFormData({
      title: '',
      project_id: projects[0]?.id || '',
      context: '',
      options_considered: '',
      decision: '',
      reason: '',
      expected_result: '',
      decision_date: new Date().toISOString().split('T')[0],
      review_date: threeMonthsLater.toISOString().split('T')[0],
      status: 'DECIDED',
    });
    setIsDecisionModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (dec: DecisionDto) => {
    setEditingDecision(dec);
    setDecisionFormData({
      title: dec.title,
      project_id: dec.project_id || '',
      context: dec.context,
      options_considered: dec.options_considered,
      decision: dec.decision,
      reason: dec.reason,
      expected_result: dec.expected_result,
      actual_result: dec.actual_result || '',
      decision_date: dec.decision_date,
      review_date: dec.review_date || '',
      status: dec.status,
    });
    setIsDecisionModalOpen(true);
  };

  // Open Review Modal
  const openReviewModal = (dec: DecisionDto) => {
    setReviewingDecision(dec);
    setReviewFormData({
      actual_result: dec.actual_result || '',
      notes: '',
    });
    setIsReviewModalOpen(true);
  };

  // Submit Decision Create/Update
  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionFormData.title?.trim() || !decisionFormData.context?.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và bối cảnh quyết định');
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingDecision) {
        await apiClient(`/decisions/${editingDecision.id}`, {
          method: 'PATCH',
          body: JSON.stringify(decisionFormData),
        });
      } else {
        await apiClient('/decisions', {
          method: 'POST',
          body: JSON.stringify(decisionFormData),
        });
      }
      setIsDecisionModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi lưu quyết định');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Review Modal
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingDecision) return;
    if (!reviewFormData.actual_result.trim()) {
      alert('Vui lòng nhập kết quả thực tế đối chiếu');
      return;
    }

    try {
      setFormSubmitting(true);
      await apiClient(`/decisions/${reviewingDecision.id}/review`, {
        method: 'POST',
        body: JSON.stringify(reviewFormData),
      });
      alert('Đã ghi nhận kết quả đánh giá quyết định thành công!');
      setIsReviewModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi lưu đánh giá');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete decision
  const handleDeleteDecision = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try {
      await apiClient(`/decisions/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi xóa quyết định');
    }
  };

  const decidedCount = decisions.filter((d) => d.status === 'DECIDED').length;
  const reviewPendingCount = decisions.filter((d) => d.status === 'REVIEW_PENDING').length;
  const reviewedCount = decisions.filter((d) => d.status === 'REVIEWED').length;

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}
      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-xs text-slate-400 block font-medium">Tổng số quyết định</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{decisions.length}</span>
            <span className="text-xs text-slate-500">mục</span>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-900/60 bg-blue-950/20 p-4">
          <span className="text-xs text-blue-300 block font-medium flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            Đang thực thi (Decided)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-blue-400">{decidedCount}</span>
            <span className="text-xs text-blue-300/70">quyết định</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-4">
          <span className="text-xs text-amber-300 block font-medium flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            Cần đánh giá lại (Review Pending)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{reviewPendingCount}</span>
            <span className="text-xs text-amber-300/70">đã tới hạn</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-4">
          <span className="text-xs text-emerald-300 block font-medium flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Đã đánh giá kết quả (Reviewed)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{reviewedCount}</span>
            <span className="text-xs text-emerald-300/70">hoàn tất</span>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status buttons */}
          <button
            type="button"
            onClick={() => setSelectedStatus('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedStatus === ''
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Tất cả ({decisions.length})
          </button>
          {(['DECIDED', 'REVIEW_PENDING', 'REVIEWED'] as DecisionStatus[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedStatus === st
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {STATUS_MAP[st].label} ({decisions.filter((d) => d.status === st).length})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Tất cả dự án</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.code}] {p.name}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm quyết định..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-56 rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Ghi nhận Quyết định</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DECISION LOG TIMELINE VIEW */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Đang tải nhật ký quyết định...</div>
      ) : filteredDecisions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-500">
          Chưa có quyết định nào trong nhật ký. Nhấp "Ghi nhận Quyết định" để bắt đầu ghi lại các quyết định quan trọng.
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {filteredDecisions.map((dec) => {
            const isPendingReview = dec.status === 'REVIEW_PENDING' || dec.is_review_overdue;

            return (
              <div key={dec.id} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1.5 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 bg-slate-950 transition ${
                    dec.status === 'REVIEWED'
                      ? 'border-emerald-500 text-emerald-400'
                      : isPendingReview
                      ? 'border-amber-500 text-amber-400 animate-pulse'
                      : 'border-indigo-500 text-indigo-400'
                  }`}
                >
                  {dec.status === 'REVIEWED' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : isPendingReview ? (
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : (
                    <GitCommit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </div>

                {/* Main Decision Card */}
                <div
                  className={`rounded-2xl border p-5 sm:p-6 shadow-sm transition space-y-4 ${
                    isPendingReview
                      ? 'border-amber-900/70 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900'
                      : dec.status === 'REVIEWED'
                      ? 'border-emerald-950/70 bg-slate-900/90'
                      : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                          {formatDate(dec.decision_date)}
                        </span>
                        {dec.project_code && (
                          <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded">
                            [{dec.project_code}]
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            STATUS_MAP[dec.status].badge
                          }`}
                        >
                          {STATUS_MAP[dec.status].label}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white leading-snug">
                        {dec.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                      {/* Review Action Button */}
                      {dec.status !== 'REVIEWED' && (
                        <button
                          type="button"
                          onClick={() => openReviewModal(dec)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-800/80 bg-amber-950/50 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/70 transition"
                          title="Đánh giá lại kết quả sau 3-6 tháng"
                        >
                          <FileCheck className="h-3.5 w-3.5 text-amber-400" />
                          <span>Đánh giá kết quả</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditModal(dec)}
                        className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white transition"
                        title="Chỉnh sửa quyết định"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteDecision(dec.id)}
                        className="p-1.5 rounded-lg border border-red-950 bg-red-950/30 text-red-400 hover:bg-red-900/50 transition"
                        title="Xóa quyết định"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Context and Options Considered */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                      <strong className="text-slate-400 block text-[11px] uppercase tracking-wider font-bold">
                        Bối cảnh ra quyết định (Context):
                      </strong>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                        {dec.context}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                      <strong className="text-slate-400 block text-[11px] uppercase tracking-wider font-bold">
                        Các phương án đã cân nhắc (Options considered):
                      </strong>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                        {dec.options_considered}
                      </p>
                    </div>
                  </div>

                  {/* Chosen Option Box (Highlight) */}
                  <div className="rounded-xl border border-indigo-800/80 bg-indigo-950/30 p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-indigo-400" />
                      <strong className="text-indigo-300 text-xs font-bold uppercase tracking-wider">
                        Quyết định được chọn:
                      </strong>
                    </div>

                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {dec.decision}
                    </p>

                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-indigo-900/40 mt-2">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Lý do chọn (Rationale):</span>
                        <p className="text-slate-300 leading-relaxed">{dec.reason}</p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Kỳ vọng ban đầu (Expected outcome):</span>
                        <p className="text-slate-300 leading-relaxed">{dec.expected_result}</p>
                      </div>
                    </div>
                  </div>

                  {/* Review Banner or Review Result */}
                  {dec.actual_result ? (
                    <div className="rounded-xl border border-emerald-900/70 bg-emerald-950/20 p-4 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <strong className="text-emerald-300 font-bold uppercase tracking-wider text-[11px]">
                            Kết quả đối chiếu thực tế sau 3-6 tháng:
                          </strong>
                        </div>
                        {dec.review_date && (
                          <span className="text-slate-400 text-[11px]">
                            Đánh giá lúc: {formatDate(dec.review_date)}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200 leading-relaxed whitespace-pre-line">
                        {dec.actual_result}
                      </p>
                    </div>
                  ) : isPendingReview ? (
                    <div className="rounded-xl border border-amber-900/60 bg-amber-950/30 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                        <div>
                          <strong className="text-amber-300 font-semibold block">
                            Đã đến hạn đánh giá lại quyết định!
                          </strong>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            Hạn đánh giá định kỳ: {formatDate(dec.review_date)}. Hãy đối chiếu kết quả thực tế để đúc kết kinh nghiệm.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openReviewModal(dec)}
                        className="rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-500 shadow-md transition whitespace-nowrap self-end sm:self-center"
                      >
                        Đánh giá ngay
                      </button>
                    </div>
                  ) : dec.review_date ? (
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Lịch hẹn đánh giá lại kết quả: <strong className="text-slate-400">{formatDate(dec.review_date)}</strong></span>
                      <span className="italic text-[11px]">(Định kỳ 3-6 tháng)</span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TẠO / SỬA QUYẾT ĐỊNH */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        title={editingDecision ? 'Chỉnh sửa Quyết định' : 'Ghi nhận Quyết định mới'}
        description="Lưu lại bối cảnh, các lựa chọn và kỳ vọng để đánh giá lại sau 3-6 tháng."
        maxWidth="lg"
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Tiêu đề quyết định <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Chuyển đổi kiến trúc sang Monorepo với Turborepo"
              value={decisionFormData.title}
              onChange={(e) => setDecisionFormData({ ...decisionFormData, title: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Dự án liên quan (Tùy chọn)
              </label>
              <select
                value={decisionFormData.project_id || ''}
                onChange={(e) => setDecisionFormData({ ...decisionFormData, project_id: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Quyết định chung / Toàn team</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ngày ra quyết định
              </label>
              <input
                type="date"
                value={decisionFormData.decision_date}
                onChange={(e) => setDecisionFormData({ ...decisionFormData, decision_date: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Bối cảnh ra quyết định (Context) <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Tại sao cần đưa ra quyết định này? Vấn đề hoặc thách thức hiện tại là gì?..."
              value={decisionFormData.context}
              onChange={(e) => setDecisionFormData({ ...decisionFormData, context: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Các phương án đã cân nhắc (Options considered) <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Phương án A: ... (Ưu/Nhược)&#10;Phương án B: ... (Ưu/Nhược)"
              value={decisionFormData.options_considered}
              onChange={(e) => setDecisionFormData({ ...decisionFormData, options_considered: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/20 p-3.5 space-y-3">
            <div>
              <label className="text-xs font-semibold text-indigo-300 block mb-1">
                Phương án được chọn (Chosen Decision)
              </label>
              <input
                type="text"
                placeholder="VD: Chọn phương án B: Áp dụng Monorepo với pnpm workspace"
                value={decisionFormData.decision || ''}
                onChange={(e) => setDecisionFormData({ ...decisionFormData, decision: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-indigo-300 block mb-1">
                Lý do lựa chọn (Rationale)
              </label>
              <textarea
                rows={2}
                placeholder="Tại sao phương án này là tối ưu nhất ở thời điểm hiện tại?..."
                value={decisionFormData.reason || ''}
                onChange={(e) => setDecisionFormData({ ...decisionFormData, reason: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-indigo-300 block mb-1">
                Kỳ vọng ban đầu (Expected outcome)
              </label>
              <textarea
                rows={2}
                placeholder="Mục tiêu cụ thể kỳ vọng đạt được (VD: Tốc độ build CI giảm 50%, 0 lỗi lệch type)..."
                value={decisionFormData.expected_result || ''}
                onChange={(e) => setDecisionFormData({ ...decisionFormData, expected_result: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Ngày dự kiến đánh giá lại sau 3-6 tháng (Review Date)
            </label>
            <input
              type="date"
              value={decisionFormData.review_date || ''}
              onChange={(e) => setDecisionFormData({ ...decisionFormData, review_date: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDecisionModalOpen(false)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {formSubmitting ? 'Đang lưu...' : editingDecision ? 'Cập nhật Quyết định' : 'Lưu Quyết định'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: ĐÁNH GIÁ LẠI QUYẾT ĐỊNH (REVIEW MODAL) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Đánh giá lại kết quả Quyết định (Decision Review)"
        description="Đối chiếu kết quả thực tế sau 3-6 tháng với kỳ vọng ban đầu."
        maxWidth="md"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2 text-xs">
            <span className="text-slate-500 uppercase font-bold text-[11px] block">Quyết định:</span>
            <h4 className="text-sm font-bold text-white">{reviewingDecision?.title}</h4>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <strong className="text-slate-400 block mb-0.5 text-[11px]">Kỳ vọng ban đầu:</strong>
              <p>{reviewingDecision?.expected_result}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-emerald-300 block mb-1">
              Kết quả thực tế sau 3-6 tháng (Actual Result) <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Thực tế triển khai ra sao? Có đạt được kỳ vọng ban đầu không? Có phát sinh vấn đề gì mới?..."
              value={reviewFormData.actual_result}
              onChange={(e) => setReviewFormData({ ...reviewFormData, actual_result: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Ghi chú thêm hoặc bài học quản trị (Tùy chọn)
            </label>
            <textarea
              rows={2}
              placeholder="Ghi chú thêm cho các quyết định tương lai..."
              value={reviewFormData.notes || ''}
              onChange={(e) => setReviewFormData({ ...reviewFormData, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {formSubmitting ? 'Đang lưu...' : 'Xác nhận Đã Đánh Giá'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
