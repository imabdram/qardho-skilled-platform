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
import GuestAuthModal from './components/GuestAuthModal';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import AboutContact from './pages/AboutContact';
import { User, Job, JobStatus, Connection, Application, Review, ProfileFieldKey, VerificationMessage, PricingType, Notification } from './types';
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
  const [realtimeNotification, setRealtimeNotification] = useState<Notification | null>(null);

  // Active Modals states
  const [selectedWorkerForConnect, setSelectedWorkerForConnect] = useState<User | null>(null);
  const [selectedJobForApply, setSelectedJobForApply] = useState<Job | null>(null);
  const [guestAuthModal, setGuestAuthModal] = useState<{
    isOpen: boolean;
    role?: 'worker' | 'employer';
    targetSummary?: any;
  }>({ isOpen: false });

  const handleOpenGuestModal = (role?: 'worker' | 'employer', summary?: any) => {
    setGuestAuthModal({ isOpen: true, role, targetSummary: summary });
  };

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
  const refreshAllData = async (authenticatedUser: User | null = currentUser, silent = false) => {
    try {
      if (!silent) setIsLoadingData(true);
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
      if (!silent) {
        showAppError(e instanceof Error ? e.message : 'Could not load platform data. Check that the local server is running.');
      }
    } finally {
      if (!silent) setIsLoadingData(false);
    }
  };

  // Soft audio chime for real-time notifications
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Audio policy fallback
    }
  };

  // Real-time Server-Sent Events (SSE) notification listener
  useEffect(() => {
    if (!currentUser || !isSignedIn) return;

    let active = true;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let reconnectTimeout: any = null;

    const connectSseStream = async () => {
      try {
        const response = await fetchAuth('/api/notifications/stream');
        if (!response.ok || !response.body) return;

        reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (active) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() || '';

          for (const chunk of chunks) {
            const dataLine = chunk.split('\n').find((line) => line.startsWith('data: '));
            if (dataLine) {
              try {
                const eventData = JSON.parse(dataLine.slice(6));
                if (eventData.type === 'notification' && eventData.notification) {
                  const notice: Notification = eventData.notification;
                  setRealtimeNotification(notice);
                  playNotificationChime();
                  showAppNotice(`${notice.title}: ${notice.message}`);
                  refreshAllData(currentUser, true);
                }
              } catch (parseErr) {
                console.error('SSE JSON parse error', parseErr);
              }
            }
          }
        }
      } catch {
        if (active) {
          reconnectTimeout = setTimeout(connectSseStream, 3000);
        }
      }
    };

    connectSseStream();

    return () => {
      active = false;
      if (reader) reader.cancel().catch(() => undefined);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [currentUser?.id, isSignedIn]);

  // Periodic polling fallback (every 12 seconds)
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      refreshAllData(currentUser, true);
    }, 12000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Tab visibility change sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUser) {
        refreshAllData(currentUser, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser?.id]);

  useEffect(() => {
    let active = true;
    if (!isClerkLoaded) return;

    const bootstrap = async () => {
      setSessionLoading(true);
      let sessionUser: User | null = null;
      if (isSignedIn) {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const response = await fetchAuth('/api/auth/me');
            if (response.ok) {
              const data = await response.json();
              sessionUser = data.user || null;
              if (sessionUser) break;
            } else if (response.status === 403) {
              const data = await response.json().catch(() => ({}));
              showAppError(data.error || 'This account is currently suspended.');
              break;
            }
          } catch (e) {
            console.error('Error fetching /api/auth/me', e);
          }
          if (attempt < 2) await new Promise((r) => setTimeout(r, 300));
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
    if (!isClerkLoaded || sessionLoading) return;
    const path = location.pathname;
    const guestOnly = ['/login', '/auth', '/register', '/forgot-password', '/reset-password'].includes(path);
    const protectedPath = ['/profile', '/profile/edit', '/settings', '/dashboard', '/worker/dashboard', '/employer/dashboard', '/post-job', '/admin', '/onboarding'].includes(path);
    let target: string | null = null;

    if (guestOnly && currentUser) {
      try {
        const raw = sessionStorage.getItem('guest_auth_intent');
        if (raw) {
          const intent = JSON.parse(raw);
          sessionStorage.removeItem('guest_auth_intent');
          if (intent?.returnPath && intent.returnPath !== '/login' && intent.returnPath !== '/register') {
            target = intent.returnPath;
          }
        }
      } catch {
        // Storage fallback
      }
      if (!target) target = getDefaultRouteForUser(currentUser);
    }
    else if (!isSignedIn && protectedPath) target = '/login';
    else if (currentUser?.role === 'pending' && path !== '/onboarding' && (protectedPath || ['/', '/workers', '/jobs', '/about-contact'].includes(path) || /^\/jobs\//.test(path))) target = '/onboarding';
    else if (currentUser && path === '/onboarding' && currentUser.role !== 'pending') target = getDefaultRouteForUser(currentUser);
    else if (currentUser && path === '/admin' && currentUser.role !== 'admin') target = '/unauthorized';
    else if (currentUser && currentUser.role === 'admin' && (path === '/dashboard' || path === '/employer/dashboard' || path === '/worker/dashboard')) target = '/admin';
    else if (currentUser && (path === '/post-job' || path === '/employer/dashboard') && currentUser.role !== 'employer') target = currentUser.role === 'pending' ? '/onboarding' : '/unauthorized';
    else if (currentUser && path === '/worker/dashboard' && currentUser.role !== 'worker') target = currentUser.role === 'pending' ? '/onboarding' : '/unauthorized';
    else if (currentUser && (path === '/profile' || path === '/profile/edit' || path === '/settings') && currentUser.role === 'pending') target = '/onboarding';

    if (target && target !== path) navigate(target, { replace: true });
  }, [isClerkLoaded, sessionLoading, isSignedIn, currentUser, location.pathname, navigate]);

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
    if (!currentUser || isSwitchingRole || currentUser.role === 'admin') return;
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
      handleOpenGuestModal('employer', { type: 'worker', title: worker.name, subtitle: worker.skill || 'Skilled Professional' });
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
      handleOpenGuestModal('worker', { type: 'job', title: job.title, subtitle: job.employerName });
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
  const updateConnectionStatus = async (id: string, status: 'accepted' | 'declined', reason?: string) => {
    try {
      const res = await fetch(`/api/connections/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
      });
      if (res.ok) {
        await refreshAllData();
        showAppNotice(status === 'accepted' ? 'Hire request accepted. Permitted contact details unlocked.' : 'Hire request declined.');
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

  // Add Worker-to-Employer Review Handler
  const handleAddEmployerReview = async (reviewData: {
    jobId: string;
    employerId: string;
    overallRating: number;
    communicationRating: number;
    fairnessRating: number;
    paymentReliabilityRating: number;
    jobAccuracyRating: number;
    comment: string;
  }) => {
    try {
      const res = await fetch('/api/reviews/employer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
      if (res.ok) {
        await refreshAllData();
        showAppNotice('Employer review published.');
        return true;
      } else {
        showAppError(await getApiError(res, 'Could not submit review.'));
      }
    } catch (e) {
      console.error(e);
      showAppError('Could not submit review.');
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
              setViewingProfileUser(worker);
              navigateTo('profile');
            }}
            currentUser={currentUser}
            onOpenGuestModal={handleOpenGuestModal}
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
              navigateTo('profile');
            }}
            isLoading={isLoadingData}
            onOpenGuestModal={handleOpenGuestModal}
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
            onOpenGuestModal={handleOpenGuestModal}
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
            onOpenGuestModal={handleOpenGuestModal}
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
            onUpdateApplicationStatus={updateApplicationStatus}
            onUpdateConnectionStatus={updateConnectionStatus}
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
            users={users}
            connections={connections}
            applications={applications}
            jobs={jobs}
            reviews={reviews}
            onUpdateConnectionStatus={updateConnectionStatus}
            onUpdateApplicationStatus={updateApplicationStatus}
            onUpdateJobStatus={updateJobStatus}
            onNavigate={handleNavigate}
            onViewWorkerProfile={handleViewWorkerProfile}
            onAddEmployerReview={handleAddEmployerReview}
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
            onUpdateJobStatus={async (jobId: string, status: string) => {
              const res = await fetch(`/api/admin/jobs/${jobId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
              });
              if (!res.ok) throw new Error(await getApiError(res, 'Could not update job status.'));
            }}
            onDeleteJob={async (jobId: string) => {
              const res = await fetch(`/api/admin/jobs/${jobId}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
              });
              if (!res.ok) throw new Error(await getApiError(res, 'Could not delete job.'));
            }}
            onDeleteReview={async (reviewId: string) => {
              const res = await fetch(`/api/admin/reviews/${reviewId}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
              });
              if (!res.ok) throw new Error(await getApiError(res, 'Could not delete review.'));
            }}
          />
        );
      case 'onboarding':
        if (!currentUser) {
          return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent mb-4" />
              <p className="text-sm font-bold text-slate-700">Synchronizing your profile...</p>
            </div>
          );
        }
        return (
          <Onboarding
            currentUser={currentUser}
            jobs={jobs}
            onCompleteOnboarding={handleCompleteOnboarding}
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
  const isAnyModalOpen = !!selectedWorkerForConnect || !!selectedJobForApply || showDeleteAccountModal || showRoleSwitchModal || guestAuthModal.isOpen;

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
        isModalOpen={isAnyModalOpen}
        realtimeNotification={realtimeNotification}
      />

      {(isLoadingData || appError) && (
        <div className={`mt-0 md:mt-[64px] px-4 py-2 text-xs font-semibold border-b ${
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
      <main className={`flex-1 pb-0 ${!(isLoadingData || appError) ? 'pt-0 md:pt-[64px]' : ''}`}>
        {renderPage()}
      </main>

      {/* Modals render portals */}
      <GuestAuthModal
        isOpen={guestAuthModal.isOpen}
        onClose={() => setGuestAuthModal({ isOpen: false })}
        intentRole={guestAuthModal.role}
        targetSummary={guestAuthModal.targetSummary}
      />

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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Switch Account Role</p>
                  <h3 className="text-base font-black text-slate-900">Switch to {roleSwitchTargetName} Mode?</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowRoleSwitchModal(false); setRoleSwitchConfirmation(''); }}
                disabled={isSwitchingRole}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-60 transition"
                aria-label="Close role switch confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <p className="text-xs leading-relaxed font-semibold text-slate-600">
                You are currently operating in <span className="capitalize font-bold text-slate-900">{currentUser.role} mode</span>. Switching to <span className="font-bold text-[#2563eb]">{roleSwitchTargetName} mode</span> will customize your dashboard, navigation, and available actions.
              </p>

              {roleSwitchProfileCheck.warnings.length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-xs font-bold text-amber-800 space-y-1">
                  {roleSwitchProfileCheck.warnings.map((w, idx) => (
                    <p key={idx}>• {w}</p>
                  ))}
                </div>
              )}

              {roleSwitchProfileCheck.blocking.length > 0 && (
                <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-xs font-bold text-rose-800 space-y-1">
                  <p className="font-black uppercase text-[10px] tracking-wider text-rose-600 mb-1">Required Profile Updates:</p>
                  {roleSwitchProfileCheck.blocking.map((b, idx) => (
                    <p key={idx}>• {b}</p>
                  ))}
                </div>
              )}

              {canConfirmRoleSwitch && (
                <div className="pt-1">
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    To confirm, type <span className="font-black text-slate-900 uppercase">CONFIRM</span> below:
                  </label>
                  <input
                    type="text"
                    value={roleSwitchConfirmation}
                    onChange={(e) => setRoleSwitchConfirmation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && hasTypedRoleSwitchConfirmation && !isSwitchingRole) {
                        confirmSwitchRole();
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-black text-slate-900 outline-none transition focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:font-normal placeholder:text-slate-400"
                    placeholder="Type CONFIRM"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 p-4">
              <button
                type="button"
                onClick={() => { setShowRoleSwitchModal(false); setRoleSwitchConfirmation(''); }}
                disabled={isSwitchingRole}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50 transition"
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
                  className="flex-1 min-h-[44px] rounded-xl bg-amber-600 text-xs font-black text-white hover:bg-amber-700 transition"
                >
                  Complete Profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={confirmSwitchRole}
                  disabled={isSwitchingRole || !hasTypedRoleSwitchConfirmation}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] text-xs font-black text-white hover:bg-[#1d4ed8] shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 ${isSwitchingRole ? 'animate-spin' : ''}`} />
                  <span>
                    {isSwitchingRole
                      ? 'Switching...'
                      : hasTypedRoleSwitchConfirmation
                      ? `Confirm ${roleSwitchTargetName}`
                      : 'Type CONFIRM first'}
                  </span>
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
