import React, { useState } from 'react';
import JobCard from '../components/JobCard';
import { User, Job } from '../types';
import { Search, MapPin, Briefcase, Plus, ShieldAlert } from 'lucide-react';

interface JobsProps {
  jobs: Job[];
  currentUser: User | null;
  onApply: (job: Job) => void;
  onNavigate: (page: string) => void;
}

export default function Jobs({ jobs, currentUser, onApply, onNavigate }: JobsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');

  // Filter lists based on inputs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.employerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = selectedLocation === 'All' || job.location === selectedLocation;

    return matchesSearch && matchesLocation;
  });

  const uniqueLocations = ['All', ...Array.from(new Set(jobs.map(j => j.location).filter(Boolean)))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="jobs-page-container">
      
      {/* Page Header */}
      <div className="mb-8 border-b border-slate-100 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Briefcase className="h-4 w-4" />
            <span>Active Job Opportunities</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Browse Job Postings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Explore and apply to local work opportunities. Find building projects, electrical installations, farm help, and teaching opportunities in Qardho.
          </p>
        </div>

        <div>
          {(!currentUser || currentUser.role !== 'employer') && (
            <div className="text-xs text-slate-400 font-medium italic border border-dashed border-slate-200 px-3 py-1.5 rounded-lg flex items-center space-x-1">
              <ShieldAlert className="h-3.5 w-3.5 text-blue-500" />
              <span>Employer? Log in to list jobs</span>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters Segment */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 mb-8 shadow-xs" id="search-filter-box">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Main search input */}
          <div className="md:col-span-8 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search job title, employer description, required skills..."
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Location Dropdown */}
          <div className="md:col-span-4 relative">
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
        </div>
      </div>

      {/* Discovery Feed Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Job Vacancies in Qardho
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Showing {filteredJobs.length} listings
          </span>
        </div>

        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="jobs-grid">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onApply={onApply}
                isOwner={currentUser?.id === job.employerId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
            <p className="text-sm font-semibold text-slate-600">No local job listings match your search.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedLocation('All');
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
