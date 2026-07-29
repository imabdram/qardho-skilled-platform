import React from 'react';
import { Search, Filter, ArrowUpDown, AlertCircle, RefreshCw, Handshake, FileText, Layers } from 'lucide-react';

export type StatusFilterValue = 'all' | 'needs_action' | 'waiting' | 'active' | 'completion_requested' | 'review_pending' | 'completed' | 'closed';
export type SourceFilterValue = 'all' | 'direct_offers' | 'applications';
export type SortOrderValue = 'newest' | 'oldest' | 'urgency';

interface FiltersBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: StatusFilterValue;
  onStatusFilterChange: (status: StatusFilterValue) => void;
  sourceFilter: SourceFilterValue;
  onSourceFilterChange: (source: SourceFilterValue) => void;
  sortOrder: SortOrderValue;
  onSortOrderChange: (sort: SortOrderValue) => void;
  needsActionCount?: number;
  totalCount?: number;
  onResetFilters?: () => void;
}

export default function FiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  sortOrder,
  onSortOrderChange,
  needsActionCount = 0,
  totalCount,
  onResetFilters,
}: FiltersBarProps) {
  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || sourceFilter !== 'all' || sortOrder !== 'newest';

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs sm:p-4 mb-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by job title, employer, location..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>

        {/* Filters & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick "Needs Action" Filter button */}
          {needsActionCount > 0 && (
            <button
              type="button"
              onClick={() => onStatusFilterChange(statusFilter === 'needs_action' ? 'all' : 'needs_action')}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black transition ${
                statusFilter === 'needs_action'
                  ? 'border-amber-400 bg-amber-500 text-white shadow-xs'
                  : 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Needs Action</span>
              <span className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] ${
                statusFilter === 'needs_action' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'
              }`}>
                {needsActionCount}
              </span>
            </button>
          )}

          {/* Source Filter Pill Buttons */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 min-h-[38px]">
            {[
              { value: 'all' as SourceFilterValue, label: 'All Sources', icon: Layers, activeClass: 'bg-white text-slate-900 border-slate-200 shadow-2xs' },
              { value: 'applications' as SourceFilterValue, label: 'Job Application', icon: FileText, activeClass: 'bg-blue-600 text-white border-blue-600 shadow-2xs font-extrabold' },
              { value: 'direct_offers' as SourceFilterValue, label: 'Direct Offer', icon: Handshake, activeClass: 'bg-purple-600 text-white border-purple-600 shadow-2xs font-extrabold' },
            ].map((src) => {
              const Icon = src.icon;
              const isActive = sourceFilter === src.value;
              return (
                <button
                  key={src.value}
                  type="button"
                  onClick={() => onSourceFilterChange(src.value)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] sm:text-xs transition ${
                    isActive ? src.activeClass : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{src.label}</span>
                </button>
              );
            })}
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as StatusFilterValue)}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition cursor-pointer min-h-[38px]"
              aria-label="Filter by Status"
            >
              <option value="all">All Statuses</option>
              <option value="needs_action">Needs Action</option>
              <option value="waiting">Waiting for Response</option>
              <option value="active">Active Work</option>
              <option value="completion_requested">Completion Requested</option>
              <option value="review_pending">Review Pending</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed / Not Selected</option>
            </select>
            <Filter className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => onSortOrderChange(e.target.value as SortOrderValue)}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition cursor-pointer min-h-[38px]"
              aria-label="Sort Order"
            >
              <option value="newest">Newest First</option>
              <option value="urgency">By Urgency</option>
              <option value="oldest">Oldest First</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && onResetFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              title="Reset all filters"
            >
              <RefreshCw className="h-3 w-3 text-slate-500" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
