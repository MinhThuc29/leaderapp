'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RiskDto,
  RiskMatrixDto,
  IncidentDto,
  ProjectDto,
  MemberDto,
  Severity,
  Probability,
  RiskStatus,
  IncidentStatus,
  CreateRiskInput,
  CreateIncidentInput,
  ConvertIncidentToLessonInput,
} from '@leaderos/shared-types';
import { AppLayout } from '@/components/layout/app-layout';
import { ManagementNavTabs } from '@/components/management/management-nav-tabs';
import { Modal } from '@/components/ui/modal';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Lightbulb,
  User,
  X,
} from 'lucide-react';

const SEVERITY_COLORS: Record<Severity, { badge: string }> = {
  CRITICAL: { badge: 'bg-critical-bg text-critical-fg border-critical-border' },
  HIGH: { badge: 'bg-danger-bg text-danger-fg border-danger-border' },
  MEDIUM: { badge: 'bg-warning-bg text-warning-fg border-warning-border' },
  LOW: { badge: 'bg-neutral-bg text-neutral-fg border-neutral-border' },
};

const PROBABILITY_COLORS: Record<Probability, string> = {
  HIGH: 'bg-danger-bg text-danger-fg border-danger-border',
  MEDIUM: 'bg-warning-bg text-warning-fg border-warning-border',
  LOW: 'bg-success-bg text-success-fg border-success-border',
};

const RISK_STATUS_MAP: Record<RiskStatus, { badge: string }> = {
  OPEN: { badge: 'bg-danger-bg text-danger-fg border-danger-border' },
  MONITORING: { badge: 'bg-warning-bg text-warning-fg border-warning-border' },
  MITIGATED: { badge: 'bg-success-bg text-success-fg border-success-border' },
  CLOSED: { badge: 'bg-neutral-bg text-neutral-fg border-neutral-border' },
};

const INCIDENT_STATUS_MAP: Record<IncidentStatus, { badge: string }> = {
  OPEN: { badge: 'bg-danger-bg text-danger-fg border-danger-border' },
  INVESTIGATING: { badge: 'bg-warning-bg text-warning-fg border-warning-border' },
  RESOLVED: { badge: 'bg-info-bg text-info-fg border-info-border' },
  CLOSED: { badge: 'bg-success-bg text-success-fg border-success-border' },
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

export default function RisksAndIncidentsPage() {
  return (
    <AppLayout>
      <ManagementNavTabs />
      <RisksContent />
    </AppLayout>
  );
}

function RisksContent() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'risks' | 'incidents'>('risks');

  // Data states
  const [risks, setRisks] = useState<RiskDto[]>([]);
  const [matrix, setMatrix] = useState<RiskMatrixDto | null>(null);
  const [incidents, setIncidents] = useState<IncidentDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRiskStatus, setSelectedRiskStatus] = useState<string>('');
  const [selectedIncidentStatus, setSelectedIncidentStatus] = useState<string>('');
  const [matrixCellFilter, setMatrixCellFilter] = useState<{
    probability: Probability;
    severity: Severity;
  } | null>(null);

  // Modals state
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskDto | null>(null);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<IncidentDto | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [incidentToConvert, setIncidentToConvert] = useState<IncidentDto | null>(null);
  const [lessonFormData, setLessonFormData] = useState({
    lesson: '',
    future_action: '',
    tags: 'incident, devops',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form states
  const [riskFormData, setRiskFormData] = useState<CreateRiskInput>({
    project_id: '',
    title: '',
    description: '',
    severity: 'MEDIUM',
    probability: 'MEDIUM',
    status: 'OPEN',
    owner_member_id: '',
    mitigation: '',
    due_date: '',
  });

  const [incidentFormData, setIncidentFormData] = useState<CreateIncidentInput>({
    project_id: '',
    title: '',
    description: '',
    severity: 'HIGH',
    status: 'OPEN',
    root_cause: '',
    solution: '',
    prevention: '',
  });

  // Fetch initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [projRes, memRes, riskRes, matRes, incRes] = await Promise.all([
        apiClient<ProjectDto[]>('/projects'),
        apiClient<MemberDto[]>('/members'),
        apiClient<RiskDto[]>(`/risks${selectedProject ? `?projectId=${selectedProject}` : ''}`),
        apiClient<RiskMatrixDto>(`/risks/matrix${selectedProject ? `?projectId=${selectedProject}` : ''}`),
        apiClient<IncidentDto[]>(`/incidents${selectedProject ? `?projectId=${selectedProject}` : ''}`),
      ]);

      setProjects(projRes.data ?? []);
      setMembers(memRes.data ?? []);
      setRisks(riskRes.data ?? []);
      setMatrix(matRes.data ?? null);
      setIncidents(incRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('management.risksPage.loadError'));
    } finally {
      setLoading(false);
    }
  }, [selectedProject, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Filtered risks
  const filteredRisks = useMemo(() => {
    return risks.filter((r) => {
      if (matrixCellFilter) {
        if (r.probability !== matrixCellFilter.probability || r.severity !== matrixCellFilter.severity) {
          return false;
        }
      }
      if (selectedRiskStatus && r.status !== selectedRiskStatus) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesDesc = r.description.toLowerCase().includes(q);
        const matchesMit = r.mitigation.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesMit) return false;
      }
      return true;
    });
  }, [risks, matrixCellFilter, selectedRiskStatus, searchQuery]);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (selectedIncidentStatus && inc.status !== selectedIncidentStatus) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = inc.title.toLowerCase().includes(q);
        const matchesDesc = inc.description.toLowerCase().includes(q);
        const matchesCause = inc.root_cause?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCause) return false;
      }
      return true;
    });
  }, [incidents, selectedIncidentStatus, searchQuery]);

  // Open Create Risk Modal
  const openCreateRiskModal = () => {
    setEditingRisk(null);
    setRiskFormData({
      project_id: projects[0]?.id || '',
      title: '',
      description: '',
      severity: 'MEDIUM',
      probability: 'MEDIUM',
      status: 'OPEN',
      owner_member_id: '',
      mitigation: '',
      due_date: '',
    });
    setIsRiskModalOpen(true);
  };

  // Open Edit Risk Modal
  const openEditRiskModal = (risk: RiskDto) => {
    setEditingRisk(risk);
    setRiskFormData({
      project_id: risk.project_id,
      title: risk.title,
      description: risk.description,
      severity: risk.severity,
      probability: risk.probability,
      status: risk.status,
      owner_member_id: risk.owner_member_id || '',
      mitigation: risk.mitigation,
      due_date: risk.due_date || '',
    });
    setIsRiskModalOpen(true);
  };

  // Submit Risk Form
  const handleRiskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskFormData.title?.trim() || !riskFormData.project_id) {
      alert(t('management.risksPage.riskValidationError'));
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingRisk) {
        await apiClient(`/risks/${editingRisk.id}`, {
          method: 'PATCH',
          body: JSON.stringify(riskFormData),
        });
      } else {
        await apiClient('/risks', {
          method: 'POST',
          body: JSON.stringify(riskFormData),
        });
      }
      setIsRiskModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('management.risksPage.riskSaveError'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick update risk status
  const handleQuickStatusUpdate = async (risk: RiskDto, nextStatus: RiskStatus) => {
    try {
      await apiClient(`/risks/${risk.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('management.risksPage.riskStatusError'));
    }
  };

  // Delete risk
  const handleDeleteRisk = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try {
      await apiClient(`/risks/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('management.risksPage.riskDeleteError'));
    }
  };

  // Open Create Incident Modal
  const openCreateIncidentModal = () => {
    setEditingIncident(null);
    setIncidentFormData({
      project_id: projects[0]?.id || '',
      title: '',
      description: '',
      severity: 'HIGH',
      status: 'OPEN',
      root_cause: '',
      solution: '',
      prevention: '',
    });
    setIsIncidentModalOpen(true);
  };

  // Open Edit Incident Modal
  const openEditIncidentModal = (inc: IncidentDto) => {
    setEditingIncident(inc);
    setIncidentFormData({
      project_id: inc.project_id,
      title: inc.title,
      description: inc.description,
      severity: inc.severity,
      status: inc.status,
      root_cause: inc.root_cause || '',
      solution: inc.solution || '',
      prevention: inc.prevention || '',
    });
    setIsIncidentModalOpen(true);
  };

  // Submit Incident Form
  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentFormData.title?.trim() || !incidentFormData.description?.trim() || !incidentFormData.project_id) {
      alert(t('management.risksPage.incidentValidationError'));
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingIncident) {
        await apiClient(`/incidents/${editingIncident.id}`, {
          method: 'PATCH',
          body: JSON.stringify(incidentFormData),
        });
      } else {
        await apiClient('/incidents', {
          method: 'POST',
          body: JSON.stringify(incidentFormData),
        });
      }
      setIsIncidentModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('management.risksPage.incidentSaveError'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete incident
  const handleDeleteIncident = async (id: string) => {
    if (!confirm(t('management.risksPage.incidentDeleteConfirm'))) return;
    try {
      await apiClient(`/incidents/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('management.risksPage.incidentDeleteError'));
    }
  };

  // Open Convert to Lesson Modal
  const openConvertToLessonModal = (inc: IncidentDto) => {
    setIncidentToConvert(inc);
    setLessonFormData({
      lesson: inc.solution ? t('management.risksPage.solutionPrefix', { value: inc.solution }) : '',
      future_action: inc.prevention || t('management.risksPage.defaultFutureAction'),
      tags: 'incident, ' + (inc.project_code ? inc.project_code.toLowerCase() : 'system'),
    });
    setIsLessonModalOpen(true);
  };

  // Submit Convert to Lesson
  const handleConvertToLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentToConvert) return;
    if (!lessonFormData.lesson.trim() || !lessonFormData.future_action.trim()) {
      alert(t('management.risksPage.convertValidationError'));
      return;
    }

    try {
      setFormSubmitting(true);
      const tagList = lessonFormData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload: ConvertIncidentToLessonInput = {
        lesson: lessonFormData.lesson.trim(),
        future_action: lessonFormData.future_action.trim(),
        tags: tagList,
      };

      await apiClient(`/incidents/${incidentToConvert.id}/convert-to-lesson`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert(t('management.risksPage.convertSuccess'));
      setIsLessonModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('management.risksPage.convertError'));
    } finally {
      setFormSubmitting(false);
    }
  };

  const highExposureRisks = risks.filter(
    (r) =>
      r.status !== 'CLOSED' &&
      r.status !== 'MITIGATED' &&
      (r.severity === 'CRITICAL' || (r.severity === 'HIGH' && r.probability !== 'LOW')),
  ).length;

  const openIncidents = incidents.filter(
    (i) => i.status === 'OPEN' || i.status === 'INVESTIGATING',
  ).length;

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
          <span className="text-xs text-slate-400 block font-medium">{t('management.risksPage.statTotalRisks')}</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">{risks.length}</span>
            <span className="text-xs text-slate-500">{t('common.items')}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-red-900/60 bg-red-950/20 p-4">
          <span className="text-xs text-red-300 block font-medium flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            {t('management.risksPage.statHighExposure')}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-400">{highExposureRisks}</span>
            <span className="text-xs text-red-300/70">{t('management.risksPage.statHighExposureUnit')}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-4">
          <span className="text-xs text-amber-300 block font-medium flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            {t('management.risksPage.statOpenIncidents')}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{openIncidents}</span>
            <span className="text-xs text-amber-300/70">{t('management.risksPage.statOpenIncidentsUnit')}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-4">
          <span className="text-xs text-emerald-300 block font-medium flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            {t('management.risksPage.statMitigated')}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {risks.filter((r) => r.status === 'MITIGATED' || r.status === 'CLOSED').length}
            </span>
            <span className="text-xs text-emerald-300/70">{t('management.risksPage.statMitigatedUnit')}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MA TRẬN RỦI RO (PROBABILITY X IMPACT MATRIX) */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t('management.risksPage.matrixTitle')}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t('management.risksPage.matrixDesc')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {matrixCellFilter && (
              <button
                type="button"
                onClick={() => setMatrixCellFilter(null)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-700/60 bg-indigo-950/60 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-900 transition"
              >
                <X className="h-3.5 w-3.5" />
                <span>
                  {t('management.risksPage.matrixFiltering', {
                    probability: matrixCellFilter.probability,
                    severity: matrixCellFilter.severity,
                  })}
                </span>
              </button>
            )}

            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">{t('common.allProjects')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Matrix Grid: Rows = Probability (HIGH, MEDIUM, LOW); Columns = Severity (CRITICAL, HIGH, MEDIUM, LOW) */}
        <div className="overflow-x-auto pt-2">
          <div className="min-w-[600px] border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            {/* Table Header: Severities */}
            <div className="grid grid-cols-5 text-center text-xs font-bold bg-slate-900 border-b border-slate-800 text-slate-300 py-2.5">
              <div className="text-slate-500 uppercase tracking-wider text-[11px] flex items-center justify-center">
                {t('management.risksPage.matrixAxisLabel')}
              </div>
              <div className="text-red-400">CRITICAL</div>
              <div className="text-orange-400">HIGH</div>
              <div className="text-amber-400">MEDIUM</div>
              <div className="text-slate-400">LOW</div>
            </div>

            {/* Matrix Rows */}
            {(['HIGH', 'MEDIUM', 'LOW'] as Probability[]).map((prob) => (
              <div
                key={prob}
                className="grid grid-cols-5 border-b border-slate-850 last:border-b-0 text-xs"
              >
                {/* Row Header */}
                <div className="bg-slate-900/60 font-semibold p-3 flex items-center justify-center text-slate-300 border-r border-slate-850">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border ${PROBABILITY_COLORS[prob]}`}
                  >
                    {prob}
                  </span>
                </div>

                {/* Severity Cells */}
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map((sev) => {
                  const cell = matrix?.cells.find(
                    (c) => c.probability === prob && c.severity === sev,
                  );
                  const count = cell?.count ?? 0;
                  const isSelected =
                    matrixCellFilter?.probability === prob && matrixCellFilter?.severity === sev;

                  let cellColor = 'bg-slate-950 hover:bg-slate-900 text-slate-400';
                  if (cell?.level === 'HIGH') {
                    cellColor = count > 0
                      ? 'bg-red-950/40 hover:bg-red-950/70 border-red-900/60 text-red-300'
                      : 'bg-red-950/15 text-slate-500 hover:bg-red-950/30';
                  } else if (cell?.level === 'MEDIUM') {
                    cellColor = count > 0
                      ? 'bg-amber-950/40 hover:bg-amber-950/70 border-amber-900/60 text-amber-300'
                      : 'bg-amber-950/15 text-slate-500 hover:bg-amber-950/30';
                  } else {
                    cellColor = count > 0
                      ? 'bg-slate-900 hover:bg-slate-850 text-slate-200'
                      : 'bg-slate-950 text-slate-600 hover:bg-slate-900';
                  }

                  if (isSelected) {
                    cellColor += ' ring-2 ring-indigo-500 font-bold';
                  }

                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setMatrixCellFilter(null);
                        } else {
                          setMatrixCellFilter({ probability: prob, severity: sev });
                          setActiveTab('risks');
                        }
                      }}
                      className={`p-3 text-center transition flex flex-col items-center justify-center border-r border-slate-850 last:border-r-0 ${cellColor}`}
                    >
                      <span className="font-mono text-base font-bold">{count}</span>
                      <span className="text-[10px] uppercase font-semibold opacity-75">
                        {t('management.risksPage.matrixCellCount', { count })}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TAB SWITCHER: SỔ RỦI RO & QUẢN LÝ SỰ CỐ */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('risks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'risks'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-foreground hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>{t('management.risksPage.tabRiskRegister', { count: risks.length })}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('incidents')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'incidents'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-foreground hover:bg-slate-800'
              }`}
            >
              <Flame className="h-4 w-4" />
              <span>{t('management.risksPage.tabIncidents', { count: incidents.length })}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={t('common.searchByTitleContent')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-64 rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {activeTab === 'risks' ? (
              <button
                type="button"
                onClick={openCreateRiskModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition"
              >
                <Plus className="h-4 w-4" />
                <span>{t('management.newRisk')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openCreateIncidentModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-500 shadow-md shadow-red-500/20 transition"
              >
                <Plus className="h-4 w-4" />
                <span>{t('management.newIncident')}</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SỔ RỦI RO (RISK REGISTER) */}
        {/* ========================================================================= */}
        {activeTab === 'risks' && (
          <div className="space-y-3">
            {/* Filter tags */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs text-slate-400 font-medium">{t('common.filterStatusLabel')}</span>
              <button
                type="button"
                onClick={() => setSelectedRiskStatus('')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedRiskStatus === ''
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-foreground'
                }`}
              >
                {t('common.allCount', { count: risks.length })}
              </button>
              {(['OPEN', 'MONITORING', 'MITIGATED', 'CLOSED'] as RiskStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedRiskStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    selectedRiskStatus === st
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-slate-900 text-slate-400 hover:text-foreground'
                  }`}
                >
                  {t(`management.riskStatuses.${st}`)} ({risks.filter((r) => r.status === st).length})
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs">{t('management.risksPage.loadingRisks')}</div>
            ) : filteredRisks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                {t('management.risksPage.noRisksFound')}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRisks.map((risk) => (
                  <div
                    key={risk.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 hover:border-slate-700 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {risk.project_code && (
                            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded">
                              [{risk.project_code}]
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              SEVERITY_COLORS[risk.severity].badge
                            }`}
                          >
                            {t('management.risksPage.severityPrefix', { value: risk.severity })}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              PROBABILITY_COLORS[risk.probability]
                            }`}
                          >
                            {t('management.risksPage.probabilityPrefix', { value: risk.probability })}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              RISK_STATUS_MAP[risk.status].badge
                            }`}
                          >
                            {t(`management.riskStatuses.${risk.status}`)}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-foreground leading-snug">
                          {risk.title}
                        </h3>

                        {risk.description && (
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {risk.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditRiskModal(risk)}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-foreground transition"
                          title={t('common.edit')}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteRisk(risk.id)}
                          className="p-1.5 rounded-lg border border-red-950 bg-red-950/30 text-red-400 hover:bg-red-900/50 transition"
                          title={t('management.risksPage.deleteRiskTitle')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Mitigation Plan Box */}
                    {risk.mitigation && (
                      <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 text-xs text-slate-300">
                        <strong className="text-indigo-400 block mb-0.5 text-[11px] uppercase tracking-wider font-bold">
                          {t('management.risksPage.mitigationPlanLabel')}
                        </strong>
                        <p className="leading-relaxed">{risk.mitigation}</p>
                      </div>
                    )}

                    {/* Footer Info & Quick Status buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                      <div className="flex items-center gap-4">
                        {risk.owner_member_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-slate-500" />
                            {t('management.risksPage.ownerPrefix')}{' '}
                            <strong className="text-slate-300">{risk.owner_member_name}</strong>
                          </span>
                        )}
                        {risk.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            {t('common.dueDateShort', { date: formatDate(risk.due_date) })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">{t('management.risksPage.changeStatusLabel')}</span>
                        {(['OPEN', 'MONITORING', 'MITIGATED', 'CLOSED'] as RiskStatus[]).map((nextSt) => (
                          <button
                            key={nextSt}
                            type="button"
                            disabled={risk.status === nextSt}
                            onClick={() => void handleQuickStatusUpdate(risk, nextSt)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                              risk.status === nextSt
                                ? RISK_STATUS_MAP[nextSt].badge
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-foreground'
                            }`}
                          >
                            {t(`management.riskStatuses.${nextSt}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: QUẢN LÝ SỰ CỐ (INCIDENTS TRACKER) */}
        {/* ========================================================================= */}
        {activeTab === 'incidents' && (
          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs text-slate-400 font-medium">{t('common.filterStatusLabel')}</span>
              <button
                type="button"
                onClick={() => setSelectedIncidentStatus('')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedIncidentStatus === ''
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-foreground'
                }`}
              >
                {t('common.allCount', { count: incidents.length })}
              </button>
              {(['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] as IncidentStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedIncidentStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    selectedIncidentStatus === st
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-slate-900 text-slate-400 hover:text-foreground'
                  }`}
                >
                  {t(`management.incidentStatuses.${st}`)} ({incidents.filter((i) => i.status === st).length})
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs">{t('management.risksPage.loadingIncidents')}</div>
            ) : filteredIncidents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                {t('management.risksPage.noIncidentsFound')}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-slate-700 transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {inc.project_code && (
                            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded">
                              [{inc.project_code}]
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              SEVERITY_COLORS[inc.severity].badge
                            }`}
                          >
                            {t(`management.severity.${inc.severity}`)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              INCIDENT_STATUS_MAP[inc.status].badge
                            }`}
                          >
                            {t(`management.incidentStatuses.${inc.status}`)}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-foreground leading-snug">
                          {inc.title}
                        </h3>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {inc.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                        {/* Convert to Lesson Learned Button */}
                        <button
                          type="button"
                          onClick={() => openConvertToLessonModal(inc)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-800/80 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/60 transition"
                          title={t('management.risksPage.convertLessonTitle')}
                        >
                          <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                          <span>{t('management.risksPage.convertLessonButton')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditIncidentModal(inc)}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-foreground transition"
                          title={t('management.risksPage.editIncidentTitle')}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteIncident(inc.id)}
                          className="p-1.5 rounded-lg border border-red-950 bg-red-950/30 text-red-400 hover:bg-red-900/50 transition"
                          title={t('management.risksPage.deleteIncidentTitle')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 3-Column / 3-Box Flow: Root Cause -> Solution -> Prevention */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Box 1: Root cause */}
                      <div className="rounded-xl border border-red-950/60 bg-red-950/20 p-3 text-xs">
                        <strong className="text-red-400 block mb-1 font-bold text-[11px] uppercase tracking-wider">
                          {t('management.risksPage.incidentRootCauseLabel')}
                        </strong>
                        <p className="text-slate-300 leading-relaxed">
                          {inc.root_cause || t('management.risksPage.incidentRootCauseEmpty')}
                        </p>
                      </div>

                      {/* Box 2: Solution */}
                      <div className="rounded-xl border border-blue-950/60 bg-blue-950/20 p-3 text-xs">
                        <strong className="text-blue-400 block mb-1 font-bold text-[11px] uppercase tracking-wider">
                          {t('management.risksPage.incidentSolutionLabel')}
                        </strong>
                        <p className="text-slate-300 leading-relaxed">
                          {inc.solution || t('management.risksPage.incidentSolutionEmpty')}
                        </p>
                      </div>

                      {/* Box 3: Prevention */}
                      <div className="rounded-xl border border-emerald-950/60 bg-emerald-950/20 p-3 text-xs">
                        <strong className="text-emerald-400 block mb-1 font-bold text-[11px] uppercase tracking-wider">
                          {t('management.risksPage.incidentPreventionLabel')}
                        </strong>
                        <p className="text-slate-300 leading-relaxed">
                          {inc.prevention || t('management.risksPage.incidentPreventionEmpty')}
                        </p>
                      </div>
                    </div>

                    {/* Timeline dates */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                      <div className="flex items-center gap-4">
                        <span>
                          {t('management.risksPage.detectedAt', {
                            date: new Date(inc.detected_at).toLocaleString(i18n.language),
                          })}
                        </span>
                        {inc.resolved_at && (
                          <span className="text-emerald-400">
                            {t('management.risksPage.resolvedAt', {
                              date: new Date(inc.resolved_at).toLocaleString(i18n.language),
                            })}
                          </span>
                        )}
                      </div>

                      {inc.lessons_count && inc.lessons_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
                          <CheckCircle2 className="h-3 w-3 text-amber-400" />
                          {t('management.risksPage.lessonsCount', { count: inc.lessons_count })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TẠO / SỬA RỦI RO */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        title={
          editingRisk
            ? t('management.risksPage.modalRiskEditTitle')
            : t('management.risksPage.modalRiskCreateTitle')
        }
        description={t('management.risksPage.modalRiskDesc')}
        maxWidth="lg"
      >
        <form onSubmit={handleRiskSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t('management.risksPage.relatedProject')} <span className="text-red-400">*</span>
            </label>
            <select
              value={riskFormData.project_id}
              onChange={(e) => setRiskFormData({ ...riskFormData, project_id: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              required
            >
              <option value="" disabled>{t('common.selectProject')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t('management.risksPage.riskTitleLabel')} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder={t('management.risksPage.riskTitlePlaceholder')}
              value={riskFormData.title}
              onChange={(e) => setRiskFormData({ ...riskFormData, title: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('management.risksPage.severityLabel')}
              </label>
              <select
                value={riskFormData.severity}
                onChange={(e) => setRiskFormData({ ...riskFormData, severity: e.target.value as Severity })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map((sv) => (
                  <option key={sv} value={sv}>
                    {t(`management.severityOptions.${sv}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('management.risksPage.probabilityLabel')}
              </label>
              <select
                value={riskFormData.probability}
                onChange={(e) => setRiskFormData({ ...riskFormData, probability: e.target.value as Probability })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {(['HIGH', 'MEDIUM', 'LOW'] as Probability[]).map((pb) => (
                  <option key={pb} value={pb}>
                    {t(`management.probabilityOptions.${pb}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('common.status')}
              </label>
              <select
                value={riskFormData.status}
                onChange={(e) => setRiskFormData({ ...riskFormData, status: e.target.value as RiskStatus })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {(['OPEN', 'MONITORING', 'MITIGATED', 'CLOSED'] as RiskStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {t(`management.riskStatusOptions.${st}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('management.risksPage.ownerLabel')}
              </label>
              <select
                value={riskFormData.owner_member_id || ''}
                onChange={(e) => setRiskFormData({ ...riskFormData, owner_member_id: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">{t('management.risksPage.noOwnerAssigned')}</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t('management.risksPage.mitigationLabel')}
            </label>
            <textarea
              rows={3}
              placeholder={t('management.risksPage.mitigationPlaceholder')}
              value={riskFormData.mitigation}
              onChange={(e) => setRiskFormData({ ...riskFormData, mitigation: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t('management.risksPage.riskDueDateLabel')}
            </label>
            <input
              type="date"
              value={riskFormData.due_date || ''}
              onChange={(e) => setRiskFormData({ ...riskFormData, due_date: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsRiskModalOpen(false)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {formSubmitting
                ? t('common.saving')
                : editingRisk
                  ? t('management.risksPage.updateRisk')
                  : t('management.risksPage.saveRisk')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: GHI NHẬN / SỬA SỰ CỐ */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        title={
          editingIncident
            ? t('management.risksPage.modalIncidentEditTitle')
            : t('management.risksPage.modalIncidentCreateTitle')
        }
        description={t('management.risksPage.modalIncidentDesc')}
        maxWidth="lg"
      >
        <form onSubmit={handleIncidentSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t('management.risksPage.relatedProject')} <span className="text-red-400">*</span>
            </label>
            <select
              value={incidentFormData.project_id}
              onChange={(e) => setIncidentFormData({ ...incidentFormData, project_id: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              required
            >
              <option value="" disabled>{t('common.selectProject')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t('management.risksPage.incidentTitleLabel')} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder={t('management.risksPage.incidentTitlePlaceholder')}
              value={incidentFormData.title}
              onChange={(e) => setIncidentFormData({ ...incidentFormData, title: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t('management.risksPage.incidentDescLabel')} <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={2}
              placeholder={t('management.risksPage.incidentDescPlaceholder')}
              value={incidentFormData.description}
              onChange={(e) => setIncidentFormData({ ...incidentFormData, description: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('management.risksPage.incidentSeverityLabel')}
              </label>
              <select
                value={incidentFormData.severity}
                onChange={(e) => setIncidentFormData({ ...incidentFormData, severity: e.target.value as Severity })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map((sv) => (
                  <option key={sv} value={sv}>
                    {t(`management.incidentSeverityOptions.${sv}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('management.risksPage.incidentStatusLabel')}
              </label>
              <select
                value={incidentFormData.status}
                onChange={(e) => setIncidentFormData({ ...incidentFormData, status: e.target.value as IncidentStatus })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {(['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] as IncidentStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {t(`management.incidentStatusOptions.${st}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-red-300 block mb-1">
              {t('management.risksPage.rootCauseLabel')}
            </label>
            <textarea
              rows={2}
              placeholder={t('management.risksPage.rootCausePlaceholder')}
              value={incidentFormData.root_cause || ''}
              onChange={(e) => setIncidentFormData({ ...incidentFormData, root_cause: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-blue-300 block mb-1">
              {t('management.risksPage.solutionLabel')}
            </label>
            <textarea
              rows={2}
              placeholder={t('management.risksPage.solutionPlaceholder')}
              value={incidentFormData.solution || ''}
              onChange={(e) => setIncidentFormData({ ...incidentFormData, solution: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-emerald-300 block mb-1">
              {t('management.risksPage.preventionLabel')}
            </label>
            <textarea
              rows={2}
              placeholder={t('management.risksPage.preventionPlaceholder')}
              value={incidentFormData.prevention || ''}
              onChange={(e) => setIncidentFormData({ ...incidentFormData, prevention: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsIncidentModalOpen(false)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {formSubmitting
                ? t('common.saving')
                : editingIncident
                  ? t('management.risksPage.updateIncident')
                  : t('management.risksPage.saveIncident')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: CHUYỂN SỰ CỐ THÀNH BÀI HỌC KINH NGHIỆM */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        title={t('management.risksPage.modalConvertTitle')}
        description={t('management.risksPage.modalConvertDesc')}
        maxWidth="lg"
      >
        <form onSubmit={handleConvertToLessonSubmit} className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-1">
            <span className="text-slate-500 block text-[11px] uppercase font-bold">
              {t('management.risksPage.sourceIncidentLabel')}
            </span>
            <span className="font-semibold text-foreground block">{incidentToConvert?.title}</span>
            <span className="text-slate-400 block text-[11px]">
              {t('management.risksPage.convertProjectPrefix', {
                code: incidentToConvert?.project_code ?? '',
                name: incidentToConvert?.project_name ?? '',
              })}
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-amber-300 block mb-1">
              {t('management.risksPage.convertLessonLabel')} <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              placeholder={t('management.risksPage.convertLessonPlaceholder')}
              value={lessonFormData.lesson}
              onChange={(e) => setLessonFormData({ ...lessonFormData, lesson: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-emerald-300 block mb-1">
              {t('management.risksPage.convertActionLabel')} <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={2}
              placeholder={t('management.risksPage.convertActionPlaceholder')}
              value={lessonFormData.future_action}
              onChange={(e) => setLessonFormData({ ...lessonFormData, future_action: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t('management.risksPage.convertTagsLabel')}
            </label>
            <input
              type="text"
              placeholder="incident, database, redis, devops"
              value={lessonFormData.tags}
              onChange={(e) => setLessonFormData({ ...lessonFormData, tags: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsLessonModalOpen(false)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {formSubmitting
                ? t('management.risksPage.convertSaving')
                : t('management.risksPage.convertSubmit')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
