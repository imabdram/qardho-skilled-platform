import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WorkerCard from '../components/WorkerCard';
import { User, Review } from '../types';
import { Search, MapPin, SlidersHorizontal, Users, Sparkles } from 'lucide-react';
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
  const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem('workersFilter.location') || 'All');
  const [selectedSkill, setSelectedSkill] = useState(() => localStorage.getItem('workersFilter.skill') || 'All');
  const [selectedAvailability, setSelectedAvailability] = useState(() => localStorage.getItem('workersFilter.availability') || 'All');

  useEffect(() => { localStorage.setItem('workersFilter.search', searchQuery); }, [searchQuery]);
  useEffect(() => { localStorage.setItem('workersFilter.location', selectedLocation); }, [selectedLocation]);
  useEffect(() => { localStorage.setItem('workersFilter.skill', selectedSkill); }, [selectedSkill]);
  useEffect(() => { localStorage.setItem('workersFilter.availability', selectedAvailability); }, [selectedAvailability]);

  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch = worker.name.toLowerCase().includes(searchQuery.toLowerCase()) || (worker.skill || '').toLowerCase().includes(searchQuery.toLowerCase()) || (worker.bio || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (selectedLocation === 'All' || worker.location === selectedLocation) && (selectedSkill === 'All' || worker.skill === selectedSkill) && (selectedAvailability === 'All' || (worker.availability || 'available') === selectedAvailability);
  });

  const uniqueSkills = ['All', ...Array.from(new Set(workers.map(w => w.skill).filter(Boolean)))];
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('All');
    setSelectedSkill('All');
    setSelectedAvailability('All');
    ['workersFilter.search', 'workersFilter.location', 'workersFilter.skill', 'workersFilter.availability'].forEach((key) => localStorage.removeItem(key));
  };

  const WorkerSkeleton = () => (
    <div className="animate-pulse rounded-xl border border-slate-100 bg-white p-5">
      <div className="flex gap-4"><div className="h-12 w-12 rounded-xl bg-slate-100" /><div className="flex-1"><div className="h-4 w-2/3 rounded bg-slate-100" /><div className="mt-2 h-4 w-1/2 rounded bg-slate-100" /></div></div>
      <div className="mt-5 h-20 rounded bg-slate-100" />
      <div className="mt-5 h-10 rounded bg-slate-100" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="workers-page-container">
      <div className="mb-8 border-b border-slate-100 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1"><Users className="h-4 w-4" /><span>Karkaar Region Talent Directory</span></div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Find Skilled Workers</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">Hire local experts directly. Filters are remembered while you move around the app.</p>
        </div>
        {!currentUser && <div className="w-full rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-md shadow-blue-950/5 md:max-w-md"><div className="flex items-start gap-3"><span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100"><Sparkles className="h-5 w-5" /></span><div><h2 className="text-base font-black text-slate-950">Show Your Skills and Find Work</h2><p className="mt-1 text-sm font-medium leading-6 text-slate-600">Create an account, add your skills, and let local employers find you.</p><Link to={PAGE_ROUTES.register} className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700">Join as a Worker</Link></div></div></div>}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-4 mb-8 shadow-xs" id="search-filter-box">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by worker name, trade skill or bio..." className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white" /></div>
          <div className="md:col-span-2 relative"><MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white"><option value="All">All Neighborhoods</option>{QARDHO_NEIGHBORHOODS.map((loc) => <option key={loc} value={loc}>Qardho - {loc}</option>)}</select></div>
          <div className="md:col-span-3 relative"><SlidersHorizontal className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><select value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white"><option value="All">All Trade Skills</option>{uniqueSkills.filter(s => s !== 'All').map((skill) => <option key={skill} value={skill}>{skill}</option>)}</select></div>
          <div className="md:col-span-3 relative"><select value={selectedAvailability} onChange={(e) => setSelectedAvailability(e.target.value)} className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white"><option value="All">All Availability</option><option value="available">Available</option><option value="busy">Busy</option><option value="unavailable">Unavailable</option></select></div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-slate-900">Skilled Workers Feed</h2><span className="text-xs text-slate-500 font-mono">Showing {isLoading ? '...' : filteredWorkers.length} results</span></div>
      {isLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, index) => <WorkerSkeleton key={index} />)}</div> : filteredWorkers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="workers-grid">{filteredWorkers.map((worker) => <WorkerCard key={worker.id} worker={worker} onConnect={onConnect} onViewProfile={onViewProfile} isCurrentUser={currentUser?.id === worker.id} reviews={reviews} />)}</div>
      ) : <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl"><p className="text-sm font-semibold text-slate-600">No skilled workers match your criteria.</p><button onClick={clearFilters} className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer">Clear all filters</button></div>}
    </div>
  );
}
