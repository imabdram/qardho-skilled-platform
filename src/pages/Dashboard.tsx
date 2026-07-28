import React, { useState } from 'react';
import { Connection, Application, Job, JobStatus, User, Review, VerificationMessage } from '../types';
import {
  Users, Briefcase, FileText, Check, X, Phone, MapPin,
  Clock, CheckCircle2, RefreshCw, PlusCircle, Star, ArrowRight, Copy
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import CandidateReviewModal from '../components/CandidateReviewModal';
import { getMissingProfileFields, PROFILE_FIELD_LABELS } from '../validation';

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
  verificationMessage?: VerificationMessage | null;
  onReadVerificationMessage?: () => void | Promise<void>;
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
  isLoading = false,
  verificationMessage = null,
  onReadVerificationMessage
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'progress' | 'connections' | 'applications' | 'jobs'>('applications');
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
    ? workerProgressItems.filter(item => item.job.status === 'completion_requested_by_employer').length
    : employerProgressJobs.filter(job => job.status === 'completion_requested_by_worker').length;
  const activeJobsCount = isWorker
    ? workerProgressItems.filter(item => ['active', 'in_progress', 'completion_requested_by_worker', 'completion_requested_by_employer'].includes(item.job.status)).length
    : employerProgressJobs.filter(job => ['active', 'in_progress', 'completion_requested_by_worker', 'completion_requested_by_employer'].includes(job.status)).length;

  const missingProfileFields = getMissingProfileFields(currentUser);

  const copyPhone = async (phone: string) => {
    await navigator.clipboard?.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 1800);
  };

  const cleanPhoneHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, '')}`;

  const formatPhoneDisplay = (phoneStr?: string) => {
    if (!phoneStr) return '';
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.startsWith('252')) {
      return `+252 ${digits.slice(3)}`;
    }
    return phoneStr;
  };

  const ContactActions = ({ phone, label = 'Phone', whatsappMessage }: { phone?: string; label?: string; whatsappMessage?: string }) => {
    if (!phone) return <span className="text-[11px] italic text-slate-400">Phone not shared</span>;
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 mr-2">
          <Phone className="h-3.5 w-3.5 text-[#2563eb]" />
          <span className="text-slate-500">{label}:</span>
          <span className="font-mono text-slate-950 select-all">{formatPhoneDisplay(phone)}</span>
        </span>
        <a href={cleanPhoneHref(phone)} className="inline-flex h-9 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white hover:bg-slate-800 transition">Call</a>
        {whatsappMessage && <a href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noreferrer" className="inline-flex h-9 w-24 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-xs font-black text-slate-950 hover:bg-[#20bd5a] transition">WhatsApp</a>}
        <button onClick={() => copyPhone(phone)} className="inline-flex h-9 w-20 shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50 transition">
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
      accepted: 'bg-brand-50 text-brand-700 border-brand-100',
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
      open: 'bg-brand-50 text-brand-700 border-brand-100',
      in_progress: 'bg-[#93c5fd]/35 text-[#1e40af] border-[#93c5fd]/70',
      active: 'bg-[#93c5fd]/35 text-[#1e40af] border-[#93c5fd]/70',
      completion_requested_by_worker: 'bg-amber-50 text-amber-700 border-amber-100',
      completion_requested_by_employer: 'bg-amber-50 text-amber-700 border-amber-100',
      completed: 'bg-slate-100 text-slate-700 border-slate-200',
      completion_disputed: 'bg-rose-50 text-rose-700 border-rose-100',
      cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
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
    { label: 'Applications received', done: hasApplication },
    { label: 'Worker accepted', done: hasAccepted },
    { label: 'In progress', done: ['active', 'in_progress', 'completion_requested_by_worker', 'completion_requested_by_employer', 'completed'].includes(job.status) },
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
      { label: 'Active job', done: app.status === 'accepted' && !!job && ['active', 'in_progress', 'completion_requested_by_worker', 'completion_requested_by_employer', 'completed'].includes(job.status) },
      { label: 'Completed', done: job?.status === 'completed' },
      { label: 'Reviewed', done: reviewed },
    ];
  };

  const Timeline = ({ steps }: { steps: Array<{ label: string; done: boolean }> }) => (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {steps.map(step => (
        <div key={step.label} className={`rounded-lg border px-2 py-2 text-center text-[10px] font-black uppercase ${
          step.done ? 'border-brand-100 bg-brand-50 text-brand-700' : 'border-slate-100 bg-slate-50 text-slate-400'
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
      <article key={job.id} className="rounded-xl border border-brand-950/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="line-clamp-2 text-base font-black text-slate-900">{job.title}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{job.category || "Local work"} · {job.location} · Posted {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(job.createdAt))}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{workerName ? `Worker: ${workerName}` : 'No worker accepted yet'}</p>
          </div>
          {getJobStatusBadge(job.status)}
        </div>
        <Timeline steps={getTimelineSteps(job, hasApplications, !!accepted || !!job.assignedWorkerId, reviewed)} />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="job-next-step"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Next step</span><span className="mt-1 block text-sm font-black text-slate-800">{job.status === 'open' ? (hasApplications ? `Review ${applications.filter(app => app.jobId === job.id).length} applicants` : 'Wait for applications') : job.status === 'completed' && !reviewed ? 'Leave a review' : job.status === 'completion_requested_by_worker' ? 'Confirm job completion' : ['active', 'in_progress'].includes(job.status) ? 'Wait for the worker to finish' : 'Review job details'}</span></div>
          {['active', 'in_progress'].includes(job.status) && (
            <button
              onClick={() => openConfirmation({
                title: 'Request worker completion?',
                description: `This asks the assigned worker to confirm the work for "${job.title}" is finished. Reviews unlock after the worker confirms.`,
                confirmLabel: actionKey === `complete-${job.id}` ? 'Requesting...' : 'Request completion',
                tone: 'neutral',
                actionKey: `complete-${job.id}`,
                onConfirm: () => onUpdateJobStatus(job.id, 'completion_requested_by_employer'),
              })}
              disabled={actionKey === `complete-${job.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#3b82f6] px-3 text-xs font-black text-white hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {actionKey === `complete-${job.id}` ? 'Requesting...' : 'Request completion'}
            </button>
          )}
          {job.status === 'completion_requested_by_employer' && <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">Waiting for the worker</span>}
          {job.status === 'completion_requested_by_worker' && <><button onClick={() => openConfirmation({ title: 'Confirm job completion?', description: `Confirm that "${job.title}" is finished.`, confirmLabel: 'Confirm completion', tone: 'neutral', actionKey: `confirm-${job.id}`, onConfirm: () => onUpdateJobStatus(job.id, 'completed') })} className="min-h-10 rounded-full bg-brand-600 px-3 text-xs font-black text-white">Confirm completion</button><button onClick={() => openConfirmation({ title: 'Report a completion issue?', description: 'The job will remain unresolved and the dispute will be recorded.', confirmLabel: 'Report issue', tone: 'danger', actionKey: `dispute-${job.id}`, onConfirm: () => onUpdateJobStatus(job.id, 'completion_disputed') })} className="min-h-10 rounded-full border border-rose-200 px-3 text-xs font-black text-rose-700">Report issue</button></>}
          {job.status === 'completed' && !reviewed && (
            <button onClick={() => { const reviewWorker = getWorker(job.assignedWorkerId || accepted?.applicantId); if (reviewWorker) onViewWorkerProfile(reviewWorker); else onNavigate('workers'); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-black text-white hover:bg-brand-700">
              <Star className="h-3.5 w-3.5" />
              Leave review
            </button>
          )}
          {job.status === 'completed' && reviewed && (
            <span className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-50 px-3 text-xs font-black text-brand-700">
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
          <button onClick={() => onNavigate('jobs')} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-brand-700 px-3 text-xs font-black text-brand-800 hover:bg-brand-50">View details</button>
          {hasApplications && job.status === 'open' && <button onClick={() => setActiveTab('applications')} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-600 px-3 text-xs font-black text-white hover:bg-brand-700">View candidates</button>}
        </div>
      </article>
    );
  };

  const renderWorkerProgressCard = ({ application, job }: { application: Application; job: Job }) => (
    <article key={application.id} className="rounded-xl border border-brand-950/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900">{job.title}</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">Employer: {job.employerName}</p>
        </div>
        {getJobStatusBadge(job.status)}
      </div>
      <Timeline steps={getTimelineSteps(job, true, true, reviews.some(review => review.jobId === job.id))} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {['active', 'in_progress'].includes(job.status) && <><span className="rounded-lg bg-[#93c5fd]/35 px-3 py-2 text-xs font-bold text-[#1e40af]">Active job</span><button onClick={() => openConfirmation({ title: 'Request job completion?', description: `Ask the employer to confirm that "${job.title}" is finished.`, confirmLabel: 'Request completion', tone: 'neutral', actionKey: `worker-request-${job.id}`, onConfirm: () => onUpdateJobStatus(job.id, 'completion_requested_by_worker') })} className="min-h-10 rounded-full bg-[#3b82f6] px-3 text-xs font-black text-white">Request completion</button></>}
        {job.status === 'completed' && <span className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700">Completed</span>}
        <ContactActions phone={job.phone} label="Employer" whatsappMessage={`Hello, my name is ${currentUser.name}. I am contacting you through Qardho Skilled Platform regarding the job "${job.title}". My application has been accepted, and I would like to discuss the next steps.`} />
        {job.status === 'completion_requested_by_employer' && (
          <button
            onClick={() => openConfirmation({ title: 'Confirm work completed?', description: `This confirms you finished "${job.title}". The employer can review the job after this.`, confirmLabel: actionKey === `worker-complete-${job.id}` ? 'Confirming...' : 'Confirm completed', tone: 'neutral', actionKey: `worker-complete-${job.id}`, onConfirm: () => onUpdateJobStatus(job.id, 'completed') })}
            disabled={actionKey === `worker-complete-${job.id}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-black text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {actionKey === `worker-complete-${job.id}` ? 'Confirming...' : 'Confirm completed'}
          </button>
        )}
        {job.status === 'completion_requested_by_employer' && <button onClick={() => openConfirmation({ title: 'Report a completion issue?', description: 'The job will remain unresolved and the issue will be recorded.', confirmLabel: 'Report issue', tone: 'danger', actionKey: `worker-dispute-${job.id}`, onConfirm: () => onUpdateJobStatus(job.id, 'completion_disputed') })} className="min-h-10 rounded-full border border-rose-200 px-3 text-xs font-black text-rose-700">Report issue</button>}
        {job.status === 'completion_requested_by_worker' && <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">Waiting for the employer</span>}
        <button onClick={() => onNavigate('jobs')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50">View related job</button>
      </div>
    </article>
  );


  const tabCounts = {
    progress: isWorker ? workerProgressItems.length : employerProgressJobs.length,
    connections: myConnections.length,
    applications: myApplications.length,
    jobs: myPostedJobs.length,
  };

  const NeedsAttentionCard = ({ title, detail, action, onClick, tone = 'blue' }: { title: string; detail: string; action: string; onClick: () => void; tone?: 'blue' | 'amber' | 'brand' }) => {
    const toneClass = tone === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-100' : tone === 'brand' ? 'bg-brand-50 text-brand-800 border-brand-100' : 'bg-[#93c5fd]/30 text-[#1e40af] border-[#93c5fd]/60';
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
      <div className="mb-8 flex flex-col gap-5 rounded-2xl bg-[#111615] p-6 text-white shadow-xl shadow-brand-950/15 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-black sm:text-2xl">My Dashboard Panel</h1>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${isWorker ? 'bg-brand-500/20 text-brand-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
              {isWorker ? 'Skilled Worker' : 'Employer'}
            </span>
          </div>
          <p className="text-xs text-slate-400 sm:text-sm">
            {isWorker ? 'Track applications, active jobs, and completed work.' : 'Manage applicants, active jobs, completion, and reviews.'}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {!isWorker && (
            <button onClick={() => onNavigate('post-job')} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-4 py-2.5 text-xs font-black text-[#111615] hover:bg-[#c8ff74]">
              <PlusCircle className="h-4 w-4 text-[#1e40af]" />
              Post a Job
            </button>
          )}
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
            <NeedsAttentionCard title={`${pendingApplications} ${isWorker ? 'application' : 'candidate'}${pendingApplications === 1 ? '' : 's'} waiting`} detail={isWorker ? 'Waiting for employer response.' : 'Review applicants and hire one worker.'} action={isWorker ? 'View status' : 'Review candidates'} onClick={() => setActiveTab('applications')} tone="amber" />
          )}
          {pendingConnections > 0 && (
            <NeedsAttentionCard title={`${pendingConnections} hire request${pendingConnections === 1 ? '' : 's'}`} detail={isWorker ? 'Accept to reveal contact details.' : 'Waiting for worker response.'} action="Open requests" onClick={() => setActiveTab('connections')} />
          )}
          {completionRequests > 0 && (
            <NeedsAttentionCard title={`${completionRequests} completion confirmation${completionRequests === 1 ? '' : 's'}`} detail={isWorker ? 'The other participant requested completion.' : 'Waiting for the other participant.'} action="Open progress" onClick={() => setActiveTab(isWorker ? 'progress' : 'jobs')} tone="brand" />
          )}
          {activeJobsCount > 0 && (
            <NeedsAttentionCard title={`${activeJobsCount} active job${activeJobsCount === 1 ? '' : 's'}`} detail={isWorker ? 'Keep contact details handy.' : 'Request completion when finished.'} action="Open progress" onClick={() => setActiveTab('progress')} />
          )}
          {!isWorker && reviewReadyJobs.length > 0 && (
            <NeedsAttentionCard title={`${reviewReadyJobs.length} review${reviewReadyJobs.length === 1 ? '' : 's'} needed`} detail="Completed jobs are waiting for feedback." action="Leave review" onClick={() => setActiveTab('progress')} tone="brand" />
          )}
          {missingProfileFields.length > 0 && (
            <NeedsAttentionCard title="Profile incomplete" detail={`Missing: ${missingProfileFields.slice(0, 3).join(', ')}${missingProfileFields.length > 3 ? '...' : ''}`} action="Complete profile" onClick={() => onNavigate('profile')} tone="amber" />
          )}
          {pendingApplications === 0 && pendingConnections === 0 && activeJobsCount === 0 && reviewReadyJobs.length === 0 && missingProfileFields.length === 0 && (
            <NeedsAttentionCard title="Nothing urgent" detail="Your dashboard is clear right now." action={isWorker ? 'Browse jobs' : 'Post a job'} onClick={() => onNavigate(isWorker ? 'jobs' : 'post-job')} tone="brand" />
          )}
        </div>
      </section>

      {verificationMessage && !currentUser.verified && (
        <section className="mb-8 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
          <div className="border-b border-amber-200/70 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Message from {verificationMessage.adminName}</p>
            <h2 className="mt-1 text-base font-black text-amber-950">Admin requested profile updates</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">Complete the requested information so the admin can review your account for verification.</p>
          </div>
          <div className="bg-white/60 px-5 py-4">
            {verificationMessage.missingFields.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {verificationMessage.missingFields.map((field) => (
                  <span key={field} className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-black text-amber-800">{PROFILE_FIELD_LABELS[field]}</span>
                ))}
              </div>
            )}
            {verificationMessage.note && <p className="mt-3 rounded-xl border border-amber-100 bg-white px-3 py-3 text-xs font-medium leading-5 text-slate-700">{verificationMessage.note}</p>}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] font-bold text-slate-500">Sent {new Date(verificationMessage.sentAt).toLocaleDateString('en-GB')}</p>
              <button onClick={async () => { await onReadVerificationMessage?.(); onNavigate('profile'); }} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-amber-600 px-4 text-xs font-black text-white transition hover:bg-amber-700">Update my profile</button>
            </div>
          </div>
        </section>
      )}
      {!verificationMessage && missingProfileFields.length > 0 && (
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

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: isWorker ? 'Pending Hire Requests' : 'Pending Connections', value: pendingConnections },
          { label: isWorker ? 'Waiting Applications' : 'Candidates Waiting', value: pendingApplications },
          { label: isWorker ? 'Active Jobs' : 'Open Jobs', value: isWorker ? activeJobsCount : openJobs },
          { label: 'Completed Jobs', value: isWorker ? workerProgressItems.filter(item => item.job.status === 'completed').length : completedJobs },
        ].map(metric => (
          <div key={metric.label} className="py-1">
            <span className="block text-xs font-black uppercase tracking-wider text-slate-500">{metric.label}</span>
            <span className="mt-1 block text-3xl font-black text-slate-900">{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="sticky top-[104px] z-30 -mx-4 mb-6 flex gap-2 overflow-x-auto border-y border-brand-950/10 bg-[#f6fbf8]/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex-wrap sm:border-b sm:border-t-0 sm:bg-transparent sm:px-0 sm:pb-3 sm:pt-0">
        {[
          ...(isWorker ? [{ key: 'progress' as const, label: 'Job Progress' }] : []),
          { key: 'applications' as const, label: isWorker ? 'Applications' : 'Candidates' },
          { key: 'connections' as const, label: isWorker ? 'Hire Requests' : 'Connections' },
          ...(!isWorker ? [{ key: 'jobs' as const, label: 'Posted Jobs' }] : []),
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} aria-selected={activeTab === tab.key} className={`min-w-[120px] min-h-12 shrink-0 rounded-full border px-5 py-3 text-sm font-black transition sm:flex-1 ${activeTab === tab.key ? 'border-[#3b82f6] bg-[#3b82f6] text-white shadow-md shadow-brand-500/10' : 'border-brand-950/10 bg-white text-slate-700 hover:bg-brand-50 hover:text-[#1e40af]'}`}>
            {tab.label} ({tabCounts[tab.key]})
          </button>
        ))}
      </div>

      {isWorker && activeTab === 'progress' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Job Progress</h2>
            </div>
          </div>
          {isWorker ? (
            workerProgressItems.length > 0 ? workerProgressItems.map(renderWorkerProgressCard) : (
              <div className="rounded-xl border border-slate-100 bg-white py-12 text-center">
                <Briefcase className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs font-medium text-slate-500">No matching jobs yet. Accepted jobs will appear here after an employer hires you.</p>
                <button onClick={() => onNavigate('jobs')} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">Browse jobs</button>
              </div>
            )
          ) : (
            employerProgressJobs.length > 0 ? employerProgressJobs.map(renderEmployerProgressCard) : (
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
                  <ContactActions phone={conn.phone} whatsappMessage={isWorker ? `Hello, my name is ${currentUser.name}. I am contacting you through Qardho Skilled Platform${conn.jobTitle ? ` regarding the job "${conn.jobTitle}"` : ''}. I accepted your hiring request and would like to discuss the next steps.` : `Hello ${conn.toUserName}, I am ${currentUser.name}. I am contacting you through Qardho Skilled Platform${conn.jobTitle ? ` regarding the job "${conn.jobTitle}"` : ''}. I would like to discuss the work details and next steps.`} />
                ) : (
                  <span className="text-[11px] italic text-slate-400">{conn.status === 'pending' ? 'Accept request to reveal phone' : 'Contact hidden'}</span>
                )}
                {isWorker && conn.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => openConfirmation({ title: 'Decline this hire request?', description: `This will mark the request from ${conn.fromUserName} as declined.`, confirmLabel: actionKey === `decline-conn-${conn.id}` ? 'Declining...' : 'Decline request', tone: 'danger', actionKey: `decline-conn-${conn.id}`, onConfirm: () => onUpdateConnectionStatus(conn.id, 'declined') })} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-red-100 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>
                    <button onClick={() => openConfirmation({ title: 'Accept this hire request?', description: `This will reveal contact info for ${conn.fromUserName} and mark the request as accepted.`, confirmLabel: actionKey === `accept-conn-${conn.id}` ? 'Accepting...' : 'Accept request', tone: 'neutral', actionKey: `accept-conn-${conn.id}`, onConfirm: () => onUpdateConnectionStatus(conn.id, 'accepted') })} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700"><Check className="h-3.5 w-3.5" />{actionKey === `accept-conn-${conn.id}` ? 'Accepting...' : 'Accept'}</button>
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
          {myApplications.length > 0 ? myApplications.map(app => (
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
                  {(isWorker || app.status === 'accepted') ? <ContactActions phone={app.phone} label={isWorker ? 'Your phone' : 'Applicant'} whatsappMessage={!isWorker && app.status === 'accepted' ? `Hello ${app.applicantName}, I am ${currentUser.name}. I am contacting you through Qardho Skilled Platform regarding the job "${app.jobTitle}". I would like to discuss the work details and next steps.` : undefined} /> : <span className="text-[11px] italic text-slate-400">Contact unlocks after accepted application or hire request.</span>}
                  <span className="flex items-center text-[11px] text-slate-500"><MapPin className="mr-1.5 h-3 w-3 text-slate-400" />Qardho ({app.location})</span>
                </div>
                {!isWorker && app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedApplication(app)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Details</button>
                    <button onClick={() => openConfirmation({ title: 'Decline this candidate application?', description: `This will mark ${app.applicantName}'s application for "${app.jobTitle}" as declined.`, confirmLabel: actionKey === `decline-app-${app.id}` ? 'Declining...' : 'Decline application', tone: 'danger', actionKey: `decline-app-${app.id}`, onConfirm: () => onUpdateApplicationStatus(app.id, 'declined') })} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-red-100 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>
                    <button onClick={() => openConfirmation({ title: 'Accept this candidate application?', description: `This will hire ${app.applicantName}, move the job to in progress, and mark other pending applications as not selected.`, confirmLabel: actionKey === `accept-app-${app.id}` ? 'Hiring...' : 'Hire candidate', tone: 'neutral', actionKey: `accept-app-${app.id}`, onConfirm: () => onUpdateApplicationStatus(app.id, 'accepted') })} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700"><Check className="h-3.5 w-3.5" />{actionKey === `accept-app-${app.id}` ? 'Hiring...' : 'Hire'}</button>{getWorker(app.applicantId) && <button onClick={() => onViewWorkerProfile(getWorker(app.applicantId)!)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">View profile</button>}
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
        <CandidateReviewModal
          application={selectedApplication}
          worker={getWorker(selectedApplication.applicantId)}
          currentUser={currentUser}
          job={getJobForApplication(selectedApplication)}
          onClose={() => setSelectedApplication(null)}
          onViewWorkerProfile={onViewWorkerProfile}
          onAccept={(appId) => {
            const app = selectedApplication;
            setSelectedApplication(null);
            openConfirmation({
              title: 'Accept & Hire Candidate?',
              description: `This will hire ${app.applicantName}, move "${app.jobTitle}" to in progress, and notify the candidate.`,
              confirmLabel: 'Hire candidate',
              tone: 'neutral',
              actionKey: `accept-app-${appId}`,
              onConfirm: () => onUpdateApplicationStatus(appId, 'accepted'),
            });
          }}
          onDecline={(appId) => {
            const app = selectedApplication;
            setSelectedApplication(null);
            openConfirmation({
              title: 'Decline application?',
              description: `This will mark ${app.applicantName}'s application for "${app.jobTitle}" as declined.`,
              confirmLabel: 'Decline application',
              tone: 'danger',
              actionKey: `decline-app-${appId}`,
              onConfirm: () => onUpdateApplicationStatus(appId, 'declined'),
            });
          }}
        />
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































