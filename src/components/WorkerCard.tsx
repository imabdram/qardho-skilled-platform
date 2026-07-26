import React from 'react';
import { DollarSign, Star, ShieldCheck } from 'lucide-react';
import { User as UserType, Review } from '../types';
import Avatar from './Avatar';

interface WorkerCardProps {
  key?: string;
  worker: UserType;
  onConnect?: (worker: UserType) => void;
  onViewProfile?: (worker: UserType) => void;
  isCurrentUser: boolean;
  reviews?: Review[];
}

export default function WorkerCard({ worker, onViewProfile, isCurrentUser, reviews = [] }: WorkerCardProps) {

  // Calculate rating stats
  const workerReviews = reviews.filter(r => r.workerId === worker.id);
  const reviewCount = workerReviews.length;
  const avgRating = reviewCount > 0
    ? (workerReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
    : null;

  return (
    <div 
      className="flex flex-col justify-between rounded-xl border border-emerald-950/10 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#008060]/30 hover:shadow-md"
      id={`worker-card-${worker.id}`}
    >
      <div>
        {/* Card Header Info */}
        <div className="flex items-start space-x-4">
          <Avatar name={worker.name} src={worker.avatarUrl} />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900 truncate">
              {worker.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="inline-flex items-center rounded-md border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-[#005f49]">
                {worker.skill}
              </span>
              {worker.verified && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
              
              {/* Star Rating Badge */}
              <div className="flex items-center space-x-1 text-amber-500 bg-amber-50/70 border border-amber-100/50 px-1.5 py-0.5 rounded-md text-[11px] font-bold">
                <Star className="h-3 w-3 fill-amber-400 stroke-amber-500" />
                <span className="text-amber-800">
                  {avgRating ? `${avgRating} (${reviewCount})` : 'New'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rate and availability details */}
        <div className="mt-4 space-y-2 border-b border-slate-50 pb-4">
          <div className="flex items-center text-xs text-slate-600 font-semibold">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600 mr-1.5 shrink-0" />
            <span className="text-emerald-700">Expects {worker.rate || '$15 / day'}</span>
          </div>
          <div className="flex items-center text-xs text-slate-600 font-semibold">
            <span className={`h-2.5 w-2.5 rounded-full mr-2 ${
              worker.availability === 'busy'
                ? 'bg-amber-500'
                : worker.availability === 'unavailable'
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
            }`} />
            <span className="capitalize">{worker.availability || 'available'}</span>
          </div>
        </div>

        {/* Bio/Summary */}
        <p className="mt-4 text-sm text-slate-600 leading-relaxed line-clamp-3">
          {worker.bio || 'Professional skilled technician ready to assist you. Contact to discuss job details and requirements.'}
        </p>
      </div>

      {/* Action buttons */}
      <div className="mt-5 pt-3 flex flex-col space-y-2">
        {onViewProfile && (
          <button
            onClick={() => onViewProfile(worker)}
            className="w-full inline-flex items-center justify-center space-x-1.5 rounded-full border border-emerald-950/10 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-[#005f49] cursor-pointer"
          >
            <Star className="h-3.5 w-3.5 text-amber-500" />
            <span>View Profile</span>
          </button>
        )}

        {isCurrentUser && (
          <div className="text-center text-xs font-semibold text-slate-400 bg-slate-50 py-2.5 rounded-lg border border-slate-100">
            This is you
          </div>
        )}
      </div>
    </div>
  );
}
