import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WorkerCard from '../components/WorkerCard';
import { User, Review } from '../types';
import { Search, MapPin, Users, Sparkles } from 'lucide-react';
import { QARDHO_NEIGHBORHOODS } from '../constants';
import { PAGE_ROUTES } from '../routes';

interface WorkersProps {
  workers: User[];
  currentUser: User | null;
  onConnect: (worker: User) => void;
  onNavigate: (page: string) => void;
  reviews: Review[];
  onViewProfile?: (worker: User) => void;
  isLoading?: boolean;
}

export default function Workers({ workers, currentUser, onConnect, reviews, onViewProfile, isLoading = false }: WorkersProps) {
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('workersFilter.search') || '');
  const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem('workersFilter.location') || '');
  useEffect(() => { localStorage.setItem('workersFilter.search', searchQuery); }, [searchQuery]);
  useEffect(() => { localStorage.setItem('workersFilter.location', selectedLocation); }, [selectedLocation]);

  const query = searchQuery.trim().toLowerCase();
  const filteredWorkers = workers.filter((worker) => {
    const haystack = [worker.name, worker.skill, worker.bio, worker.location].filter(Boolean).join(' ').toLowerCase();
    return (!query || haystack.includes(query)) && (!selectedLocation || worker.location === selectedLocation);
  });
  const clearSearch = () => { setSearchQuery(''); setSelectedLocation(''); };

  const WorkerSkeleton = () => (
    <div className="animate-pulse rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm">
      <div className="flex gap-4"><div className="h-14 w-14 rounded-2xl bg-slate-100" /><div className="flex-1"><div className="h-4 w-2/3 rounded bg-slate-100" /><div className="mt-2 h-4 w-1/2 rounded bg-slate-100" /></div></div>
      <div className="mt-5 h-20 rounded bg-slate-100" /><div className="mt-5 h-11 rounded bg-slate-100" />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="workers-page-container">
      <header className="mb-8 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#008060]"><Users className="h-4 w-4" /><span>Local professionals</span></div>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Workers</h1>
        <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-slate-500">Browse skilled workers, review their experience, and open their full profile before hiring.</p>
        {!currentUser && <div className="mt-5 flex max-w-xl items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#008060]" /><div><p className="text-sm font-black text-slate-950">Looking for local work?</p><Link to={PAGE_ROUTES.register} className="mt-1 inline-block text-sm font-black text-[#00715a] hover:underline">Create a worker profile</Link></div></div>}
      </header>

      <section className="mb-8 grid gap-3 rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm md:grid-cols-[1fr_18rem]" aria-label="Worker search">
        <label className="relative"><span className="sr-only">Search workers</span><Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search name, skill, profession, or description" className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#008060] focus:bg-white focus:ring-4 focus:ring-emerald-500/10" /></label>
        <label className="relative"><span className="sr-only">Location</span><MapPin className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><select value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#008060] focus:bg-white focus:ring-4 focus:ring-emerald-500/10"><option value="">Every neighborhood</option>{QARDHO_NEIGHBORHOODS.map((location) => <option key={location} value={location}>{location}</option>)}</select></label>
      </section>

      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-base font-black text-slate-900">Worker listings</h2><span className="text-xs font-semibold text-slate-500">{isLoading ? 'Loading...' : `${filteredWorkers.length} shown`}</span></div>
      {isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <WorkerSkeleton key={index} />)}</div> : filteredWorkers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" id="workers-grid">{filteredWorkers.map((worker) => <WorkerCard key={worker.id} worker={worker} onConnect={onConnect} onViewProfile={onViewProfile} isCurrentUser={currentUser?.id === worker.id} reviews={reviews} />)}</div>
      ) : <div className="rounded-2xl border border-emerald-950/10 bg-white py-16 text-center"><p className="font-bold text-slate-700">No workers match this search.</p><button onClick={clearSearch} className="mt-3 min-h-11 rounded-full px-4 text-sm font-black text-[#00715a] hover:bg-emerald-50">Clear search</button></div>}
    </div>
  );
}
