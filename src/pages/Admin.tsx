import React, { useMemo, useState } from 'react';
import { Application, Connection, Job, ProfileFieldKey, Review, User, VerificationMessage } from '../types';
import { ShieldAlert, Search, Trash2, UserCheck, UserX, BadgeCheck, Briefcase, MessageSquare, Link as LinkIcon, Clock3, UsersRound, X } from 'lucide-react';
import { buildVerificationMessageText, getMissingProfileFields, PROFILE_FIELD_LABELS } from '../validation';

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
}

export default function Admin({ currentUser, users, jobs, connections, applications, reviews, onNavigate, onRefresh, onToggleVerifyUser, onToggleSuspendUser, onDeleteUser, onChangeUserRole, onLoadVerificationMessage, onSendVerificationMessage }: AdminProps) {
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewingUser, setReviewingUser] = useState<User | null>(null);
  const [selectedMissingFields, setSelectedMissingFields] = useState<ProfileFieldKey[]>([]);
  const [verificationNote, setVerificationNote] = useState('');
  const [latestVerificationMessage, setLatestVerificationMessage] = useState<VerificationMessage | null>(null);
  const [messageBusy, setMessageBusy] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);

  const waitingUsers = useMemo(() => [...users]
    .filter((user) => !user.verified && user.role !== 'admin')
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()), [users]);

  const counts = useMemo(() => ({
    users: users.length,
    workers: users.filter(u => u.role === 'worker').length,
    employers: users.filter(u => u.role === 'employer').length,
    admins: users.filter(u => u.role === 'admin').length,
    suspended: users.filter(u => u.suspended).length,
    verified: users.filter(u => u.verified).length,
    waiting: waitingUsers.length,
    jobs: jobs.length,
    connections: connections.length,
    applications: applications.length,
    reviews: reviews.length,
  }), [users, jobs, connections, applications, reviews, waitingUsers]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => [user.name, user.email, user.phone, user.role, user.location, user.skill].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [users, query]);

  const formatJoinedDate = (createdAt?: string) => {
    if (!createdAt) return 'Signup date unavailable';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return 'Signup date unavailable';
    return `Joined ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-8 text-rose-800">
          <ShieldAlert className="h-8 w-8" />
          <h1 className="mt-4 text-2xl font-black">Admin access required</h1>
          <p className="mt-2 text-sm font-medium">Sign in with the seeded admin account to manage users and content.</p>
          <button onClick={() => onNavigate('auth')} className="mt-5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white">Go to login</button>
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
      const phoneDigits = reviewingUser.phone.replace(/D/g, '');
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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-900/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-wider text-sky-200"><ShieldAlert className="h-3.5 w-3.5" /> Platform control</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Admin dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-300">Moderate users, verify trust, suspend abuse, and remove accounts or content when needed.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs font-black sm:grid-cols-4">
            <div className="rounded-2xl bg-white/5 px-4 py-3"><div className="text-slate-400">Users</div><div className="mt-1 text-2xl text-white">{counts.users}</div></div>
            <div className="rounded-2xl bg-white/5 px-4 py-3"><div className="text-slate-400">Verified</div><div className="mt-1 text-2xl text-white">{counts.verified}</div></div>
            <div className="rounded-2xl bg-white/5 px-4 py-3"><div className="text-slate-400">Suspended</div><div className="mt-1 text-2xl text-white">{counts.suspended}</div></div>
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-left"><div className="text-amber-200">Waiting</div><div className="mt-1 flex items-center gap-2 text-2xl text-white">{counts.waiting}{counts.waiting > 0 && <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" />}</div></div>
          </div>
        </div>
      </section>

      <section className={`mt-6 overflow-hidden rounded-3xl border ${counts.waiting > 0 ? 'border-amber-200 bg-amber-50/60' : 'border-brand-200 bg-brand-50/50'}`}>
        <div className="flex flex-col gap-3 border-b border-black/5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={`rounded-2xl p-2.5 ${counts.waiting > 0 ? 'bg-amber-100 text-amber-700' : 'bg-brand-100 text-brand-700'}`}>
              {counts.waiting > 0 ? <Clock3 className="h-5 w-5" /> : <BadgeCheck className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950">Verification queue</h2>
              <p className="mt-1 text-sm font-medium text-slate-600">{counts.waiting > 0 ? `${counts.waiting} new account${counts.waiting === 1 ? '' : 's'} waiting for admin review.` : 'No new accounts are waiting for verification.'}</p>
            </div>
          </div>
        </div>
        {counts.waiting > 0 && (
          <div className="divide-y divide-amber-100 bg-white/70">
            {waitingUsers.slice(0, 3).map((user) => (
              <div key={`waiting-${user.id}`} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black text-slate-950">{user.name}</p>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800">Waiting for verification</span>
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">{user.role || 'pending'} · {user.phone}{user.email ? ` · ${user.email}` : ''}</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">{formatJoinedDate(user.createdAt)}{user.location ? ` · ${user.location}` : ''}</p>
                </div>
                <button onClick={() => openUserReview(user)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800">
                  <UserCheck className="h-4 w-4" />Review full details
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="user-accounts" className="mt-6 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users by name, phone, email, skill, or role" className="w-full bg-transparent text-sm font-semibold outline-none" />
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Workers', counts.workers], ['Employers', counts.employers], ['Admins', counts.admins], ['Jobs', counts.jobs]
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</div><div className="mt-2 text-3xl font-black text-slate-950">{value as number}</div></div>
        ))}
      </section>

      <section className="mt-8 grid gap-4">
        {filteredUsers.map((user) => (
          <article key={user.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-slate-950">{user.name}</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700">{user.role || 'pending'}</span>
                  {user.verified && <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-brand-700"><BadgeCheck className="h-3 w-3" /> Verified</span>}
                  {!user.verified && user.role !== 'admin' && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800"><Clock3 className="h-3 w-3" /> Waiting for verification</span>}
                  {user.suspended && <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-700"><UserX className="h-3 w-3" /> Suspended</span>}
                </div>
                <p className="mt-2 text-sm font-medium text-slate-500">{user.email || 'No email'} · {user.phone}</p>
                <p className="mt-1 text-sm text-slate-600">{user.location || 'No location'}{user.skill ? ` · ${user.skill}` : ''}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.verified ? (
                  <button disabled={busyId === `verify-${user.id}`} onClick={() => run(`verify-${user.id}`, () => onToggleVerifyUser(user))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"><UserCheck className="h-4 w-4" />Unverify</button>
                ) : (
                  <button onClick={() => openUserReview(user)} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 transition hover:bg-amber-100"><UserCheck className="h-4 w-4" />Review before verifying</button>
                )}
                <button disabled={busyId === `suspend-${user.id}`} onClick={() => run(`suspend-${user.id}`, () => onToggleSuspendUser(user))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"><ShieldAlert className="h-4 w-4" />{user.suspended ? 'Unsuspend' : 'Suspend'}</button>
                {user.role !== 'admin' && (
                  <button disabled={busyId === `role-${user.id}`} onClick={() => run(`role-${user.id}`, () => onChangeUserRole(user, user.role === 'worker' ? 'employer' : 'worker'))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"><Briefcase className="h-4 w-4" />Swap role</button>
                )}
                <button disabled={busyId === `delete-${user.id}`} onClick={() => run(`delete-${user.id}`, () => onDeleteUser(user))} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-60"><Trash2 className="h-4 w-4" />Delete</button>
              </div>
            </div>
          </article>
        ))}
        {filteredUsers.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <UsersRound className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">No accounts match this view</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Try another filter or clear the search field.</p>
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="text-base font-black text-slate-950">Latest jobs</h2>
          <div className="mt-4 space-y-3">{jobs.slice(0, 5).map(job => <div key={job.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"><div className="font-black text-slate-950">{job.title}</div><div>{job.employerName} · {job.status}</div></div>)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-black text-slate-950">Recent activity</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-600" />{applications.length} applications</div>
            <div className="flex items-center gap-2"><LinkIcon className="h-4 w-4 text-blue-600" />{connections.length} connections</div>
            <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-blue-600" />{jobs.length} jobs</div>
            <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-blue-600" />{reviews.length} reviews</div>
          </div>
        </div>
      </section>

      {reviewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="account-review-title" onClick={() => setReviewingUser(null)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
                  {reviewingUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-700">Verification review</p>
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
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800">Waiting for verification</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700">{reviewingUser.role || 'pending role'}</span>
                {reviewingUser.suspended && <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-rose-700">Suspended</span>}
              </div>

              <div className="mt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Account and contact details</h3>
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
                    ['SMS notifications', reviewingUser.smsNotificationsEnabled ? 'Enabled' : 'Disabled'],
                    ['Signup date', formatJoinedDate(reviewingUser.createdAt).replace('Joined ', '')],
                    ['Account status', reviewingUser.suspended ? 'Suspended' : 'Active'],
                  ].map(([label, value]) => (
                    <div key={label} className="border-b border-slate-100 px-4 py-3 last:border-b-0 sm:odd:border-r">
                      <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</dt>
                      <dd className="mt-1 break-words text-sm font-bold capitalize text-slate-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Profile bio</h3>
                <p className="mt-3 min-h-20 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-700">
                  {reviewingUser.bio || 'This account has not added a profile bio.'}
                </p>
              </div>

              <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-950">Tell the user what is missing</h3>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-600">The checklist starts with fields detected from the profile. Adjust it before sending.</p>
                  </div>
                  {latestVerificationMessage && (
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-600 ring-1 ring-slate-200">
                      Last sent {new Date(latestVerificationMessage.sentAt).toLocaleDateString('en-GB')}
                      {' · '}{latestVerificationMessage.readAt ? 'Read' : 'Unread'}
                    </span>
                  )}
                </div>

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
                  <span className="text-xs font-black text-slate-700">Optional note</span>
                  <textarea
                    value={verificationNote}
                    onChange={(event) => {
                      setVerificationNote(event.target.value.slice(0, 500));
                      setMessageFeedback(null);
                      setWhatsAppUrl(null);
                    }}
                    rows={4}
                    placeholder="Example: Please add a clearer description of your experience and the jobs you have completed."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                  <span className="mt-1 block text-right text-[10px] font-bold text-slate-400">{verificationNote.length}/500</span>
                </label>

                {messageFeedback && (
                  <div className={messageFeedback.type === 'success' ? 'mt-3 rounded-xl border border-brand-200 bg-brand-50 px-3 py-3 text-xs font-bold text-brand-800' : 'mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs font-bold text-rose-700'}>
                    {messageFeedback.text}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button disabled={messageBusy} onClick={sendVerificationMessage} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                    <MessageSquare className="h-4 w-4" />{messageBusy ? 'Sending message...' : latestVerificationMessage ? 'Replace in-app message' : 'Send in-app message'}
                  </button>
                  {whatsAppUrl && (
                    <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-brand-700">
                      Open prepared WhatsApp
                    </a>
                  )}
                </div>
              </section>
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-black text-amber-900">Review before approving</p>
                <p className="mt-1 text-xs font-medium leading-5 text-amber-800">Confirm that the name, contact information, requested role, and worker skill or employer profile are appropriate before verifying this account.</p>
              </div>
            </div>

            <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
              <button onClick={() => setReviewingUser(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50">Close review</button>
              <button disabled={busyId === `verify-${reviewingUser.id}`} onClick={verifyReviewedUser} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-black text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60">
                <BadgeCheck className="h-4 w-4" />{busyId === `verify-${reviewingUser.id}` ? 'Verifying account...' : 'Verify this account'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}


