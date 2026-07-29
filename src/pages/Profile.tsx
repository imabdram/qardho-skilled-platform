import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Briefcase, CheckCircle2, DollarSign, Edit3, Lock, MapPin,
  MessageSquare, Phone, Send, Share2, ShieldCheck, Star, UserCheck, UserRound, Wrench, Settings as SettingsIcon, Check, X, FileText
} from 'lucide-react';
import { User as UserType, Review, Connection, Job, Application } from '../types';
import Avatar from '../components/Avatar';
import { getMissingProfileFields, PROFILE_FIELD_LABELS } from '../validation';

interface ProfileProps {
  currentUser: UserType | null;
  userToShow?: UserType | null;
  onUpdateProfile: (updatedProfile: UserType) => void | Promise<void>;
  onAvatarUpdated?: (user: UserType) => void;
  onSwitchRole: () => void;
  reviews: Review[];
  jobs: Job[];
  applications: Application[];
  onAddReview: (review: { workerId: string; employerId: string; employerName: string; jobId: string; jobTitle: string; rating: number; comment: string }) => Promise<boolean>;
  connections: Connection[];
  onBack?: () => void;
  onConnect?: (worker: UserType) => void;
  onRequestDeleteAccount?: () => void;
  onUpdateApplicationStatus?: (id: string, status: 'accepted' | 'declined') => void | Promise<void>;
  onUpdateConnectionStatus?: (id: string, status: 'accepted' | 'declined', reason?: string) => void | Promise<void>;
}

export default function Profile({
  currentUser,
  userToShow,
  reviews = [],
  jobs = [],
  applications = [],
  onAddReview,
  connections = [],
  onBack,
  onConnect,
  onRequestDeleteAccount,
  onUpdateApplicationStatus,
  onUpdateConnectionStatus,
}: ProfileProps) {
  const navigate = useNavigate();
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Review form states
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [selectedReviewJobId, setSelectedReviewJobId] = useState<string>('');
  const [reviewSuccess, setReviewSuccess] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [ratingHover, setRatingHover] = useState<number | null>(null);

  if (!currentUser) return null;

  const targetUser = userToShow || currentUser;
  const isOwnProfile = targetUser.id === currentUser.id;
  const isWorker = targetUser.role === 'worker';

  // Candidate application lookup if current user is an employer viewing an applicant
  const candidateApplication = (!isOwnProfile && currentUser.role === 'employer' && applications)
    ? applications.find(a => a.applicantId === targetUser.id && a.employerId === currentUser.id)
    : null;

  // Direct offer lookup if current user is a worker viewing an employer who sent them a direct offer
  const directOffer = (!isOwnProfile && currentUser.role === 'worker' && connections)
    ? connections.find(c => c.fromUserId === targetUser.id && c.toUserId === currentUser.id)
    : null;

  // Connections logic for contact privacy
  const connection = connections.find(
    c => (c.fromUserId === currentUser.id && c.toUserId === targetUser.id) ||
         (c.fromUserId === targetUser.id && c.toUserId === currentUser.id)
  );
  const isConnected = isOwnProfile || (connection && connection.status === 'accepted');
  const isPendingConnection = connection && connection.status === 'pending';

  // Completion calculation (does not include reviews)
  const missingFields = isOwnProfile ? getMissingProfileFields(currentUser) : [];
  const isProfileComplete = missingFields.length === 0;

  // Filter reviews for target user
  const userReviews = isWorker
    ? reviews.filter(r => r.workerId === targetUser.id)
    : reviews.filter(r => r.employerId === targetUser.id);

  const averageRating = userReviews.length
    ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
    : null;

  // Jobs completed count
  const completedJobsCount = isWorker
    ? jobs.filter(j => j.assignedWorkerId === targetUser.id && j.status === 'completed').length
    : jobs.filter(j => j.employerId === targetUser.id && j.status === 'completed').length;

  const shareProfile = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + '/profile');
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      // fallback
    }
  };

  const copyPhone = async (phoneStr?: string) => {
    if (!phoneStr) return;
    try {
      await navigator.clipboard.writeText(phoneStr);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      // fallback
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingReview) return;
    setIsSubmittingReview(true);
    try {
      const ok = await onAddReview({
        workerId: targetUser.id,
        employerId: currentUser.id,
        employerName: currentUser.name,
        jobId: selectedReviewJobId || `job-${Date.now()}`,
        jobTitle: 'Direct Service Review',
        rating: newRating,
        comment: newComment.trim(),
      });
      if (ok) {
        setNewComment('');
        setReviewSuccess('Thank you! Your review has been added.');
        setTimeout(() => setReviewSuccess(''), 3000);
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const cleanPhone = targetUser.phone ? targetUser.phone.replace(/[^+\d]/g, '') : '';
  const cleanWhatsapp = targetUser.whatsappPhone ? targetUser.whatsappPhone.replace(/\D/g, '') : cleanPhone.replace(/\D/g, '');

  const formatPhoneDisplay = (phoneStr?: string) => {
    if (!phoneStr) return '';
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.startsWith('252')) {
      return `+252 ${digits.slice(3)}`;
    }
    return phoneStr;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-[calc(90px+env(safe-area-inset-bottom))]">
      {/* Container - Max Width ~1120px */}
      <div className="mx-auto max-w-[1120px] px-3.5 sm:px-6 py-4 sm:py-8 min-w-0">
        
        {/* Back button when viewing another profile */}
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {/* 1. Profile Header (Branded Card with Role Specific Colors) */}
        <div className={`overflow-hidden rounded-3xl border border-brand-950/10 p-6 text-white shadow-lg sm:p-8 ${
          targetUser.role === 'employer'
            ? 'bg-emerald-600'
            : targetUser.role === 'admin'
            ? 'bg-amber-600'
            : 'bg-[#2563eb]'
        }`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Profile Photo */}
              <div className="relative shrink-0 self-start sm:self-center">
                <Avatar
                  name={targetUser.name}
                  src={targetUser.avatarUrl}
                  size="xl"
                  eager
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black text-white sm:text-3xl">{targetUser.name}</h1>
                  {targetUser.verified && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      targetUser.role === 'employer'
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
                        : targetUser.role === 'admin'
                        ? 'bg-amber-500/20 text-amber-200 border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  )}
                </div>

                <p className={`mt-1 text-sm font-semibold flex items-center gap-2 ${
                  targetUser.role === 'employer'
                    ? 'text-emerald-100'
                    : targetUser.role === 'admin'
                    ? 'text-amber-100'
                    : 'text-[#93c5fd]'
                }`}>
                  <span>{isWorker ? targetUser.skill || 'Skilled Worker' : targetUser.role === 'admin' ? 'Administrator' : 'Employer'}</span>
                  <span>·</span>
                  <span className="capitalize">{targetUser.role} Account</span>
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/90">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <MapPin className="h-3.5 w-3.5 opacity-80" />
                    {targetUser.location || 'Qardho'}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className={`h-2 w-2 rounded-full ${targetUser.availability === 'busy' ? 'bg-amber-300' : 'bg-emerald-300'}`} />
                    {targetUser.availability === 'busy' ? 'Currently busy' : 'Available for work'}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-[#2563eb] hover:bg-slate-100 transition"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Profile
                  </button>

                  <button
                    onClick={() => navigate('/settings')}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-black text-white hover:bg-white/20 transition"
                  >
                    <SettingsIcon className="h-4 w-4" />
                    Settings
                  </button>
                </>
              ) : (
                <>
                  {isWorker && onConnect && (
                    <button
                      onClick={() => onConnect(targetUser)}
                      disabled={isPendingConnection || isConnected}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#3b82f6] px-5 text-xs font-black text-white hover:bg-[#2563eb] disabled:opacity-60 transition"
                    >
                      <UserCheck className="h-4 w-4" />
                      {isConnected ? 'Connected' : isPendingConnection ? 'Request Pending' : 'Connect'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Candidate Application Context Banner for Employers */}
        {candidateApplication && (
          <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50/80 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">Candidate Application</span>
                  <span className="text-xs font-bold text-slate-800">Job: {candidateApplication.jobTitle}</span>
                </div>
                {candidateApplication.message && (
                  <p className="mt-2 text-xs italic text-slate-600 bg-white/80 rounded-lg p-2.5 border border-brand-100/70">
                    "{candidateApplication.message}"
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {candidateApplication.status === 'pending' && onUpdateApplicationStatus && (
                  <>
                    <button
                      onClick={() => onUpdateApplicationStatus(candidateApplication.id, 'declined')}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                    >
                      <X className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => onUpdateApplicationStatus(candidateApplication.id, 'accepted')}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 transition"
                    >
                      <Check className="h-4 w-4" />
                      <span>Accept & Hire</span>
                    </button>
                  </>
                )}
                {candidateApplication.status === 'accepted' && (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Hired Candidate
                  </span>
                )}
                {candidateApplication.status === 'declined' && (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-rose-100 px-3.5 py-2 text-xs font-bold text-rose-800 border border-rose-200">
                    <X className="h-4 w-4 text-rose-600" />
                    Application Declined
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. Compact Profile Completion Banner */}
        {isOwnProfile && (
          <div className="mt-4">
            {isProfileComplete ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 px-4 py-2.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>✓ Profile complete</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-amber-800">Profile incomplete</p>
                  <p className="mt-0.5 text-xs text-amber-900">
                    Missing: {missingFields.map(f => PROFILE_FIELD_LABELS[f]).join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/profile/edit')}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-amber-600 px-4 text-xs font-black text-white hover:bg-amber-700 transition"
                >
                  Continue Setup
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Main Content + Sidebar Layout (Desktop: 68% / 32%, Gap 24px) */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* Main Column (~68% -> lg:col-span-8) */}
          <div className="space-y-6 lg:col-span-8">
            
            {/* About Section */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-black text-slate-900">
                {isWorker ? 'About me' : 'About the company'}
              </h2>
              <div className="mt-3 text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                {targetUser.bio ? targetUser.bio : (
                  <span className="italic text-slate-400">
                    {isOwnProfile
                      ? 'Add an about description in Edit Profile to let people know about your skills and experience.'
                      : 'No bio description provided.'}
                  </span>
                )}
              </div>
            </section>

            {/* Skills & Offerings (for Workers) */}
            {isWorker && (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <h2 className="text-lg font-black text-slate-900">Skills & Services</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {targetUser.skill ? (
                    targetUser.skill.split(',').map(s => s.trim()).map(skillName => (
                      <span
                        key={skillName}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800"
                      >
                        <Wrench className="h-3.5 w-3.5 text-[#2563eb]" />
                        {skillName}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs italic text-slate-400">No specific skills listed yet.</span>
                  )}
                </div>
              </section>
            )}

            {/* Work & Performance Stats */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-black text-slate-900">Platform Activity</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <span className="block text-[10px] font-black uppercase text-slate-400">Completed Jobs</span>
                  <span className="mt-1 block text-2xl font-black text-slate-900">{completedJobsCount}</span>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <span className="block text-[10px] font-black uppercase text-slate-400">Average Rating</span>
                  <span className="mt-1 flex items-center gap-1 text-2xl font-black text-slate-900">
                    {averageRating ? averageRating : 'N/A'}
                    {averageRating && <Star className="h-5 w-5 text-amber-500 fill-amber-500" />}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 col-span-2 sm:col-span-1">
                  <span className="block text-[10px] font-black uppercase text-slate-400">Reviews Count</span>
                  <span className="mt-1 block text-2xl font-black text-slate-900">{userReviews.length}</span>
                </div>
              </div>
            </section>

            {/* Reviews Section */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {isWorker ? 'Client Reviews & Feedback' : 'Worker Reviews & Verified Feedback'}
                  </h2>
                  {!isWorker && (
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Ratings from skilled workers on completed engagements.
                    </p>
                  )}
                </div>
                {userReviews.length > 0 && (
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    {averageRating} ({userReviews.length} verified review{userReviews.length === 1 ? '' : 's'})
                  </span>
                )}
              </div>

              {/* Employer Category Rating Breakdown */}
              {!isWorker && userReviews.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-4">
                  {[
                    {
                      label: 'Communication',
                      val: (userReviews.reduce((sum, r) => sum + (r.communicationRating || r.rating), 0) / userReviews.length).toFixed(1)
                    },
                    {
                      label: 'Fairness & Respect',
                      val: (userReviews.reduce((sum, r) => sum + (r.fairnessRating || r.rating), 0) / userReviews.length).toFixed(1)
                    },
                    {
                      label: 'Payment Reliability',
                      val: (userReviews.reduce((sum, r) => sum + (r.paymentReliabilityRating || r.rating), 0) / userReviews.length).toFixed(1)
                    },
                    {
                      label: 'Work Description',
                      val: (userReviews.reduce((sum, r) => sum + (r.jobAccuracyRating || r.rating), 0) / userReviews.length).toFixed(1)
                    },
                  ].map((cat) => (
                    <div key={cat.label} className="text-center">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">{cat.label}</span>
                      <span className="mt-1 flex items-center justify-center gap-1 text-sm font-black text-slate-900">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {cat.val}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Review Form for visitors targeting workers */}
              {isWorker && !isOwnProfile && (
                <form onSubmit={submitReview} className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-xs font-black uppercase text-slate-700">Leave a Review</h3>
                  
                  {reviewSuccess && (
                    <p className="mt-2 text-xs font-bold text-emerald-700">{reviewSuccess}</p>
                  )}

                  <div className="mt-3 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        onMouseEnter={() => setRatingHover(star)}
                        onMouseLeave={() => setRatingHover(null)}
                        className="p-1 text-amber-400 focus:outline-none"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            (ratingHover !== null ? star <= ratingHover : star <= newRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-slate-600">{newRating} / 5</span>
                  </div>

                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write honest feedback about working with this person..."
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 outline-none focus:border-[#3b82f6]"
                  />

                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingReview}
                    className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 text-xs font-black text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Submit Review
                  </button>
                </form>
              )}

              {/* Reviews List */}
              <div className="mt-5 space-y-4">
                {userReviews.length > 0 ? (
                  userReviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">
                            {isWorker ? (r.employerName || 'Platform Employer') : (r.workerName || 'Skilled Worker')}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-black text-emerald-800">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Verified completed work
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-amber-500" />
                          <span className="text-xs font-bold text-slate-800">{r.rating} / 5</span>
                        </div>
                      </div>

                      {r.jobTitle && (
                        <p className="text-[11px] font-bold text-slate-500">
                          Work: <span className="text-slate-800">"{r.jobTitle}"</span>
                        </p>
                      )}

                      {r.comment && (
                        <p className="text-xs font-medium text-slate-700 leading-relaxed">{r.comment}</p>
                      )}

                      <p className="text-[10px] font-semibold text-slate-400">
                        Completed {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : 'Recently'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs italic text-slate-400 py-4">No verified reviews submitted yet.</p>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Column (~32% -> lg:col-span-4) */}
          <div className="space-y-6 lg:col-span-4">
            
            {/* Rates & Pricing Card */}
            {isWorker && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Rate & Pricing</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">
                    {targetUser.pricingAmount && targetUser.pricingType
                      ? `${targetUser.pricingCurrency || 'USD'} ${targetUser.pricingAmount}`
                      : targetUser.rate || 'Negotiable'}
                  </span>
                  {targetUser.pricingType && (
                    <span className="text-xs font-bold text-slate-500">/ {targetUser.pricingType}</span>
                  )}
                </div>
                {targetUser.pricingNote && (
                  <p className="mt-2 rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-600 font-medium">
                    {targetUser.pricingNote}
                  </p>
                )}
              </div>
            )}

            {/* Contact & Privacy Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3">Contact Information</span>
              
              {isConnected ? (
                <div className="space-y-3">
                  {targetUser.phone && (
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400">Primary Phone</span>
                        <span className="text-xs font-mono font-bold text-slate-900">{formatPhoneDisplay(targetUser.phone)}</span>
                      </div>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="inline-flex h-9 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white hover:bg-slate-800 transition"
                      >
                        Call
                      </a>
                    </div>
                  )}

                  {(targetUser.whatsappPhone || targetUser.phone) && (
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400">WhatsApp</span>
                        <span className="text-xs font-mono font-bold text-slate-900">{formatPhoneDisplay(targetUser.whatsappPhone || targetUser.phone)}</span>
                      </div>
                      <a
                        href={`https://wa.me/${cleanWhatsapp}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 w-24 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-xs font-black text-slate-950 hover:bg-[#20bd5a] transition"
                      >
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                  <Lock className="mx-auto h-5 w-5 text-slate-400" />
                  <p className="mt-2 text-xs font-bold text-slate-700">Contact details protected</p>
                  <p className="mt-1 text-[11px] text-slate-500">Contact details available after connection request is accepted.</p>
                </div>
              )}
            </div>

            {/* Quick Details Sidebar Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Profile Overview</span>
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-500">Location</span>
                <span className="text-xs font-black text-slate-900">{targetUser.location || 'Qardho'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-500">Primary Skill</span>
                <span className="text-xs font-black text-slate-900">{targetUser.skill || 'Worker'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-500">Availability</span>
                <span className={`text-xs font-black capitalize ${targetUser.availability === 'busy' ? 'text-amber-600' : 'text-emerald-700'}`}>
                  {targetUser.availability === 'busy' ? 'Busy' : 'Available'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Verification</span>
                <span className="text-xs font-black text-slate-900">
                  {targetUser.verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sticky Action Bar for Worker viewing Employer Direct Offer */}
      {directOffer && (directOffer.status === 'pending' || directOffer.status === 'pending_worker_response') && (
        <div className="fixed bottom-0 inset-x-0 z-50 border-t border-brand-200 bg-white/95 p-4 backdrop-blur shadow-2xl">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-900 border border-purple-200">
                Direct Offer from {targetUser.name}
              </span>
              <span className="text-xs font-semibold text-slate-600 hidden sm:inline">Review profile and respond to the direct offer</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateConnectionStatus && onUpdateConnectionStatus(directOffer.id, 'declined')}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 text-xs font-bold text-red-600 hover:bg-red-50 transition"
              >
                <X className="h-4 w-4" />
                <span>Decline</span>
              </button>
              <button
                onClick={() => onUpdateConnectionStatus && onUpdateConnectionStatus(directOffer.id, 'accepted')}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition"
              >
                <Check className="h-4 w-4" />
                <span>Accept Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Action Bar for Employer viewing Worker Application */}
      {candidateApplication && candidateApplication.status === 'pending' && (
        <div className="fixed bottom-0 inset-x-0 z-50 border-t border-brand-200 bg-white/95 p-4 backdrop-blur shadow-2xl">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900 border border-blue-200">
                Application for {candidateApplication.jobTitle}
              </span>
              <span className="text-xs font-semibold text-slate-600 hidden sm:inline">Applicant: {targetUser.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateApplicationStatus && onUpdateApplicationStatus(candidateApplication.id, 'declined')}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 text-xs font-bold text-red-600 hover:bg-red-50 transition"
              >
                <X className="h-4 w-4" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => onUpdateApplicationStatus && onUpdateApplicationStatus(candidateApplication.id, 'accepted')}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition"
              >
                <Check className="h-4 w-4" />
                <span>Accept & Hire</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
