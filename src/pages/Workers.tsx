import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignUpButton } from '@clerk/react';
import WorkerCard from '../components/WorkerCard';
import FilterBottomSheet from '../components/FilterBottomSheet';
import { User, Review } from '../types';
import { ArrowUpDown, Filter, MapPin, Search, Users, Wrench, X } from 'lucide-react';
import { QARDHO_NEIGHBORHOODS } from '../constants';
import { PAGE_ROUTES } from '../routes';
import { useLanguage } from '../LanguageContext';

interface WorkersProps {
  workers: User[];
  currentUser: User | null;
  onConnect: (worker: User) => void;
  onNavigate: (page: string) => void;
  reviews: Review[];
  onViewProfile?: (worker: User) => void;
  isLoading?: boolean;
}

export default function Workers({ workers = [], currentUser, onConnect, reviews = [], onViewProfile, isLoading = false }: WorkersProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('workersFilter.search') || '');
  const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem('workersFilter.location') || '');
  const [selectedAvailability, setSelectedAvailability] = useState(() => localStorage.getItem('workersFilter.availability') || '');
  const [sortOrder, setSortOrder] = useState<'newest' | 'rating' | 'name'>('newest');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('workersFilter.search', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('workersFilter.location', selectedLocation);
  }, [selectedLocation]);

  useEffect(() => {
    localStorage.setItem('workersFilter.availability', selectedAvailability);
  }, [selectedAvailability]);

  const filteredWorkers = workers.filter((worker) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [worker.name, worker.skill, worker.bio, worker.location]
        .some((val) => val?.toLowerCase().includes(query));
    const matchesLocation = !selectedLocation || worker.location === selectedLocation;
    const matchesAvailability = !selectedAvailability || worker.availability === selectedAvailability;
    return matchesSearch && matchesLocation && matchesAvailability;
  });

  const getWorkerRating = (workerId: string) => {
    const workerReviews = reviews.filter((r) => r.workerId === workerId);
    if (workerReviews.length === 0) return 0;
    return workerReviews.reduce((sum, r) => sum + r.rating, 0) / workerReviews.length;
  };

  const sortedWorkers = [...filteredWorkers].sort((a, b) => {
    if (sortOrder === 'newest') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }
    if (sortOrder === 'rating') {
      const ratingA = getWorkerRating(a.id);
      const ratingB = getWorkerRating(b.id);
      return ratingB - ratingA;
    }
    if (sortOrder === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    return 0;
  });

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedAvailability('');
    localStorage.removeItem('workersFilter.search');
    localStorage.removeItem('workersFilter.location');
    localStorage.removeItem('workersFilter.availability');
  };

  const activeFilterCount = (selectedLocation ? 1 : 0) + (selectedAvailability ? 1 : 0);
  const hasActiveFilters = !!searchQuery.trim() || activeFilterCount > 0;

  const WorkerSkeleton = () => (
    <div className="animate-pulse rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded-lg bg-slate-100" />
          <div className="h-4 w-1/2 rounded-lg bg-slate-100" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <div className="h-10 rounded-xl bg-slate-100" />
        <div className="h-10 rounded-xl bg-slate-100" />
      </div>
      <div className="h-16 rounded-xl bg-slate-100" />
      <div className="h-11 w-full rounded-xl bg-slate-100" />
    </div>
  );

  return (
    <main
      className={`min-h-screen bg-[#f1f5f9] ${currentUser ? 'pb-[calc(90px+env(safe-area-inset-bottom))]' : 'pb-16'}`}
      id="workers-page-container"
    >
      {/* Centered Container ~1180px */}
      <div className="mx-auto max-w-[1180px] px-3.5 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 min-w-0">
        
        {/* Page Heading & Header Banner */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {t('nav_workers')}
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600">
              Browse skilled professionals, review experience, and hire top talent in Qardho.
            </p>
          </div>

          {!currentUser ? (
            <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3.5 sm:max-w-xs shrink-0">
              <p className="text-xs font-black text-slate-900">Looking for work in Qardho?</p>
              <p className="mt-0.5 text-xs text-slate-600">Create a worker profile to showcase your skills.</p>
              <SignUpButton mode="modal">
                <button
                  className="mt-2 inline-flex min-h-[38px] w-full sm:w-auto items-center justify-center rounded-xl bg-[#2563eb] px-4 text-xs font-black text-white hover:bg-[#1d4ed8] transition"
                >
                  Create a profile
                </button>
              </SignUpButton>
            </div>
          ) : currentUser.role === 'employer' ? (
            <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3.5 sm:max-w-xs shrink-0">
              <p className="text-xs font-black text-slate-900">Need work done?</p>
              <p className="mt-0.5 text-xs text-slate-600">Post a job to get proposals from skilled workers.</p>
              <button
                onClick={() => navigate(PAGE_ROUTES['post-job'])}
                className="mt-2 inline-flex min-h-[38px] w-full sm:w-auto items-center justify-center rounded-xl bg-[#2563eb] px-4 text-xs font-black text-white hover:bg-[#1d4ed8] transition"
              >
                {t('hero_post_job')}
              </button>
            </div>
          ) : null}
        </header>

        {/* Search & Filter Controls */}
        <section className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs space-y-3 min-w-0" aria-label="Worker search">
          <div className="space-y-3">
            {/* Full-width Search Input */}
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_workers_placeholder')}
                className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-9 text-xs font-medium text-slate-900 outline-none transition focus:border-[#3b82f6] focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Desktop Filters Row */}
            <div className="hidden sm:grid sm:grid-cols-2 gap-3">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none transition focus:border-[#3b82f6] focus:bg-white"
                >
                  <option value="">Every neighborhood</option>
                  {QARDHO_NEIGHBORHOODS.map((loc) => (
                    <option key={loc} value={loc}>
                      Qardho - {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Wrench className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  value={selectedAvailability}
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none transition focus:border-[#3b82f6] focus:bg-white"
                >
                  <option value="">Any availability</option>
                  <option value="available">Available now</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>

            {/* Mobile Filter Button & Mobile Sort Row */}
            <div className="flex items-center gap-2 sm:hidden">
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(true)}
                className={`flex-1 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black transition ${
                  activeFilterCount > 0
                    ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-[#2563eb] px-1.5 py-0.5 text-[10px] font-black text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="relative flex-1">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'newest' | 'rating' | 'name')}
                  className="min-h-[44px] w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-8 text-xs font-bold text-slate-700 outline-none focus:border-[#3b82f6]"
                >
                  <option value="newest">Newest first</option>
                  <option value="rating">Highest rated</option>
                  <option value="name">Name (A-Z)</option>
                </select>
                <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400">Active:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="ml-0.5 hover:text-slate-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedLocation && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                  {selectedLocation}
                  <button onClick={() => setSelectedLocation('')} className="ml-0.5 hover:text-slate-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedAvailability && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                  {selectedAvailability}
                  <button onClick={() => setSelectedAvailability('')} className="ml-0.5 hover:text-slate-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearSearch}
                className="text-xs font-bold text-rose-600 hover:underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </section>

        {/* Results Counter & Desktop Sort Selector */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">Workers available</h2>
            <p className="text-xs font-medium text-slate-500">
              {isLoading ? 'Loading workers...' : `${sortedWorkers.length} ${sortedWorkers.length === 1 ? 'result' : 'results'}`}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Sort by:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'rating' | 'name')}
              className="min-h-[40px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#3b82f6]"
            >
              <option value="newest">Newest first</option>
              <option value="rating">Highest rated</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Workers Grid (1 col mobile, 2 col tablet, 3 col desktop) */}
        {isLoading ? (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <WorkerSkeleton key={idx} />
            ))}
          </div>
        ) : sortedWorkers.length > 0 ? (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3" id="workers-grid">
            {sortedWorkers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                currentUser={currentUser}
                onConnect={onConnect}
                onViewProfile={onViewProfile}
                isCurrentUser={currentUser?.id === worker.id}
                reviews={reviews}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-12 text-center shadow-xs space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">No workers found</h3>
            <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">
              Try changing your search keywords or clearing location filters to find available workers.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearSearch}
                className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#2563eb] px-5 text-xs font-black text-white hover:bg-[#1d4ed8] transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet for Mobile */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filter Workers"
        activeFilterCount={activeFilterCount}
        onReset={() => {
          setSelectedLocation('');
          setSelectedAvailability('');
        }}
        onApply={() => setIsFilterSheetOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-900 mb-1.5 uppercase tracking-wider">
              Neighborhood
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none"
            >
              <option value="">Every neighborhood</option>
              {QARDHO_NEIGHBORHOODS.map((loc) => (
                <option key={loc} value={loc}>
                  Qardho - {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-900 mb-1.5 uppercase tracking-wider">
              Availability
            </label>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none"
            >
              <option value="">Any availability</option>
              <option value="available">Available now</option>
              <option value="busy">Busy</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>
      </FilterBottomSheet>
    </main>
  );
}
