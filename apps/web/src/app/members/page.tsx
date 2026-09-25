'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MemberDto, CreateMemberInput, UpdateMemberInput } from '@leaderos/shared-types';
import { AppLayout } from '@/components/layout/app-layout';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { apiClient } from '@/lib/api-client';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';

export default function MembersPage() {
  return (
    <AppLayout>
      <MembersContent />
    </AppLayout>
  );
}

interface MemberFormData {
  name: string;
  nickname: string;
  role: string;
  level: string;
  email: string;
  phone: string;
  active: boolean;
  notes: string;
}

const initialFormData: MemberFormData = {
  name: '',
  nickname: '',
  role: '',
  level: '',
  email: '',
  phone: '',
  active: true,
  notes: '',
};

function MembersContent() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<MemberDto | null>(null);
  const [formData, setFormData] = useState<MemberFormData>(initialFormData);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<MemberDto[]>('/members');
      setMembers(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('members.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  // Open modal for creating new member
  const handleOpenCreate = () => {
    setEditingMember(null);
    setFormData(initialFormData);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing member
  const handleOpenEdit = (member: MemberDto) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      nickname: member.nickname ?? '',
      role: member.role,
      level: member.level ?? '',
      email: member.email ?? '',
      phone: member.phone ?? '',
      active: member.active,
      notes: member.notes ?? '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit form (create or edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role.trim()) {
      setFormError(t('members.validationError'));
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (editingMember) {
        const updatePayload: UpdateMemberInput = {
          name: formData.name.trim(),
          nickname: formData.nickname.trim() || undefined,
          role: formData.role.trim(),
          level: formData.level.trim() || undefined,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          active: formData.active,
          notes: formData.notes.trim() || undefined,
        };
        await apiClient<MemberDto>(`/members/${editingMember.id}`, {
          method: 'PATCH',
          body: JSON.stringify(updatePayload),
        });
      } else {
        const createPayload: CreateMemberInput = {
          name: formData.name.trim(),
          nickname: formData.nickname.trim() || undefined,
          role: formData.role.trim(),
          level: formData.level.trim() || undefined,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          active: formData.active,
          notes: formData.notes.trim() || undefined,
        };
        await apiClient<MemberDto>('/members', {
          method: 'POST',
          body: JSON.stringify(createPayload),
        });
      }

      setIsModalOpen(false);
      await fetchMembers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('common.genericError'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle active status directly
  const handleToggleActive = async (member: MemberDto) => {
    try {
      await apiClient<MemberDto>(`/members/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !member.active }),
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, active: !m.active } : m)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : t('members.toggleStatusError'));
    }
  };

  // Delete member
  const handleDelete = async (id: string) => {
    if (!confirm(t('members.deleteConfirm'))) {
      return;
    }
    try {
      setDeletingId(id);
      await apiClient(`/members/${id}`, { method: 'DELETE' });
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : t('members.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Status filter
      if (statusFilter === 'active' && !m.active) return false;
      if (statusFilter === 'inactive' && m.active) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = m.name.toLowerCase().includes(query);
        const matchNickname = m.nickname?.toLowerCase().includes(query);
        const matchRole = m.role.toLowerCase().includes(query);
        const matchEmail = m.email?.toLowerCase().includes(query);
        const matchPhone = m.phone?.toLowerCase().includes(query);
        return matchName || matchNickname || matchRole || matchEmail || matchPhone;
      }
      return true;
    });
  }, [members, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-6 w-6 text-indigo-400" />
            <span>{t('members.title')}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t('members.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <UserPlus className="h-4 w-4" />
          <span>{t('members.createMember')}</span>
        </button>
      </div>

      {/* Info notice: Member != User */}
      <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3.5 text-xs text-slate-400">
        <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">{t('members.singleUserRuleLabel')}</span>{' '}
          {t('members.singleUserRuleDesc')}
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder={t('members.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-4 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">{t('common.status')}:</span>
          <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-md px-2.5 py-1 transition ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('common.all')} ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`rounded-md px-2.5 py-1 transition ${
                statusFilter === 'active'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('members.statusActive')} ({members.filter((m) => m.active).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`rounded-md px-2.5 py-1 transition ${
                statusFilter === 'inactive'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('members.statusInactive')} ({members.filter((m) => !m.active).length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table / Empty / Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-6 text-center text-red-300">
          <p className="font-semibold">{t('common.error')}</p>
          <p className="text-sm mt-1 text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => void fetchMembers()}
            className="mt-4 px-4 py-1.5 text-xs bg-danger text-white rounded-lg transition hover:opacity-90"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-3 text-base font-semibold text-slate-300">{t('members.noMembersFound')}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchQuery || statusFilter !== 'all'
              ? t('members.noFilterResult')
              : t('members.emptyStateHint')}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>{t('members.createMember')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-950/70 text-xs font-semibold uppercase text-slate-400 tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3.5">{t('members.memberName')}</th>
                <th scope="col" className="px-5 py-3.5">{t('members.role')} & {t('members.level')}</th>
                <th scope="col" className="px-5 py-3.5">{t('members.contact')}</th>
                <th scope="col" className="px-5 py-3.5">{t('common.status')}</th>
                <th scope="col" className="px-5 py-3.5">{t('common.notes')}</th>
                <th scope="col" className="px-5 py-3.5 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-800/40 transition">
                  {/* Name & Initials */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 font-bold text-white text-sm shadow-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {member.name}
                          {member.nickname ? (
                            <span className="ml-1.5 text-xs font-normal text-slate-400">
                              ({member.nickname})
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {t('members.joinedAt', { date: member.created_at.split('T')[0] ?? '' })}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role & Level */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-200">{member.role}</div>
                    {member.level ? (
                      <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {member.level}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </td>

                  {/* Contact */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="space-y-1 text-xs">
                      {member.email ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="h-3.5 w-3.5 text-slate-500" />
                          <span>{member.email}</span>
                        </div>
                      ) : null}
                      {member.phone ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Phone className="h-3.5 w-3.5 text-slate-500" />
                          <span>{member.phone}</span>
                        </div>
                      ) : null}
                      {!member.email && !member.phone && (
                        <span className="text-slate-500">—</span>
                      )}
                    </div>
                  </td>

                  {/* Status & Inline Toggle */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => void handleToggleActive(member)}
                      title={t('members.toggleStatusTitle')}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition ${
                        member.active
                          ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700/60'
                      }`}
                    >
                      {member.active ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{t('members.badgeActive')}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5 text-slate-400" />
                          <span>{t('members.badgeInactive')}</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Notes */}
                  <td className="px-5 py-4 max-w-xs truncate text-xs text-slate-400">
                    {member.notes || '—'}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(member)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                        title={t('members.editTitle')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(member.id)}
                        disabled={deletingId === member.id}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-950/60 hover:text-red-300 transition disabled:opacity-50"
                        title={t('members.deleteTitle')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? t('members.modalEditTitle') : t('members.modalCreateTitle')}
        description={t('members.modalDesc')}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <div className="rounded-lg bg-red-950/50 border border-red-900 p-3 text-xs text-red-300">
              {formError}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t('members.memberName')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={t('members.namePlaceholder')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t('members.nicknameLabel')}</label>
              <input
                type="text"
                placeholder={t('members.nicknamePlaceholder')}
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t('members.roleRequired')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={t('members.rolePlaceholder')}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t('members.level')}</label>
              <input
                type="text"
                placeholder={t('members.levelPlaceholder')}
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t('members.email')}</label>
              <input
                type="email"
                placeholder="member@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t('members.phone')}</label>
              <input
                type="tel"
                placeholder="0912345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="member-active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="member-active" className="text-xs font-medium text-slate-300">
              {t('members.activeCheckboxLabel')}
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">{t('members.notes')}</label>
            <textarea
              rows={3}
              placeholder={t('members.notesPlaceholder')}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

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
              {formSubmitting
                ? t('common.saving')
                : editingMember
                ? t('members.updateMember')
                : t('common.addNew')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
