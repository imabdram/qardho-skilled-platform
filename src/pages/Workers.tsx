import React, { useState } from 'react';
import WorkerCard from '../components/WorkerCard';
import { User, Review } from '../types';
import { Search, MapPin, SlidersHorizontal, Users, Sparkles } from 'lucide-react';

interface WorkersProps {
  workers: User[];
  currentUser: User | null;
  onConnect: (worker: User) => void;
  onNavigate: (page: string) => void;
  reviews: Review[];
  onViewProfile?: (worker: User) => void;
}

export default function Workers({ workers, currentUser, onConnect, onNavigate, reviews, onViewProfile }: WorkersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState('All');

  // Filter lists based on inputs
  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch = 
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (worker.skill || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (worker.bio || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = selectedLocation === 'All' || worker.location === selectedLocation;
    const matchesSkill = selectedSkill === 'All' || worker.skill === selectedSkill;

    return matchesSearch && matchesLocation && matchesSkill;
  });

  // Get unique skills and locations for dropdown options
  const uniqueSkills = ['All', ...Array.from(new Set(workers.map(w => w.skill).filter(Boolean)))];
  const uniqueLocations = ['All', ...Array.from(new Set(workers.map(w => w.location).filter(Boolean)))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="workers-page-container">
      
      {/* Page Header */}
      <div className="mb-8 border-b border-slate-100 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="h-4 w-4" />
            <span>Karkaar Region Talent Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Find Skilled Workers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Hire local experts directly without intermediary agency fees. Select skills and locate workers by their neighborhood in Qardho.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {!currentUser && (
            <button
              onClick={() => onNavigate('auth')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              <span>List Your Trade Skills</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Segment */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 mb-8 shadow-xs" id="search-filter-box">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Main search input */}
          <div className="md:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by worker name, trade skill or bio..."
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Location Dropdown */}
          <div className="md:col-span-3 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="All">All Neighborhoods</option>
              {uniqueLocations.filter(loc => loc !== 'All').map((loc) => (
                <option key={loc} value={loc}>Qardho - {loc}</option>
              ))}
            </select>
          </div>

          {/* Skill Dropdown */}
          <div className="md:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="All">All Trade Skills</option>
              {uniqueSkills.filter(s => s !== 'All').map((skill) => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Discovery Feed Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Skilled Workers Feed
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Showing {filteredWorkers.length} results
          </span>
        </div>

        {filteredWorkers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="workers-grid">
            {filteredWorkers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onConnect={onConnect}
                onViewProfile={onViewProfile}
                isCurrentUser={currentUser?.id === worker.id}
                reviews={reviews}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
            <p className="text-sm font-semibold text-slate-600">No skilled workers match your criteria.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedLocation('All');
                setSelectedSkill('All');
              }}
              className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
