'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LearningItemDto,
  Priority,
  CreateLearningItemInput,
  UpdateLearningItemInput,
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
  ExternalLink,
  GraduationCap,
  Calendar,
  X,
  RefreshCw,
  Kanban,
  Table as TableIcon,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  BookOpen,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  string,
  { badge: string; colBadge: string; nextStatus?: string; prevStatus?: string }
> = {
  BACKLOG: {
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    colBadge: 'border-slate-800 bg-slate-900/60',
    nextStatus: 'LEARNING',
  },
  LEARNING: {
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    colBadge: 'border-blue-900/40 bg-blue-950/20',
    nextStatus: 'COMPLETED',
    prevStatus: 'BACKLOG',
  },
  PAUSED: {
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    colBadge: 'border-amber-900/40 bg-amber-950/20',
    nextStatus: 'LEARNING',
    prevStatus: 'BACKLOG',
  },
  COMPLETED: {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    colBadge: 'border-emerald-900/40 bg-emerald-950/20',
    prevStatus: 'LEARNING',
  },
};

const LEARNING_STATUS_KEYS = ['BACKLOG', 'LEARNING', 'PAUSED', 'COMPLETED'] as const;

const PRIORITY_MAP: Record<Priority, { badge: string }> = {
  CRITICAL: { badge: 'bg-red-500/20 text-red-300 border-red-500/40' },
  HIGH: { badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  MEDIUM: { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  LOW: { badge: 'bg-slate-500/20 text-slate-400 border-slate-500/40' },
};

export default function LearningPage() {
  return (
    <AppLayout>
      <KnowledgeNavTabs />
      <LearningContent />
    </AppLayout>
  );
}

function LearningContent() {
  const { t } = useTranslation();
  const [items, setItems] = useState<LearningItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'kanban' or 'table'
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Modal Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LearningItemDto | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<Priority>(Priority.MEDIUM);
  const [formStatus, setFormStatus] = useState<string>('BACKLOG');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formResourceUrl, setFormResourceUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedPriority !== 'ALL') params.append('priority', selectedPriority);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient<LearningItemDto[]>(`/learning-items${qs}`);
      setItems(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('knowledge.learningPage.loadError'));
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedPriority, t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchItems();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  // Extract unique categories
  const categories = useMemo(() => {
    const catSet = new Set<string>();
    items.forEach((i) => {
      if (i.category) catSet.add(i.category);
    });
    return Array.from(catSet).sort();
  }, [items]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const toLearn = items.filter((i) => i.status === 'BACKLOG').length;
    const inProgress = items.filter((i) => i.status === 'LEARNING').length;
    const completed = items.filter((i) => i.status === 'COMPLETED').length;
    return { total, toLearn, inProgress, completed };
  }, [items]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormCategory('');
    setFormDescription('');
    setFormPriority(Priority.MEDIUM);
    setFormStatus('BACKLOG');
    setFormTargetDate('');
    setFormResourceUrl('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: LearningItemDto) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category ?? '');
    setFormDescription(item.description ?? '');
    setFormPriority(item.priority);
    setFormStatus(item.status);
    setFormTargetDate(item.target_date ?? '');
    setFormResourceUrl(item.resource_url ?? '');
    setFormNotes(item.notes ?? '');
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      setSaving(true);
      if (editingItem) {
        const payload: UpdateLearningItemInput = {
          title: formTitle.trim(),
          category: formCategory.trim() || null,
          description: formDescription.trim() || null,
          priority: formPriority,
          status: formStatus,
          target_date: formTargetDate || null,
          resource_url: formResourceUrl.trim() || null,
          notes: formNotes.trim() || null,
        };
        await apiClient<LearningItemDto>(`/learning-items/${editingItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        const payload: CreateLearningItemInput = {
          title: formTitle.trim(),
          category: formCategory.trim() || undefined,
          description: formDescription.trim() || undefined,
          priority: formPriority,
          status: formStatus,
          target_date: formTargetDate || undefined,
          resource_url: formResourceUrl.trim() || undefined,
          notes: formNotes.trim() || undefined,
        };
        await apiClient<LearningItemDto>('/learning-items', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      void fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('knowledge.learningPage.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient<LearningItemDto>(`/learning-items/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      void fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('knowledge.learningPage.statusChangeError'));
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(t('knowledge.learningPage.deleteConfirm', { title }))) return;
    try {
      await apiClient(`/learning-items/${id}`, { method: 'DELETE' });
      void fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('knowledge.learningPage.deleteError'));
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI STATS ROW */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t('knowledge.learningPage.statTotal')}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
            <span className="text-[11px] text-slate-400">{t('knowledge.learningPage.statTotalUnit')}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t('knowledge.learningPage.statBacklog')}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-200">{stats.toLearn}</span>
            <span className="text-[11px] text-slate-400">backlog</span>
          </div>
        </div>

        <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
            {t('knowledge.learningPage.statLearning')}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-400">{stats.inProgress}</span>
            <span className="text-[11px] text-blue-300">{t('knowledge.learningPage.statLearningUnit')}</span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            {t('knowledge.learningPage.statCompleted')}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{stats.completed}</span>
            <span className="text-[11px] text-emerald-300">{t('knowledge.learningPage.statCompletedUnit')}</span>
          </div>
        </div>
      </div>

      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder={t('knowledge.learningPage.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">{t('common.anyCategory')}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">{t('common.anyPriority')}</option>
            {(Object.keys(PRIORITY_MAP) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {t(`tasks.priority.${p}`)}
              </option>
            ))}
          </select>

          {(search || selectedCategory !== 'ALL' || selectedPriority !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
                setSelectedPriority('ALL');
              }}
              className="text-[11px] text-slate-400 hover:text-indigo-400 transition underline underline-offset-4"
            >
              {t('common.reset')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={t('common.viewKanban')}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={t('common.viewTable')}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>{t('common.table')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => void fetchItems()}
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
            <span>{t('knowledge.learningPage.newItem')}</span>
          </button>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-900 rounded-xl text-red-300 text-xs">
          {t('common.errorPrefix', { message: error })}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {loading && items.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-500">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <GraduationCap className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <div className="text-sm font-semibold text-slate-300">
            {t('knowledge.learningPage.emptyTitle')}
          </div>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {t('knowledge.learningPage.emptyDesc')}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t('knowledge.learningPage.createFirst')}</span>
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* ========================================================================= */
        /* KANBAN VIEW (3 COLUMNS)                                                   */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column 1: BACKLOG */}
          <KanbanColumn
            title={t('knowledge.learningStatuses.BACKLOG')}
            statusKey="BACKLOG"
            items={items.filter((i) => i.status === 'BACKLOG')}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onMoveStatus={handleQuickStatus}
          />

          {/* Column 2: LEARNING */}
          <KanbanColumn
            title={t('knowledge.learningStatuses.LEARNING')}
            statusKey="LEARNING"
            items={items.filter((i) => i.status === 'LEARNING')}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onMoveStatus={handleQuickStatus}
          />

          {/* Column 3: COMPLETED */}
          <KanbanColumn
            title={t('knowledge.learningStatuses.COMPLETED')}
            statusKey="COMPLETED"
            items={items.filter((i) => i.status === 'COMPLETED')}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onMoveStatus={handleQuickStatus}
          />
        </div>
      ) : (
        /* ========================================================================= */
        /* TABLE VIEW                                                                */
        /* ========================================================================= */
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t('knowledge.learningPage.colTopic')}</th>
                  <th className="px-4 py-3 font-semibold">{t('common.category')}</th>
                  <th className="px-4 py-3 font-semibold">{t('common.priority')}</th>
                  <th className="px-4 py-3 font-semibold">{t('common.status')}</th>
                  <th className="px-4 py-3 font-semibold">{t('common.targetDate')}</th>
                  <th className="px-4 py-3 font-semibold">{t('knowledge.learningPage.colDocs')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item) => {
                  const priorityConfig = PRIORITY_MAP[item.priority] ?? PRIORITY_MAP.MEDIUM;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        <div className="space-y-0.5">
                          <span
                            onClick={() => openEditModal(item)}
                            className="cursor-pointer hover:text-indigo-400 transition"
                          >
                            {item.title}
                          </span>
                          {item.description && (
                            <p className="text-[11px] text-slate-400 font-normal line-clamp-1">{item.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {item.category ? (
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-indigo-300 border border-slate-700/60">
                            {item.category}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${priorityConfig.badge}`}>
                          {t(`tasks.priority.${item.priority}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.status}
                          onChange={(e) => void handleQuickStatus(item.id, e.target.value)}
                          className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] font-medium text-slate-200 focus:border-indigo-500 focus:outline-none"
                        >
                          {LEARNING_STATUS_KEYS.map((st) => (
                            <option key={st} value={st}>
                              {t(`knowledge.learningStatuses.${st}`)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {item.target_date || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {item.resource_url ? (
                          <a
                            href={item.resource_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-400 hover:underline text-[11px]"
                          >
                            <span>{t('common.openLink')}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition"
                            title={t('common.edit')}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.title)}
                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
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
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 dark:bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[92vh] z-10">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-brand" />
                <span>
                  {editingItem
                    ? t('knowledge.learningPage.modalEditTitle')
                    : t('knowledge.learningPage.modalCreateTitle')}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('knowledge.learningPage.topicLabel')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('knowledge.learningPage.topicPlaceholder')}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('knowledge.learningPage.categoryLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder="Architecture, System Design..."
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('common.priority')}</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as Priority)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    {(Object.keys(PRIORITY_MAP) as Priority[]).map((p) => (
                      <option key={p} value={p}>
                        {t(`tasks.priority.${p}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('common.status')}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    {LEARNING_STATUS_KEYS.map((st) => (
                      <option key={st} value={st}>
                        {t(`knowledge.learningStatuses.${st}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('knowledge.learningPage.targetDateLabel')}
                  </label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('knowledge.learningPage.urlLabel')}
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formResourceUrl}
                  onChange={(e) => setFormResourceUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('knowledge.learningPage.summaryLabel')}
                </label>
                <textarea
                  rows={2}
                  placeholder={t('knowledge.learningPage.summaryPlaceholder')}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('common.notesExtra')}
                </label>
                <textarea
                  rows={2}
                  placeholder={t('knowledge.learningPage.notesPlaceholder')}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

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
                  {saving ? t('common.saving') : editingItem ? t('common.update') : t('common.addNew')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  title,
  statusKey,
  items,
  onEdit,
  onDelete,
  onMoveStatus,
}: {
  title: string;
  statusKey: string;
  items: LearningItemDto[];
  onEdit: (item: LearningItemDto) => void;
  onDelete: (id: string, title: string) => void;
  onMoveStatus: (id: string, newStatus: string) => void;
}) {
  const { t } = useTranslation();
  const conf = STATUS_CONFIG[statusKey] ?? {
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    colBadge: 'border-slate-800 bg-slate-900/60',
    nextStatus: undefined,
    prevStatus: undefined,
  };

  return (
    <div className={`flex flex-col rounded-xl border p-4 shadow-sm min-h-[500px] ${conf.colBadge}`}>
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
          {statusKey === 'BACKLOG' && <BookOpen className="h-4 w-4 text-slate-400" />}
          {statusKey === 'LEARNING' && <Clock className="h-4 w-4 text-blue-400" />}
          {statusKey === 'COMPLETED' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          <span>{title}</span>
        </h3>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-400">
          {items.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {items.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-600 italic">
            {t('knowledge.learningPage.noItems')}
          </div>
        ) : (
          items.map((item) => {
            const priorityConfig = PRIORITY_MAP[item.priority] ?? PRIORITY_MAP.MEDIUM;
            const prevStatusKey = conf.prevStatus;
            const nextStatusKey = conf.nextStatus;
            const prevLabel = prevStatusKey
              ? t(`knowledge.learningStatuses.${prevStatusKey}`)
              : undefined;
            const nextLabel = nextStatusKey
              ? t(`knowledge.learningStatuses.${nextStatusKey}`)
              : undefined;

            return (
              <div
                key={item.id}
                className="group rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 shadow-sm transition hover:border-slate-700 hover:shadow-indigo-500/5 space-y-2.5"
              >
                {/* Badges & Actions */}
                <div className="flex items-start justify-between gap-2">
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${priorityConfig.badge}`}>
                    {t(`tasks.priority.${item.priority}`)}
                  </span>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800"
                      title={t('common.edit')}
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id, item.title)}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800"
                      title={t('common.delete')}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h4
                  onClick={() => onEdit(item)}
                  className="text-xs font-bold text-foreground hover:text-brand cursor-pointer transition leading-snug"
                >
                  {item.title}
                </h4>

                {/* Description snippet */}
                {item.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                )}

                {/* Metadata: Category & Date */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {item.category && (
                    <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300 border border-slate-700/60">
                      {item.category}
                    </span>
                  )}
                  {item.target_date && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      <span>{item.target_date}</span>
                    </span>
                  )}
                  {item.resource_url && (
                    <a
                      href={item.resource_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:underline ml-auto"
                      title={item.resource_url}
                    >
                      <span>{t('knowledge.learningPage.docsLabel')}</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>

                {/* 1-Click Status Transition Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  {prevStatusKey ? (
                    <button
                      type="button"
                      onClick={() => onMoveStatus(item.id, prevStatusKey)}
                      className="flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-slate-200 transition"
                      title={t('knowledge.learningPage.moveBack', {
                        status: prevLabel ?? prevStatusKey,
                      })}
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span>{t('common.back')}</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {nextStatusKey && (
                    <button
                      type="button"
                      onClick={() => onMoveStatus(item.id, nextStatusKey)}
                      className="flex items-center gap-0.5 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
                      title={t('knowledge.learningPage.moveNext', {
                        status: nextLabel ?? nextStatusKey,
                      })}
                    >
                      <span>
                        {statusKey === 'BACKLOG'
                          ? t('knowledge.learningPage.startLearning')
                          : t('knowledge.learningPage.markCompleted')}
                      </span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
