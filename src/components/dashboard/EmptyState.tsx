import React from 'react';
import { Briefcase, FileText, Users, CheckCircle2, Search } from 'lucide-react';

interface EmptyStateProps {
  type: 'active' | 'applications' | 'connections' | 'completed' | 'filtered';
  isWorker?: boolean;
  onAction?: () => void;
  customMessage?: string;
  actionText?: string;
}

export default function EmptyState({
  type,
  isWorker = true,
  onAction,
  customMessage,
  actionText,
}: EmptyStateProps) {
  let Icon = Briefcase;
  let title = 'No items found';
  let description = 'There are no records to display.';
  let buttonLabel = 'Browse Jobs';

  switch (type) {
    case 'active':
      Icon = Briefcase;
      title = isWorker ? 'No active work right now' : 'No active jobs in progress';
      description = isWorker
        ? 'Jobs will appear here once an employer accepts your application or hire offer.'
        : 'Jobs in progress with assigned workers will appear here.';
      buttonLabel = isWorker ? 'Browse Jobs' : 'Post a Job';
      break;
    case 'applications':
      Icon = FileText;
      title = isWorker ? 'You have not submitted any applications yet' : 'No job applications received';
      description = isWorker
        ? 'Find matching opportunities in Qardho and submit your applications.'
        : 'Applications from skilled workers will appear here once posted.';
      buttonLabel = isWorker ? 'Browse Jobs' : 'Post a Job';
      break;
    case 'connections':
      Icon = Users;
      title = isWorker ? 'No direct offers received' : 'No direct offers sent';
      description = isWorker
        ? 'Direct hire requests from employers in Qardho will appear here.'
        : 'Direct offers you send to skilled workers will appear here.';
      buttonLabel = isWorker ? 'View Opportunities' : 'Browse Workers';
      break;
    case 'completed':
      Icon = CheckCircle2;
      title = 'No completed work yet';
      description = 'Completed jobs and work engagements will be archived here.';
      buttonLabel = isWorker ? 'Browse Jobs' : 'Post a Job';
      break;
    case 'filtered':
      Icon = Search;
      title = 'No matching records found';
      description = 'Try clearing or adjusting your search filters.';
      buttonLabel = 'Reset Filters';
      break;
  }

  if (customMessage) description = customMessage;
  if (actionText) buttonLabel = actionText;

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 sm:p-12 text-center shadow-2xs">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-1.5 mx-auto max-w-md text-xs text-slate-500 font-medium leading-relaxed">{description}</p>

      {onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 active:scale-[0.98] transition"
        >
          <span>{buttonLabel}</span>
        </button>
      )}
    </div>
  );
}
