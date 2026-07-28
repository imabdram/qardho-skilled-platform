import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Workers from './pages/Workers';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import PostJob, { JobFormData } from './pages/PostJob';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import ConnectModal from './components/ConnectModal';
import ApplyModal from './components/ApplyModal';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import AboutContact from './pages/AboutContact';
import { User, Job, JobStatus, Connection, Application, Review, ProfileFieldKey, VerificationMessage, PricingType } from './types';
import { MapPin, AlertCircle, RefreshCw, CheckCircle2, X } from 'lucide-react';
import ConfirmDialog from './components/ConfirmDialog';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPageForPath, getRouteForPage, PageId } from './routes';

import { useAuth, useUser } from '@clerk/react';
import { useApi } from './useApi';
const getDefaultRouteForUser = (user: User) => user.role === 'admin' ? '/admin' : user.role === 'employer' ? '/dashboard' : user.role === 'worker' ? '/dashboard' : '/onboarding';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded: isClerkLoaded, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const fetchAuth = useApi();
  const fetch = fetchAuth;

  // Navigation & User session states
  const [currentPage, setCurrentPage] = useState<PageId>(() => getPageForPath(location.pathname));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [viewingProfileUser, setViewingProfileUser] = useState<User | null>(null);

  // App data list states (initialized empty, populated dynamically from PostgreSQL)
  const [users, setUsers] = useState<User[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [verificationMessage, setVerificationMessage] = useState<VerificationMessage | null>(null);

  // Active Modals states
  const [selectedWorkerForConnect, setSelectedWorkerForConnect] = useState<User | null>(null);
  const [selectedJobForApply, setSelectedJobForApply] = useState<Job | null>(null);
  const [roleToast, setRoleToast] = useState<string | null>(null);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [showRoleSwitchModal, setShowRoleSwitchModal] = useState(false);
  const [roleSwitchConfirmation, setRoleSwitchConfirmation] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [appError, setAppError] = useState<string | null>(null);
  const [appNotice, setAppNotice] = useState<string | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const showAppError = (message: string) => {
    setAppError(message);
    setTimeout(() => setAppError(null), 6000);
  };

  const showAppNotice = (message: string) => {
    setAppNotice(message);
    setTimeout(() => setAppNotice(null), 4000);
  };

  const getApiError = async (res: Response, fallback: string) => {
    const data = await res.json().catch(() => ({ error: fallback }));
    return data.error || data.message || fallback;
  };

  const fetchJson = async <T,>(url: string, fallback: string): Promise<T> => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(await getApiError(res, fallback));
    }
    return res.json();
  };

  const navigateTo = (page: PageId) => {
    const route = getRouteForPage(page);
    setCurrentPage(page);
    if (location.pathname !== route) {
      navigate(route);
    }
  };

  useEffect(() => {
    setCurrentPage(getPageForPath(location.pathname));
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Load and refresh all data from the PostgreSQL database
  const refreshAllData = async (authenticatedUser: User | null = currentUser) => {
    try {
      setIsLoadingData(true);
      setAppError(null);
      const [usersRes, workersRes, jobsRes, connectionsRes, applicationsRes, reviewsRes] = await Promise.all([
        authenticatedUser?.role === 'admin' ? fetchJson<User[]>('/api/users', 'Could not load users.') : Promise.resolve([]),
        fetchJson<User[]>('/api/workers', 'Could not load workers.'),
        fetchJson<Job[]>('/api/jobs', 'Could not load jobs.'),
        authenticatedUser ? fetchJson<Connection[]>('/api/connections', 'Could not load connection requests.') : Promise.resolve([]),
        authenticatedUser ? fetchJson<Application[]>('/api/applications', 'Could not load applications.') : Promise.resolve([]),
        fetchJson<Review[]>('/api/reviews', 'Could not load reviews.'),
      ]);

      const userList = Array.isArray(usersRes) ? usersRes : [];
      const workerList = Array.isArray(workersRes) ? workersRes : [];
      const jobList = Array.isArray(jobsRes) ? jobsRes : [];
      const connectionList = Array.isArray(connectionsRes) ? connectionsRes : [];
      const applicationList = Array.isArray(applicationsRes) ? applicationsRes : [];
      const reviewList = Array.isArray(reviewsRes) ? reviewsRes : [];

      setUsers(userList);
      setWorkers(workerList);
      setJobs(jobList);
      setConnections(connectionList);
      setApplications(applicationList);
      setReviews(reviewList);

    } catch (e) {
      console.error("Failed to fetch fresh database states", e);
      showAppError(e instanceof Error ? e.message : 'Could not load platform data. Check that the local server is running.');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!isClerkLoaded) return;

    const bootstrap = async () => {
      let sessionUser: User | null = null;
      if (isSignedIn) {
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) sessionUser = (await response.json()).user || null;
        } catch {
          sessionUser = null;
        }
      }
      if (sessionUser && clerkUser?.imageUrl) {
        sessionUser = { ...sessionUser, avatarUrl: sessionUser.avatarUrl || clerkUser.imageUrl };
      }
      if (!active) return;
      setCurrentUser(sessionUser);
      await refreshAllData(sessionUser);
    };
    bootstrap().finally(() => { if (active) setSessionLoading(false); });
    return () => { active = false; };
  }, [isClerkLoaded, isSignedIn, clerkUser?.id]);

  useEffect(() => {
    if (sessionLoading) return;
    const path = location.pathname;
    const guestOnly = ['/login', '/auth', '/register', '/forgot-password', '/reset-password'].includes(path);
    const protectedPath = ['/profile', '/profile/edit', '/settings', '/dashboard', '/worker/dashboard', '/employer/dashboard', '/post-job', '/admin', '/onboarding'].includes(path);
    let target: string | null = null;
    if (guestOnly && currentUser) target = getDefaultRouteForUser(currentUser);
    else if (!currentUser && protectedPath) target = '/login';
    else if (currentUser?.role === 'pending' && path !== '/onboarding' && (protectedPath || ['/', '/workers', '/jobs', '/about-contact'].includes(path) || /^\/jobs\//.test(path))) target = '/onboarding';
    else if (currentUser && path === '/onboarding' && currentUser.role !== 'pending') target = getDefaultRouteForUser(currentUser);
    else if (currentUser && path === '/admin' && currentUser.role !== 'admin') target = '/unauthorized';
    else if (currentUser && (path === '/post-job' || path === '/employer/dashboard') && currentUser.role !== 'employer') target = currentUser.role === 'pending' ? '/onboarding' : '/unauthorized';
    else if (currentUser && path === '/worker/dashboard' && currentUser.role !== 'worker') target = currentUser.role === 'pending' ? '/onboarding' : '/unauthorized';
    else if (currentUser && (path === '/profile' || path === '/profile/edit' || path === '/settings') && currentUser.role === 'pending') target = '/onboarding';
    if (target && target !== path) navigate(target, { replace: true });
  }, [sessionLoading, currentUser?.id, currentUser?.role, location.pathname, navigate]);

  const loadVerificationMessage = async (user: User | null) => {
    if (!user || user.role === 'admin' || user.verified) {
      setVerificationMessage(null);
      return;
    }

    try {
      const data = await fetchJson<{ message: VerificationMessage | null }>(
        `/api/verification-messages/${user.id}`,
        'Could not load your verification message.'
      );
      setVerificationMessage(data.message);
    } catch (error) {
      console.error('Failed to load verification message', error);
      setVerificationMessage(null);
    }
  };

  useEffect(() => {
    loadVerificationMessage(currentUser);
  }, [currentUser?.id, currentUser?.verified]);

  const markVerificationMessageRead = async () => {
    if (!currentUser || !verificationMessage || verificationMessage.readAt) return;
    const res = await fetch(`/api/verification-messages/${currentUser.id}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      showAppError(await getApiError(res, 'Could not mark the verification message as read.'));
      return;
    }
    const data = await res.json();
    setVerificationMessage(data.message || null);
  };

  const handleLogin = async ({ identifier, password }: any) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Invalid email/phone or password. Try the demo password or sign up.' }));
        return { success: false, message: data.error || 'Invalid email/phone or password.' };
      }
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        navigateTo('dashboard');
        showAppNotice('Logged in successfully.');
        return { success: true, message: 'Logged in successfully.' };
      }
      return { success: false, message: 'Invalid email/phone or password.' };
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
        showAppNotice('Account created. Please sign in.');
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
        
        if (data.user.role === 'worker') {
          navigateTo('jobs');
        } else if (data.user.role === 'employer') {
          navigateTo('workers');
        } else if (data.user.role === 'admin') {
          navigateTo('admin');
        }

        await refreshAllData();
        showAppNotice('Onboarding saved.');
      }
    } catch (e) {
      console.error('Failed to complete onboarding', e);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    await signOut().catch(() => undefined);
    setCurrentUser(null);
    navigateTo('home');
  };

  const requestDeleteAccount = () => {
    if (!currentUser) return;
    setShowDeleteAccountModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'I confirm' })
      });
      if (!res.ok) {
        showAppError(await getApiError(res, 'Could not delete account.'));
        return;
      }

      setShowDeleteAccountModal(false);
      setViewingProfileUser(null);
      setCurrentUser(null);
      await refreshAllData();
      navigateTo('home');
      showAppNotice('Your account has been removed.');
    } catch (err) {
      console.error('Error deleting account:', err);
      showAppError('Could not delete account.');
    }
  };

  const getRoleSwitchTarget = () => currentUser?.role === 'worker' ? 'employer' : 'worker';

  const getRoleSwitchProfileCheck = () => {
    if (!currentUser) return { blocking: ['You must be signed in.'], warnings: [] as string[] };

    const blocking = [
      !currentUser.name?.trim() ? 'Add your full name.' : null,
      !currentUser.phone?.trim() ? 'Add a contact phone number.' : null,
      !currentUser.location?.trim() ? 'Choose your Qardho neighborhood.' : null,
      !currentUser.bio?.trim() ? 'Add a short profile bio.' : null,
    ].filter(Boolean) as string[];

    const targetRole = getRoleSwitchTarget();
    const warnings = targetRole === 'worker'
      ? [
          !currentUser.skill?.trim() ? 'Worker skill will need to be updated after switching.' : null,
          !currentUser.availability ? 'Worker availability will default to available.' : null,
        ].filter(Boolean) as string[]
      : [];

    return { blocking, warnings };
  };

  const handleSwitchRole = () => {
    if (!currentUser || isSwitchingRole) return;
    setShowRoleSwitchModal(true);
  };

  const confirmSwitchRole = async () => {
    if (!currentUser || isSwitchingRole) return;

    const profileCheck = getRoleSwitchProfileCheck();
    if (profileCheck.blocking.length > 0) {
      showAppError('Complete the required profile fields before switching roles.');
      return;
    }

    const newRole = getRoleSwitchTarget();
    const targetRoleName = newRole === 'worker' ? 'Worker' : 'Employer';
    setIsSwitchingRole(true);
    setShowRoleSwitchModal(false);
    setRoleToast(`Switching to ${targetRoleName} Mode...`);

    try {
      const res = await fetch('/api/profile/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, confirmation: roleSwitchConfirmation.trim().toUpperCase() })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setRoleToast(`Success! Switched to ${targetRoleName} Mode`);
        showAppNotice(`Switched to ${newRole === 'worker' ? 'worker' : 'employer'} mode.`);
        await refreshAllData(data.user);

        if (newRole === 'worker' && currentPage === 'workers') {
          navigateTo('jobs');
        } else if (newRole === 'employer' && currentPage === 'jobs') {
          navigateTo('workers');
        }
      } else {
        showAppError(await getApiError(res, 'Could not switch role.'));
      }
    } catch (err) {
      console.error('Error switching role:', err);
      showAppError('Could not switch role.');
    } finally {
      setTimeout(() => setRoleToast(null), 4000);
      setIsSwitchingRole(false);
    }
  };

  // Connection Request Action
  const triggerConnect = (worker: User) => {
    if (!currentUser) {
      navigateTo('auth');
      return;
    }
    if (currentUser.role !== 'employer') {
      showAppError('Only employers can initiate hiring connections.');
      return;
    }
    setSelectedWorkerForConnect(worker);
  };

  const submitConnect = async ({ message, jobId, expectedTimeline }: { message: string; jobId?: string; expectedTimeline?: string }) => {
    if (!currentUser || !selectedWorkerForConnect) return;

    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: selectedWorkerForConnect.id,
          message,
          jobId,
          expectedTimeline,
        })
      });
      if (res.ok) {
        await refreshAllData();
        setSelectedWorkerForConnect(null);
        navigateTo('dashboard');
        showAppNotice('Connection request sent.');
      } else {
        showAppError(await getApiError(res, 'Could not submit connection request.'));
      }
    } catch (e) {
      console.error(e);
      showAppError('Could not submit connection request.');
    }
  };

  // Application Submission Action
  const triggerApply = (job: Job) => {
    if (!currentUser) {
      navigateTo('auth');
      return;
    }
    if (currentUser.role !== 'worker') {
      showAppError('Only workers can apply for jobs.');
      return;
    }
    const existingApplication = applications.find((app) => app.jobId === job.id && app.applicantId === currentUser.id);
    if (existingApplication) {
      showAppNotice(`You already applied for this job. Current status: ${existingApplication.status}.`);
      navigateTo('dashboard');
      return;
    }
    if (job.status !== 'open') {
      showAppError('This job is not open for new applications.');
      return;
    }
    setSelectedJobForApply(job);
  };

  const submitApply = async (applicationData: { message: string; proposedPricingType?: PricingType; proposedAmount?: number | null; proposedCurrency?: string; proposedNote?: string; expectedTimeline?: string }) => {
    if (!currentUser || !selectedJobForApply) return;

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJobForApply.id,
          ...applicationData,
        })
      });
      if (res.ok) {
        await refreshAllData();
        setSelectedJobForApply(null);
        navigateTo('dashboard');
        showAppNotice('Application submitted.');
      } else {
        showAppError(await getApiError(res, 'Could not submit application.'));
      }
    } catch (e) {
      console.error(e);
      showAppError('Could not submit application.');
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
        showAppNotice('Connection updated.');
      } else {
        showAppError(await getApiError(res, 'Could not update connection status.'));
      }
    } catch (e) {
      console.error(e);
      showAppError('Could not update connection status.');
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
        showAppNotice('Application updated.');
      } else {
        showAppError(await getApiError(res, 'Could not update application status.'));
      }
    } catch (e) {
      console.error(e);
      showAppError('Could not update application status.');
    }
  };

  const updateJobStatus = async (id: string, status: JobStatus) => {
    try {
      const res = await fetch(`/api/jobs/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await refreshAllData();
        showAppNotice('Job status updated.');
      } else {
        showAppError(await getApiError(res, 'Could not update job status.'));
      }
    } catch (e) {
      console.error(e);
      showAppError('Could not update job status.');
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
        await refreshAllData(data.user);
        showAppNotice('Profile updated.');
      } else {
        const message = await getApiError(res, 'Could not update profile.');
        showAppError(message);
        throw new Error(message);
      }
    } catch (e) {
      console.error(e);
      showAppError('Could not update profile.');
      throw e;
    }
  };

  // Post Job Handler
  const postNewJob = async (jobData: JobFormData) => {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...jobData
        })
      });
      if (res.ok) {
        await refreshAllData();
        showAppNotice('Job posted.');
        navigateTo('dashboard');
      } else {
        showAppError(await getApiError(res, 'Could not post job.'));
      }
    } catch (e) {
      console.error(e);
      showAppError('Could not post job.');
    }
  };

  // Add Review Handler
  const handleAddReview = async (newReviewData: { workerId: string; employerId: string; employerName: string; jobId: string; jobTitle: string; rating: number; comment: string }) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReviewData)
      });
      if (res.ok) {
        await refreshAllData();
        showAppNotice('Review published.');
        return true;
      } else {
        showAppError(await getApiError(res, 'Could not add review.'));
      }
    } catch (e) {
      console.error(e);
      showAppError('Could not add review.');
    }
    return false;
  };


  const handleNavigate = (page: string) => {
    setViewingProfileUser(null);
    navigateTo(page as PageId);
  };

  const handleViewWorkerProfile = (worker: User) => {
    setViewingProfileUser(worker);
    navigateTo('profile');
    window.setTimeout(() => {
      document.getElementById('rating-review-system')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // Active page renderer
  const renderPage = () => {
    if (currentUser && currentUser.role === 'pending') {
      return (
        <Onboarding
          currentUser={currentUser}
          jobs={jobs}
          onCompleteOnboarding={handleCompleteOnboarding}
        />
      );
    }

    switch (currentPage) {
      case 'unauthorized':
        return <Unauthorized />;
      case 'home':
        return (
          <Landing
            workers={workers}
            jobs={jobs}
            reviews={reviews}
            workersCount={workers.length}
            jobsCount={jobs.length}
            onNavigate={handleNavigate}
            onViewWorkerProfile={(worker) => {
              if (!currentUser) {
                navigateTo('auth');
                return;
              }
              setViewingProfileUser(worker);
              navigateTo('profile');
            }}
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
            onViewProfile={handleViewWorkerProfile}
            isLoading={isLoadingData}
          />
        );
      case 'jobs':
        return (
          <Jobs
            jobs={jobs}
            currentUser={currentUser}
            onApply={triggerApply}
            onNavigate={handleNavigate}
            applications={applications}
            isLoading={isLoadingData}
          />
        );
      case 'job-detail': {
        const jobId = decodeURIComponent(location.pathname.split('/').filter(Boolean)[1] || '');
        const job = jobs.find((item) => item.id === jobId);
        return (
          <JobDetail
            job={job}
            currentUser={currentUser}
            applications={applications}
            onApply={triggerApply}
            onNavigate={handleNavigate}
          />
        );
      }
      case 'profile':
        return (
          <Profile
            currentUser={currentUser}
            userToShow={viewingProfileUser || currentUser}
            onUpdateProfile={updateProfile}
            onSwitchRole={handleSwitchRole}
            reviews={reviews}
            jobs={jobs}
            applications={applications}
            onAddReview={handleAddReview}
            connections={connections}
            onBack={viewingProfileUser ? () => {
              setViewingProfileUser(null);
              navigateTo('workers');
            } : undefined}
            onConnect={triggerConnect}
            onRequestDeleteAccount={requestDeleteAccount}
            onAvatarUpdated={(user) => {
              setCurrentUser(user);
            }}
          />
        );
      case 'profile-edit':
        if (!currentUser) return null;
        return (
          <ProfileEdit
            currentUser={currentUser}
            onUpdateProfile={updateProfile}
            onAvatarUpdated={(user) => setCurrentUser(user)}
            onNavigate={handleNavigate}
          />
        );
      case 'settings':
        if (!currentUser) return null;
        return (
          <Settings
            currentUser={currentUser}
            onUpdateProfile={updateProfile}
            onSwitchRole={handleSwitchRole}
            onRequestDeleteAccount={requestDeleteAccount}
            onNavigate={handleNavigate}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            currentUser={currentUser}
            workers={workers}
            connections={connections}
            applications={applications}
            jobs={jobs}
            reviews={reviews}
            onUpdateConnectionStatus={updateConnectionStatus}
            onUpdateApplicationStatus={updateApplicationStatus}
            onUpdateJobStatus={updateJobStatus}
            onNavigate={handleNavigate}
            onViewWorkerProfile={handleViewWorkerProfile}
            onSwitchRole={handleSwitchRole}
            isSwitchingRole={isSwitchingRole}
            isLoading={isLoadingData}
            verificationMessage={verificationMessage}
            onReadVerificationMessage={markVerificationMessageRead}
          />
        );
      case 'admin':
        return (
          <Admin
            currentUser={currentUser}
            users={users}
            jobs={jobs}
            connections={connections}
            applications={applications}
            reviews={reviews}
            onNavigate={handleNavigate}
            onRefresh={refreshAllData}
            onLoadVerificationMessage={async (userId) => {
              const data = await fetchJson<{ message: VerificationMessage | null }>(
                `/api/verification-messages/${userId}`,
                'Could not load the latest verification message.'
              );
              return data.message;
            }}
            onSendVerificationMessage={async (user, missingFields: ProfileFieldKey[], note: string) => {
              const res = await fetch(`/api/admin/users/${user.id}/verification-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ missingFields, note }),
              });
              if (!res.ok) throw new Error(await getApiError(res, 'Could not send the verification message.'));
              const data = await res.json();
              return data.message as VerificationMessage;
            }}
            onToggleVerifyUser={async (user) => {
              const res = await fetch(`/api/admin/users/${user.id}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verified: !user.verified })
              });
              if (!res.ok) throw new Error(await getApiError(res, 'Could not update verification.'));
            }}
            onToggleSuspendUser={async (user) => {
              const res = await fetch(`/api/admin/users/${user.id}/suspend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ suspended: !user.suspended })
              });
              if (!res.ok) throw new Error(await getApiError(res, 'Could not update suspension.'));
            }}
            onDeleteUser={async (user) => {
              const res = await fetch(`/api/admin/users/${user.id}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
              });
              if (!res.ok) throw new Error(await getApiError(res, 'Could not delete user.'));
            }}
            onChangeUserRole={async (user, role) => {
              const res = await fetch(`/api/admin/users/${user.id}/role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
              });
              if (!res.ok) throw new Error(await getApiError(res, 'Could not update role.'));
            }}
          />
        );
      case 'post-job':
        return <PostJob currentUser={currentUser} onPostJob={postNewJob} onNavigate={handleNavigate} />;
      case 'about':
        return <AboutContact />;
      case 'auth':
      case 'register':
      case 'forgot-password':
      case 'reset-password':
        return <Auth />;
      case 'not-found':
        return <NotFound />;
      default:
        return <NotFound />;
    }
  };

  if (sessionLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-bold text-slate-600">Checking your session...</div>;

  const roleSwitchTarget = getRoleSwitchTarget();
  const roleSwitchTargetName = roleSwitchTarget === 'worker' ? 'Worker' : 'Employer';
  const roleSwitchProfileCheck = getRoleSwitchProfileCheck();
  const hasTypedRoleSwitchConfirmation = roleSwitchConfirmation.trim().toUpperCase() === 'CONFIRM';
  const canConfirmRoleSwitch = roleSwitchProfileCheck.blocking.length === 0 && !!currentUser;
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col text-slate-800 antialiased font-sans" id="app-root-layout">
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
        jobs={jobs}
        reviews={reviews}
      />

      {(isLoadingData || appError) && (
        <div className={`px-4 py-2 text-xs font-semibold border-b ${
          appError
            ? 'bg-rose-50 text-rose-700 border-rose-100'
            : 'bg-blue-50 text-blue-700 border-blue-100'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            {isLoadingData ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Loading latest workers, jobs, and dashboard activity...</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{appError}</span>
              </>
            )}
          </div>
        </div>
      )}

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

      {appNotice && (
        <div className="fixed bottom-6 left-6 z-50 animate-fade-in">
          <div className="bg-brand-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 border border-brand-500/50">
            <div className="p-1 bg-white/15 rounded-lg text-white">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-black tracking-tight">{appNotice}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Layout Frame */}
      <main className="flex-1 pb-0">
        {renderPage()}
      </main>

      {/* Modals render portals */}
      {selectedWorkerForConnect && (
        <ConnectModal
          worker={selectedWorkerForConnect}
          currentUser={currentUser}
          jobs={jobs}
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

      {showDeleteAccountModal && currentUser && (
        <ConfirmDialog
          title="Remove your account?"
          description="This permanently deletes your profile, jobs, applications, connections, and reviews tied to this account. This cannot be undone."
          confirmLabel="Delete account"
          cancelLabel="Keep account"
          tone="danger"
          onConfirm={confirmDeleteAccount}
          onCancel={() => setShowDeleteAccountModal(false)}
        />
      )}

      {showRoleSwitchModal && currentUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Role switch confirmation</p>
                <h3 className="mt-0.5 text-base font-black text-slate-950">Switch to {roleSwitchTargetName} mode?</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Your dashboard, main actions, and public profile will change to match the {roleSwitchTargetName.toLowerCase()} role.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowRoleSwitchModal(false); setRoleSwitchConfirmation(''); }}
                disabled={isSwitchingRole}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close role switch confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Profile check</h4>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Basic public profile fields are required before switching.</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${canConfirmRoleSwitch ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'}`}>
                    {canConfirmRoleSwitch ? 'Ready' : 'Incomplete'}
                  </span>
                </div>

                {roleSwitchProfileCheck.blocking.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {roleSwitchProfileCheck.blocking.map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs font-semibold text-amber-800">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs font-semibold text-brand-700">Your basic profile is ready for role switching.</p>
                )}

                {canConfirmRoleSwitch && (
                  <div className="mt-4">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Type CONFIRM to continue</label>
                    <input
                      type="text"
                      value={roleSwitchConfirmation}
                      onChange={(e) => setRoleSwitchConfirmation(e.target.value)}
                      placeholder="CONFIRM"
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      autoComplete="off"
                    />
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">This prevents accidental role changes.</p>
                  </div>
                )}

                {roleSwitchProfileCheck.warnings.length > 0 && (
                  <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-blue-700">After switching</p>
                    <ul className="mt-2 space-y-1.5">
                      {roleSwitchProfileCheck.warnings.map(item => (
                        <li key={item} className="text-xs font-semibold text-blue-800">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row">
              <button
                type="button"
                onClick={() => { setShowRoleSwitchModal(false); setRoleSwitchConfirmation(''); }}
                disabled={isSwitchingRole}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              {!canConfirmRoleSwitch ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleSwitchModal(false);
                    handleNavigate('profile');
                  }}
                  className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white hover:bg-amber-700"
                >
                  Complete profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={confirmSwitchRole}
                  disabled={isSwitchingRole || !hasTypedRoleSwitchConfirmation}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSwitchingRole ? 'animate-spin' : ''}`} />
                  {isSwitchingRole ? 'Switching...' : hasTypedRoleSwitchConfirmation ? `Confirm ${roleSwitchTargetName} mode` : 'Type CONFIRM first'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Soft platform footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <p>(c) 2026 Xirfad Qardho. Connecting Somali trade skills and local industry.</p>
        </div>
      </footer>
    </div>
  );
}


