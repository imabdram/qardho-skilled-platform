import React, { useState } from 'react';
import { User, Save, MapPin, Phone, Briefcase, DollarSign, Edit3, CheckCircle, Bell, Star, ArrowLeft, Send, ShieldCheck } from 'lucide-react';
import { User as UserType, Review, Connection, Job, Application } from '../types';
import { QARDHO_NEIGHBORHOODS } from '../constants';

interface ProfileProps {
  currentUser: UserType | null;
  userToShow?: UserType | null;
  onUpdateProfile: (updatedProfile: UserType) => void;
  onSwitchRole: () => void;
  reviews: Review[];
  jobs: Job[];
  applications: Application[];
  onAddReview: (review: { workerId: string; employerId: string; employerName: string; jobId: string; jobTitle: string; rating: number; comment: string }) => Promise<boolean>;
  connections: Connection[];
  onBack?: () => void;
  onConnect?: (worker: UserType) => void;
}

export default function Profile({ 
  currentUser, 
  userToShow, 
  onUpdateProfile, 
  onSwitchRole,
  reviews = [],
  jobs = [],
  applications = [],
  onAddReview,
  connections = [],
  onBack,
  onConnect
}: ProfileProps) {
  if (!currentUser) return null;

  // The profile target user can be another worker we are viewing, or the current user
  const targetUser = userToShow || currentUser;
  const isOwnProfile = targetUser.id === currentUser.id;

  // Form edit states (for own profile)
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [skill, setSkill] = useState(currentUser.skill || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [rate, setRate] = useState(currentUser.rate || '');
  const [availability, setAvailability] = useState(currentUser.availability || 'available');
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(currentUser.smsNotificationsEnabled ?? true);
  const [successMsg, setSuccessMsg] = useState('');

  // Review submission states
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [selectedReviewJobId, setSelectedReviewJobId] = useState<string>('');
  const [reviewSuccess, setReviewSuccess] = useState<string>('');
  const [ratingHover, setRatingHover] = useState<number | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserType = {
      ...currentUser,
      name,
      phone,
      location,
      skill: currentUser.role === 'worker' ? skill : undefined,
      bio,
      rate: currentUser.role === 'worker' ? rate : undefined,
      availability: currentUser.role === 'worker' ? availability : currentUser.availability,
      smsNotificationsEnabled,
    };
    onUpdateProfile(updated);
    setIsEditing(false);
    setSuccessMsg('Your profile has been successfully updated.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reviewJob = completedReviewJobs.find((job) => job.id === selectedReviewJobId) || completedReviewJobs[0];
    if (!newComment.trim() || !reviewJob) return;

    const saved = await onAddReview({
      workerId: targetUser.id,
      employerId: currentUser.id,
      employerName: currentUser.name,
      jobId: reviewJob.id,
      jobTitle: reviewJob.title,
      rating: newRating,
      comment: newComment.trim(),
    });

    if (saved) {
      setNewComment('');
      setNewRating(5);
      setSelectedReviewJobId('');
      setReviewSuccess('Thank you! Your verified feedback and rating have been posted.');
      setTimeout(() => setReviewSuccess(''), 4000);
    }
  };
  // Profile data for avatar initials
  const colors = ['bg-blue-100 text-blue-800', 'bg-emerald-100 text-emerald-800', 'bg-purple-100 text-purple-800', 'bg-amber-100 text-amber-800', 'bg-rose-100 text-rose-800'];
  const colorIndex = targetUser.name.charCodeAt(0) % colors.length;
  const colorClass = colors[colorIndex];
  
  const initials = targetUser.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('');

  // Calculate rating stats for target user
  const targetReviews = reviews.filter(r => r.workerId === targetUser.id);
  const reviewCount = targetReviews.length;
  const avgRating = reviewCount > 0
    ? (targetReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
    : null;

  // Check if current user is an employer and has an accepted connection (hired this worker)
  const isEmployer = currentUser.role === 'employer';
  const hasHired = connections.some(
    c => c.fromUserId === currentUser.id && c.toUserId === targetUser.id && c.status === 'accepted'
  );

  const profileChecks = [
    { label: 'Basic info', complete: !!targetUser.name?.trim() && !!targetUser.bio?.trim(), weight: 40 },
    { label: 'Skill and rate', complete: targetUser.role !== 'worker' || (!!targetUser.skill?.trim() && !!targetUser.rate?.trim()), weight: 30 },
    { label: 'Contact and availability', complete: !!targetUser.phone?.trim() && !!targetUser.location?.trim() && (targetUser.role !== 'worker' || !!targetUser.availability), weight: 30 },
  ];
  const profileStrength = profileChecks.reduce((total, item) => total + (item.complete ? item.weight : 0), 0);
  const hasAcceptedApplicationForTarget = applications.some((app) =>
    app.employerId === currentUser.id &&
    app.applicantId === targetUser.id &&
    app.status === 'accepted'
  );
  const canSeeTargetPhone = isOwnProfile || hasHired || hasAcceptedApplicationForTarget;
  const completedReviewJobs = jobs.filter((job) => {
    if (job.employerId !== currentUser.id || job.status !== 'completed') return false;
    const acceptedApplication = applications.some((app) =>
      app.jobId === job.id &&
      app.employerId === currentUser.id &&
      app.applicantId === targetUser.id &&
      app.status === 'accepted'
    );
    const alreadyReviewed = reviews.some((review) =>
      review.jobId === job.id &&
      review.workerId === targetUser.id &&
      review.employerId === currentUser.id
    );
    return acceptedApplication && !alreadyReviewed;
  });
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="profile-page">
      
      {/* Navigation back button for public view */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-5 inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 hover:bg-slate-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
          id="profile-back-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Directory</span>
        </button>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        
        {/* Profile Header backdrop */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-sky-600 relative">
          <div className="absolute -bottom-10 left-8">
            <div className={`h-20 w-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center font-extrabold text-xl tracking-wider ${colorClass}`}>
              {initials}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-8 pt-14 pb-8">
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{targetUser.name}</h1>
                {targetUser.role === 'worker' && avgRating && (
                  <div className="flex items-center space-x-1 text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg text-xs font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-500" />
                    <span>{avgRating}</span>
                  </div>
                )}
                {targetUser.role === 'worker' && targetUser.verified && (
                  <div className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg text-xs font-bold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
              <div className="flex items-center mt-1.5 space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  targetUser.role === 'worker'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200/80'
                    : 'bg-indigo-100 text-indigo-800 border-indigo-200/80'
                }`}>
                  {targetUser.role === 'worker' ? 'Skilled Worker' : 'Employer'}
                </span>
                
                {targetUser.role === 'worker' && targetUser.skill && (
                  <span className="text-xs text-slate-500 font-semibold">- {targetUser.skill}</span>
                )}
              </div>
            </div>

            {isOwnProfile && !isEditing && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-all"
                  id="edit-profile-trigger"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            )}
          </div>

          {isOwnProfile && (
            <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black text-slate-900">Profile strength</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Complete profiles get more trust from employers and workers.</p>
                </div>
                <span className="text-2xl font-black text-slate-950">{profileStrength}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${profileStrength}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {profileChecks.map(item => (
                  <div key={item.label} className={`rounded-lg border px-3 py-2 text-[11px] font-bold ${item.complete ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
                    {item.complete ? 'Done' : 'Missing'}: {item.label}
                  </div>
                ))}
              </div>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-800 flex items-center space-x-1.5 animate-fade-in">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isEditing && isOwnProfile ? (
            <form onSubmit={handleSave} className="space-y-4" id="profile-edit-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+252 90 XXXXXXX"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Neighborhood (Optional)</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select neighborhood</option>
                    {QARDHO_NEIGHBORHOODS.map((neighborhood) => (
                      <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                    ))}
                  </select>
                </div>

                {currentUser.role === 'worker' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Trade Skill / Specialty</label>
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      placeholder="e.g. Electrician, Carpenter, Mason"
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>
                )}
              </div>

              {currentUser.role === 'worker' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Expected Rate (e.g., Daily Rate)</label>
                    <input
                      type="text"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      placeholder="e.g. $15 / day, $200 total"
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Availability</label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value as 'available' | 'busy' | 'unavailable')}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Bio / Profile Description</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Provide details about your experience, training, past work projects, or neighborhood service terms..."
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                ></textarea>
              </div>

              {/* Notification Settings Block */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center">
                  <Bell className="h-4 w-4 mr-1.5 text-blue-500" />
                  <span>Notification Settings</span>
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Choose how you want to be notified of new activity on Xirfad Qardho.
                </p>
                
                <label className="flex items-start space-x-3 p-3.5 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors border border-slate-100">
                  <input
                    type="checkbox"
                    checked={smsNotificationsEnabled}
                    onChange={(e) => setSmsNotificationsEnabled(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500/20 border-slate-300 rounded-sm cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">
                      Enable SMS Alerts
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5 leading-relaxed">
                      Receive direct mobile SMS notifications on <strong className="text-slate-700 font-bold">{phone || currentUser.phone || 'your phone number'}</strong> for new relevant job postings or direct connection requests.
                    </span>
                  </div>
                </label>
              </div>

              {/* Edit Buttons */}
              <div className="flex space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 px-4 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6" id="profile-details-view">
              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Neighborhood</span>
                  <div className="flex items-center text-sm font-semibold text-slate-800">
                    <MapPin className="h-4 w-4 text-slate-400 mr-1.5 shrink-0" />
                    <span>{targetUser.location ? `Qardho - ${targetUser.location}` : 'Location Not Specified'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Direct Phone Contact</span>
                  <div className="flex items-center text-sm font-semibold text-slate-800">
                    <Phone className="h-4 w-4 text-slate-400 mr-1.5 shrink-0" />
                    <span>{canSeeTargetPhone ? (targetUser.phone || 'No phone set yet') : 'Contact unlocks after accepted application or hire request.'}</span>
                  </div>
                </div>

                {targetUser.role === 'worker' && (
                  <>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Skill / Trade</span>
                      <div className="flex items-center text-sm font-semibold text-slate-800">
                        <Briefcase className="h-4 w-4 text-slate-400 mr-1.5 shrink-0" />
                        <span>{targetUser.skill || 'No skill set'}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standard Rate</span>
                      <div className="flex items-center text-sm font-semibold text-slate-800">
                        <DollarSign className="h-4 w-4 text-slate-400 mr-1.5 shrink-0" />
                        <span>{targetUser.rate || 'Negotiable'}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Availability</span>
                      <div className="flex items-center text-sm font-semibold text-slate-800">
                        <span className={`h-2.5 w-2.5 rounded-full mr-2 ${
                          targetUser.availability === 'busy'
                            ? 'bg-amber-500'
                            : targetUser.availability === 'unavailable'
                              ? 'bg-rose-500'
                              : 'bg-emerald-500'
                        }`} />
                        <span className="capitalize">{targetUser.availability || 'available'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Bio block */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">About / Business Bio</span>
                <p className="text-sm text-slate-600 leading-relaxed font-normal bg-white border border-slate-50 p-4 rounded-xl">
                  {targetUser.bio || 'No bio provided.'}
                </p>
              </div>

              {/* SMS Notification Preferences Banner (Only on own profile) */}
              {isOwnProfile && (
                <div className="border-t border-slate-100 pt-5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Notification Preferences</span>
                  <div className="flex items-center space-x-3.5 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
                    <div className={`p-2.5 rounded-lg ${targetUser.smsNotificationsEnabled !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {targetUser.smsNotificationsEnabled !== false ? (
                        <Bell className="h-4 w-4 animate-bounce" style={{ animationDuration: '3s' }} />
                      ) : (
                        <Bell className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-800 block">
                        SMS Notification Alerts: {targetUser.smsNotificationsEnabled !== false ? 'Enabled' : 'Disabled'}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5 leading-normal">
                        {targetUser.smsNotificationsEnabled !== false 
                          ? `Receiving instant alerts on ${targetUser.phone || 'your phone number'}` 
                          : 'Alerts are currently paused. Enable them in your profile settings.'}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      targetUser.smsNotificationsEnabled !== false 
                        ? 'bg-emerald-100/50 text-emerald-800 border-emerald-200/50' 
                        : 'bg-slate-150 text-slate-600 border border-slate-200/60'
                    }`}>
                      {targetUser.smsNotificationsEnabled !== false ? 'Active' : 'Muted'}
                    </span>
                  </div>
                </div>
              )}

              {/* Star-based Rating & Review System */}
              {targetUser.role === 'worker' && (
                <div className="border-t border-slate-100 pt-6 mt-6" id="rating-review-system">
                  
                  {/* Reviews Title */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Worker Ratings & Verified Reviews</h2>
                      <p className="text-[11px] text-slate-500">Verified feedback and satisfaction scores from local Qardho clients.</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-black text-slate-800">{avgRating || 'New'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{reviewCount} reviews total</span>
                    </div>
                  </div>

                  {/* Submit review section for employers */}
                  {!isOwnProfile && isEmployer && (
                    <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 mb-6">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center">
                        <Star className="h-4 w-4 mr-1.5 text-blue-500 fill-blue-100" />
                        <span>Provide Work Feedback</span>
                      </h3>

                      {reviewSuccess && (
                        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-800 flex items-center space-x-1.5 animate-fade-in">
                          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{reviewSuccess}</span>
                        </div>
                      )}

                      {/* Require Connection check for leaving reviews (with simple demo override) */}
                      {completedReviewJobs.length > 0 ? (
                        <form onSubmit={handleReviewSubmit} className="space-y-3.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Completed Job
                            </label>
                            <select
                              value={selectedReviewJobId || completedReviewJobs[0]?.id || ''}
                              onChange={(e) => setSelectedReviewJobId(e.target.value)}
                              className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                              required
                            >
                              {completedReviewJobs.map((job) => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Select Rating Score
                            </label>
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((starValue) => {
                                const isHighlighted = ratingHover !== null 
                                  ? starValue <= ratingHover
                                  : starValue <= newRating;
                                return (
                                  <button
                                    key={starValue}
                                    type="button"
                                    onClick={() => setNewRating(starValue)}
                                    onMouseEnter={() => setRatingHover(starValue)}
                                    onMouseLeave={() => setRatingHover(null)}
                                    className="p-1 cursor-pointer transition-transform duration-100 hover:scale-125 focus:outline-hidden"
                                    title={`${starValue} Stars`}
                                  >
                                    <Star 
                                      className={`h-6 w-6 ${
                                        isHighlighted 
                                          ? 'text-amber-400 fill-amber-400 stroke-amber-500' 
                                          : 'text-slate-300 fill-transparent'
                                      }`} 
                                    />
                                  </button>
                                );
                              })}
                              <span className="text-xs font-bold text-slate-600 ml-2">
                                {newRating === 5 ? 'Excellent (5/5)' :
                                 newRating === 4 ? 'Good (4/5)' :
                                 newRating === 3 ? 'Average (3/5)' :
                                 newRating === 2 ? 'Disappointing (2/5)' : 'Poor (1/5)'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Review Comment
                            </label>
                            <textarea
                              rows={3}
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder={`Describe your experience hiring ${targetUser.name}. Was the work quality good? Did they deliver on time?`}
                              className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-colors"
                          >
                            <span>Publish Feedback</span>
                          </button>
                        </form>
                      ) : (
                        <div className="p-4 bg-slate-100/50 border border-slate-200/50 rounded-xl text-slate-600 text-xs">
                          <p className="leading-relaxed font-semibold mb-3">
                            Reviews unlock after you accept this worker for a job and mark that job as completed. Each completed job can be reviewed once.
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            {onConnect && (
                              <button
                                onClick={() => onConnect(targetUser)}
                                className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                              >
                                <Send className="h-3 w-3" />
                                <span>Connect & Hire Now</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {targetReviews.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <Star className="h-8 w-8 mx-auto text-slate-300 stroke-1 mb-2" />
                        <p className="text-xs font-semibold text-slate-500">No client feedback reviews yet.</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Be the first client to leave a review after hiring!</p>
                      </div>
                    ) : (
                      targetReviews.map((rev) => (
                        <div key={rev.id} className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs" id={`review-card-${rev.id}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-xs">
                                {rev.employerName.split(' ').map(n => n[0]).slice(0,2).join('')}
                              </div>
                              <div>
                                <span className="text-xs font-extrabold text-slate-800 block leading-tight">{rev.employerName}</span>
                                <span className="text-[9px] text-slate-400 block font-medium mt-0.5">
                                  {rev.jobTitle ? `${rev.jobTitle} - ` : ''}{new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                            
                            {/* Score Display */}
                            <div className="flex items-center space-x-0.5 text-amber-400 bg-amber-50/50 border border-amber-100/50 px-1.5 py-0.5 rounded-md text-[10px] font-black">
                              <Star className="h-3 w-3 fill-amber-400 stroke-amber-500" />
                              <span className="text-amber-800">{rev.rating}</span>
                            </div>
                          </div>
                          
                          <p className="mt-3 text-xs text-slate-600 leading-relaxed font-normal italic bg-slate-50/40 p-3 rounded-lg border border-slate-50">
                            "{rev.comment}"
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}




