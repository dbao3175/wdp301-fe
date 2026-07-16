import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Eye, Download, Search, Filter, SortAsc, SortDesc, RefreshCw } from 'lucide-react';
import { apiClient } from '../../../api/client.ts';
import type { Proposal, ProposalStatus } from '../types/index.ts';
import { SearchInput, FilterDropdown, DataTable } from '../components/common/DataTable.tsx';
import type { Column } from '../components/common/DataTable.tsx';
import { LoadingState, ErrorState, StatusBadge } from '../components/common/States.tsx';

// =========================================================
// STATUS CONFIG HELPERS
// =========================================================

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'REVISION_REQUESTED', label: 'Revision Requested' },
  { value: 'RESUBMITTED', label: 'Resubmitted' },
  { value: 'APPROVED_BY_TANTOU', label: 'Approved' },
  { value: 'SENT_TO_EDITORIAL_BOARD', label: 'Sent to Board' },
  { value: 'APPROVED', label: 'Board Approved' },
  { value: 'SERIES_CREATED', label: 'Series Created' },
];

const statusVariantMap: Record<ProposalStatus, string> = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  REVISION_REQUESTED: 'revision',
  RESUBMITTED: 'warning',
  APPROVED_BY_TANTOU: 'approved',
  SENT_TO_EDITORIAL_BOARD: 'sent',
  APPROVED: 'approved',
  SERIES_CREATED: 'success',
  REJECTED: 'danger',
};

const statusLabels: Record<ProposalStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  REVISION_REQUESTED: 'Revision Requested',
  RESUBMITTED: 'Resubmitted',
  APPROVED_BY_TANTOU: 'Approved',
  SENT_TO_EDITORIAL_BOARD: 'Sent to Board',
  APPROVED: 'Board Approved',
  SERIES_CREATED: 'Series Created',
  REJECTED: 'Rejected',
};

export const ProposalListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const mapProposal = (p: any) => ({
    id: p._id || p.id,
    title: p.title || '',
    synopsis: p.synopsis || '',
    genre: p.genre || '',
    tags: p.tags || [],
    mangaka: {
      id: p.mangakaId?._id || p.mangaka?.id || '',
      name: p.mangakaId?.name || p.mangaka?.name || 'Unknown',
      avatar: p.mangaka?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
      email: p.mangakaId?.email || p.mangaka?.email || '',
      totalSeries: p.mangaka?.totalSeries || 0,
      joinedDate: p.mangaka?.joinedDate || '',
    },
    submittedDate: p.submittedAt || p.submittedDate || '',
    lastUpdated: p.lastUpdated || p.submittedAt || '',
    status: p.status || '',
    // Backend proposals don't have these rich fields, so provide defaults
    storyDraft: p.storyDraft || { description: p.synopsis || '', samplePages: [] },
    characterDesigns: p.characterDesigns || [],
    reviewComments: p.reviewComments || [],
    assignedEditorId: p.assignedEditorId || '',
    targetAudience: p.targetAudience || '',
    estimatedChapters: p.estimatedChapters || 0,
    scheduledFrequency: p.scheduledFrequency || '',
  });

  const { data: proposals, isLoading, error, refetch } = useQuery({
    queryKey: ['proposals', statusFilter, search],
    queryFn: () =>
      apiClient.proposals.getAll(statusFilter || undefined).then((data: any[]) => {
        let result = (data || []).map(mapProposal);
        if (search) {
          const q = search.toLowerCase();
          result = result.filter(
            (p: any) =>
              (p.title || '').toLowerCase().includes(q) ||
              (p.mangaka?.name || '').toLowerCase().includes(q) ||
              (p.genre || '').toLowerCase().includes(q),
          );
        }
        return result;
      }),
  });

  const sortedProposals = React.useMemo(() => {
    if (!proposals) return [];
    return [...proposals].sort((a, b) => {
      const dA = new Date(a.submittedDate).getTime();
      const dB = new Date(b.submittedDate).getTime();
      return sortOrder === 'desc' ? dB - dA : dA - dB;
    });
  }, [proposals, sortOrder]);

  const columns: Column<Proposal>[] = [
    {
      key: 'title',
      header: 'Proposal',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-1.5 h-10 shrink-0"
            style={{
              backgroundColor:
                row.status === 'SUBMITTED' || row.status === 'UNDER_REVIEW'
                  ? '#F39C12'
                  : row.status === 'REVISION_REQUESTED'
                  ? '#E63946'
                  : '#2ECC71',
            }}
          />
          <div>
            <p className="font-sans font-bold text-xs text-ink-black">{row.title}</p>
            <p className="font-mono text-[9px] text-neutral-400 mt-0.5">{row.genre} · {row.tags.slice(0, 2).join(', ')}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'mangaka',
      header: 'Mangaka',
      render: (row) => (
        <div className="flex items-center gap-2">
          <img
            src={row.mangaka.avatar}
            alt={row.mangaka.name}
            className="w-7 h-7 border border-neutral-200 shrink-0"
          />
          <span className="font-sans text-xs text-ink-black font-medium">{row.mangaka.name}</span>
        </div>
      ),
    },
    {
      key: 'submittedDate',
      header: 'Submitted',
      render: (row) => (
        <span className="font-mono text-[10px] text-neutral-500">
          {new Date(row.submittedDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          label={statusLabels[row.status]}
          variant={statusVariantMap[row.status] as any}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/editor/proposals/${row.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-ink-black text-white text-[9px] font-mono font-extrabold uppercase border-2 border-ink-black hover:bg-neutral-800 transition-colors shadow-[2px_2px_0px_#141414] cursor-pointer"
          >
            <Eye className="w-3 h-3" />
            Review
          </Link>
          <a
            href={`/api/series/proposal/${row.id}/storyboard`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#E63946] text-white text-[9px] font-mono font-extrabold uppercase border-2 border-ink-black hover:bg-red-600 transition-colors shadow-[2px_2px_0px_#141414] cursor-pointer"
          >
            <Download className="w-3 h-3" />
            Download
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-syne font-extrabold text-2xl text-ink-black tracking-tight">
            Proposals
          </h1>
          <p className="font-mono text-xs text-neutral-500 mt-0.5 uppercase tracking-widest">
            Assigned Manga Proposals — Review Queue
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-ink-black text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#141414] hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search proposals..."
          className="flex-1 min-w-48"
        />
        <FilterDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
          label="Status"
        />
        <button
          onClick={() => setSortOrder((s) => (s === 'desc' ? 'asc' : 'desc'))}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-ink-black text-[10px] font-mono font-bold uppercase shadow-[2px_2px_0px_#141414] hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          {sortOrder === 'desc' ? (
            <>
              <SortDesc className="w-3.5 h-3.5" /> Newest
            </>
          ) : (
            <>
              <SortAsc className="w-3.5 h-3.5" /> Oldest
            </>
          )}
        </button>
      </div>

      {/* Stats summary */}
      {proposals && (
        <div className="flex items-center gap-4 text-xs font-mono text-neutral-500">
          <span>
            <strong className="text-ink-black">{proposals.length}</strong> proposals
          </span>
          <span>
            <strong className="text-amber-600">{proposals.filter(p => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length}</strong> need review
          </span>
          <span>
            <strong className="text-orange-600">{proposals.filter(p => p.status === 'REVISION_REQUESTED').length}</strong> revision requested
          </span>
          <span>
            <strong className="text-emerald-600">{proposals.filter(p => p.status === 'APPROVED_BY_TANTOU' || p.status === 'APPROVED').length}</strong> approved
          </span>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <LoadingState message="Loading proposals..." />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <DataTable<Proposal>
          columns={columns}
          data={sortedProposals}
          keyField="id"
          emptyMessage="No proposals found"
        />
      )}
    </div>
  );
};
