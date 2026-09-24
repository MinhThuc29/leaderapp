'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  NoteDto,
  NoteType,
  ProjectDto,
  CreateNoteInput,
  UpdateNoteInput,
} from '@leaderos/shared-types';
import { AppLayout } from '@/components/layout/app-layout';
import { KnowledgeNavTabs } from '@/components/knowledge/knowledge-nav-tabs';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Pin,
  PinOff,
  Edit2,
  Trash2,
  Tag,
  FolderKanban,
  FileText,
  Eye,
  Code,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const CATEGORY_MAP: Record<NoteType, { label: string; badge: string }> = {
  WORK: { label: 'Công việc (Work)', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  IDEA: { label: 'Ý tưởng (Idea)', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  TECHNICAL: { label: 'Kỹ thuật (Technical)', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  MEETING: { label: 'Cuộc họp (Meeting)', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  GENERAL: { label: 'Chung (General)', badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
};

export default function NotesPage() {
  return (
    <AppLayout>
      <KnowledgeNavTabs />
      <NotesContent />
    </AppLayout>
  );
}

function NotesContent() {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<NoteDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  // Modal Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteDto | null>(null);
  const [modalMode, setModalMode] = useState<'edit' | 'preview'>('edit');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<NoteType>(NoteType.TECHNICAL);
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formTags, setFormTags] = useState<string>('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedCategory !== 'ALL') params.append('type', selectedCategory);
      if (selectedProject !== 'ALL') params.append('project_id', selectedProject);
      if (selectedTag !== 'ALL') params.append('tag', selectedTag);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const [resNotes, resProjects] = await Promise.all([
        apiClient<NoteDto[]>(`/notes${qs}`),
        projects.length === 0 ? apiClient<ProjectDto[]>('/projects') : Promise.resolve({ data: projects }),
      ]);

      setNotes(resNotes.data);
      if (projects.length === 0) setProjects(resProjects.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách ghi chú');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedProject, selectedTag, projects]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchNotes();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchNotes]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => {
      n.tags?.forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  const openCreateModal = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormType(NoteType.TECHNICAL);
    setFormProjectId('');
    setFormTags('');
    setFormIsPinned(false);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openEditModal = (note: NoteDto) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormType(note.type);
    setFormProjectId(note.project_id ?? '');
    setFormTags(note.tags ? note.tags.join(', ') : '');
    setFormIsPinned(note.is_pinned);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    try {
      setSaving(true);
      const tagsArray = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingNote) {
        const payload: UpdateNoteInput = {
          title: formTitle.trim(),
          content: formContent.trim(),
          type: formType,
          project_id: formProjectId || null,
          is_pinned: formIsPinned,
          tags: tagsArray,
        };
        await apiClient<NoteDto>(`/notes/${editingNote.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        const payload: CreateNoteInput = {
          title: formTitle.trim(),
          content: formContent.trim(),
          type: formType,
          project_id: formProjectId || undefined,
          is_pinned: formIsPinned,
          tags: tagsArray,
        };
        await apiClient<NoteDto>('/notes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      void fetchNotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi lưu ghi chú');
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (note: NoteDto) => {
    try {
      await apiClient<NoteDto>(`/notes/${note.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_pinned: !note.is_pinned }),
      });
      void fetchNotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi ghim ghi chú');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ghi chú "${title}"?`)) return;
    try {
      await apiClient(`/notes/${id}`, { method: 'DELETE' });
      void fetchNotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi xóa ghi chú');
    }
  };

  // Group notes: pinned vs regular
  const pinnedNotes = useMemo(() => notes.filter((n) => n.is_pinned), [notes]);
  const regularNotes = useMemo(() => notes.filter((n) => !n.is_pinned), [notes]);

  return (
    <div className="space-y-6">
      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, nội dung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">Mọi danh mục</option>
            {Object.entries(CATEGORY_MAP).map(([val, conf]) => (
              <option key={val} value={val}>
                {conf.label}
              </option>
            ))}
          </select>

          {/* Project Dropdown */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">Mọi dự án</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>

          {/* Tag Dropdown */}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">Mọi nhãn (Tags)</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          )}

          {(search || selectedCategory !== 'ALL' || selectedProject !== 'ALL' || selectedTag !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
                setSelectedProject('ALL');
                setSelectedTag('ALL');
              }}
              className="text-[11px] text-slate-400 hover:text-indigo-400 transition underline underline-offset-4"
            >
              Đặt lại
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchNotes()}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            title="Làm mới"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Ghi chú mới</span>
          </button>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-900 rounded-xl text-red-300 text-xs">
          Lỗi: {error}
        </div>
      )}

      {/* PINNED NOTES SECTION */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ghi chú quan trọng đã ghim ({pinnedNotes.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => openEditModal(note)}
                onDelete={() => handleDelete(note.id, note.title)}
                onTogglePin={() => togglePin(note)}
              />
            ))}
          </div>
        </div>
      )}

      {/* REGULAR NOTES SECTION */}
      <div className="space-y-3">
        {pinnedNotes.length > 0 && regularNotes.length > 0 && (
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tất cả ghi chú ({regularNotes.length})
          </div>
        )}

        {loading && notes.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">{t('common.loading')}</div>
        ) : notes.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <div className="text-sm font-semibold text-slate-300">Chưa có ghi chú nào</div>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Tạo ghi chú kỹ thuật, lưu lại tài liệu kiến trúc hoặc ý tưởng quan trọng của bạn.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tạo ghi chú đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {regularNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => openEditModal(note)}
                onDelete={() => handleDelete(note.id, note.title)}
                onTogglePin={() => togglePin(note)}
              />
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL WITH MARKDOWN PREVIEW */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <span>{editingNote ? 'Chỉnh sửa ghi chú' : 'Tạo ghi chú mới'}</span>
              </h2>
              <div className="flex items-center gap-2">
                {/* Switch Edit / Preview */}
                <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setModalMode('edit')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                      modalMode === 'edit'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code className="h-3.5 w-3.5" />
                    <span>Soạn thảo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode('preview')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                      modalMode === 'preview'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Xem trước (Markdown)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveNote} className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalMode === 'edit' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tiêu đề ghi chú <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Tài liệu chuẩn hóa kiến trúc Microservices & Event-driven"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Danh mục</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as NoteType)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      >
                        {Object.entries(CATEGORY_MAP).map(([val, conf]) => (
                          <option key={val} value={val}>
                            {conf.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Project */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Liên kết dự án</label>
                      <select
                        value={formProjectId}
                        onChange={(e) => setFormProjectId(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Không liên kết --</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Pinned */}
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="is_pinned_checkbox"
                        checked={formIsPinned}
                        onChange={(e) => setFormIsPinned(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="is_pinned_checkbox" className="text-xs font-semibold text-slate-300 cursor-pointer">
                        Ghim ghi chú lên đầu
                      </label>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nhãn (Tags) <span className="text-[10px] text-slate-500 font-normal">(cách nhau bằng dấu phẩy)</span>
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="architecture, backend, nestjs, postgres"
                        value={formTags}
                        onChange={(e) => setFormTags(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Content (Markdown) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Nội dung chi tiết (Hỗ trợ Markdown) <span className="text-red-400">*</span>
                      </label>
                      <span className="text-[10px] text-slate-500">Hỗ trợ # H1, ## H2, - List, ``` Code, &gt; Quote</span>
                    </div>
                    <textarea
                      required
                      rows={12}
                      placeholder="Viết nội dung ở đây bằng cú pháp Markdown..."
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                </>
              ) : (
                /* MARKDOWN PREVIEW MODE */
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-bold text-white">{formTitle || 'Chưa có tiêu đề'}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          CATEGORY_MAP[formType]?.badge
                        }`}
                      >
                        {CATEGORY_MAP[formType]?.label}
                      </span>
                      {formProjectId && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">
                          <FolderKanban className="h-3 w-3" />
                          <span>{projects.find((p) => p.id === formProjectId)?.code}</span>
                        </span>
                      )}
                      {formTags
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full border border-indigo-900/60 bg-indigo-950/60 px-2 py-0.5 text-[10px] text-indigo-400"
                          >
                            #{tag}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="min-h-[280px] rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <MarkdownRenderer content={formContent} />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  {saving ? 'Đang lưu...' : editingNote ? 'Cập nhật ghi chú' : 'Tạo ghi chú'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  note: NoteDto;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const categoryConfig = CATEGORY_MAP[note.type] ?? CATEGORY_MAP.GENERAL;
  const formattedDate = new Date(note.updated_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div
      className={`group flex flex-col justify-between rounded-xl border p-4.5 shadow-sm transition hover:shadow-indigo-500/5 ${
        note.is_pinned
          ? 'border-amber-500/40 bg-gradient-to-b from-slate-900 to-amber-950/10'
          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
      }`}
    >
      <div className="space-y-2.5">
        {/* Top Badges & Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${categoryConfig.badge}`}
            >
              {categoryConfig.label.split(' ')[0]}
            </span>
            {note.project && (
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                <FolderKanban className="h-3 w-3 text-slate-400" />
                <span>{note.project.code}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
            <button
              type="button"
              onClick={onTogglePin}
              className={`p-1 rounded hover:bg-slate-800 transition ${
                note.is_pinned ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title={note.is_pinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
            >
              {note.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
              title="Chỉnh sửa"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              title="Xóa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={onEdit}
          className="text-sm font-bold text-white hover:text-indigo-300 cursor-pointer transition line-clamp-2"
        >
          {note.title}
        </h3>

        {/* Content Snippet */}
        <p
          onClick={onEdit}
          className="text-xs text-slate-400 line-clamp-4 cursor-pointer whitespace-pre-line leading-relaxed font-sans"
        >
          {note.content}
        </p>
      </div>

      {/* Footer Tags & Date */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 max-w-[70%]">
          {note.tags && note.tags.length > 0 ? (
            note.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono"
              >
                #{t}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-600 italic">Không có tag</span>
          )}
          {note.tags && note.tags.length > 3 && (
            <span className="text-[10px] text-slate-500">+{note.tags.length - 3}</span>
          )}
        </div>

        <span className="text-[10px] text-slate-500">{formattedDate}</span>
      </div>
    </div>
  );
}

/**
 * Lightweight, zero-dependency Markdown renderer for safe rendering of headings, code, lists, and bold text.
 */
function MarkdownRenderer({ content }: { content: string }) {
  if (!content.trim()) {
    return <div className="text-xs text-slate-500 italic">Chưa có nội dung để xem trước...</div>;
  }

  const lines = content.split('\n');
  return (
    <div className="space-y-2 text-xs text-slate-200 leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Heading 1 (# ...)
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-base font-bold text-white pt-2 border-b border-slate-800 pb-1">
              {trimmed.slice(2)}
            </h1>
          );
        }
        // Heading 2 (## ...)
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-sm font-bold text-indigo-300 pt-2">
              {trimmed.slice(3)}
            </h2>
          );
        }
        // Heading 3 (### ...)
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-xs font-bold text-indigo-400 pt-1">
              {trimmed.slice(4)}
            </h3>
          );
        }
        // Blockquote (> ...)
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={idx}
              className="border-l-2 border-indigo-500 bg-indigo-950/20 pl-3 py-1 my-1 italic text-slate-300 rounded-r"
            >
              {trimmed.slice(2)}
            </blockquote>
          );
        }
        // Unordered list (- ... or * ...)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <li key={idx} className="list-disc ml-5 text-slate-300">
              {renderFormattedText(trimmed.slice(2))}
            </li>
          );
        }
        // Code line / code block simulation
        if (trimmed.startsWith('```')) {
          return (
            <div key={idx} className="font-mono text-[11px] text-slate-500">
              {trimmed}
            </div>
          );
        }
        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Regular paragraph with bold / code
        return <p key={idx}>{renderFormattedText(line)}</p>;
      })}
    </div>
  );
}

function renderFormattedText(text: string) {
  // Simple bold and inline code parser: **bold** and `code`
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[11px] text-indigo-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
