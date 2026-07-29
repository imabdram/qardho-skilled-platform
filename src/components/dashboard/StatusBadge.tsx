import React from 'react';
import { Clock, CheckCircle2, X, AlertCircle, PlayCircle, Sparkles, CheckCheck } from 'lucide-react';

export type DisplayStatus =
  | 'under_review'
  | 'needs_action'
  | 'accepted'
  | 'active'
  | 'completion_requested'
  | 'completed'
  | 'review_pending'
  | 'not_selected'
  | 'declined'
  | 'disputed'
  | 'cancelled'
  | 'expired'
  | 'closed';

interface StatusBadgeProps {
  status: DisplayStatus | string;
  customLabel?: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, customLabel, size = 'sm' }: StatusBadgeProps) {
  let label = customLabel || '';
  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon: React.ComponentType<{ className?: string }> = Clock;

  switch (status) {
    case 'needs_action':
      label = label || 'Needs Action';
      styles = 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold animate-pulse-subtle';
      Icon = AlertCircle;
      break;
    case 'under_review':
    case 'pending':
      label = label || 'Under Review';
      styles = 'bg-amber-50 text-amber-800 border-amber-200/80 font-bold';
      Icon = Clock;
      break;
    case 'accepted':
      label = label || 'Accepted';
      styles = 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-bold';
      Icon = CheckCircle2;
      break;
    case 'active':
    case 'in_progress':
      label = label || 'Active Work';
      styles = 'bg-blue-50 text-blue-800 border-blue-200/80 font-bold';
      Icon = PlayCircle;
      break;
    case 'completion_requested':
    case 'completion_requested_by_worker':
    case 'completion_requested_by_employer':
      label = label || 'Completion Requested';
      styles = 'bg-amber-50 text-amber-800 border-amber-200/80 font-bold';
      Icon = Clock;
      break;
    case 'completed':
      label = label || 'Completed';
      styles = 'bg-slate-100 text-slate-700 border-slate-200 font-bold';
      Icon = CheckCheck;
      break;
    case 'review_pending':
      label = label || 'Review Pending';
      styles = 'bg-purple-50 text-purple-800 border-purple-200/80 font-bold';
      Icon = Sparkles;
      break;
    case 'not_selected':
    case 'declined':
      label = label || 'Not Selected';
      styles = 'bg-rose-50 text-rose-800 border-rose-200/80 font-semibold';
      Icon = X;
      break;
    case 'disputed':
    case 'completion_disputed':
      label = label || 'Disputed';
      styles = 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
      Icon = AlertCircle;
      break;
    case 'cancelled':
    case 'cancelled_by_employer':
      label = label || 'Cancelled';
      styles = 'bg-slate-100 text-slate-600 border-slate-200 font-normal';
      Icon = X;
      break;
    case 'expired':
      label = label || 'Expired';
      styles = 'bg-slate-100 text-slate-500 border-slate-200 font-normal';
      Icon = Clock;
      break;
    case 'closed':
      label = label || 'Closed';
      styles = 'bg-slate-100 text-slate-600 border-slate-200 font-normal';
      Icon = X;
      break;
    default:
      label = label || status.replace(/_/g, ' ');
      styles = 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
      Icon = Clock;
  }

  const padding = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]';
  const iconSize = size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3';

  return (
    <span className={`inline-flex items-center gap-1.2 rounded-full border ${padding} shrink-0 transition-colors ${styles}`}>
      <Icon className={`${iconSize} shrink-0`} />
      <span className="capitalize">{label}</span>
    </span>
  );
}
