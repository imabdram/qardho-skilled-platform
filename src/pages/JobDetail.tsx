import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Briefcase, Calendar, Check, CheckCircle2, Clock3, DollarSign,
  Lock, MapPin, MessageCircle, ShieldCheck, UserCheck, UserRound
} from 'lucide-react';
import { Application, Job, User } from '../types';
import { PAGE_ROUTES } from '../routes';

interface JobDetailProps {
  job?: Job;
  currentUser: User | null;
  applications: Application[];
  onApply: (job: Job) => void;
  onNavigate: (page: string) => void;
}

const formatDate = (date?: string) => {
  if (!date) return 'Recently posted';
  try {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently posted';
  }
};

const getStatusBadge = (status: Job['status']) => {
  switch (status) {
    case 'open':
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-500" />Open</span>;
    case 'active':
    case 'in_progress':
    case 'completion_requested_by_worker':
    case 'completion_requested_by_employer':
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-800 border border-blue-200"><span className="h-2 w-2 rounded-full bg-blue-500" />In Progress</span>;
    case 'completed':
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-800 border border-slate-200"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />Completed</span>;
    case 'closed':
    case 'cancelled':
    default:
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 border border-slate-200">Closed</span>;
  }
};

export default function JobDetail({
  job,
  currentUser,
  applications = [],
  onApply,
  onNavigate,
}: JobDetailProps) {

  // Empty / Not Found State
  if (!job) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-12 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Briefcase className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">This job could not be found</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">It may have been removed, filled, or closed by the employer.</p>
          <button
            onClick={() => onNavigate('jobs')}
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#073f34] px-6 text-sm font-black text-white hover:bg-[#064e3b] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </button>
        </div>
      </main>
    );
  }

  const myApplication = currentUser?.role === 'worker'
    ? applications.find((app) => app.jobId === job.id && app.applicantId === currentUser.id)
    : undefined;

  const isOwner = currentUser?.id === job.employerId;
  const isWorker = currentUser?.role === 'worker';
  const isAcceptedApplication = myApplication?.status === 'accepted';
  const canApply = !!currentUser && isWorker && job.status === 'open' && !myApplication;

  // Rate / Compensation Formatting
  const formattedOffer = job.pricingAmount && job.pricingType
    ? `${job.pricingCurrency || 'USD'} ${job.pricingAmount} / ${job.pricingType}`
    : job.rate || 'Negotiable';

  // Timeline Steps Calculation
  const isAppliedDone = !!myApplication || applications.some((app) => app.jobId === job.id && app.status === 'accepted');
  const isAcceptedDone = !!job.assignedWorkerId || isAcceptedApplication;
  const isInProgressDone = ['active', 'in_progress', 'completion_requested_by_worker', 'completion_requested_by_employer', 'completed'].includes(job.status);
  const isCompletedDone = job.status === 'completed';

  const timelineSteps = [
    { label: 'Posted', active: true, done: true },
    { label: 'Applied', active: isAppliedDone, done: isAppliedDone },
    { label: 'Accepted', active: isAcceptedDone, done: isAcceptedDone },
    { label: 'In progress', active: isInProgressDone, done: isInProgressDone },
    { label: 'Completed', active: isCompletedDone, done: isCompletedDone },
  ];

  // Apply Button Label & Disabled State
  let applyButtonLabel = 'Apply for this Job';
  let applyButtonDisabled = !canApply;

  if (!currentUser) {
    applyButtonLabel = 'Log in to Apply';
    applyButtonDisabled = false;
  } else if (isOwner) {
    applyButtonLabel = 'Manage in Dashboard';
    applyButtonDisabled = false;
  } else if (myApplication) {
    if (myApplication.status === 'accepted') {
      applyButtonLabel = '✓ Application Accepted';
    } else if (myApplication.status === 'pending') {
      applyButtonLabel = '✓ Application Submitted';
    } else {
      applyButtonLabel = `Application ${myApplication.status}`;
    }
    applyButtonDisabled = true;
  } else if (job.status === 'completed') {
    applyButtonLabel = 'Job Completed';
    applyButtonDisabled = true;
  } else if (['active', 'in_progress', 'completion_requested_by_worker', 'completion_requested_by_employer'].includes(job.status)) {
    applyButtonLabel = 'Work in Progress';
    applyButtonDisabled = true;
  } else if (job.status !== 'open') {
    applyButtonLabel = 'Applications Closed';
    applyButtonDisabled = true;
  } else if (!isWorker) {
    applyButtonLabel = 'Skilled Worker Account Required';
    applyButtonDisabled = true;
  }

  const handleApplyClick = () => {
    if (!currentUser) {
      onNavigate('auth');
      return;
    }
    if (isOwner) {
      onNavigate('dashboard');
      return;
    }
    if (canApply) {
      onApply(job);
    }
  };

  const whatsappPhone = (job.phone || '').replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 sm:pb-12">
      {/* Centered Container ~1120px */}
      <div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6 sm:py-8">
        
        {/* Back Link */}
        <button
          onClick={() => onNavigate('jobs')}
          className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </button>

        {/* 1. Job Header Card */}
        <header className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(job.status)}
                <span className="text-xs font-medium text-slate-400">· Posted {formatDate(job.createdAt)}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl lg:text-4xl tracking-tight leading-tight">
                {job.title}
              </h1>
              <p className="text-sm font-bold text-[#073f34] flex items-center gap-1.5">
                <UserRound className="h-4 w-4 text-slate-400" />
                <span>{job.employerName}</span>
              </p>
            </div>

            {/* Desktop Quick Header Status */}
            {myApplication && (
              <div className="shrink-0 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-left sm:text-right">
                <span className="block text-[10px] font-black uppercase text-emerald-800">Your Status</span>
                <span className="mt-0.5 block text-xs font-bold text-emerald-900 capitalize">
                  {myApplication.status === 'pending' ? 'Application Submitted' : myApplication.status}
                </span>
              </div>
            )}
          </div>

          {/* Compact Metadata Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-6 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="h-4 w-4 text-[#073f34]" />
                <span className="text-[10px] font-black uppercase text-slate-500">Location</span>
              </div>
              <p className="mt-1 truncate text-xs font-black text-slate-900">
                {job.location ? `Qardho - ${job.location}` : 'Qardho'}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-400">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-black uppercase text-slate-500">Compensation</span>
              </div>
              <p className="mt-1 truncate text-xs font-black text-slate-900">
                {formattedOffer}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <span className="text-[10px] font-black uppercase text-slate-500">Category</span>
              </div>
              <p className="mt-1 truncate text-xs font-black text-slate-900">
                {job.category || 'General Skill'}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock3 className="h-4 w-4 text-amber-600" />
                <span className="text-[10px] font-black uppercase text-slate-500">Work Type</span>
              </div>
              <p className="mt-1 truncate text-xs font-black text-slate-900">
                {job.workType || 'Flexible'}
              </p>
            </div>
          </div>
        </header>

        {/* 2. Main Grid Layout (Desktop: 68% Main / 32% Sidebar, Gap 24px) */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* Main Column (~68% -> lg:col-span-8) */}
          <div className="space-y-6 lg:col-span-8 min-w-0">
            
            {/* About This Job Section */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 min-w-0 overflow-hidden">
              <h2 className="text-lg font-black text-slate-900">About this job</h2>
              <div className="mt-4 text-sm font-medium leading-relaxed text-slate-700 whitespace-pre-line break-words [overflow-wrap:anywhere] [word-break:break-word] min-w-0 max-w-full">
                {job.description}
              </div>
            </section>

            {/* Requirements Section */}
            {job.requirements && (
              <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 min-w-0 overflow-hidden">
                <h2 className="text-lg font-black text-slate-900">Requirements</h2>
                <div className="mt-4 text-sm font-medium leading-relaxed text-slate-700 whitespace-pre-line break-words [overflow-wrap:anywhere] [word-break:break-word] min-w-0 max-w-full">
                  {job.requirements}
                </div>
              </section>
            )}

            {/* Additional Job Details */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 min-w-0 overflow-hidden">
              <h2 className="text-lg font-black text-slate-900">Job details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <span className="block text-xs font-bold text-slate-400">Category</span>
                  <span className="mt-1 block font-black text-slate-900 text-sm">{job.category || 'General Skilled Work'}</span>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <span className="block text-xs font-bold text-slate-400">Work Type</span>
                  <span className="mt-1 block font-black text-slate-900 text-sm">{job.workType || 'On Site'}</span>
                </div>

                {job.expectedDuration && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:col-span-2">
                    <span className="block text-xs font-bold text-slate-400">Expected Duration</span>
                    <span className="mt-1 block font-black text-slate-900 text-sm">{job.expectedDuration}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Application Progress Timeline */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
              <h2 className="text-lg font-black text-slate-900 mb-6">Application progress</h2>

              {/* Desktop Horizontal Timeline */}
              <div className="hidden sm:flex sm:items-center sm:justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />

                {timelineSteps.map((step, idx) => (
                  <div key={step.label} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-black transition ${
                        step.done
                          ? 'border-[#073f34] bg-[#073f34] text-white'
                          : 'border-slate-200 bg-white text-slate-400'
                      }`}
                    >
                      {step.done ? <Check className="h-4 w-4" /> : idx + 1}
                    </div>
                    <span className={`text-xs font-black ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mobile Vertical Timeline */}
              <div className="space-y-6 sm:hidden">
                {timelineSteps.map((step, idx) => (
                  <div key={step.label} className="flex items-start gap-4">
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-black ${
                          step.done
                            ? 'border-[#073f34] bg-[#073f34] text-white'
                            : 'border-slate-200 bg-white text-slate-400'
                        }`}
                      >
                        {step.done ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                      </div>
                      {idx < timelineSteps.length - 1 && (
                        <div className={`h-8 w-0.5 mt-1 ${step.done ? 'bg-[#073f34]' : 'bg-slate-200'}`} />
                      )}
                    </div>
                    <div className="pt-0.5">
                      <span className={`text-xs font-black ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Column (~32% -> lg:col-span-4) */}
          <div className="space-y-6 lg:col-span-4">
            
            {/* Sticky Container for Desktop */}
            <div className="space-y-6 lg:sticky lg:top-24">
              
              {/* Employer Card */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Employer</span>

                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-[#073f34] font-black text-lg">
                    {job.employerName ? job.employerName.charAt(0).toUpperCase() : 'E'}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">{job.employerName}</h3>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      Qardho - {job.location}
                    </p>
                  </div>
                </div>

                {/* Contact Privacy / Action */}
                <div className="border-t border-slate-100 pt-4">
                  {isAcceptedApplication && whatsappPhone ? (
                    <a
                      href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hello, my name is ${currentUser?.name}. I am contacting you through Qardho Skilled Platform regarding the job "${job.title}". My application has been accepted, and I would like to discuss the next steps.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-xs font-black text-slate-950 hover:bg-[#20bd5a] transition"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Contact on WhatsApp
                    </a>
                  ) : (
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-center">
                      <Lock className="mx-auto h-4 w-4 text-slate-400 mb-1" />
                      <p className="text-xs font-semibold text-slate-600">
                        Contact details become available after your application is accepted.
                      </p>
                    </div>
                  )}
                </div>

                {/* Primary Apply Action in Sidebar */}
                <button
                  type="button"
                  onClick={handleApplyClick}
                  disabled={applyButtonDisabled}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#073f34] px-6 text-sm font-black text-white hover:bg-[#064e3b] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  <span>{applyButtonLabel}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={handleApplyClick}
          disabled={applyButtonDisabled}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#073f34] px-6 text-sm font-black text-white hover:bg-[#064e3b] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
        >
          <CheckCircle2 className="h-4.5 w-4.5" />
          <span>{applyButtonLabel}</span>
        </button>
      </div>
    </div>
  );
}
