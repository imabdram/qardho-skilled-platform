import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Briefcase, LayoutDashboard, LogIn, LogOut, Menu, User, X } from 'lucide-react';
import { User as UserType, Connection, Application, Job, Review } from '../types';
import { PAGE_ROUTES } from '../routes';

interface NavbarProps {
  currentUser: UserType | null;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  workersCount: number;
  jobsCount: number;
  onSwitchRole: () => void;
  isSwitchingRole?: boolean;
  connections?: Connection[];
  applications?: Application[];
  jobs?: Job[];
  reviews?: Review[];
}

export default function Navbar({ 
  currentUser, 
  currentPage, 
  onNavigate, 
  onLogout, 
  workersCount, 
  jobsCount, 
  onSwitchRole,
  isSwitchingRole = false,
  connections = [],
  applications = [],
  jobs = [],
  reviews = []
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setShowNotifications(false);
  };

  const navigate = (page: string) => {
    onNavigate(page);
    closeMenus();
  };

  // Compute active notifications / new actions based on connections and applications
  const notifications = useMemo(() => {
    if (!currentUser) return [];

    const list: Array<{
      id: string;
      type: 'connection' | 'application' | 'job' | 'review';
      title: string;
      description: string;
      date: string;
      status: 'pending' | 'accepted' | 'declined';
    }> = [];

    if (currentUser.role === 'worker') {
      // 1. Incoming connection requests (from employers trying to hire this worker)
      connections
        .filter(c => c.toUserId === currentUser.id)
        .forEach(c => {
          list.push({
            id: `conn-${c.id}`,
            type: 'connection',
            title: c.status === 'pending' ? 'New Connection Request' : 'Connection Request Update',
            description: c.status === 'pending' 
              ? `${c.fromUserName} wants to hire you for a skilled job in Qardho.`
              : `Connection with ${c.fromUserName} is now ${c.status}.`,
            date: c.createdAt,
            status: c.status,
          });
        });

      // 2. Outgoing application status updates (this worker applied for a job)
      applications
        .filter(a => a.applicantId === currentUser.id)
        .forEach(a => {
          list.push({
            id: `app-${a.id}`,
            type: 'application',
            title: `Job Application ${a.status === 'pending' ? 'Submitted' : 'Updated'}`,
            description: a.status === 'pending'
              ? `You applied for "${a.jobTitle}". Status is pending.`
              : `Your application for "${a.jobTitle}" was ${a.status} by the employer.`,
            date: a.createdAt,
            status: a.status,
          });
        });

      jobs
        .filter(j => j.assignedWorkerId === currentUser.id && j.status === 'in_progress' && j.completionRequestedAt)
        .forEach(j => {
          list.push({ id: `job-complete-request-${j.id}`, type: 'job', title: 'Work Completion Requested', description: `Employer marked "${j.title}" ready. Confirm completion if the work is finished.`, date: j.completionRequestedAt || j.createdAt, status: 'pending' });
        });

      jobs
        .filter(j => j.assignedWorkerId === currentUser.id && j.status === 'completed')
        .forEach(j => {
          list.push({ id: `job-completed-${j.id}`, type: 'job', title: 'Job Completed', description: `"${j.title}" is completed.`, date: j.workerCompletedAt || j.createdAt, status: 'accepted' });
        });
    } else if (currentUser.role === 'employer') {
      // 1. Incoming job applications (from workers applying to this employer's jobs)
      applications
        .filter(a => a.employerId === currentUser.id)
        .forEach(a => {
          list.push({
            id: `app-${a.id}`,
            type: 'application',
            title: a.status === 'pending' ? 'New Job Application' : 'Application Handled',
            description: a.status === 'pending'
              ? `${a.applicantName} applied for your job "${a.jobTitle}".`
              : `Application from ${a.applicantName} for "${a.jobTitle}" was ${a.status}.`,
            date: a.createdAt,
            status: a.status,
          });
        });

      // 2. Outgoing connection requests status updates (this employer contacted a worker)
      connections
        .filter(c => c.fromUserId === currentUser.id)
        .forEach(c => {
          list.push({
            id: `conn-${c.id}`,
            type: 'connection',
            title: `Hire Connection Request ${c.status === 'pending' ? 'Sent' : 'Accepted'}`,
            description: c.status === 'pending'
              ? `Request sent to ${c.toUserName} is pending response.`
              : `${c.toUserName} has ${c.status} your hire connection request!`,
            date: c.createdAt,
            status: c.status,
          });
        });

      jobs
        .filter(j => j.employerId === currentUser.id && j.status === 'in_progress' && j.completionRequestedAt)
        .forEach(j => {
          list.push({ id: `job-waiting-worker-${j.id}`, type: 'job', title: 'Waiting for Worker Confirmation', description: `"${j.title}" is waiting for the worker to confirm completion.`, date: j.completionRequestedAt || j.createdAt, status: 'pending' });
        });

      jobs
        .filter(j => j.employerId === currentUser.id && j.status === 'completed' && !reviews.some(r => r.jobId === j.id && r.employerId === currentUser.id))
        .forEach(j => {
          list.push({ id: `review-needed-${j.id}`, type: 'review', title: 'Review Needed', description: `Leave feedback for the completed job "${j.title}".`, date: j.workerCompletedAt || j.createdAt, status: 'pending' });
        });
    }

    // Sort by date (latest first) or status pending first
    return list.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [connections, applications, jobs, reviews, currentUser]);

  const activeNotifications = notifications.filter(n => !dismissedIds.includes(n.id));
  const pendingCount = activeNotifications.filter(n => n.status === 'pending').length;

  return (
    <header className={`bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-shadow duration-200 ${hasScrolled ? 'border-b border-slate-200 shadow-sm' : 'border-b border-slate-100'}`} id="main-navbar">
      <nav aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[70px] gap-4">
          {/* Logo Brand */}
          <div className="flex items-center">
            <button
              onClick={() => navigate('home')}
              className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer"
              id="brand-logo-btn"
            >
              <div className="text-left">
                <span className="text-lg font-black text-slate-900 tracking-tight block leading-none">
                  Xirfad
                </span>
                <span className="text-xs font-bold text-blue-600 tracking-wider block uppercase mt-0.5">
                  Qardho
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {(!currentUser || currentUser.role === 'employer') && (
              <Link
                to={PAGE_ROUTES.workers}
                onClick={closeMenus}
                className={`flex min-h-11 items-center space-x-2.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  currentPage === 'workers'
                    ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-400 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100'
                }`}
                id="nav-workers-btn"
              >
                <span>Find Skilled Workers</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${
                  currentPage === 'workers'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {workersCount}
                </span>
              </Link>
            )}

            {(!currentUser || currentUser.role === 'worker') && (
              <Link
                to={PAGE_ROUTES.jobs}
                onClick={closeMenus}
                className={`flex min-h-11 items-center space-x-2.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  currentPage === 'jobs'
                    ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-400 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100'
                }`}
                id="nav-jobs-btn"
              >
                <span>Browse Job Postings</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${
                  currentPage === 'jobs'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {jobsCount}
                </span>
              </Link>
            )}

            {currentUser && (
              <>
                <button
                  onClick={() => navigate('dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                    currentPage === 'dashboard'
                      ? 'bg-slate-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  id="nav-dashboard-btn"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </button>


                {/* Notifications Bell next to Profile */}
                <div className='relative hidden md:inline-block text-left' id='notifications-menu'>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-center relative ${
                      showNotifications
                        ? 'bg-slate-100 text-slate-950 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    title="Recent Actions & Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {pendingCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotifications(false)} />
                      <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1 overflow-hidden animate-fade-in">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">New Actions ({pendingCount})</span>
                          {activeNotifications.length > 0 && (
                            <button
                              onClick={() => setDismissedIds(notifications.map(n => n.id))}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                        
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                          {activeNotifications.length === 0 ? (
                            <div className="p-6 text-center text-slate-400">
                              <Bell className="h-8 w-8 mx-auto stroke-1 mb-2 text-slate-300" />
                              <p className="text-xs font-medium">All caught up! No new actions.</p>
                            </div>
                          ) : (
                            activeNotifications.map(item => (
                              <div key={item.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-start space-x-3 text-left">
                                <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                                  item.status === 'pending'
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                    : item.status === 'accepted'
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                  {item.type === 'connection' ? <User className="h-3.5 w-3.5" /> : <Briefcase className="h-3.5 w-3.5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 truncate">{item.title}</span>
                                    {item.status === 'pending' && (
                                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 ml-1.5 animate-pulse"></span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
                                  <div className="mt-2.5 flex items-center justify-between pt-1">
                                    <button
                                      onClick={() => {
                                        onNavigate('dashboard');
                                        setShowNotifications(false);
                                      }}
                                      className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold"
                                    >
                                      Go to Dashboard
                                    </button>
                                    <button
                                      onClick={() => setDismissedIds(prev => [...prev, item.id])}
                                      className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                                    >
                                      Dismiss
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => navigate('profile')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                    currentPage === 'profile'
                      ? 'bg-slate-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  id="nav-profile-btn"
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </button>
              </>
            )}
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-controls="mobile-navigation-menu"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className='hidden md:flex order-1 flex-col text-right'>
                  <span className="text-xs font-black text-slate-900 leading-none">
                    {currentUser.name}
                  </span>
                </div>

                <div className='hidden md:block order-3'>
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border shadow-xs ${
                      currentUser.role === 'worker'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-200/80'
                    }`}
                    title={`Active mode: ${currentUser.role === 'worker' ? 'Worker' : 'Employer'}`}
                    aria-label={`Active mode: ${currentUser.role === 'worker' ? 'Worker' : 'Employer'}`}
                  >
                    {currentUser.role === 'worker' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Briefcase className="h-4 w-4" />
                    )}
                  </span>
                </div>

                {/* Mobile Notification Button next to Profile */}
                <div className='relative order-2 inline-block text-left mr-1' id='notifications-menu-mobile'>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-center relative ${
                      showNotifications ? 'bg-slate-100 text-slate-950 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    title="Recent Actions & Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {pendingCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotifications(false)} />
                      <div className="fixed left-3 right-3 top-[76px] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1 overflow-hidden animate-fade-in">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">New Actions ({pendingCount})</span>
                          {activeNotifications.length > 0 && (
                            <button
                              onClick={() => setDismissedIds(notifications.map(n => n.id))}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                        
                        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
                          {activeNotifications.length === 0 ? (
                            <div className="p-5 text-center text-slate-400">
                              <Bell className="h-6 w-6 mx-auto stroke-1 mb-2 text-slate-300" />
                              <p className="text-xs font-medium">No new actions.</p>
                            </div>
                          ) : (
                            activeNotifications.map(item => (
                              <div key={item.id} className="p-3 hover:bg-slate-50 transition-colors flex items-start space-x-2 text-left">
                                <div className={`p-1.5 rounded-lg shrink-0 ${
                                  item.status === 'pending'
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                  {item.type === 'connection' ? <User className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[11px] font-bold text-slate-800 block truncate">{item.title}</span>
                                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{item.description}</p>
                                  <div className="mt-2 flex items-center justify-between">
                                    <button
                                      onClick={() => {
                                        onNavigate('dashboard');
                                        setShowNotifications(false);
                                      }}
                                      className="text-[9px] text-blue-600 hover:underline font-bold"
                                    >
                                      View
                                    </button>
                                    <button
                                      onClick={() => setDismissedIds(prev => [...prev, item.id])}
                                      className="text-[9px] text-slate-400 hover:text-slate-600 font-semibold"
                                    >
                                      Dismiss
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => navigate('profile')}
                  className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                  title="Profile"
                  id="nav-profile-mobile"
                >
                  <User className="h-5 w-5" />
                </button>

                <button
                  onClick={onLogout}
                  className='order-5 inline-flex items-center space-x-1 px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors cursor-pointer'
                  id="nav-logout-btn"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  to={PAGE_ROUTES.auth}
                  onClick={closeMenus}
                  className="inline-flex items-center space-x-1 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  id="nav-signin-btn"
                >
                  <LogIn className="h-4 w-4 text-slate-500" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to={PAGE_ROUTES.register}
                  onClick={closeMenus}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  id="nav-signup-btn"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar bottom drawer */}
        <div className="md:hidden sticky top-[70px] z-40 flex items-center justify-around py-2 border-t border-slate-100 overflow-x-auto space-x-1 bg-white/95 backdrop-blur" id="mobile-navbar-actions">
          {(!currentUser || currentUser.role === 'employer') && (
            <Link
              to={PAGE_ROUTES.workers}
              onClick={closeMenus}
              className={`flex-1 rounded-lg border px-2 py-2 text-center text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                currentPage === 'workers' ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-400 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100'
              }`}
            >
              <span className="leading-tight">Find Skilled Workers</span>
              <span className="text-[10px] px-1.5 bg-blue-50 text-blue-600 rounded-full font-bold">{workersCount}</span>
            </Link>
          )}
          {(!currentUser || currentUser.role === 'worker') && (
            <Link
              to={PAGE_ROUTES.jobs}
              onClick={closeMenus}
              className={`flex-1 rounded-lg border px-2 py-2 text-center text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                currentPage === 'jobs' ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-400 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100'
              }`}
            >
              <span className="leading-tight">Browse Job Postings</span>
              <span className="text-[10px] px-1.5 bg-slate-100 text-slate-600 rounded-full font-bold">{jobsCount}</span>
            </Link>
          )}
          {currentUser && (
            <>
              <button
                onClick={() => navigate('dashboard')}
                className={`flex-1 text-center py-1 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center ${
                  currentPage === 'dashboard' ? 'text-blue-600 bg-slate-50' : 'text-slate-600'
                }`}
              >
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => navigate('profile')}
                className={`flex-1 text-center py-1 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center ${
                  currentPage === 'profile' ? 'text-blue-600 bg-slate-50' : 'text-slate-600'
                }`}
              >
                <span>Profile</span>
              </button>
            </>
          )}
        </div>
      </div>
      </nav>
    </header>
  );
}







