import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpDown, Briefcase, MapPin, RefreshCw, Search, ShieldAlert, X } from 'lucide-react';
import JobCard from '../components/JobCard';
import { Application, Job, User } from '../types';
import { QARDHO_NEIGHBORHOODS } from '../constants';
import { PAGE_ROUTES } from '../routes';

interface JobsProps {
  jobs: Job[];
  currentUser: User | null;
  onApply: (job: Job) => void;
  onNavigate: (page: string) => void;
  applications: Application[];
  isLoading?: boolean;
}

export default function Jobs({ jobs = [], currentUser, applications = [], isLoading = false }: JobsProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('jobsFilter.search') || '');
  const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem('jobsFilter.location') || '');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    localStorage.setItem('jobsFilter.search', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('jobsFilter.location', selectedLocation);
  }, [selectedLocation]);

  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [job.title, job.description, job.employerName, job.category]
        .some((val) => val?.toLowerCase().includes(query));
    const matchesLocation = !selectedLocation || job.location === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedLocation('');
    localStorage.removeItem('jobsFilter.search');
    localStorage.removeItem('jobsFilter.location');
  };

  const hasActiveFilters = !!searchQuery.trim() || !!selectedLocation;

  const Skeleton = () => (
    <div className="animate-pulse rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
      <div className="h-5 w-3/4 rounded-lg bg-slate-100" />
      <div className="h-4 w-1/2 rounded-lg bg-slate-100" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-10 rounded-xl bg-slate-100" />
        <div className="h-10 rounded-xl bg-slate-100" />
      </div>
      <div className="h-16 rounded-xl bg-slate-100" />
      <div className="h-11 w-full rounded-xl bg-slate-100" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f1f5f9] pb-16" id="jobs-page-container">
      {/* Centered Container ~1180px */}
      <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        
        {/* Page Heading & Header Banner */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl lg:text-4xl tracking-tight">
              Jobs
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-600">
              Find local work opportunities that match your skills.
            </p>
          </div>

          {!currentUser && (
            <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4 sm:max-w-xs shrink-0">
              <p className="text-xs font-black text-slate-900">Hiring in Qardho?</p>
              <p className="mt-0.5 text-xs text-slate-600">Sign in as an employer to post jobs.</p>
              <button
                onClick={() => navigate(PAGE_ROUTES.auth)}
                className="mt-2 inline-flex min-h-9 items-center justify-center rounded-xl bg-[#073f34] px-4 text-xs font-black text-white hover:bg-[#064e3b] transition"
              >
                Sign in to post
              </button>
            </div>
          )}
        </header>

        {/* Search & Filter Bar */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3 sm:p-5" aria-label="Job search">
          <div className="grid gap-3 sm:grid-cols-12">
            <div className="relative sm:col-span-8">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, category, employer, or description..."
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-xs font-medium text-slate-900 outline-none transition focus:border-[#3b82f6] focus:bg-white focus:ring-4 focus:ring-brand-500/10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="relative sm:col-span-4">
              <MapPin className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-xs font-bold text-slate-900 outline-none transition focus:border-[#3b82f6] focus:bg-white"
              >
                <option value="">Every neighborhood</option>
                {QARDHO_NEIGHBORHOODS.map((loc) => (
                  <option key={loc} value={loc}>
                    Qardho - {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-slate-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedLocation && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                  Location: {selectedLocation}
                  <button onClick={() => setSelectedLocation('')} className="ml-1 hover:text-slate-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearSearch}
                className="text-xs font-bold text-rose-600 hover:underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </section>

        {/* Results Counter & Sort Selector */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Jobs available</h2>
            <p className="text-xs font-medium text-slate-500">
              {isLoading ? 'Loading jobs...' : `${sortedJobs.length} ${sortedJobs.length === 1 ? 'result' : 'results'}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-bold text-slate-400">Sort by:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#3b82f6]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {/* Jobs Grid (3 cols desktop, 2 cols tablet, 1 col mobile) */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} />
            ))}
          </div>
        ) : sortedJobs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" id="jobs-grid">
            {sortedJobs.map((job) => {
              const application = currentUser?.role === 'worker'
                ? applications.find((app) => app.jobId === job.id && app.applicantId === currentUser.id)
                : undefined;

              return (
                <JobCard
                  key={job.id}
                  job={job}
                  application={application}
                  onViewDetails={(selected) => navigate(`/jobs/${encodeURIComponent(selected.id)}`)}
                  isOwner={currentUser?.id === job.employerId}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center sm:p-12 shadow-xs space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">No jobs found</h3>
            <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">
              Try changing your search keywords or clearing location filters to see more opportunities.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearSearch}
                className="mt-2 inline-flex min-h-10 items-center justify-center rounded-xl bg-[#073f34] px-5 text-xs font-black text-white hover:bg-[#064e3b] transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
