import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import JobCard from '../components/JobCard';
import { User, Job, JobStatus, Application } from '../types';
import { Search, MapPin, Briefcase, ShieldAlert, X, Calendar, DollarSign, Phone, CheckCircle2 } from 'lucide-react';
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

export default function Jobs({ jobs, currentUser, onApply, applications, isLoading = false }: JobsProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('jobsFilter.search') || '');
  const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem('jobsFilter.location') || 'All');
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | 'All'>(() => (localStorage.getItem('jobsFilter.status') as JobStatus | 'All') || 'open');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => { localStorage.setItem('jobsFilter.search', searchQuery); }, [searchQuery]);
  useEffect(() => { localStorage.setItem('jobsFilter.location', selectedLocation); }, [selectedLocation]);
  useEffect(() => { localStorage.setItem('jobsFilter.status', selectedStatus); }, [selectedStatus]);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || job.description.toLowerCase().includes(searchQuery.toLowerCase()) || job.employerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (selectedLocation === 'All' || job.location === selectedLocation) && (selectedStatus === 'All' || job.status === selectedStatus);
  });

  const statusOptions: Array<{ value: JobStatus | 'All'; label: string }> = [
    { value: 'open', label: 'Open Jobs' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'closed', label: 'Closed' },
    { value: 'All', label: 'All Statuses' },
  ];

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('All');
    setSelectedStatus('open');
    ['jobsFilter.search', 'jobsFilter.location', 'jobsFilter.status'].forEach((key) => localStorage.removeItem(key));
  };

  const Skeleton = () => (
    <div className="animate-pulse rounded-xl border border-slate-100 bg-white p-5">
      <div className="h-5 w-3/4 rounded bg-slate-100" />
      <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
      <div className="mt-5 h-20 rounded bg-slate-100" />
      <div className="mt-5 h-10 rounded bg-slate-100" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="jobs-page-container">
      <div className="mb-8 border-b border-slate-100 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1"><Briefcase className="h-4 w-4" /><span>Active Job Opportunities</span></div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Browse Job Postings</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">Explore and apply to local work opportunities in Qardho. Open a job detail to see the full scope, employer, status timeline, and next action.</p>
        </div>
        {!currentUser && (
          <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-md shadow-emerald-950/5 md:max-w-md">
            <div className="flex items-start gap-3"><span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100"><ShieldAlert className="h-5 w-5" /></span><div><h2 className="text-base font-black text-slate-950">Need to Hire a Worker?</h2><p className="mt-1 text-sm font-medium leading-6 text-slate-600">Log in to post a job and find skilled workers in Qardho.</p><Link to={PAGE_ROUTES.auth} className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700">Log In to Post a Job</Link></div></div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-4 mb-8 shadow-xs" id="search-filter-box">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search job title, employer, description..." className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white" /></div>
          <div className="md:col-span-3 relative"><MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white"><option value="All">All Neighborhoods</option>{QARDHO_NEIGHBORHOODS.map((loc) => <option key={loc} value={loc}>Qardho - {loc}</option>)}</select></div>
          <div className="md:col-span-4 relative"><Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as JobStatus | 'All')} className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-slate-900">Job Vacancies in Qardho</h2><span className="text-xs text-slate-500 font-mono">Showing {isLoading ? '...' : filteredJobs.length} listings</span></div>
      {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} />)}</div> : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="jobs-grid">{filteredJobs.map((job) => {
          const application = currentUser?.role === 'worker' ? applications.find((app) => app.jobId === job.id && app.applicantId === currentUser.id) : undefined;
          return <JobCard key={job.id} job={job} application={application} onApply={onApply} onViewDetails={(selected) => navigate('/jobs/' + selected.id)} isOwner={currentUser?.id === job.employerId} />;
        })}</div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl"><p className="text-sm font-semibold text-slate-600">No local job listings match your search.</p><button onClick={clearFilters} className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer">Clear all filters</button></div>
      )}

      {selectedJob && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Job detail</p><h2 className="mt-1 text-lg font-black text-slate-950">{selectedJob.title}</h2><p className="mt-1 text-xs font-semibold text-slate-500">Employer: {selectedJob.employerName}</p></div><button onClick={() => setSelectedJob(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-4 w-4" /></button></div>
            <div className="space-y-5 px-5 py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-xl border border-slate-100 p-3"><MapPin className="h-4 w-4 text-slate-400" /><span className="mt-2 block text-xs font-black text-slate-500">Location</span><span className="text-sm font-bold text-slate-900">{selectedJob.location}</span></div><div className="rounded-xl border border-slate-100 p-3"><DollarSign className="h-4 w-4 text-emerald-600" /><span className="mt-2 block text-xs font-black text-slate-500">Budget</span><span className="text-sm font-bold text-slate-900">{selectedJob.rate}</span></div><div className="rounded-xl border border-slate-100 p-3"><Calendar className="h-4 w-4 text-slate-400" /><span className="mt-2 block text-xs font-black text-slate-500">Status</span><span className="text-sm font-bold capitalize text-slate-900">{selectedJob.status.replace('_', ' ')}</span></div></div>
              <div><h3 className="text-sm font-black text-slate-900">Full Description</h3><p className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{selectedJob.description}</p></div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs font-semibold text-blue-800"><Phone className="mr-1.5 inline h-3.5 w-3.5" />Contact unlocks after accepted application or hire request.</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{['Posted', 'Applied', 'Accepted', selectedJob.status === 'completed' ? 'Completed' : 'In progress'].map((step, index) => <div key={step} className={`rounded-lg border px-2 py-2 text-center text-[10px] font-black uppercase ${index === 0 || selectedJob.status !== 'open' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-400'}`}>{step}</div>)}</div>
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row"><button onClick={() => setSelectedJob(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50">Close</button>{currentUser?.id !== selectedJob.employerId && <button onClick={() => { const job = selectedJob; setSelectedJob(null); onApply(job); }} disabled={selectedJob.status !== 'open'} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"><CheckCircle2 className="h-3.5 w-3.5" />Apply</button>}</div>
          </div>
        </div>
      )}
    </div>
  );
}




