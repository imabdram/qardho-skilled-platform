import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Workers from './pages/Workers';
import Jobs from './pages/Jobs';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import PostJob from './pages/PostJob';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import ConnectModal from './components/ConnectModal';
import ApplyModal from './components/ApplyModal';
import { User, Job, Connection, Application, Review } from './types';
import { Sparkles, MapPin, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Navigation & User session states
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [viewingProfileUser, setViewingProfileUser] = useState<User | null>(null);

  // App data list states (Initialized empty, populated dynamically from SQLite)
  const [workers, setWorkers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Active Modals states
  const [selectedWorkerForConnect, setSelectedWorkerForConnect] = useState<User | null>(null);
  const [selectedJobForApply, setSelectedJobForApply] = useState<Job | null>(null);
  const [roleToast, setRoleToast] = useState<string | null>(null);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  // Load and refresh all data from the SQLite database
  const refreshAllData = async () => {
    try {
      const [workersRes, jobsRes, connectionsRes, applicationsRes, reviewsRes] = await Promise.all([
        fetch('/api/workers').then(r => r.json()),
        fetch('/api/jobs').then(r => r.json()),
        fetch('/api/connections').then(r => r.json()),
        fetch('/api/applications').then(r => r.json()),
        fetch('/api/reviews').then(r => r.json()),
      ]);

      setWorkers(workersRes || []);
      setJobs(jobsRes || []);
      setConnections(connectionsRes || []);
      setApplications(applicationsRes || []);
      setReviews(reviewsRes || []);

      // Keep current user state perfectly updated with latest database values
      const savedUserStr = localStorage.getItem('currentUser');
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        // Look up latest record in workers or fetch/re-authenticate
        const latestWorker = (workersRes || []).find((w: User) => w.id === savedUser.id);
        if (latestWorker) {
          setCurrentUser(latestWorker);
          localStorage.setItem('currentUser', JSON.stringify(latestWorker));
        }
      }
    } catch (e) {
      console.error("Failed to fetch fresh database states", e);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Quick Switch Roles helper for Demo / Testing (Hitting the SQLite DB)
  const loginAsDemoUser = async (role: 'worker' | 'employer') => {
    if (role === 'worker') {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: '+252 90 779 1234' }) // Ahmed's phone
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          setCurrentPage('dashboard');
          setRoleToast(`Demo Session: Active role set to Ahmed Mohamed Ali (Worker)`);
          setTimeout(() => setRoleToast(null), 4000);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: 'employer1@qardho.com' })
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          setCurrentPage('dashboard');
          setRoleToast(`Demo Session: Active role set to Qardho Agricultural Co. (Employer)`);
          setTimeout(() => setRoleToast(null), 4000);
        } else {
          // Register first, then login
          const regRes = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: 'employer-1',
              name: 'Qardho Agricultural Co.',
              email: 'employer1@qardho.com',
              phone: '+252 90 700 1122',
              role: 'employer',
              location: 'Wadajir',
              bio: 'Local farming collective focusing on water-efficient agricultural systems in Karkaar.'
            })
          });
          if (regRes.ok) {
            const data = await regRes.json();
            setCurrentUser(data.user);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            setCurrentPage('dashboard');
            setRoleToast(`Demo Session: Active role set to Qardho Agricultural Co. (Employer)`);
            setTimeout(() => setRoleToast(null), 4000);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Auth Operations
  const handleLogin = async ({ identifier }: any) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'User not found. Try quick-login or sign up with your phone number.' }));
        return { success: false, message: data.error || 'User not found.' };
      }
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        setCurrentPage('dashboard');
        return { success: true, message: 'Logged in successfully.' };
      }
      return { success: false, message: 'Invalid credentials. Try quick-login or sign up with your phone number!' };
    } catch (err) {
      return { success: false, message: 'Could not reach the authentication server. Please try again.' };
    }
  };

  const handleSignup = async (payload: any) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'A user with this phone or email already exists.' }));
        return { success: false, message: data.error || 'Signup failed.' };
      }
      const data = await res.json();
      if (data.success) {
        return { success: true, message: 'Signup completed! Please sign in.' };
      }
      return { success: false, message: 'Registration failed.' };
    } catch (err) {
      return { success: false, message: 'Could not reach the database. Please try again.' };
    }
  };

  const handleCompleteOnboarding = async (updatedUser: User) => {
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        await refreshAllData();

        if (data.user.role === 'worker') {
          setCurrentPage('jobs');
        } else if (data.user.role === 'employer') {
          setCurrentPage('workers');
        }
      }
    } catch (e) {
      console.error('Failed to complete onboarding', e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentPage('workers');
  };

  const handleSwitchRole = async () => {
    if (!currentUser || isSwitchingRole) return;
    
    setIsSwitchingRole(true);
    const targetRoleName = currentUser.role === 'worker' ? 'Employer' : 'Worker';
    setRoleToast(`Switching to ${targetRoleName} Mode...`);
    
    setTimeout(async () => {
      const newRole = currentUser.role === 'worker' ? 'employer' : 'worker';
      const updatedUser: User = {
        ...currentUser,
        role: newRole,
        skill: newRole === 'worker' ? (currentUser.skill || 'General Laborer') : undefined,
        rate: newRole === 'worker' ? (currentUser.rate || '$15/day') : undefined,
      };
      
      try {
        const res = await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser)
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          setRoleToast(`Success! Switched to ${newRole === 'worker' ? 'Worker Mode' : 'Employer Mode'}`);
          await refreshAllData();
          
          if (newRole === 'worker') {
            if (currentPage === 'workers') {
              setCurrentPage('jobs');
            }
          } else {
            if (currentPage === 'jobs') {
              setCurrentPage('workers');
            }
          }
        }
      } catch (err) {
        console.error('Error switching role:', err);
      } finally {
        setTimeout(() => setRoleToast(null), 4000);
        setIsSwitchingRole(false);
      }
    }, 1200);
  };

  // Connection Request Action
  const triggerConnect = (worker: User) => {
    if (!currentUser) {
      setCurrentPage('auth');
      return;
    }
    if (currentUser.role !== 'employer') {
      alert('Only Employers can initiate hiring connections.');
      return;
    }
    setSelectedWorkerForConnect(worker);
  };

  const submitConnect = async ({ message, phone }: { message: string; phone: string }) => {
    if (!currentUser || !selectedWorkerForConnect) return;

    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          fromUserName: currentUser.name,
          toUserId: selectedWorkerForConnect.id,
          toUserName: selectedWorkerForConnect.name,
          message,
          phone
        })
      });
      if (res.ok) {
        await refreshAllData();
        setSelectedWorkerForConnect(null);
        setCurrentPage('dashboard');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Application Submission Action
  const triggerApply = (job: Job) => {
    if (!currentUser) {
      setCurrentPage('auth');
      return;
    }
    if (currentUser.role !== 'worker') {
      alert('Only Workers can apply for jobs.');
      return;
    }
    setSelectedJobForApply(job);
  };

  const submitApply = async ({ message, phone, location }: { message: string; phone: string; location: string }) => {
    if (!currentUser || !selectedJobForApply) return;

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJobForApply.id,
          jobTitle: selectedJobForApply.title,
          employerId: selectedJobForApply.employerId,
          applicantId: currentUser.id,
          applicantName: currentUser.name,
          applicantSkill: currentUser.skill || 'General Laborer',
          message,
          phone,
          location
        })
      });
      if (res.ok) {
        await refreshAllData();
        setSelectedJobForApply(null);
        setCurrentPage('dashboard');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update Status Handlers (Dashboard)
  const updateConnectionStatus = async (id: string, status: 'accepted' | 'declined') => {
    try {
      const res = await fetch(`/api/connections/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateApplicationStatus = async (id: string, status: 'accepted' | 'declined') => {
    try {
      const res = await fetch(`/api/applications/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Profile Update Handler
  const updateProfile = async (updatedProfile: User) => {
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Post Job Handler
  const postNewJob = async (jobData: { title: string; location: string; description: string; rate: string; phone: string }) => {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerId: currentUser.id,
          employerName: currentUser.name,
          ...jobData
        })
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Review Handler
  const handleAddReview = async (newReviewData: { workerId: string; employerId: string; employerName: string; rating: number; comment: string }) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReviewData)
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavigate = (page: string) => {
    setViewingProfileUser(null);
    setCurrentPage(page);
  };

  // Active page renderer
  const renderPage = () => {
    if (currentUser && currentUser.role === 'pending') {
      return (
        <Onboarding
          currentUser={currentUser}
          onCompleteOnboarding={handleCompleteOnboarding}
        />
      );
    }

    switch (currentPage) {
      case 'home':
        return (
          <Landing
            workersCount={workers.length}
            jobsCount={jobs.length}
            onNavigate={handleNavigate}
            currentUser={currentUser}
          />
        );
      case 'workers':
        return (
          <Workers
            workers={workers}
            currentUser={currentUser}
            onConnect={triggerConnect}
            onNavigate={handleNavigate}
            reviews={reviews}
            onViewProfile={(worker) => {
              setViewingProfileUser(worker);
              setCurrentPage('profile');
            }}
          />
        );
      case 'jobs':
        return (
          <Jobs
            jobs={jobs}
            currentUser={currentUser}
            onApply={triggerApply}
            onNavigate={handleNavigate}
          />
        );
      case 'profile':
        return (
          <Profile
            currentUser={currentUser}
            userToShow={viewingProfileUser || currentUser}
            onUpdateProfile={updateProfile}
            onSwitchRole={handleSwitchRole}
            reviews={reviews}
            onAddReview={handleAddReview}
            connections={connections}
            onBack={viewingProfileUser ? () => {
              setViewingProfileUser(null);
              setCurrentPage('workers');
            } : undefined}
            onConnect={triggerConnect}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            currentUser={currentUser}
            connections={connections}
            applications={applications}
            jobs={jobs}
            onUpdateConnectionStatus={updateConnectionStatus}
            onUpdateApplicationStatus={updateApplicationStatus}
            onNavigate={handleNavigate}
            onSwitchRole={handleSwitchRole}
          />
        );
      case 'post-job':
        return <PostJob currentUser={currentUser} onPostJob={postNewJob} onNavigate={handleNavigate} />;
      case 'auth':
        return <Auth onLogin={handleLogin} onSignup={handleSignup} />;
      default:
        return (
          <Landing
            workersCount={workers.length}
            jobsCount={jobs.length}
            onNavigate={handleNavigate}
            currentUser={currentUser}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col text-slate-800 antialiased font-sans" id="app-root-layout">
      {/* Top Banner indicating Preview Mode / Quick Login Panel */}
      <div className="bg-emerald-600 text-white px-4 py-2 flex flex-col sm:flex-row items-center justify-between text-xs font-semibold shadow-xs" id="preview-alert-banner">
        <div className="flex items-center space-x-1.5 mb-1.5 sm:mb-0">
          <Sparkles className="h-4 w-4 animate-pulse shrink-0" />
          <span><strong>Database Active:</strong> Real persistent SQLite database powering all workers, jobs, connections, and applications!</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-blue-100 hidden md:inline">Quick Test Actions:</span>
          <button
            onClick={() => loginAsDemoUser('worker')}
            className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md text-[10px] cursor-pointer transition-all border border-white/10"
          >
            🔑 Log In as Ahmed (Worker)
          </button>
          <button
            onClick={() => loginAsDemoUser('employer')}
            className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md text-[10px] cursor-pointer transition-all border border-white/10"
          >
            💼 Log In as Farmer (Employer)
          </button>
        </div>
      </div>

      {/* Main Navigation Component */}
      <Navbar
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        workersCount={workers.length}
        jobsCount={jobs.length}
        onSwitchRole={handleSwitchRole}
        isSwitchingRole={isSwitchingRole}
        connections={connections}
        applications={applications}
      />

      {/* Active Role Quick Toast Alert */}
      {roleToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 border border-slate-700/50">
            <div className="p-1 bg-blue-500 rounded-lg text-white">
              <RefreshCw className="h-4 w-4 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <p className="text-xs font-black tracking-tight">{roleToast}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Layout Frame */}
      <main className="flex-1 pb-16">
        {renderPage()}
      </main>

      {/* Modals render portals */}
      {selectedWorkerForConnect && (
        <ConnectModal
          worker={selectedWorkerForConnect}
          currentUser={currentUser}
          onClose={() => setSelectedWorkerForConnect(null)}
          onSubmit={submitConnect}
        />
      )}

      {selectedJobForApply && (
        <ApplyModal
          job={selectedJobForApply}
          currentUser={currentUser}
          onClose={() => setSelectedJobForApply(null)}
          onSubmit={submitApply}
        />
      )}

      {/* Soft platform footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Skills Hub Qardho. Connecting Somali trade skills and local industry.</p>
        </div>
      </footer>
    </div>
  );
}
