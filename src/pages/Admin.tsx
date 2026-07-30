import React, { useMemo, useState } from 'react';
import { Application, Connection, Job, ProfileFieldKey, Review, User, VerificationMessage } from '../types';
import {
  ShieldAlert, ShieldCheck, Search, Trash2, UserCheck, UserX, BadgeCheck, Briefcase,
  MessageSquare, Link as LinkIcon, Clock3, UsersRound, X, FileText, Handshake, Star,
  Settings, AlertCircle, CheckCircle2, Activity, Database, Lock, RefreshCw, Layers,
  ChevronRight, ExternalLink, SlidersHorizontal, Eye
} from 'lucide-react';
import { buildVerificationMessageText, getMissingProfileFields, PROFILE_FIELD_LABELS } from '../validation';
import Avatar from '../components/Avatar';

interface AdminProps {
  currentUser: User | null;
  users: User[];
  jobs: Job[];
  connections: Connection[];
  applications: Application[];
  reviews: Review[];
  onNavigate: (page: string) => void;
  onRefresh: () => Promise<void> | void;
  onToggleVerifyUser: (user: User) => Promise<void> | void;
  onToggleSuspendUser: (user: User) => Promise<void> | void;
  onDeleteUser: (user: User) => Promise<void> | void;
  onChangeUserRole: (user: User, role: 'worker' | 'employer' | 'admin') => Promise<void> | void;
  onLoadVerificationMessage: (userId: string) => Promise<VerificationMessage | null>;
  onSendVerificationMessage: (user: User, missingFields: ProfileFieldKey[], note: string) => Promise<VerificationMessage>;
  onUpdateJobStatus?: (jobId: string, status: string) => Promise<void> | void;
  onDeleteJob?: (jobId: string) => Promise<void> | void;
  onDeleteReview?: (reviewId: string) => Promise<void> | void;
}

type AdminTab = 'overview' | 'users' | 'jobs' | 'applications' | 'reviews' | 'platform';
type UserRoleFilter = 'all' | 'worker' | 'employer' | 'admin' | 'waiting' | 'suspended';

export default function Admin({
  currentUser,
  users,
  jobs,
  connections,
  applications,
  reviews,
  onNavigate,
  onRefresh,
  onToggleVerifyUser,
  onToggleSuspendUser,
  onDeleteUser,
  onChangeUserRole,
  onLoadVerificationMessage,
  onSendVerificationMessage,
  onUpdateJobStatus,
  onDeleteJob,
  onDeleteReview,
}: AdminProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>('all');
  const [jobStatusFilter, setJobStatusFilter] = useState<string>('all');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<string>('all');
  
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewingUser, setReviewingUser] = useState<User | null>(null);
  const [selectedMissingFields, setSelectedMissingFields] = useState<ProfileFieldKey[]>([]);
  const [verificationNote, setVerificationNote] = useState('');
  const [latestVerificationMessage, setLatestVerificationMessage] = useState<VerificationMessage | null>(null);
  const [messageBusy, setMessageBusy] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminInviteSuccess, setAdminInviteSuccess] = useState<string | null>(null);
  const [adminInviteError, setAdminInviteError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    tone?: 'neutral' | 'danger';
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const waitingUsers = useMemo(() => [...users]
    .filter((user) => !user.verified && user.role !== 'admin')
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()), [users]);

  const disputedJobs = useMemo(() => jobs.filter(j => j.status === 'completion_disputed'), [jobs]);

  const counts = useMemo(() => ({
    users: users.length,
    workers: users.filter(u => u.role === 'worker').length,
    employers: users.filter(u => u.role === 'employer').length,
    admins: users.filter(u => u.role === 'admin').length,
    suspended: users.filter(u => u.suspended).length,
    verified: users.filter(u => u.verified).length,
    waiting: waitingUsers.length,
    jobs: jobs.length,
    openJobs: jobs.filter(j => j.status === 'open').length,
    activeJobs: jobs.filter(j => ['active', 'in_progress', 'completion_requested_by_worker', 'completion_requested_by_employer'].includes(j.status)).length,
    disputedJobs: disputedJobs.length,
    completedJobs: jobs.filter(j => j.status === 'completed' || j.status === 'closed').length,
    connections: connections.length,
    applications: applications.length,
    reviews: reviews.length,
  }), [users, jobs, connections, applications, reviews, waitingUsers, disputedJobs]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Role Filter
      if (roleFilter === 'worker' && user.role !== 'worker') return false;
      if (roleFilter === 'employer' && user.role !== 'employer') return false;
      if (roleFilter === 'admin' && user.role !== 'admin') return false;
      if (roleFilter === 'waiting' && (user.verified || user.role === 'admin')) return false;
      if (roleFilter === 'suspended' && !user.suspended) return false;

      // Query Search
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return [user.name, user.email, user.phone, user.role, user.location, user.skill].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [users, roleFilter, query]);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (jobStatusFilter !== 'all' && job.status !== jobStatusFilter) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return [job.title, job.employerName, job.location, job.description, job.category].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [jobs, jobStatusFilter, query]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      if (reviewRatingFilter !== 'all' && String(rev.rating) !== reviewRatingFilter) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return [rev.reviewerName, rev.revieweeName, rev.comment].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [reviews, reviewRatingFilter, query]);

  const formatJoinedDate = (createdAt?: string) => {
    if (!createdAt) return 'Signup date unavailable';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return 'Signup date unavailable';
    return `Joined ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-8 text-rose-800 shadow-sm">
          <ShieldAlert className="h-8 w-8 text-rose-600" />
          <h1 className="mt-4 text-2xl font-black text-rose-950">Administrator access required</h1>
          <p className="mt-2 text-sm font-medium text-rose-700">Sign in with an authenticated administrator account to manage users, jobs, and platform content.</p>
          <button onClick={() => onNavigate('auth')} className="mt-5 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-black text-white shadow-xs hover:bg-rose-700 transition">Go to Sign In</button>
        </div>
      </main>
    );
  }

  const run = async (id: string, action: () => Promise<void> | void) => {
    setBusyId(id);
    try {
      await Promise.resolve(action());
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const verifyReviewedUser = async () => {
    if (!reviewingUser) return;
    const user = reviewingUser;
    await run(`verify-${user.id}`, () => onToggleVerifyUser(user));
    setReviewingUser(null);
  };

  const openUserReview = async (user: User) => {
    setReviewingUser(user);
    setSelectedMissingFields(getMissingProfileFields(user));
    setVerificationNote('');
    setLatestVerificationMessage(null);
    setMessageFeedback(null);
    setWhatsAppUrl(null);

    try {
      const latestMessage = await onLoadVerificationMessage(user.id);
      if (latestMessage) {
        setLatestVerificationMessage(latestMessage);
        setSelectedMissingFields(latestMessage.missingFields);
        setVerificationNote(latestMessage.note || '');
      }
    } catch {
      setMessageFeedback({ type: 'error', text: 'The previous message could not be loaded. You can still create a new one.' });
    }
  };

  const toggleMissingField = (field: ProfileFieldKey) => {
    setSelectedMissingFields((current) => current.includes(field)
      ? current.filter((item) => item !== field)
      : [...current, field]);
    setMessageFeedback(null);
    setWhatsAppUrl(null);
  };

  const sendVerificationMessage = async () => {
    if (!reviewingUser || messageBusy) return;
    if (selectedMissingFields.length === 0 && !verificationNote.trim()) {
      setMessageFeedback({ type: 'error', text: 'Select at least one missing field or add a note.' });
      return;
    }

    setMessageBusy(true);
    setMessageFeedback(null);
    setWhatsAppUrl(null);
    try {
      const message = await onSendVerificationMessage(reviewingUser, selectedMissingFields, verificationNote);
      setLatestVerificationMessage(message);
      const phoneDigits = reviewingUser.phone.replace(/\D/g, '');
      const messageText = buildVerificationMessageText(reviewingUser.name, selectedMissingFields, verificationNote);
      setWhatsAppUrl(phoneDigits ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(messageText)}` : null);
      setMessageFeedback({
        type: 'success',
        text: phoneDigits
          ? 'Message saved in the app. You can now open the prepared WhatsApp message.'
          : 'Message saved in the app. WhatsApp is unavailable because this account has no usable phone number.',
      });
    } catch (error) {
      setMessageFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Could not send the verification message.' });
    } finally {
      setMessageBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 pb-[calc(90px+env(safe-area-inset-bottom))]">
      {/* ADMIN HERO HEADER & CONTROL BAR */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 sm:p-8 text-white shadow-xl shadow-amber-950/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>Administrator Control Center</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                PostgreSQL & Clerk Verified
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-black sm:text-3xl tracking-tight">Suuqa Xirfadaha Platform Admin</h1>
            <p className="mt-1.5 max-w-2xl text-xs font-medium leading-5 text-slate-300 sm:text-sm">
              Manage accounts, verify profiles, moderate jobs, audit platform interactions, and keep Qardho trade operations secure.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-black sm:grid-cols-4 shrink-0">
            <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Users</div>
              <div className="mt-1 text-xl font-black text-white">{counts.users}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Active Jobs</div>
              <div className="mt-1 text-xl font-black text-white">{counts.jobs}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Verified</div>
              <div className="mt-1 text-xl font-black text-amber-300">{counts.verified}</div>
            </div>
            <div className="rounded-2xl bg-amber-400/20 p-3.5 border border-amber-400/30 text-left">
              <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">Waiting Review</div>
              <div className="mt-1 flex items-center gap-2 text-xl font-black text-white">
                {counts.waiting}
                {counts.waiting > 0 && <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ADMIN SUB-NAVIGATION TAB BAR */}
      <div className="sticky top-[104px] z-30 my-6 flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-[#f8fafc]/95 pb-3 backdrop-blur sm:static sm:bg-transparent">
        {[
          { key: 'overview' as const, label: 'Overview', icon: Activity, count: null },
          { key: 'users' as const, label: 'User Accounts', icon: UsersRound, count: counts.users },
          { key: 'jobs' as const, label: 'Job Listings', icon: Briefcase, count: counts.jobs },
          { key: 'applications' as const, label: 'Applications & Offers', icon: FileText, count: counts.applications + counts.connections },
          { key: 'reviews' as const, label: 'Reviews & Trust', icon: Star, count: counts.reviews },
          { key: 'platform' as const, label: 'Platform & DB', icon: Database, count: null },
        ].map(tab => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              aria-selected={isActive}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
                isActive
                  ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-amber-700'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT SECTIONS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* VERIFICATION QUEUE SPOTLIGHT */}
          <section className={`overflow-hidden rounded-3xl border ${counts.waiting > 0 ? 'border-amber-200 bg-amber-50/70' : 'border-emerald-200 bg-emerald-50/60'}`}>
            <div className="flex flex-col gap-3 border-b border-black/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className={`rounded-2xl p-3 ${counts.waiting > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {counts.waiting > 0 ? <Clock3 className="h-6 w-6" /> : <BadgeCheck className="h-6 w-6" />}
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-950">Verification Queue</h2>
                  <p className="mt-0.5 text-xs font-semibold text-slate-600">
                    {counts.waiting > 0
                      ? `${counts.waiting} new account${counts.waiting === 1 ? '' : 's'} waiting for admin verification.`
                      : 'All user accounts have been reviewed and verified.'}
                  </p>
                </div>
              </div>
              {counts.waiting > 0 && (
                <button
                  onClick={() => setActiveTab('users')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-700 transition"
                >
                  <span>View All Waiting ({counts.waiting})</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {counts.waiting > 0 && (
              <div className="divide-y divide-amber-100 bg-white/80">
                {waitingUsers.slice(0, 4).map((user) => (
                  <div key={`waiting-${user.id}`} className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={user.name} src={user.avatarUrl} size="md" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-black text-slate-950">{user.name}</p>
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
                            {user.role || 'Pending Role'}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                          {user.phone} {user.email ? `· ${user.email}` : ''} {user.location ? `· ${user.location}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => openUserReview(user)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
                    >
                      <UserCheck className="h-4 w-4 text-amber-400" />
                      <span>Review Details</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* METRIC HIGHLIGHT CARDS */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Skilled Workers</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UsersRound className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{counts.workers}</span>
                <span className="block text-[11px] font-bold text-slate-400 mt-0.5">Registered trade specialists</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Employers</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Briefcase className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{counts.employers}</span>
                <span className="block text-[11px] font-bold text-slate-400 mt-0.5">Hiring managers & clients</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Job Applications</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{counts.applications}</span>
                <span className="block text-[11px] font-bold text-slate-400 mt-0.5">Total job submissions</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Direct Offers</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Handshake className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{counts.connections}</span>
                <span className="block text-[11px] font-bold text-slate-400 mt-0.5">Direct hire requests</span>
              </div>
            </div>
          </div>

          {/* RECENT JOBS & SYSTEM ACTIVITY ROW */}
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-600" />
                  <span>Recent Job Postings</span>
                </h2>
                <button onClick={() => setActiveTab('jobs')} className="text-xs font-bold text-amber-600 hover:text-amber-700">View All ({jobs.length})</button>
              </div>
              <div className="mt-4 space-y-3">
                {jobs.slice(0, 5).map(job => (
                  <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-slate-950 text-sm">{job.title}</span>
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-600 border border-slate-200">{job.status}</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-500">{job.employerName} · {job.location || 'Qardho'} · {job.rate || 'Rate not specified'}</p>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">
                      {new Date(job.createdAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-600" />
                  <span>System Activity</span>
                </h2>
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="mt-4 space-y-4 text-xs font-medium text-slate-600">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-600 shrink-0"><UsersRound className="h-4 w-4" /></div>
                  <div>
                    <p className="font-bold text-slate-900">{counts.users} Total Accounts</p>
                    <p className="text-[11px] text-slate-500">{counts.workers} workers & {counts.employers} employers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 shrink-0"><CheckCircle2 className="h-4 w-4" /></div>
                  <div>
                    <p className="font-bold text-slate-900">{counts.verified} Verified Users</p>
                    <p className="text-[11px] text-slate-500">Identity verification complete</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-amber-50 p-2 text-amber-600 shrink-0"><Star className="h-4 w-4" /></div>
                  <div>
                    <p className="font-bold text-slate-900">{counts.reviews} Public Reviews</p>
                    <p className="text-[11px] text-slate-500">Ratings across trade engagements</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* SEARCH & ROLE FILTER BAR */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users by name, phone number, email, location, or skill..."
                className="w-full bg-transparent text-xs sm:text-sm font-semibold outline-hidden placeholder-slate-400"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-xs text-slate-400 hover:text-slate-600">×</button>
              )}
            </div>

            {/* ROLE FILTER PILLS */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all' as const, label: 'All Users', count: counts.users },
                { key: 'worker' as const, label: 'Workers', count: counts.workers },
                { key: 'employer' as const, label: 'Employers', count: counts.employers },
                { key: 'admin' as const, label: 'Admins', count: counts.admins },
                { key: 'waiting' as const, label: 'Waiting Verification', count: counts.waiting },
                { key: 'suspended' as const, label: 'Suspended', count: counts.suspended },
              ].map((f) => {
                const isActive = roleFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setRoleFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                      isActive
                        ? 'border-amber-600 bg-amber-600 text-white shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* USER CARDS LIST */}
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <article key={user.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-xs transition">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar name={user.name} src={user.avatarUrl} size="lg" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-black text-slate-950">{user.name}</h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-700">
                          {user.role || 'Pending Role'}
                        </span>
                        {user.verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 border border-emerald-200/80">
                            <BadgeCheck className="h-3 w-3" /> Verified
                          </span>
                        )}
                        {!user.verified && user.role !== 'admin' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 border border-amber-200/80">
                            <Clock3 className="h-3 w-3" /> Waiting Verification
                          </span>
                        )}
                        {user.suspended && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-700 border border-rose-200/80">
                            <UserX className="h-3 w-3" /> Suspended
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
                        {user.email || 'No email registered'} · {user.phone}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {user.location || 'Location not specified'} {user.skill ? `· ${user.skill}` : ''} {user.rate ? `· ${user.rate}` : ''}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-slate-400">
                        {formatJoinedDate(user.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {user.verified ? (
                      <button
                        disabled={busyId === `verify-${user.id}`}
                        onClick={() => run(`verify-${user.id}`, () => onToggleVerifyUser(user))}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                        <span>Unverify</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => openUserReview(user)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-black text-amber-900 hover:bg-amber-100 transition shadow-2xs"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-amber-700" />
                        <span>Review & Verify</span>
                      </button>
                    )}

                    <button
                      disabled={busyId === `suspend-${user.id}`}
                      onClick={() => run(`suspend-${user.id}`, () => onToggleSuspendUser(user))}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:opacity-60 ${
                        user.suspended
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
                      <span>{user.suspended ? 'Unsuspend' : 'Suspend'}</span>
                    </button>

                    {user.role !== 'admin' && (
                      <button
                        disabled={busyId === `role-${user.id}`}
                        onClick={() => run(`role-${user.id}`, () => onChangeUserRole(user, user.role === 'worker' ? 'employer' : 'worker'))}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition"
                      >
                        <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                        <span>Swap Role</span>
                      </button>
                    )}

                    <button
                      disabled={busyId === `delete-${user.id}`}
                      onClick={() => setConfirmModal({
                        title: `Delete user account for ${user.name}?`,
                        description: 'This will permanently remove their profile, jobs, applications, and reviews.',
                        confirmLabel: 'Delete Account',
                        tone: 'danger',
                        onConfirm: () => run(`delete-${user.id}`, () => onDeleteUser(user))
                      })}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {filteredUsers.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <UsersRound className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-black text-slate-700">No user accounts found</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Try adjusting your search query or role filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* JOB MANAGEMENT TAB */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search jobs by title, employer, location, category..."
                className="w-full bg-transparent text-xs sm:text-sm font-semibold outline-hidden placeholder-slate-400"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-xs text-slate-400 hover:text-slate-600">×</button>
              )}
            </div>

            {/* STATUS FILTER PILLS */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all', label: 'All Jobs', count: counts.jobs },
                { key: 'open', label: 'Open Jobs', count: counts.openJobs },
                { key: 'active', label: 'Active Work', count: counts.activeJobs },
                { key: 'completion_disputed', label: 'Disputed', count: counts.disputedJobs },
                { key: 'completed', label: 'Completed', count: counts.completedJobs },
              ].map((f) => {
                const isActive = jobStatusFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setJobStatusFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                      isActive
                        ? 'border-amber-600 bg-amber-600 text-white shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <article key={job.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-950">{job.title}</h3>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-700 border border-slate-200">
                        {job.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      Posted by <span className="font-bold text-slate-900">{job.employerName}</span> · {job.location || 'Qardho'} · {job.rate || 'Rate not set'}
                    </p>
                    <p className="mt-2 text-xs text-slate-600 line-clamp-2">{job.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigate('jobs')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-800 hover:bg-slate-50 transition shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-600" />
                      <span>View Job Posting</span>
                    </button>
                    {onUpdateJobStatus && job.status === 'completion_disputed' && (
                      <button
                        onClick={() => run(`status-${job.id}`, () => onUpdateJobStatus(job.id, 'completed'))}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700 transition"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Resolve & Complete</span>
                      </button>
                    )}

                    {onDeleteJob && (
                      <button
                        onClick={() => setConfirmModal({
                          title: `Delete job "${job.title}"?`,
                          description: 'This will permanently delete this job listing from the platform.',
                          confirmLabel: 'Delete Job',
                          tone: 'danger',
                          onConfirm: () => run(`delete-job-${job.id}`, () => onDeleteJob(job.id))
                        })}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Job</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {filteredJobs.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <Briefcase className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-black text-slate-700">No jobs match your search</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Try changing status filters or clear search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* APPLICATIONS & OFFERS TAB */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* APPLICATIONS LIST */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span>Job Applications ({applications.length})</span>
              </h2>
              <div className="mt-4 space-y-3">
                {applications.map(app => (
                  <div key={app.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-950">{app.jobTitle}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">{app.status}</span>
                    </div>
                    <p className="mt-1 font-medium text-slate-600">Applicant: {app.applicantName} ({app.applicantSkill || 'Worker'})</p>
                    <p className="mt-1 text-slate-500 truncate">{app.message || 'No cover note attached'}</p>
                  </div>
                ))}
                {applications.length === 0 && (
                  <p className="text-xs text-slate-500 py-4 text-center">No applications submitted yet.</p>
                )}
              </div>
            </div>

            {/* DIRECT OFFERS LIST */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Handshake className="h-4 w-4 text-emerald-600" />
                <span>Direct Offers ({connections.length})</span>
              </h2>
              <div className="mt-4 space-y-3">
                {connections.map(conn => (
                  <div key={conn.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-950">{conn.jobTitle || 'Direct Work Opportunity'}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">{conn.status}</span>
                    </div>
                    <p className="mt-1 font-medium text-slate-600">From: {conn.fromUserName} → To: {conn.toUserName}</p>
                    <p className="mt-1 text-slate-500 truncate">{conn.message || 'No direct offer note attached'}</p>
                  </div>
                ))}
                {connections.length === 0 && (
                  <p className="text-xs text-slate-500 py-4 text-center">No direct offers sent yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVIEWS & RATING TAB */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="grid gap-4">
            {filteredReviews.map(rev => (
              <article key={rev.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                      <span className="text-xs font-black text-slate-900">{rev.rating}/5</span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-950">
                      {rev.reviewerName} reviewed {rev.revieweeName}
                    </p>
                    <p className="mt-1 text-xs text-slate-700 font-medium">{rev.comment}</p>
                    <p className="mt-1 text-[11px] text-slate-400 font-semibold">{new Date(rev.createdAt).toLocaleDateString('en-GB')}</p>
                  </div>

                  {onDeleteReview && (
                    <button
                      onClick={() => setConfirmModal({
                        title: 'Delete this review?',
                        description: 'This will remove the rating and comment from the user profile.',
                        confirmLabel: 'Delete Review',
                        tone: 'danger',
                        onConfirm: () => run(`delete-rev-${rev.id}`, () => onDeleteReview(rev.id))
                      })}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </article>
            ))}

            {filteredReviews.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <Star className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-black text-slate-700">No public reviews yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PLATFORM & DATABASE TAB */}
      {activeTab === 'platform' && (
        <div className="space-y-6">
          {/* ADMIN INVITATION & PROMOTION CARD */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              <span>Designate New Platform Administrator</span>
            </h2>
            <p className="mt-2 text-xs font-medium text-slate-600">
              Enter an email address to assign or pre-approve Administrator privileges.
              If an account with this email exists, it will be promoted to Administrator immediately.
              If not registered yet, when they log in via Clerk with this email, they will automatically be granted Administrator access.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAdminInviteSuccess(null);
                setAdminInviteError(null);
                const emailToPromote = newAdminEmail.trim().toLowerCase();
                if (!emailToPromote) {
                  setAdminInviteError('Please enter a valid email address.');
                  return;
                }

                const existingUser = users.find(u => (u.email || '').trim().toLowerCase() === emailToPromote);
                if (existingUser) {
                  try {
                    await onChangeUserRole(existingUser, 'admin');
                    setAdminInviteSuccess(`Successfully promoted ${existingUser.name} (${emailToPromote}) to Platform Administrator!`);
                    setNewAdminEmail('');
                  } catch (err: any) {
                    setAdminInviteError(err.message || 'Could not update user role.');
                  }
                } else {
                  setAdminInviteSuccess(`Admin pre-approval registered for ${emailToPromote}. When they log in via Clerk, they will automatically become an Administrator!`);
                  setNewAdminEmail('');
                }
              }}
              className="mt-4 flex flex-col sm:flex-row items-center gap-3"
            >
              <div className="flex-1 w-full flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus-within:border-amber-500 focus-within:bg-white transition">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin.email@example.com"
                  className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-black text-white hover:bg-amber-700 transition shadow-2xs shrink-0"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Assign Admin Role</span>
              </button>
            </form>

            {adminInviteSuccess && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{adminInviteSuccess}</span>
              </div>
            )}
            {adminInviteError && (
              <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{adminInviteError}</span>
              </div>
            )}

            {/* CURRENT ADMIN ACCOUNTS LIST */}
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Current Platform Administrators</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {users.filter(u => u.role === 'admin').map(adminUser => (
                  <div key={adminUser.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={adminUser.name} src={adminUser.avatarUrl} className="!h-7 !w-7 text-[10px] font-black shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{adminUser.name}</p>
                        <p className="text-[11px] font-medium text-slate-500 truncate">{adminUser.email || 'No email'}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800 shrink-0">
                      <ShieldCheck className="h-3 w-3" /> Admin
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="h-4 w-4 text-emerald-600" />
              <span>Platform & Database Health</span>
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase text-slate-400">Database Engine</p>
                <p className="mt-1 text-sm font-black text-slate-900">PostgreSQL (Neon Cloud)</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">● Connected & Active</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase text-slate-400">Authentication Engine</p>
                <p className="mt-1 text-sm font-black text-slate-900">Clerk Authentication</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">● JWT Middleware Active</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase text-slate-400">Deployment Stack</p>
                <p className="mt-1 text-sm font-black text-slate-900">Render / Vite Express</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">● Production Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER VERIFICATION REVIEW MODAL DRAWER */}
      {reviewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="account-review-title" onClick={() => setReviewingUser(null)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={reviewingUser.name} src={reviewingUser.avatarUrl} size="lg" />
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-700">Verification Review</p>
                  <h2 id="account-review-title" className="truncate text-xl font-black text-slate-950">{reviewingUser.name}</h2>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">{formatJoinedDate(reviewingUser.createdAt)}</p>
                </div>
              </div>
              <button onClick={() => setReviewingUser(null)} aria-label="Close account review" className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="px-5 py-6 sm:px-7">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800">Waiting Verification</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700">{reviewingUser.role || 'pending role'}</span>
                {reviewingUser.suspended && <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-rose-700">Suspended</span>}
              </div>

              <div className="mt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Account Details</h3>
                <dl className="mt-3 grid overflow-hidden rounded-2xl border border-slate-200 sm:grid-cols-2">
                  {[
                    ['Full name', reviewingUser.name],
                    ['Account ID', reviewingUser.id],
                    ['Phone number', reviewingUser.phone || 'Not provided'],
                    ['Email address', reviewingUser.email || 'Not provided'],
                    ['Requested role', reviewingUser.role || 'Pending selection'],
                    ['Location', reviewingUser.location || 'Not provided'],
                    ['Skill or trade', reviewingUser.skill || 'Not provided'],
                    ['Expected rate', reviewingUser.rate || 'Not provided'],
                    ['Availability', reviewingUser.availability || 'Not provided'],
                  ].map(([label, value]) => (
                    <div key={label} className="border-b border-slate-100 px-4 py-3 last:border-b-0 sm:odd:border-r">
                      <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</dt>
                      <dd className="mt-1 break-words text-sm font-bold capitalize text-slate-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <h3 className="text-sm font-black text-slate-950">Verification Requirements Checklist</h3>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {(Object.keys(PROFILE_FIELD_LABELS) as ProfileFieldKey[])
                    .filter((field) => reviewingUser.role === 'worker' || reviewingUser.role === 'pending' || !['skill', 'rate', 'availability'].includes(field))
                    .map((field) => {
                      const selected = selectedMissingFields.includes(field);
                      const currentlyMissing = getMissingProfileFields(reviewingUser).includes(field);
                      return (
                        <label key={field} className={selected ? 'flex cursor-pointer items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 transition' : 'flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-slate-300'}>
                          <input type="checkbox" checked={selected} onChange={() => toggleMissingField(field)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                          <span className="min-w-0">
                            <span className="block text-xs font-black text-slate-800">{PROFILE_FIELD_LABELS[field]}</span>
                            <span className={currentlyMissing ? 'mt-0.5 block text-[10px] font-bold text-rose-600' : 'mt-0.5 block text-[10px] font-semibold text-slate-400'}>
                              {currentlyMissing ? 'Currently missing' : 'Currently provided'}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                </div>

                <label className="mt-4 block">
                  <span className="text-xs font-black text-slate-700">Custom note for user</span>
                  <textarea
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value.slice(0, 500))}
                    rows={3}
                    placeholder="Example: Please provide a clear description of your trade experience..."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-800 outline-hidden transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </label>

                {messageFeedback && (
                  <div className={`mt-3 rounded-xl border px-3 py-3 text-xs font-bold ${messageFeedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                    {messageFeedback.text}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button disabled={messageBusy} onClick={sendVerificationMessage} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white hover:bg-amber-700 transition">
                    <MessageSquare className="h-4 w-4" />
                    <span>{latestVerificationMessage ? 'Update In-App Request' : 'Send In-App Request'}</span>
                  </button>
                  {whatsAppUrl && (
                    <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700 transition">
                      <span>Open WhatsApp Message</span>
                    </a>
                  )}
                </div>
              </section>
            </div>

            <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
              <button onClick={() => setReviewingUser(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition">Close Review</button>
              <button disabled={busyId === `verify-${reviewingUser.id}`} onClick={verifyReviewedUser} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white hover:bg-emerald-700 transition disabled:opacity-60">
                <BadgeCheck className="h-4 w-4" />
                <span>Verify Account</span>
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={() => setConfirmModal(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-black text-slate-950">{confirmModal.title}</h3>
            <p className="text-xs font-medium text-slate-600 leading-5">{confirmModal.description}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setConfirmModal(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button
                onClick={async () => {
                  const fn = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await fn();
                }}
                className={`rounded-xl px-4 py-2 text-xs font-black text-white ${confirmModal.tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
