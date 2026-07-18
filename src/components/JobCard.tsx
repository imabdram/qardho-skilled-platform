import React from 'react';
import { MapPin, DollarSign, Calendar, ArrowRight, CheckCircle2, Clock, X } from 'lucide-react';
import { Application, Job, JobStatus } from '../types';

interface JobCardProps {
  key?: string;
  job: Job;
  application?: Application;
  onApply: (job: Job) => void;
  onViewDetails?: (job: Job) => void;
  isOwner: boolean;
}

export default function JobCard({ job, application, onApply, onViewDetails, isOwner }: JobCardProps) {
  const isOpen = job.status === 'open';
  const canApply = isOpen && !application;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  const getJobStatusBadge = (status: JobStatus) => {
    const label = status.replace('_', ' ');
    const styles = {
      open: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
      completed: 'bg-slate-100 text-slate-700 border-slate-200',
      closed: 'bg-rose-50 text-rose-700 border-rose-100',
    }[status];

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${styles}`}>
        {label}
      </span>
    );
  };

  const getApplicationBadge = (status: Application['status']) => {
    const Icon = status === 'accepted' ? CheckCircle2 : status === 'declined' ? X : Clock;
    const styles = {
      pending: 'border-amber-100 bg-amber-50 text-amber-700',
      accepted: 'border-emerald-100 bg-emerald-50 text-emerald-700',
      declined: 'border-rose-100 bg-rose-50 text-rose-700',
    }[status];
    const label = status === 'pending' ? 'Applied: waiting' : `Applied: ${status}`;

    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${styles}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  return (
    <div
      className="bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-200 p-5 flex flex-col justify-between"
      id={`job-card-${job.id}`}
    >
      <div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 leading-snug hover:text-blue-600 transition-colors">
            {job.title}
          </h3>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono mt-1">
            By: {job.employerName}
          </span>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2 mt-3">
          <div className="flex flex-wrap gap-1.5">
            {getJobStatusBadge(job.status)}
            {application && getApplicationBadge(application.status)}
          </div>
          <div className="inline-flex items-center space-x-1 text-slate-400 text-xs font-semibold shrink-0">
            <Calendar className="h-3 w-3" />
            <span className="text-[11px] font-medium">{formatDate(job.createdAt)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-3 pb-3 border-b border-slate-50">
          <div className="flex items-center text-xs text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-md">
            <MapPin className="h-3 w-3 text-slate-400 mr-1 shrink-0" />
            <span>Qardho ({job.location})</span>
          </div>
          <div className="flex items-center text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md">
            <DollarSign className="h-3 w-3 text-emerald-500 mr-1 shrink-0" />
            <span>{job.rate}</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
          {job.description}
        </p>
      </div>

      <div className="mt-6 space-y-2 pt-2">
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(job)}
            className="w-full inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 font-semibold text-xs rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all"
          >
            <span>View Details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
        {isOwner ? (
          <div className="text-center text-xs font-semibold text-blue-600 bg-blue-50/50 py-2.5 rounded-lg border border-blue-100">
            Your Job Listing
          </div>
        ) : (
          <button
            onClick={() => onApply(job)}
            disabled={!canApply}
            className={`w-full inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 font-semibold text-xs rounded-lg shadow-xs transition-all ${
              canApply
                ? 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-md cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            id={`btn-apply-${job.id}`}
          >
            <span>{application ? `Already applied: ${application.status}` : isOpen ? 'Apply Now' : 'Not Accepting Applications'}</span>
            {canApply && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
