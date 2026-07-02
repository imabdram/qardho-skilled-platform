import React, { useState, useMemo } from 'react';
import { Briefcase, User, LogOut, LogIn, LayoutDashboard, PlusCircle, RefreshCw, Bell } from 'lucide-react';
import { User as UserType, Connection, Application } from '../types';

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
  applications = []
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Compute active notifications / new actions based on connections and applications
  const notifications = useMemo(() => {
    if (!currentUser) return [];

    const list: Array<{
      id: string;
      type: 'connection' | 'application';
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
    }

    // Sort by date (latest first) or status pending first
    return list.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [connections, applications, currentUser]);

  const activeNotifications = notifications.filter(n => !dismissedIds.includes(n.id));
  const pendingCount = activeNotifications.filter(n => n.status === 'pending').length;

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-xs" id="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center focus:outline-hidden cursor-pointer"
              id="brand-logo-btn"
            >
              <div className="text-left">
                <span className="text-lg font-black text-slate-900 tracking-tight block leading-none">
                  Skills Hub
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
              <button
                onClick={() => onNavigate('workers')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  currentPage === 'workers'
                    ? 'bg-slate-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="nav-workers-btn"
              >
                <span>Find Skilled Workers</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  currentPage === 'workers'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {workersCount}
                </span>
              </button>
            )}

            {(!currentUser || currentUser.role === 'worker') && (
              <button
                onClick={() => onNavigate('jobs')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  currentPage === 'jobs'
                    ? 'bg-slate-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="nav-jobs-btn"
              >
                <span>Browse Job Postings</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  currentPage === 'jobs'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {jobsCount}
                </span>
              </button>
            )}

            {currentUser && (
              <>
                <button
                  onClick={() => onNavigate('dashboard')}
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

                {currentUser.role === 'employer' && (
                  <button
                    onClick={() => onNavigate('post-job')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                      currentPage === 'post-job'
                        ? 'bg-slate-50 text-blue-600 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    id="nav-post-job-btn"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Post a Job</span>
                  </button>
                )}

                {/* Notifications Bell next to Profile */}
                <div className="relative inline-block text-left" id="notifications-menu">
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
                  onClick={() => onNavigate('profile')}
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
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-black text-slate-900 leading-none">
                    {currentUser.name}
                  </span>
                </div>

                {/* Clean, icon-free Active Role badge next to Switch Role button */}
                <div className="hidden md:block">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-xs ${
                    currentUser.role === 'worker'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200/80'
                  }`}>
                    Active Mode: {currentUser.role}
                  </span>
                </div>

                 <button
                  onClick={onSwitchRole}
                  disabled={isSwitchingRole}
                  className={`hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                    isSwitchingRole
                      ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                  title={`Switch to ${currentUser.role === 'worker' ? 'Employer' : 'Worker'} role`}
                  id="nav-switch-role-desktop"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSwitchingRole ? 'animate-spin' : ''}`} />
                  <span>{isSwitchingRole ? 'Switching...' : `Switch to ${currentUser.role === 'worker' ? 'Employer' : 'Worker'}`}</span>
                </button>
                
                {/* Mobile action icons or quick Nav buttons */}
                <button
                  onClick={onSwitchRole}
                  disabled={isSwitchingRole}
                  className={`md:hidden p-2 rounded-lg cursor-pointer border transition-all ${
                    isSwitchingRole
                      ? 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed'
                      : 'text-slate-600 bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                  title={`Switch to ${currentUser.role === 'worker' ? 'Employer' : 'Worker'}`}
                  id="nav-switch-role-mobile"
                >
                  <RefreshCw className={`h-4 w-4 shrink-0 ${isSwitchingRole ? 'animate-spin' : ''}`} />
                </button>

                {/* Mobile Notification Button next to Profile */}
                <div className="relative md:hidden inline-block text-left mr-1" id="notifications-menu-mobile">
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
                      <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1 overflow-hidden animate-fade-in">
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
                        
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
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
                  onClick={() => onNavigate('profile')}
                  className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                  title="Profile"
                  id="nav-profile-mobile"
                >
                  <User className="h-5 w-5" />
                </button>

                <button
                  onClick={onLogout}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors cursor-pointer"
                  id="nav-logout-btn"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigate('auth')}
                  className="inline-flex items-center space-x-1 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                  id="nav-signin-btn"
                >
                  <LogIn className="h-4 w-4 text-slate-500" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => onNavigate('auth')}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg shadow-sm cursor-pointer"
                  id="nav-signup-btn"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar bottom drawer */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 overflow-x-auto space-x-1 bg-white" id="mobile-navbar-actions">
          {(!currentUser || currentUser.role === 'employer') && (
            <button
              onClick={() => onNavigate('workers')}
              className={`flex-1 text-center py-1 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center ${
                currentPage === 'workers' ? 'text-blue-600 bg-slate-50' : 'text-slate-600'
              }`}
            >
              <span>Workers</span>
              <span className="text-[10px] px-1.5 bg-blue-50 text-blue-600 rounded-full font-bold">{workersCount}</span>
            </button>
          )}
          {(!currentUser || currentUser.role === 'worker') && (
            <button
              onClick={() => onNavigate('jobs')}
              className={`flex-1 text-center py-1 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center ${
                currentPage === 'jobs' ? 'text-blue-600 bg-slate-50' : 'text-slate-600'
              }`}
            >
              <span>Jobs</span>
              <span className="text-[10px] px-1.5 bg-slate-100 text-slate-600 rounded-full font-bold">{jobsCount}</span>
            </button>
          )}
          {currentUser && (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`flex-1 text-center py-1 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center ${
                  currentPage === 'dashboard' ? 'text-blue-600 bg-slate-50' : 'text-slate-600'
                }`}
              >
                <span>Dashboard</span>
              </button>
              {currentUser.role === 'employer' && (
                <button
                  onClick={() => onNavigate('post-job')}
                  className={`flex-1 text-center py-1 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center ${
                    currentPage === 'post-job' ? 'text-blue-600 bg-slate-50' : 'text-slate-600'
                  }`}
                >
                  <span>Post Job</span>
                </button>
              )}
              <button
                onClick={() => onNavigate('profile')}
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
  );
}
