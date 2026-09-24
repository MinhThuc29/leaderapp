'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProjectProgressSnapshotDto } from '@leaderos/shared-types';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  RefreshCw,
  Clock,
  Activity,
  Sliders,
  AlertCircle,
} from 'lucide-react';

interface ProjectSnapshotsTabProps {
  projectId: string;
}

export function ProjectSnapshotsTab({ projectId }: ProjectSnapshotsTabProps) {
  const { t } = useTranslation();
  const [snapshots, setSnapshots] = useState<ProjectProgressSnapshotDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<ProjectProgressSnapshotDto[]>(
        `/projects/${projectId}/snapshots`,
      );
      setSnapshots(res.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể tải lịch sử tiến độ',
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchSnapshots();
  }, [fetchSnapshots]);

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'AUTO':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-indigo-950/70 border border-indigo-800/80 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
            <Activity className="h-3 w-3" />
            <span>{t('projects.progressAuto')}</span>
          </span>
        );
      case 'MANUAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-300">
            <Sliders className="h-3 w-3" />
            <span>{t('projects.progressManual')}</span>
          </span>
        );
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'GREEN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Khỏe mạnh
          </span>
        );
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Cần theo dõi
          </span>
        );
      case 'RED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
            Nguy cấp
          </span>
        );
      default:
        return null;
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            <span>Lịch sử Snapshot Tiến độ ({snapshots.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ghi nhận các điểm biến thiên tiến độ theo thời gian thực (tự động tính khi hoàn thành task hoặc cập nhật thủ công).
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchSnapshots()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-900/60 p-4 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && snapshots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <div className="h-7 w-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Đang tải lịch sử tiến độ...</p>
        </div>
      ) : snapshots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center">
          <Clock className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Chưa có bản ghi tiến độ nào</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Hệ thống sẽ tự động ghi lại snapshot khi bạn kéo thanh tiến độ hoặc khi hoàn thành các Task trong dự án.
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
          {snapshots.map((snap, idx) => (
            <div key={snap.id} className="relative group">
              {/* Dot marker */}
              <div
                className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 transition ${
                  snap.progress === 100
                    ? 'bg-emerald-500'
                    : snap.progress >= 50
                    ? 'bg-indigo-500'
                    : 'bg-amber-500'
                }`}
              />

              {/* Snapshot Card */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 hover:border-slate-700 transition">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl font-bold text-white">
                      {snap.progress}%
                    </span>
                    {getModeBadge(snap.mode)}
                    {getHealthBadge(snap.health_status)}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{formatDateTime(snap.captured_at)}</span>
                    {idx === 0 && (
                      <span className="ml-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-sans px-1.5 py-0.2 border border-indigo-500/30">
                        Mới nhất
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      snap.progress === 100
                        ? 'bg-emerald-500'
                        : snap.progress >= 75
                        ? 'bg-indigo-500'
                        : snap.progress >= 30
                        ? 'bg-sky-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, snap.progress))}%` }}
                  />
                </div>

                {/* Note */}
                {snap.note && (
                  <p className="text-xs text-slate-300/90 mt-2 bg-slate-950/60 rounded px-2.5 py-1.5 border border-slate-800/80">
                    <span className="text-slate-500 mr-1.5 font-medium">Ghi chú:</span>
                    {snap.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
