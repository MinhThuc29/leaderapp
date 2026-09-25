'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LessonLearnedDto,
  ProjectDto,
  CreateLessonLearnedInput,
  UpdateLessonLearnedInput,
} from '@leaderos/shared-types';
import { AppLayout } from '@/components/layout/app-layout';
import { KnowledgeNavTabs } from '@/components/knowledge/knowledge-nav-tabs';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Tag,
  FolderKanban,
  Lightbulb,
  X,
  RefreshCw,
  Compass,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export default function LessonsPage() {
  return (
    <AppLayout>
      <KnowledgeNavTabs />
      <LessonsContent />
    </AppLayout>
  );
}

function LessonsContent() {
  const { t } = useTranslation();
  const [lessons, setLessons] = useState<LessonLearnedDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  // Modal Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonLearnedDto | null>(null);

  // Form State (5 steps)
  const [formTitle, setFormTitle] = useState('');
  const [formSituation, setFormSituation] = useState('');
  const [formProblem, setFormProblem] = useState('');
  const [formRootCause, setFormRootCause] = useState('');
  const [formLesson, setFormLesson] = useState('');
  const [formFutureAction, setFormFutureAction] = useState('');
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formTags, setFormTags] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedProject !== 'ALL') params.append('project_id', selectedProject);
      if (selectedTag !== 'ALL') params.append('tag', selectedTag);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const [resLessons, resProjects] = await Promise.all([
        apiClient<LessonLearnedDto[]>(`/lessons-learned${qs}`),
        projects.length === 0 ? apiClient<ProjectDto[]>('/projects') : Promise.resolve({ data: projects }),
      ]);

      setLessons(resLessons.data);
      if (projects.length === 0) setProjects(resProjects.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('knowledge.lessonsPage.loadError'));
    } finally {
      setLoading(false);
    }
  }, [search, selectedProject, selectedTag, projects, t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchLessons();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchLessons]);

  // Unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    lessons.forEach((l) => {
      l.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [lessons]);

  const openCreateModal = () => {
    setEditingLesson(null);
    setFormTitle('');
    setFormSituation('');
    setFormProblem('');
    setFormRootCause('');
    setFormLesson('');
    setFormFutureAction('');
    setFormProjectId('');
    setFormTags('');
    setIsModalOpen(true);
  };

  const openEditModal = (lesson: LessonLearnedDto) => {
    setEditingLesson(lesson);
    setFormTitle(lesson.title);
    setFormSituation(lesson.situation);
    setFormProblem(lesson.problem);
    setFormRootCause(lesson.root_cause);
    setFormLesson(lesson.lesson);
    setFormFutureAction(lesson.future_action);
    setFormProjectId(lesson.project_id ?? '');
    setFormTags(lesson.tags ? lesson.tags.join(', ') : '');
    setIsModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formProblem.trim() || !formRootCause.trim() || !formLesson.trim() || !formFutureAction.trim()) {
      alert(t('knowledge.lessonsPage.validationError'));
      return;
    }

    try {
      setSaving(true);
      const tagsArray = formTags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      if (editingLesson) {
        const payload: UpdateLessonLearnedInput = {
          title: formTitle.trim(),
          situation: formSituation.trim() || 'Chung',
          problem: formProblem.trim(),
          root_cause: formRootCause.trim(),
          lesson: formLesson.trim(),
          future_action: formFutureAction.trim(),
          project_id: formProjectId || null,
          tags: tagsArray,
        };
        await apiClient<LessonLearnedDto>(`/lessons-learned/${editingLesson.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        const payload: CreateLessonLearnedInput = {
          title: formTitle.trim(),
          situation: formSituation.trim() || 'Chung',
          problem: formProblem.trim(),
          root_cause: formRootCause.trim(),
          lesson: formLesson.trim(),
          future_action: formFutureAction.trim(),
          project_id: formProjectId || undefined,
          tags: tagsArray,
        };
        await apiClient<LessonLearnedDto>('/lessons-learned', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      void fetchLessons();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('knowledge.lessonsPage.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(t('knowledge.lessonsPage.deleteConfirm', { title }))) return;
    try {
      await apiClient(`/lessons-learned/${id}`, { method: 'DELETE' });
      void fetchLessons();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('knowledge.lessonsPage.deleteError'));
    }
  };

  return (
    <div className="space-y-6">
      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder={t('knowledge.lessonsPage.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Project */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">{t('common.allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>

          {/* Tag */}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">{t('common.anyTag')}</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          )}

          {(search || selectedProject !== 'ALL' || selectedTag !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedProject('ALL');
                setSelectedTag('ALL');
              }}
              className="text-[11px] text-slate-400 hover:text-indigo-400 transition underline underline-offset-4"
            >
              {t('common.reset')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchLessons()}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            title={t('common.refresh')}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>{t('knowledge.lessonsPage.newLesson')}</span>
          </button>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-900 rounded-xl text-red-300 text-xs">
          {t('common.errorPrefix', { message: error })}
        </div>
      )}

      {/* 5-STEP STRUCTURE GUIDELINE HEADER */}
      <div className="hidden sm:flex items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-2 text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
          {t('knowledge.lessonsPage.structureHint')}
        </span>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-blue-400">{t('knowledge.lessonsPage.step1Short')}</span>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <span className="text-amber-400">{t('knowledge.lessonsPage.step2Short')}</span>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <span className="text-rose-400">{t('knowledge.lessonsPage.step3Short')}</span>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <span className="text-emerald-400">{t('knowledge.lessonsPage.step4Short')}</span>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <span className="text-indigo-400">{t('knowledge.lessonsPage.step5Short')}</span>
        </div>
      </div>

      {/* LESSONS CARDS LIST */}
      {loading && lessons.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-500">{t('common.loading')}</div>
      ) : lessons.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <Lightbulb className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <div className="text-sm font-semibold text-slate-300">{t('knowledge.lessonsPage.emptyTitle')}</div>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {t('knowledge.lessonsPage.emptyDesc')}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t('knowledge.lessonsPage.createFirst')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onEdit={() => openEditModal(lesson)}
              onDelete={() => handleDelete(lesson.id, lesson.title)}
            />
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 dark:bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col max-h-[92vh] z-10">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-foreground flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                <span>{editingLesson ? t('knowledge.lessonsPage.modalEditTitle') : t('knowledge.lessonsPage.modalCreateTitle')}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('knowledge.lessonsPage.titleLabel')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('knowledge.lessonsPage.titlePlaceholder')}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Project & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('common.projectLink')}</label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">{t('common.noProjectLink')}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('common.tags')} <span className="text-[10px] text-slate-500 font-normal">{t('common.tagsCommaHint')}</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="database, deadlock, scaling, architecture"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 5-STEP FORM FIELDS */}
              <div className="space-y-3 pt-2">
                {/* Step 1: Situation */}
                <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-3 space-y-1">
                  <label className="block text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-blue-400" />
                    <span>{t('knowledge.lessonsPage.step1Label')}</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder={t('knowledge.lessonsPage.step1Placeholder')}
                    value={formSituation}
                    onChange={(e) => setFormSituation(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Step 2: Problem */}
                <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3 space-y-1">
                  <label className="block text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>{t('knowledge.lessonsPage.step2Label')} <span className="text-red-400">*</span></span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder={t('knowledge.lessonsPage.step2Placeholder')}
                    value={formProblem}
                    onChange={(e) => setFormProblem(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Step 3: Root Cause */}
                <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3 space-y-1">
                  <label className="block text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-rose-400" />
                    <span>{t('knowledge.lessonsPage.step3Label')} <span className="text-red-400">*</span></span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder={t('knowledge.lessonsPage.step3Placeholder')}
                    value={formRootCause}
                    onChange={(e) => setFormRootCause(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                {/* Step 4: Lesson */}
                <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3 space-y-1">
                  <label className="block text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{t('knowledge.lessonsPage.step4Label')} <span className="text-red-400">*</span></span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder={t('knowledge.lessonsPage.step4Placeholder')}
                    value={formLesson}
                    onChange={(e) => setFormLesson(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Step 5: Future Action */}
                <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3 space-y-1">
                  <label className="block text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{t('knowledge.lessonsPage.step5Label')} <span className="text-red-400">*</span></span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder={t('knowledge.lessonsPage.step5Placeholder')}
                    value={formFutureAction}
                    onChange={(e) => setFormFutureAction(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  {saving
                    ? t('common.saving')
                    : editingLesson
                    ? t('knowledge.lessonsPage.updateLesson')
                    : t('knowledge.lessonsPage.saveLesson')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LessonCard({
  lesson,
  onEdit,
  onDelete,
}: {
  lesson: LessonLearnedDto;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t, i18n } = useTranslation();
  const formattedDate = new Date(lesson.created_at).toLocaleDateString(i18n.language, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm transition hover:border-slate-700 hover:shadow-indigo-500/5">
      <div className="space-y-4">
        {/* Header: Title, Project & Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3
              onClick={onEdit}
              className="text-sm font-bold text-foreground hover:text-brand cursor-pointer transition leading-snug"
            >
              {lesson.title}
            </h3>
            {lesson.project && (
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                <FolderKanban className="h-3 w-3 text-slate-400" />
                <span>{lesson.project.code} - {lesson.project.name}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
            <button
              type="button"
              onClick={onEdit}
              className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
              title={t('knowledge.lessonsPage.editTitle')}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              title={t('knowledge.lessonsPage.deleteTitle')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 5-STEP STRUCTURE BLOCKS */}
        <div className="space-y-2 text-xs">
          {/* 1. Situation */}
          {lesson.situation && lesson.situation !== 'Chung' && (
            <div className="rounded-lg border border-blue-900/30 bg-blue-950/20 p-2.5">
              <span className="font-semibold text-blue-400 block mb-0.5 text-[11px] flex items-center gap-1">
                <Compass className="h-3 w-3" />
                {t('knowledge.lessonsPage.viewStep1')}
              </span>
              <p className="text-slate-300 leading-relaxed">{lesson.situation}</p>
            </div>
          )}

          {/* 2. Problem */}
          <div className="rounded-lg border border-amber-900/30 bg-amber-950/20 p-2.5">
            <span className="font-semibold text-amber-400 block mb-0.5 text-[11px] flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {t('knowledge.lessonsPage.viewStep2')}
            </span>
            <p className="text-slate-300 leading-relaxed">{lesson.problem}</p>
          </div>

          {/* 3. Root Cause */}
          <div className="rounded-lg border border-rose-900/30 bg-rose-950/20 p-2.5">
            <span className="font-semibold text-rose-400 block mb-0.5 text-[11px] flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {t('knowledge.lessonsPage.viewStep3')}
            </span>
            <p className="text-slate-300 leading-relaxed">{lesson.root_cause}</p>
          </div>

          {/* 4. Lesson */}
          <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/20 p-2.5">
            <span className="font-semibold text-emerald-400 block mb-0.5 text-[11px] flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {t('knowledge.lessonsPage.viewStep4')}
            </span>
            <p className="text-slate-200 font-medium leading-relaxed">{lesson.lesson}</p>
          </div>

          {/* 5. Future Action */}
          <div className="rounded-lg border border-indigo-900/30 bg-indigo-950/20 p-2.5">
            <span className="font-semibold text-indigo-400 block mb-0.5 text-[11px] flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              {t('knowledge.lessonsPage.viewStep5')}
            </span>
            <p className="text-slate-300 leading-relaxed">{lesson.future_action}</p>
          </div>
        </div>
      </div>

      {/* Footer Tags & Date */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {lesson.tags && lesson.tags.length > 0 ? (
            lesson.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-600 italic">{t('common.noTags')}</span>
          )}
        </div>

        <span className="text-[10px] text-slate-500">{formattedDate}</span>
      </div>
    </div>
  );
}
