import React from 'react';
import { User, MapPin, DollarSign, Send, Phone, Star } from 'lucide-react';
import { User as UserType, Review } from '../types';

interface WorkerCardProps {
  key?: string;
  worker: UserType;
  onConnect: (worker: UserType) => void;
  onViewProfile?: (worker: UserType) => void;
  isCurrentUser: boolean;
  reviews?: Review[];
}

export default function WorkerCard({ worker, onConnect, onViewProfile, isCurrentUser, reviews = [] }: WorkerCardProps) {
  // Generate random avatar initials style or color
  const colors = ['bg-blue-100 text-blue-800', 'bg-emerald-100 text-emerald-800', 'bg-purple-100 text-purple-800', 'bg-amber-100 text-amber-800', 'bg-rose-100 text-rose-800'];
  const colorIndex = worker.name.charCodeAt(0) % colors.length;
  const colorClass = colors[colorIndex];
  
  const initials = worker.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('');

  // Calculate rating stats
  const workerReviews = reviews.filter(r => r.workerId === worker.id);
  const reviewCount = workerReviews.length;
  const avgRating = reviewCount > 0
    ? (workerReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
    : null;

  return (
    <div 
      className="bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-200 flex flex-col justify-between p-5"
      id={`worker-card-${worker.id}`}
    >
      <div>
        {/* Card Header Info */}
        <div className="flex items-start space-x-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm tracking-wide ${colorClass} shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900 truncate">
              {worker.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                {worker.skill}
              </span>
              
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

        {/* Location & Rate details */}
        <div className="mt-4 space-y-2 border-b border-slate-50 pb-4">
          <div className="flex items-center text-xs text-slate-600 font-medium">
            <MapPin className="h-3.5 w-3.5 text-slate-400 mr-1.5 shrink-0" />
            <span>Qardho ({worker.location})</span>
          </div>
          <div className="flex items-center text-xs text-slate-600 font-semibold">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600 mr-1.5 shrink-0" />
            <span className="text-emerald-700">Expects {worker.rate || '$15 / day'}</span>
          </div>
        </div>

        {/* Bio/Summary */}
        <p className="mt-4 text-xs text-slate-500 leading-relaxed line-clamp-3">
          {worker.bio || 'Professional skilled technician ready to assist you. Contact to discuss job details and requirements.'}
        </p>
      </div>

      {/* Action buttons */}
      <div className="mt-5 pt-3 flex flex-col space-y-2">
        {onViewProfile && (
          <button
            onClick={() => onViewProfile(worker)}
            className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            <Star className="h-3.5 w-3.5 text-amber-500" />
            <span>View Profile & Feedback</span>
          </button>
        )}

        {isCurrentUser ? (
          <div className="text-center text-xs font-semibold text-slate-400 bg-slate-50 py-2.5 rounded-lg border border-slate-100">
            This is you
          </div>
        ) : (
          <button
            onClick={() => onConnect(worker)}
            className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer"
            id={`btn-connect-${worker.id}`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Connect & Hire</span>
          </button>
        )}
      </div>
    </div>
  );
}
