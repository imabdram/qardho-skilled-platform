import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, MapPin, Search, ShieldAlert } from 'lucide-react';
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

export default function Jobs({ jobs, currentUser, applications, isLoading = false }: JobsProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('jobsFilter.search') || '');
  const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem('jobsFilter.location') || '');

  useEffect(() => { localStorage.setItem('jobsFilter.search', searchQuery); }, [searchQuery]);
  useEffect(() => { localStorage.setItem('jobsFilter.location', selectedLocation); }, [selectedLocation]);

  const visibleJobs = jobs.filter((job) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [job.title, job.description, job.employerName, job.category].some((value) => value?.toLowerCase().includes(query));
    return matchesSearch && (!selectedLocation || job.location === selectedLocation);
  });

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedLocation('');
    localStorage.removeItem('jobsFilter.search');
    localStorage.removeItem('jobsFilter.location');
    localStorage.removeItem('jobsFilter.status');
  };

  const Skeleton = () => <div className="animate-pulse rounded-2xl border border-emerald-950/10 bg-white p-5"><div className="h-5 w-3/4 rounded bg-slate-100" /><div className="mt-3 h-4 w-1/2 rounded bg-slate-100" /><div className="mt-5 h-20 rounded bg-slate-100" /><div className="mt-5 h-11 rounded-full bg-slate-100" /></div>;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="jobs-page-container">
      <header className="mb-8 flex flex-col justify-between gap-5 border-b border-emerald-950/10 pb-7 md:flex-row md:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#008060]"><BriefcaseBusiness className="h-4 w-4" />Local opportunities</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Jobs</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">Browse every job record, open the full details, and review the scope before applying.</p>
        </div>
        {!currentUser && <div className="max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#008060]" /><div><p className="font-black text-slate-900">Hiring in Qardho?</p><p className="mt-1 text-sm text-slate-600">Sign in as an employer to publish a job.</p><Link to={PAGE_ROUTES.auth} className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[#008060] px-4 text-xs font-black text-white">Sign in to post</Link></div></div></div>}
      </header>

      <section className="mb-8 grid gap-3 rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm md:grid-cols-[1fr_18rem]" aria-label="Job search">
        <label className="relative"><span className="sr-only">Search jobs</span><Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search title, category, employer, or description" className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#008060] focus:bg-white focus:ring-4 focus:ring-emerald-500/10" /></label>
        <label className="relative"><span className="sr-only">Location</span><MapPin className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><select value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#008060] focus:bg-white focus:ring-4 focus:ring-emerald-500/10"><option value="">Every neighborhood</option>{QARDHO_NEIGHBORHOODS.map((location) => <option key={location} value={location}>{location}</option>)}</select></label>
      </section>

      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-black text-slate-950">Job listings</h2><span className="text-xs font-bold text-slate-500">{isLoading ? 'Loading...' : `${visibleJobs.length} shown`}</span></div>
      {isLoading ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} />)}</div> : visibleJobs.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" id="jobs-grid">
          {visibleJobs.map((job) => {
            const application = currentUser?.role === 'worker' ? applications.find((item) => item.jobId === job.id && item.applicantId === currentUser.id) : undefined;
            return <JobCard key={job.id} job={job} application={application} onViewDetails={(selected) => navigate(`/jobs/${encodeURIComponent(selected.id)}`)} isOwner={currentUser?.id === job.employerId} />;
          })}
        </div>
      ) : <div className="rounded-2xl border border-emerald-950/10 bg-white py-16 text-center"><p className="font-bold text-slate-700">No jobs match this search.</p><button onClick={clearSearch} className="mt-3 min-h-11 rounded-full px-4 text-sm font-black text-[#00715a] hover:bg-emerald-50">Clear search</button></div>}
    </main>
  );
}
