import React, { useState } from 'react';
import { Connection, Application, Job, JobStatus, User, Review } from '../types';
import {
  Users, Briefcase, FileText, Check, X, Phone, MapPin,
  Clock, CheckCircle2, RefreshCw, PlusCircle, Star, ArrowRight, Copy, Filter
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

interface DashboardProps {
  currentUser: User | null;
  workers: User[];
  connections: Connection[];
  applications: Application[];
  jobs: Job[];
  reviews: Review[];
  onUpdateConnectionStatus: (id: string, status: 'accepted' | 'declined') => void | Promise<void>;
  onUpdateApplicationStatus: (id: string, status: 'accepted' | 'declined') => void | Promise<void>;
  onUpdateJobStatus: (id: string, status: JobStatus) => void | Promise<void>;
  onNavigate: (page: string) => void;
  onViewWorkerProfile: (worker: User) => void;
  onSwitchRole: () => void;
  isSwitchingRole?: boolean;
  isLoading?: boolean;
}

export default function Dashboard({
  currentUser,
  workers,
  connections,
  applications,
  jobs,
  reviews,
  onUpdateConnectionStatus,
  onUpdateApplicationStatus,
  onUpdateJobStatus,
  onNavigate,
  onViewWorkerProfile,
  onSwitchRole,
  isSwitchingRole = false,
  isLoading = false
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'progress' | 'connections' | 'applications' | 'jobs'>('progress');
  const [quickFilter, setQuickFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'needs_review'>('all');
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    tone?: 'danger' | 'neutral';
    actionKey?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  if (!currentUser) return null;

  const isWorker = currentUser.role === 'worker';
  const myConnections = isWorker
    ? connections.filter(c => c.toUserId === currentUser.id)
    : connections.filter(c => c.fromUserId === currentUser.id);
  const myApplications = isWorker
    ? applications.filter(a => a.applicantId === currentUser.id)
    : applications.filter(a => a.employerId === currentUser.id);
  const myPostedJobs = jobs.filter(j => j.employerId === currentUser.id);
  const pendingConnections = myConnections.filter(c => c.status === 'pending').length;
  const pendingApplications = myApplications.filter(a => a.status === 'pending').length;
  const openJobs = myPostedJobs.filter(j => j.status === 'open').length;
  const completedJobs = myPostedJobs.filter(j => j.status === 'completed').length;
  const acceptedApplications = myApplications.filter(a => a.status === 'accepted');

  const getAcceptedApplicationForJob = (job: Job) => applications.find(app => app.jobId === job.id && app.status === 'accepted');
  const getJobForApplication = (app: Application) => jobs.find(job => job.id === app.jobId);
  const isJobReviewed = (job: Job) => reviews.some(review => review.jobId === job.id && review.employerId === currentUser.id);

  const workerProgressItems = acceptedApplications
    .map(app => ({ application: app, job: getJobForApplication(app) }))
    .filter((item): item is { application: Application; job: Job } => !!item.job && item.job.status !== 'closed');

  const employerProgressJobs = myPostedJobs.filter(job => job.status !== 'closed');

  const openConfirmation = (action: {
    title: string;
    description: string;
    confirmLabel: string;
    tone?: 'danger' | 'neutral';
    actionKey?: string;
    onConfirm: () => void | Promise<void>;
  }) => setPendingAction(action);

  const runAction = async (key: string, action: () => void | Promise<void>) => {
    if (actionKey) return;
    setActionKey(key);
    try {
      await Promise.resolve(action());
    } finally {
      setActionKey(null);
    }
  };

  const getWorker = (id?: string) => workers.find(worker => worker.id === id);
  const reviewReadyJobs = myPostedJobs.filter(job => job.status === 'completed' && !isJobReviewed(job));
  const completionRequests = isWorker
    ? workerProgressItems.filter(item => item.job.status === 'in_progress' && item.job.completionRequestedAt).length
    : employerProgressJobs.filter(job => job.status === 'in_progress' && job.completionRequestedAt).length;
  const activeJobsCount = isWorker
    ? workerProgressItems.filter(item => item.job.status === 'in_progress').length
    : employerProgressJobs.filter(job => job.status === 'in_progress').length;

  const missingProfileFields = [
    !currentUser.name?.trim() ? 'name' : null,
    !currentUser.phone?.trim() ? 'phone' : null,
    !currentUser.location?.trim() ? 'location' : null,
    !currentUser.bio?.trim() ? 'bio' : null,
    isWorker && !currentUser.skill?.trim() ? 'skill' : null,
    isWorker && !currentUser.rate?.trim() ? 'rate' : null,
    isWorker && !currentUser.availability ? 'availability' : null,
  ].filter(Boolean) as string[];

  const copyPhone = async (phone: string) => {
    await navigator.clipboard?.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 1800);
  };

  const cleanPhoneHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, '')}`;

  const ContactActions = ({ phone, label = 'Phone' }: { phone?: string; label?: string }) => {
    if (!phone) return <span className="text-[11px] italic text-slate-400">Phone not shared</span>;
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Phone className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-slate-500">{label}:</span>
          <span className="font-mono text-slate-950 select-all">{phone}</span>
        </span>
        <a href={cleanPhoneHref(phone)} className="inline-flex min-h-8 items-center justify-center rounded-md bg-slate-900 px-2.5 text-[11px] font-black text-white hover:bg-slate-800">Call</a>
        <button onClick={() => copyPhone(phone)} className="inline-flex min-h-8 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-black text-slate-700 hover:bg-slate-50">
          <Copy className="h-3 w-3" />
          {copiedPhone === phone ? 'Copied' : 'Copy'}
        </button>
      </div>
    );
  };

  const getReadableStatus = (status: 'pending' | 'accepted' | 'declined') => {
    if (isWorker) return status === 'pending' ? 'Waiting for employer response' : status === 'accepted' ? 'Accepted / active job' : 'Not selected';
    return status === 'pending' ? 'Needs review' : status === 'accepted' ? 'Hired' : 'Not selected';
  };

  const getStatusBadge = (status: 'pending' | 'accepted' | 'declined') => {
    const styles = {
      pending: 'bg-amber-50 text-amber-700 border-amber-100',
      accepted: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      declined: 'bg-rose-50 text-rose-700 border-rose-100',
    }[status];
    const Icon = status === 'accepted' ? CheckCircle2 : status === 'declined' ? X : Clock;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${styles}`}>
        <Icon className="h-3 w-3" />
        <span>{getReadableStatus(status)}</span>
      </span>
    );
  };

  const getJobStatusBadge = (status: JobStatus) => {
    const styles = {
      open: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
      completed: 'bg-slate-100 text-slate-700 border-slate-200',
      closed: 'bg-rose-50 text-rose-700 border-rose-100',
    }[status];
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${styles}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getTimelineSteps = (job: Job, hasApplication: boolean, hasAccepted: boolean, reviewed = false) => [
    { label: 'Posted', done: true },
    { label: 'Applied', done: hasApplication },
    { label: 'Accepted', done: hasAccepted },
    { label: 'In progress', done: job.status === 'in_progress' || job.status === 'completed' },
    { label: 'Completed', done: job.status === 'completed' },
    { label: 'Reviewed', done: reviewed },
  ];

  const getApplicationTimelineSteps = (app: Application) => {
    const job = getJobForApplication(app);
    const reviewed = job ? reviews.some(review => review.jobId === job.id) : false;
    const decided = app.status === 'accepted' || app.status === 'declined';
    return [
      { label: 'Applied', done: true },
      { label: 'Reviewed', done: decided },
      { label: app.status === 'declined' ? 'Declined' : 'Accepted', done: decided },
      { label: 'Active job', done: app.status === 'accepted' && (job?.status === 'in_progress' || job?.status === 'completed') },
      { label: 'Completed', done: job?.status === 'completed' },
      { label: 'Reviewed', done: reviewed },
    ];
  };

  const Timeline = ({ steps }: { steps: Array<{ label: string; done: boolean }> }) => (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {steps.map(step => (
        <div key={step.label} className={`rounded-lg border px-2 py-2 text-center text-[10px] font-black uppercase ${
          step.done ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-400'
        }`}>
          {step.label}
        </div>
      ))}
    </div>
  );

  const renderEmployerProgressCard = (job: Job) => {
    const accepted = getAcceptedApplicationForJob(job);
    const reviewed = isJobReviewed(job);
    const workerName = job.assignedWorkerName || accepted?.applicantName;
    const hasApplications = applications.some(app => app.jobId === job.id);

    return (
      <article key={job.id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">{job.title}</h3>
            <p className="mt-1 text-xs font-medium text-slate-500">{workerName ? `Worker: ${workerName}` : 'No worker accepted yet'}</p>
          </div>
          {getJobStatusBadge(job.status)}
        </div>
        <Timeline steps={getTimelineSteps(job, hasApplications, !!accepted || !!job.assignedWorkerId, reviewed)} />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {job.status === 'open' && (
            <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">Next step: Accept an applicant</span>
          )}
          {job.status === 'in_progress' && (
            <button
              onClick={() => openConfirmation({
                title: 'Request worker completion?',
                description: `This asks the assigned worker to confirm the work for "${job.title}" is finished. Reviews unlock after the worker confirms.`,
                confirmLabel: job.completionRequestedAt ? 'Waiting...' : actionKey === `complete-${job.id}` ? 'Requesting...' : 'Request completion',
                tone: 'neutral',
                actionKey: `complete-${job.id}`,
                onConfirm: () => onUpdateJobStatus(job.id, 'completed'),
              })}
              disabled={!!job.completionRequestedAt || actionKey === `complete-${job.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {job.completionRequestedAt ? 'Waiting worker confirmation' : actionKey === `complete-${job.id}` ? 'Requesting...' : 'Request completion'}
            </button>
          )}
          {job.status === 'completed' && !reviewed && (
            <button onClick={() => { const reviewWorker = getWorker(job.assignedWorkerId || accepted?.applicantId); if (reviewWorker) onViewWorkerProfile(reviewWorker); else onNavigate('workers'); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700">
              <Star className="h-3.5 w-3.5" />
              Leave review
            </button>
          )}
          {job.status === 'completed' && reviewed && (
            <span className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-xs font-black text-emerald-700">
              <Star className="h-3.5 w-3.5" />
              Reviewed
            </span>
          )}
          {job.status === 'open' && (
            <button
              onClick={() => openConfirmation({
                title: 'Close this open job?',
                description: `This stops new applications for "${job.title}".`,
                confirmLabel: actionKey === `close-${job.id}` ? 'Closing...' : 'Close job',
                tone: 'danger',
                actionKey: `close-${job.id}`,
                onConfirm: () => onUpdateJobStatus(job.id, 'closed'),
              })}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              {actionKey === `close-${job.id}` ? 'Closing...' : 'Close job'}
            </button>
          )}
        </div>
      </article>
    );
  };

  const renderWorkerProgressCard = ({ application, job }: { application: Application; job: Job }) => (
    <article key={application.id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900">{job.title}</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">Employer: {job.employerName}</p>
        </div>
        {getJobStatusBadge(job.status)}
      </div>
      <Timeline steps={getTimelineSteps(job, true, true, reviews.some(review => review.jobId === job.id))} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {job.status === 'in_progress' && <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">{job.completionRequestedAt ? 'Employer requested completion' : 'Active job'}</span>}
        {job.status === 'completed' && <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Completed</span>}
        <ContactActions phone={job.phone} label="Employer" />
        {job.status === 'in_progress' && job.completionRequestedAt && (
          <button
            onClick={() => openConfirmation({ title: 'Confirm work completed?', description: `This confirms you finished "${job.title}". The employer can review the job after this.`, confirmLabel: actionKey === `worker-complete-${job.id}` ? 'Confirming...' : 'Confirm completed', tone: 'neutral', actionKey: `worker-complete-${job.id}`, onConfirm: () => onUpdateJobStatus(job.id, 'completed') })}
            disabled={actionKey === `worker-complete-${job.id}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {actionKey === `worker-complete-${job.id}` ? 'Confirming...' : 'Confirm completed'}
          </button>
        )}
        <button onClick={() => onNavigate('jobs')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50">View related job</button>
      </div>
    </article>
  );


  const progressMatchesFilter = (job: Job) => {
    if (quickFilter === 'all') return true;
    if (quickFilter === 'active') return job.status === 'in_progress';
    if (quickFilter === 'completed') return job.status === 'completed';
    if (quickFilter === 'needs_review') return !isWorker && job.status === 'completed' && !isJobReviewed(job);
    if (quickFilter === 'pending') return job.status === 'open';
    return true;
  };

  const filteredEmployerProgressJobs = employerProgressJobs.filter(progressMatchesFilter);
  const filteredWorkerProgressItems = workerProgressItems.filter(item => progressMatchesFilter(item.job));
  const filteredApplications = myApplications.filter(app => {
    if (quickFilter === 'all') return true;
    if (quickFilter === 'pending') return app.status === 'pending';
    if (quickFilter === 'active') return app.status === 'accepted';
    if (quickFilter === 'completed') return getJobForApplication(app)?.status === 'completed';
    return true;
  });

  const tabCounts = {
    progress: isWorker ? workerProgressItems.length : employerProgressJobs.length,
    connections: myConnections.length,
    applications: myApplications.length,
    jobs: myPostedJobs.length,
  };

  const NeedsAttentionCard = ({ title, detail, action, onClick, tone = 'blue' }: { title: string; detail: string; action: string; onClick: () => void; tone?: 'blue' | 'amber' | 'emerald' }) => {
    const toneClass = tone === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-100' : tone === 'emerald' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-blue-50 text-blue-800 border-blue-100';
    return (
      <button onClick={onClick} className={`min-h-28 rounded-xl border p-4 text-left transition hover:shadow-sm ${toneClass}`}>
        <span className="block text-sm font-black">{title}</span>
        <span className="mt-1 block text-xs font-semibold opacity-80">{detail}</span>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-black">{action}<ArrowRight className="h-3.5 w-3.5" /></span>
      </button>
    );
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="dashboard-container">
      <div className="mb-8 flex flex-col gap-5 rounded-2xl bg-slate-900 p-6 text-white sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black sm:text-2xl">My Dashboard Panel</h1>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${isWorker ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
              {isWorker ? 'Skilled Worker' : 'Employer'}
            </span>
          </div>
          <p className="text-xs text-slate-400 sm:text-sm">
            {isWorker ? 'Track applications, active jobs, and completed work.' : 'Manage applicants, active jobs, completion, and reviews.'}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {!isWorker && (
            <button onClick={() => onNavigate('post-job')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-black text-slate-900 hover:bg-slate-100">
              <PlusCircle className="h-4 w-4 text-blue-600" />
              Post a Job
            </button>
          )}
          <button onClick={onSwitchRole} disabled={isSwitchingRole} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:text-slate-400">
            <RefreshCw className={`h-4 w-4 ${isSwitchingRole ? 'animate-spin' : ''}`} />
            {isSwitchingRole ? 'Switching...' : `Switch to ${isWorker ? 'Employer' : 'Worker'}`}
          </button>
        </div>
      </div>

      {isLoading && (
        <section className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard data">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-xl border border-slate-100 bg-white p-4 shadow-xs">
              <div className="h-3 w-24 rounded bg-slate-100" />
              <div className="mt-3 h-7 w-12 rounded bg-slate-100" />
              <div className="mt-4 h-3 w-32 rounded bg-slate-100" />
            </div>
          ))}
        </section>
      )}

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">Next Actions</h2>
          <span className="text-xs font-semibold text-slate-400">Your next useful actions</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {pendingApplications > 0 && (
            <NeedsAttentionCard title={`${pendingApplications} ${isWorker ? 'application' : 'candidate'}${pendingApplications === 1 ? '' : 's'} waiting`} detail={isWorker ? 'Waiting for employer response.' : 'Review applicants and hire one worker.'} action={isWorker ? 'View status' : 'Review candidates'} onClick={() => { setActiveTab('applications'); setQuickFilter('pending'); }} tone="amber" />
          )}
          {pendingConnections > 0 && (
            <NeedsAttentionCard title={`${pendingConnections} hire request${pendingConnections === 1 ? '' : 's'}`} detail={isWorker ? 'Accept to reveal contact details.' : 'Waiting for worker response.'} action="Open requests" onClick={() => { setActiveTab('connections'); setQuickFilter('pending'); }} />
          )}
          {completionRequests > 0 && (
            <NeedsAttentionCard title={`${completionRequests} completion confirmation${completionRequests === 1 ? '' : 's'}`} detail={isWorker ? 'Employer says the work is complete.' : 'Waiting for worker confirmation.'} action="Open progress" onClick={() => { setActiveTab('progress'); setQuickFilter('active'); }} tone="emerald" />
          )}
          {activeJobsCount > 0 && (
            <NeedsAttentionCard title={`${activeJobsCount} active job${activeJobsCount === 1 ? '' : 's'}`} detail={isWorker ? 'Keep contact details handy.' : 'Request completion when finished.'} action="Open progress" onClick={() => { setActiveTab('progress'); setQuickFilter('active'); }} />
          )}
          {!isWorker && reviewReadyJobs.length > 0 && (
            <NeedsAttentionCard title={`${reviewReadyJobs.length} review${reviewReadyJobs.length === 1 ? '' : 's'} needed`} detail="Completed jobs are waiting for feedback." action="Leave review" onClick={() => { setActiveTab('progress'); setQuickFilter('needs_review'); }} tone="emerald" />
          )}
          {missingProfileFields.length > 0 && (
            <NeedsAttentionCard title="Profile incomplete" detail={`Missing: ${missingProfileFields.slice(0, 3).join(', ')}${missingProfileFields.length > 3 ? '...' : ''}`} action="Complete profile" onClick={() => onNavigate('profile')} tone="amber" />
          )}
          {pendingApplications === 0 && pendingConnections === 0 && activeJobsCount === 0 && reviewReadyJobs.length === 0 && missingProfileFields.length === 0 && (
            <NeedsAttentionCard title="Nothing urgent" detail="Your dashboard is clear right now." action={isWorker ? 'Browse jobs' : 'Post a job'} onClick={() => onNavigate(isWorker ? 'jobs' : 'post-job')} tone="emerald" />
          )}
        </div>
      </section>

      {missingProfileFields.length > 0 && (
        <section className="mb-8 rounded-xl border border-amber-100 bg-amber-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black text-amber-950">Complete your profile</h2>
              <p className="mt-1 text-xs font-semibold text-amber-800">Add {missingProfileFields.join(', ')} so people can trust your account and contact you.</p>
            </div>
            <button onClick={() => onNavigate('profile')} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-600 px-4 text-xs font-black text-white hover:bg-amber-700">Complete profile</button>
          </div>
        </section>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: isWorker ? 'Pending Hire Requests' : 'Pending Connections', value: pendingConnections },
          { label: isWorker ? 'Waiting Applications' : 'Candidates Waiting', value: pendingApplications },
          { label: isWorker ? 'Active Jobs' : 'Open Jobs', value: isWorker ? activeJobsCount : openJobs },
          { label: 'Completed Jobs', value: isWorker ? workerProgressItems.filter(item => item.job.status === 'completed').length : completedJobs },
        ].map(metric => (
          <div key={metric.label} className="rounded-xl border border-slate-100 bg-white p-4 shadow-xs">
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">{metric.label}</span>
            <span className="mt-1 block text-2xl font-black text-slate-900">{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="sticky top-[104px] z-30 -mx-4 mb-6 flex gap-2 overflow-x-auto border-y border-slate-100 bg-slate-50/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex-wrap sm:border-b sm:border-t-0 sm:bg-transparent sm:px-0 sm:pb-3 sm:pt-0">
        {[
          { key: 'progress' as const, label: 'Job Progress' },
          { key: 'connections' as const, label: isWorker ? 'Hire Requests' : 'Connections' },
          { key: 'applications' as const, label: isWorker ? 'Applications' : 'Candidates' },
          ...(!isWorker ? [{ key: 'jobs' as const, label: 'Posted Jobs' }] : []),
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold ${activeTab === tab.key ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {tab.label} ({tabCounts[tab.key]})
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-slate-400"><Filter className="h-3.5 w-3.5" />Filter</span>
        {[
          { key: 'all' as const, label: 'All' },
          { key: 'pending' as const, label: 'Pending' },
          { key: 'active' as const, label: 'Active' },
          { key: 'completed' as const, label: 'Completed' },
          ...(!isWorker ? [{ key: 'needs_review' as const, label: 'Needs review' }] : []),
        ].map(filter => (
          <button key={filter.key} onClick={() => setQuickFilter(filter.key)} className={`rounded-full border px-3 py-1 text-xs font-bold ${quickFilter === filter.key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {filter.label}
          </button>
        ))}
      </div>

      {activeTab === 'progress' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Job Progress</h2>
            </div>
          </div>
          {isWorker ? (
            filteredWorkerProgressItems.length > 0 ? filteredWorkerProgressItems.map(renderWorkerProgressCard) : (
              <div className="rounded-xl border border-slate-100 bg-white py-12 text-center">
                <Briefcase className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs font-medium text-slate-500">No matching jobs yet. Accepted jobs will appear here after an employer hires you.</p>
                <button onClick={() => onNavigate('jobs')} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">Browse jobs</button>
              </div>
            )
          ) : (
            filteredEmployerProgressJobs.length > 0 ? filteredEmployerProgressJobs.map(renderEmployerProgressCard) : (
              <div className="rounded-xl border border-slate-100 bg-white py-12 text-center">
                <Briefcase className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs font-medium text-slate-500">No matching posted jobs. Post a job or adjust the filter.</p>
                <button onClick={() => onNavigate('post-job')} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">Post a job</button>
              </div>
            )
          )}
        </section>
      )}

      {activeTab === 'connections' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">{isWorker ? 'Hire Requests Received' : 'Connections Initiated'}</h2>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{myConnections.length}</span>
          </div>
          {myConnections.length > 0 ? myConnections.map(conn => (
            <article key={conn.id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{isWorker ? conn.fromUserName : `Connected with: ${conn.toUserName}`}</h3>
                  <p className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs italic text-slate-600">"{conn.message || 'No message provided.'}"</p>
                </div>
                {getStatusBadge(conn.status)}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-50 pt-3">
                {conn.phone && conn.status === 'accepted' ? (
                  <ContactActions phone={conn.phone} />
                ) : (
                  <span className="text-[11px] italic text-slate-400">{conn.status === 'pending' ? 'Accept request to reveal phone' : 'Contact hidden'}</span>
                )}
                {isWorker && conn.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => openConfirmation({ title: 'Decline this hire request?', description: `This will mark the request from ${conn.fromUserName} as declined.`, confirmLabel: actionKey === `decline-conn-${conn.id}` ? 'Declining...' : 'Decline request', tone: 'danger', actionKey: `decline-conn-${conn.id}`, onConfirm: () => onUpdateConnectionStatus(conn.id, 'declined') })} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-red-100 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>
                    <button onClick={() => openConfirmation({ title: 'Accept this hire request?', description: `This will reveal contact info for ${conn.fromUserName} and mark the request as accepted.`, confirmLabel: actionKey === `accept-conn-${conn.id}` ? 'Accepting...' : 'Accept request', tone: 'neutral', actionKey: `accept-conn-${conn.id}`, onConfirm: () => onUpdateConnectionStatus(conn.id, 'accepted') })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"><Check className="h-3.5 w-3.5" />{actionKey === `accept-conn-${conn.id}` ? 'Accepting...' : 'Accept'}</button>
                  </div>
                )}
              </div>
            </article>
          )) : (
            <div className="rounded-xl border border-slate-100 bg-white py-12 text-center"><Users className="mx-auto mb-2 h-8 w-8 text-slate-300" /><p className="text-xs font-medium text-slate-500">No connections yet. Accepted hire requests will show contact details here.</p><button onClick={() => onNavigate(isWorker ? 'jobs' : 'workers')} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">{isWorker ? 'Browse jobs' : 'Find workers'}</button></div>
          )}
        </section>
      )}

      {activeTab === 'applications' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /><h2 className="text-base font-bold text-slate-900">{isWorker ? 'Job Applications Submitted' : 'Applications Received'}</h2></div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{myApplications.length}</span>
          </div>
          {filteredApplications.length > 0 ? filteredApplications.map(app => (
            <article key={app.id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{isWorker ? app.jobTitle : `Applicant: ${app.applicantName}`}</h3>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">{isWorker && app.status === 'pending' ? 'Waiting for employer response' : `Job: ${app.jobTitle}`}</p>
                </div>
                {getStatusBadge(app.status)}
              </div>
              <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs italic text-slate-600">"{app.message}"</p>
              <Timeline steps={getApplicationTimelineSteps(app)} />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-50 pt-3">
                <div className="space-y-1">
                  {(isWorker || app.status === 'accepted') ? <ContactActions phone={app.phone} label={isWorker ? 'Your phone' : 'Applicant'} /> : <span className="text-[11px] italic text-slate-400">Contact unlocks after accepted application or hire request.</span>}
                  <span className="flex items-center text-[11px] text-slate-500"><MapPin className="mr-1.5 h-3 w-3 text-slate-400" />Qardho ({app.location})</span>
                </div>
                {!isWorker && app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedApplication(app)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Details</button>
                    <button onClick={() => openConfirmation({ title: 'Decline this candidate application?', description: `This will mark ${app.applicantName}'s application for "${app.jobTitle}" as declined.`, confirmLabel: actionKey === `decline-app-${app.id}` ? 'Declining...' : 'Decline application', tone: 'danger', actionKey: `decline-app-${app.id}`, onConfirm: () => onUpdateApplicationStatus(app.id, 'declined') })} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-red-100 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>
                    <button onClick={() => openConfirmation({ title: 'Accept this candidate application?', description: `This will hire ${app.applicantName}, move the job to in progress, and mark other pending applications as not selected.`, confirmLabel: actionKey === `accept-app-${app.id}` ? 'Hiring...' : 'Hire candidate', tone: 'neutral', actionKey: `accept-app-${app.id}`, onConfirm: () => onUpdateApplicationStatus(app.id, 'accepted') })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"><Check className="h-3.5 w-3.5" />{actionKey === `accept-app-${app.id}` ? 'Hiring...' : 'Hire'}</button>{getWorker(app.applicantId) && <button onClick={() => onViewWorkerProfile(getWorker(app.applicantId)!)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">View profile</button>}
                  </div>
                )}
                {isWorker && app.status === 'accepted' && (
                  <button onClick={() => setActiveTab('progress')} className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">View status <ArrowRight className="h-3.5 w-3.5" /></button>
                )}
              </div>
            </article>
          )) : (
            <div className="rounded-xl border border-slate-100 bg-white py-12 text-center"><FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" /><p className="text-xs font-medium text-slate-500">No matching applications. New worker applications and status updates will appear here.</p><button onClick={() => onNavigate(isWorker ? 'jobs' : 'post-job')} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">{isWorker ? 'Browse jobs' : 'Post a job'}</button></div>
          )}
        </section>
      )}

      {!isWorker && activeTab === 'jobs' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-blue-600" /><h2 className="text-base font-bold text-slate-900">Your Posted Jobs</h2></div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{myPostedJobs.length}</span>
          </div>
          {myPostedJobs.length > 0 ? myPostedJobs.map(renderEmployerProgressCard) : (
            <div className="rounded-xl border border-slate-100 bg-white py-12 text-center"><Briefcase className="mx-auto mb-2 h-8 w-8 text-slate-300" /><p className="text-xs font-medium text-slate-500">You have not posted any jobs yet.</p><button onClick={() => onNavigate('post-job')} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">Post a job</button></div>
          )}
        </section>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Application detail</p>
                <h3 className="mt-0.5 text-base font-black text-slate-950">{selectedApplication.applicantName}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">{selectedApplication.applicantSkill} for {selectedApplication.jobTitle}</p>
              </div>
              <button onClick={() => setSelectedApplication(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 px-5 py-4">
              {getStatusBadge(selectedApplication.status)}
              <p className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs italic text-slate-700">"{selectedApplication.message}"</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 p-3"><span className="block text-[10px] font-black uppercase text-slate-400">Location</span><span className="text-sm font-bold text-slate-900">{selectedApplication.location}</span></div>
                <div className="rounded-xl border border-slate-100 p-3"><span className="block text-[10px] font-black uppercase text-slate-400">Phone</span>{selectedApplication.status === 'accepted' ? <ContactActions phone={selectedApplication.phone} label="Applicant" /> : <span className="text-xs font-semibold text-slate-500">Contact unlocks after accepted application or hire request.</span>}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row">
              {getWorker(selectedApplication.applicantId) && <button onClick={() => { const worker = getWorker(selectedApplication.applicantId); setSelectedApplication(null); if (worker) onViewWorkerProfile(worker); }} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50">View profile</button>}
              {selectedApplication.status === 'pending' && <button onClick={() => openConfirmation({ title: 'Decline this candidate application?', description: `This will mark ${selectedApplication.applicantName}'s application for "${selectedApplication.jobTitle}" as declined.`, confirmLabel: 'Decline application', tone: 'danger', actionKey: `decline-app-${selectedApplication.id}`, onConfirm: () => onUpdateApplicationStatus(selectedApplication.id, 'declined') })} className="flex-1 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-black text-rose-700 hover:bg-rose-50">Decline</button>}
              {selectedApplication.status === 'pending' && <button onClick={() => openConfirmation({ title: 'Accept this candidate application?', description: `This will hire ${selectedApplication.applicantName}, move the job to in progress, and mark other pending applications as not selected.`, confirmLabel: 'Hire candidate', tone: 'neutral', actionKey: `accept-app-${selectedApplication.id}`, onConfirm: () => onUpdateApplicationStatus(selectedApplication.id, 'accepted') })} className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700">Accept applicant</button>}
            </div>
          </div>
        </div>
      )}
      {pendingAction && (
        <ConfirmDialog
          title={pendingAction.title}
          description={pendingAction.description}
          confirmLabel={pendingAction.confirmLabel}
          tone={pendingAction.tone}
          onConfirm={() => {
            const action = pendingAction;
            setPendingAction(null);
            void runAction(action.actionKey || action.title, action.onConfirm);
          }}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}





























