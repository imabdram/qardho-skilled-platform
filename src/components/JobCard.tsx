import React from 'react';
import { Briefcase, MapPin, DollarSign, Calendar, Phone, ArrowRight } from 'lucide-react';
import { Job } from '../types';

interface JobCardProps {
  key?: string;
  job: Job;
  onApply: (job: Job) => void;
  isOwner: boolean;
}

export default function JobCard({ job, onApply, isOwner }: JobCardProps) {
  // Format Date simply
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div 
      className="bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-200 p-5 flex flex-col justify-between"
      id={`job-card-${job.id}`}
    >
      <div>
        {/* Header Metadata */}
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Posted by {job.employerName}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1 hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
          </div>
          <div className="inline-flex items-center space-x-1 text-slate-400 shrink-0 text-xs font-semibold">
            <Calendar className="h-3 w-3" />
            <span className="text-[11px] font-medium">{formatDate(job.createdAt)}</span>
          </div>
        </div>

        {/* Info Tags */}
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

        {/* Job Description */}
        <p className="mt-4 text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
          {job.description}
        </p>
      </div>

      {/* Apply Action Buttons */}
      <div className="mt-6 pt-2">
        {isOwner ? (
          <div className="text-center text-xs font-semibold text-blue-600 bg-blue-50/50 py-2.5 rounded-lg border border-blue-100">
            Your Job Listing
          </div>
        ) : (
          <button
            onClick={() => onApply(job)}
            className="w-full inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer"
            id={`btn-apply-${job.id}`}
          >
            <span>Apply Now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
