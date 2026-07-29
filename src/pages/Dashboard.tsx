import React, { useState, useMemo } from 'react';
import { Connection, Application, Job, JobStatus, User, Review, VerificationMessage } from '../types';
import {
  Users, Briefcase, FileText, Check, X, Phone, MapPin,
  Clock, CheckCircle2, RefreshCw, PlusCircle, Star, ArrowRight, Copy, User as UserIcon, AlertCircle, Handshake
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import CandidateReviewModal from '../components/CandidateReviewModal';
import Avatar from '../components/Avatar';
import { getMissingProfileFields, PROFILE_FIELD_LABELS } from '../validation';

import EmployerReviewModal from '../components/EmployerReviewModal';
import WorkListCard, { WorkItemData } from '../components/dashboard/WorkListCard';
import StatusBadge, { DisplayStatus } from '../components/dashboard/StatusBadge';
import FiltersBar, { StatusFilterValue, SourceFilterValue, SortOrderValue } from '../components/dashboard/FiltersBar';
import PaginationBar from '../components/dashboard/PaginationBar';
import EmptyState from '../components/dashboard/EmptyState';

interface DashboardProps {
  currentUser: User | null;
  workers: User[];
  users?: User[];
  connections: Connection[];
  applications: Application[];
  jobs: Job[];
  reviews: Review[];
  onUpdateConnectionStatus: (id: string, status: 'accepted' | 'declined', reason?: string) => void | Promise<void>;
  onUpdateApplicationStatus: (id: string, status: 'accepted' | 'declined') => void | Promise<void>;
  onUpdateJobStatus: (id: string, status: JobStatus) => void | Promise<void>;
  onNavigate: (page: string) => void;
  onViewWorkerProfile: (worker: User) => void;
  onAddEmployerReview?: (data: {
    jobId: string;
    employerId: string;
    overallRating: number;
    communicationRating: number;
    fairnessRating: number;
    paymentReliabilityRating: number;
    jobAccuracyRating: number;
    comment: string;
  }) => Promise<boolean>;
  onSwitchRole: () => void;
  isSwitchingRole?: boolean;
  isLoading?: boolean;
  verificationMessage?: VerificationMessage | null;
  onReadVerificationMessage?: () => void | Promise<void>;
}

export default function Dashboard({
  currentUser,
  workers,
  users = [],
  connections,
  applications,
  jobs,
  reviews,
  onUpdateConnectionStatus,
  onUpdateApplicationStatus,
  onUpdateJobStatus,
  onNavigate,
  onViewWorkerProfile,
  onAddEmployerReview,
  onSwitchRole,
  isSwitchingRole = false,
  isLoading = false,
  verificationMessage = null,
  onReadVerificationMessage
}: DashboardProps) {
  if (!currentUser) return null;

  const isWorker = currentUser.role === 'worker';
  const [activeTab, setActiveTab] = useState<'progress' | 'connections' | 'applications' | 'jobs' | 'completed'>(isWorker ? 'progress' : 'applications');
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [declineModalConnection, setDeclineModalConnection] = useState<Connection | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('');

  // Filtering & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>('all');
  const [sortOrder, setSortOrder] = useState<SortOrderValue>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [pendingAction, setPendingAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    tone?: 'danger' | 'neutral';
    actionKey?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const [selectedEmployerReviewJob, setSelectedEmployerReviewJob] = useState<{ job: Job; sourceBadge?: 'Job Application' | 'Direct Offer' } | null>(null);

  const hasWorkerReviewedJob = (jobId: string) => reviews.some(r => r.jobId === jobId && r.reviewerRole === 'worker');
  const hasEmployerReviewedJob = (jobId: string) => reviews.some(r => r.jobId === jobId && (r.reviewerRole === 'employer' || !r.reviewerRole));

  // Raw filtered datasets by role
  const myConnections = isWorker
    ? connections.filter(c => c.toUserId === currentUser.id)
    : connections.filter(c => c.fromUserId === currentUser.id);

  const myApplications = isWorker
    ? applications.filter(a => a.applicantId === currentUser.id)
    : applications.filter(a => a.employerId === currentUser.id);

  const myPostedJobs = jobs.filter(j => j.employerId === currentUser.id);
  const pendingConnections = myConnections.filter(c => c.status === 'pending' || c.status === 'pending_worker_response').length;
  const pendingApplications = myApplications.filter(a => a.status === 'pending').length;
  const openJobs = myPostedJobs.filter(j => j.status === 'open').length;
  const completedJobs = myPostedJobs.filter(j => j.status === 'completed').length;
  const acceptedApplications = myApplications.filter(a => a.status === 'accepted');

  const getJobForApplication = (app: Application) => jobs.find(job => job.id === app.jobId);
  const isJobReviewed = (job: Job) => reviews.some(review => review.jobId === job.id && review.employerId === currentUser.id);

  const allWorkerProgressItems = [
    ...acceptedApplications.map(app => ({ application: app, connection: null, job: getJobForApplication(app), source: 'applications' as const })),
    ...myConnections.filter(c => c.status === 'accepted').map(conn => ({
      application: null,
      connection: conn,
      job: jobs.find(j => j.id === conn.jobId) || {
        id: `conn-job-${conn.id}`,
        title: conn.jobTitle || 'Direct Work Engagement',
        employerId: conn.fromUserId,
        employerName: conn.fromUserName,
        status: 'in_progress' as const,
        location: 'Qardho',
        createdAt: conn.createdAt
      } as Job,
      source: 'direct_offers' as const
    }))
  ].filter((item): item is { application: Application | null; connection: Connection | null; job: Job; source: 'applications' | 'direct_offers' } => !!item.job && item.job.status !== 'closed');

  const openConfirmation = (action: {
    title: string;
    description: string;
    confirmLabel: string;
    tone?: 'danger' | 'neutral';
    actionKey?: string;
    onConfirm: () => void | Promise<void>;
  }) => setPendingAction(action);

  const runAction = async (key: string, action: () => void | Promise<void>) => {
    if (actionKey) return;
    setActionKey(key);
    try {
      await Promise.resolve(action());
    } finally {
      setActionKey(null);
    }
  };

  const getWorker = (id?: string) => workers.find(worker => worker.id === id);
  const getEmployerUser = (userId?: string, fallbackName?: string, phone?: string): User => {
    const found = users?.find(u => u.id === userId) || workers.find(w => w.id === userId);
    if (found) return found;
    return {
      id: userId || 'emp-user',
      name: fallbackName || 'Employer',
      phone: phone || '',
      role: 'employer',
    };
  };

  const reviewReadyJobs = myPostedJobs.filter(job => job.status === 'completed' && !isJobReviewed(job));
  const completionRequests = isWorker
    ? allWorkerProgressItems.filter(item => item.job.status === 'completion_requested_by_employer').length
    : myPostedJobs.filter(job => job.status === 'completion_requested_by_worker').length;
  const activeJobsCount = isWorker
    ? allWorkerProgressItems.filter(item => ['active', 'in_progress', 'completion_requested_by_worker', 'completion_requested_by_employer'].includes(item.job.status)).length
    : myPostedJobs.filter(job => ['active', 'in_progress', 'completion_requested_by_worker', 'completion_requested_by_employer'].includes(job.status)).length;

  const missingProfileFields = getMissingProfileFields(currentUser);

  // Tab counts
  const tabCounts = {
    progress: isWorker
      ? allWorkerProgressItems.length
      : myPostedJobs.filter(j => ['active', 'in_progress', 'completion_requested_by_worker', 'completion_requested_by_employer'].includes(j.status)).length,
    applications: myApplications.length,
    connections: myConnections.length,
    jobs: myPostedJobs.length,
    completed: isWorker
      ? allWorkerProgressItems.filter(item => item.job.status === 'completed' || item.job.status === 'closed').length
      : myPostedJobs.filter(j => j.status === 'completed' || j.status === 'closed').length,
  };

  // Convert Worker Active Work items to WorkItemData
  const activeWorkCards: WorkItemData[] = useMemo(() => {
    if (!isWorker) return [];
    return allWorkerProgressItems.map(item => {
      const job = item.job;
      const app = item.application;
      const conn = item.connection;
      const isActionReq = job.status === 'completion_requested_by_employer';
      const workerReviewed = hasWorkerReviewedJob(job.id);
      const employerReviewed = hasEmployerReviewedJob(job.id);

      let status: DisplayStatus = 'active';
      let statusLabel = 'Active Work';
      let nextStepText = 'Finish the work or request completion.';

      if (isActionReq) {
        status = 'needs_action';
        statusLabel = 'Action Required';
        nextStepText = 'Employer requested completion. Please confirm or report issue.';
      } else if (job.status === 'completion_requested_by_worker') {
        status = 'completion_requested';
        statusLabel = 'Completion Requested';
        nextStepText = 'Waiting for employer to confirm job completion.';
      } else if (job.status === 'completed' || job.status === 'closed') {
        if (!workerReviewed && !employerReviewed) {
          status = 'review_pending';
          statusLabel = 'Review Pending';
          nextStepText = 'Rate your experience with this employer to close the work.';
        } else if (workerReviewed && !employerReviewed) {
          status = 'review_pending';
          statusLabel = 'Review Pending';
          nextStepText = 'Your review was submitted. Waiting for employer review.';
        } else if (!workerReviewed && employerReviewed) {
          status = 'review_pending';
          statusLabel = 'Review Pending';
          nextStepText = 'Rate your experience with this employer to close the work.';
        } else {
          status = 'closed';
          statusLabel = 'Closed';
          nextStepText = 'Both reviews were submitted. Work engagement closed.';
        }
      } else if (job.status === 'completion_disputed') {
        status = 'disputed';
        statusLabel = 'Completion Disputed';
        nextStepText = 'Work completion is currently under dispute.';
      }

      // Primary Action
      let primaryAction;
      if (job.status === 'active' || job.status === 'in_progress') {
        primaryAction = {
          label: 'Request Completion',
          icon: CheckCircle2,
          variant: 'primary' as const,
          isLoading: actionKey === `worker-request-${job.id}`,
          onClick: () => openConfirmation({
            title: 'Request job completion?',
            description: `Ask employer "${job.employerName}" to confirm "${job.title}" is finished.`,
            confirmLabel: 'Request completion',
            tone: 'neutral',
            actionKey: `worker-request-${job.id}`,
            onConfirm: () => onUpdateJobStatus(job.id, 'completion_requested_by_worker'),
          }),
        };
      } else if (isActionReq) {
        primaryAction = {
          label: 'Confirm Completion',
          icon: CheckCircle2,
          variant: 'success' as const,
          isLoading: actionKey === `worker-complete-${job.id}`,
          onClick: () => openConfirmation({
            title: 'Confirm work completed?',
            description: `This confirms you finished "${job.title}". The employer can review after this.`,
            confirmLabel: 'Confirm completed',
            tone: 'neutral',
            actionKey: `worker-complete-${job.id}`,
            onConfirm: () => onUpdateJobStatus(job.id, 'completed'),
          }),
        };
      } else if ((job.status === 'completed' || job.status === 'closed') && !workerReviewed) {
        primaryAction = {
          label: 'Rate Employer',
          icon: Star,
          variant: 'warning' as const,
          onClick: () => {
            setSelectedEmployerReviewJob({
              job,
              sourceBadge: item.source === 'direct_offers' ? 'Direct Offer' : 'Job Application'
            });
          },
        };
      }

      // Secondary actions
      const secondaryActions = [];
      if (isActionReq) {
        secondaryActions.push({
          label: 'Report Issue',
          icon: AlertCircle,
          tone: 'danger' as const,
          isMoreMenuOnly: true,
          onClick: () => openConfirmation({
            title: 'Report a completion issue?',
            description: 'The job will remain unresolved and the issue will be recorded.',
            confirmLabel: 'Report issue',
            tone: 'danger',
            actionKey: `worker-dispute-${job.id}`,
            onConfirm: () => onUpdateJobStatus(job.id, 'completion_disputed'),
          }),
        });
      }

      const formattedDate = job.createdAt
        ? new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Jul 29';

      return {
        id: job.id,
        type: 'active_work',
        title: job.title,
        sourceBadge: item.source === 'direct_offers' ? 'Direct Offer' : 'Job Application',
        otherPartyName: job.employerName,
        otherPartyRole: 'Employer',
        otherPartyId: job.employerId,
        location: job.location || 'Qardho',
        rate: job.rate,
        workType: item.source === 'direct_offers' ? 'Direct Work' : 'Contract',
        message: conn?.message || app?.message || job.description,
        dateStr: `Started ${formattedDate}`,
        status,
        statusLabel,
        nextStepText,
        phone: job.phone || conn?.phone || app?.phone,
        isContactUnlocked: true,
        agreedAmount: conn?.agreedAmount || job.rate,
        expectedTimeline: conn?.expectedTimeline || job.expectedDuration,
        isAgreementConfirmed: true,
        workflowSteps: [
          { key: 'posted', label: 'Posted', isDone: true },
          { key: 'accepted', label: 'Accepted', isDone: true },
          { key: 'active', label: 'Active Work', isDone: ['active', 'in_progress', 'completion_requested_by_worker', 'completion_requested_by_employer', 'completed'].includes(job.status), isCurrent: ['active', 'in_progress', 'completion_requested_by_worker', 'completion_requested_by_employer'].includes(job.status) },
          { key: 'completed', label: 'Completed', isDone: job.status === 'completed' || job.status === 'closed', isCurrent: (job.status === 'completed' || job.status === 'closed') && !workerReviewed },
          { key: 'reviewed', label: 'Reviewed', isDone: workerReviewed },
        ],
        primaryAction,
        secondaryActions,
        job,
        application: app || undefined,
        connection: conn || undefined,
      };
    });
  }, [allWorkerProgressItems, isWorker, actionKey, reviews]);

  // Convert Applications to WorkItemData (Worker & Employer)
  const applicationCards: WorkItemData[] = useMemo(() => {
    return myApplications.map(app => {
      const job = getJobForApplication(app);
      const formattedDate = app.createdAt
        ? new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Jul 29';

      let status: DisplayStatus = 'under_review';
      let statusLabel = isWorker ? 'Under Review' : 'Needs Review';
      let nextStepText = isWorker ? 'Waiting for employer to review application.' : 'Review this application and make a decision.';

      if (!isWorker && app.status === 'pending') {
        status = 'needs_action';
        statusLabel = 'Needs Review';
        nextStepText = 'Review this application and make a decision.';
      } else if (app.status === 'accepted') {
        status = 'accepted';
        statusLabel = isWorker ? 'Accepted' : 'Candidate Hired';
        nextStepText = isWorker ? 'Your application was accepted! Check Active Work for details.' : 'Candidate hired. Contact worker or check Active Work.';
      } else if (app.status === 'declined') {
        status = 'not_selected';
        statusLabel = isWorker ? 'Not Selected' : 'Rejected';
        nextStepText = isWorker ? 'Application was not selected by employer.' : 'Application was rejected.';
      }

      let primaryAction;
      if (isWorker) {
        if (app.status === 'accepted') {
          primaryAction = {
            label: 'View Active Work',
            icon: ArrowRight,
            variant: 'primary' as const,
            onClick: () => setActiveTab('progress'),
          };
        }
      } else {
        if (app.status === 'pending') {
          primaryAction = {
            label: 'Review Application',
            icon: FileText,
            variant: 'primary' as const,
            onClick: () => setSelectedApplication(app),
          };
        } else if (app.status === 'accepted') {
          primaryAction = {
            label: 'View Active Work',
            icon: ArrowRight,
            variant: 'primary' as const,
            onClick: () => setActiveTab('progress'),
          };
        }
      }

      return {
        id: app.id,
        type: 'application',
        title: app.jobTitle,
        sourceBadge: 'Job Application',
        otherPartyName: isWorker ? (job?.employerName || 'Employer') : app.applicantName,
        otherPartyRole: isWorker ? 'Employer' : 'Worker',
        otherPartyId: isWorker ? app.employerId : app.applicantId,
        location: app.location || 'Qardho',
        rate: app.proposedAmount ? `$${app.proposedAmount}/${app.proposedPricingType || 'project'}` : job?.rate,
        workType: isWorker ? 'Contract' : (app.applicantSkill || 'Skilled Worker'),
        message: app.message,
        dateStr: `Submitted ${formattedDate}`,
        status,
        statusLabel,
        nextStepText,
        phone: app.phone,
        isContactUnlocked: app.status === 'accepted',
        workflowSteps: [
          { key: 'submitted', label: 'Submitted', isDone: true },
          { key: 'review', label: 'Under Review', isDone: true, isCurrent: app.status === 'pending' },
          { key: 'decision', label: app.status === 'declined' ? (isWorker ? 'Not Selected' : 'Rejected') : 'Accepted', isDone: app.status !== 'pending', isCurrent: app.status === 'accepted' },
          { key: 'active', label: 'Active Work', isDone: app.status === 'accepted' },
        ],
        primaryAction,
        secondaryActions: !isWorker ? [
          {
            label: 'View Worker Profile',
            icon: UserIcon,
            onClick: () => {
              const workerObj = getWorker(app.applicantId);
              if (workerObj) onViewWorkerProfile(workerObj);
            },
          },
          ...(app.status === 'pending' ? [
            {
              label: 'Accept & Hire Candidate',
              icon: Check,
              onClick: () => openConfirmation({
                title: 'Accept & Hire this candidate?',
                description: `This will hire ${app.applicantName}, move "${app.jobTitle}" to in progress, and notify candidate.`,
                confirmLabel: actionKey === `accept-app-${app.id}` ? 'Accepting...' : 'Accept & Hire candidate',
                tone: 'neutral' as const,
                actionKey: `accept-app-${app.id}`,
                onConfirm: () => onUpdateApplicationStatus(app.id, 'accepted')
              }),
            },
            {
              label: 'Reject Application',
              icon: X,
              tone: 'danger' as const,
              onClick: () => openConfirmation({
                title: 'Reject candidate application?',
                description: `This will mark ${app.applicantName}'s application for "${app.jobTitle}" as rejected.`,
                confirmLabel: 'Reject application',
                tone: 'danger' as const,
                actionKey: `decline-app-${app.id}`,
                onConfirm: () => onUpdateApplicationStatus(app.id, 'declined')
              }),
            }
          ] : [])
        ] : [],
        application: app,
        job,
      };
    });
  }, [myApplications, isWorker, actionKey]);

  // Convert Direct Offers (Connections) to WorkItemData
  const directOfferCards: WorkItemData[] = useMemo(() => {
    return myConnections.map(conn => {
      const formattedDate = conn.createdAt
        ? new Date(conn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Jul 29';

      const isPending = conn.status === 'pending' || conn.status === 'pending_worker_response';

      let status: DisplayStatus = 'under_review';
      let statusLabel = 'Waiting';
      let nextStepText = 'Waiting for response.';

      if (isPending) {
        status = isWorker ? 'needs_action' : 'under_review';
        statusLabel = isWorker ? 'Needs Response' : 'Waiting for Worker';
        nextStepText = isWorker ? 'Employer sent a direct offer. Accept to unlock contact details.' : 'Waiting for worker to accept your direct offer.';
      } else if (conn.status === 'accepted') {
        status = 'accepted';
        statusLabel = 'Offer Accepted';
        nextStepText = 'Offer accepted. Work agreement confirmed & contact unlocked.';
      } else if (conn.status === 'declined') {
        status = 'declined';
        statusLabel = 'Offer Declined';
        nextStepText = isWorker ? 'You declined this direct offer.' : 'Worker declined this direct offer.';
      } else if (conn.status === 'cancelled_by_employer') {
        status = 'cancelled';
        statusLabel = 'Cancelled';
        nextStepText = isWorker ? 'Offer was cancelled by employer.' : 'You cancelled this direct offer.';
      } else if (conn.status === 'expired') {
        status = 'expired';
        statusLabel = 'Expired';
        nextStepText = 'Direct offer expired.';
      }

      let primaryAction;
      if (isWorker && isPending) {
        primaryAction = {
          label: 'Accept Offer',
          icon: Check,
          variant: 'success' as const,
          isLoading: actionKey === `accept-conn-${conn.id}`,
          onClick: () => openConfirmation({
            title: 'Accept this hire request?',
            description: `Allowed contact information may be shared with ${conn.fromUserName}.`,
            confirmLabel: actionKey === `accept-conn-${conn.id}` ? 'Accepting...' : 'Accept Request',
            tone: 'neutral',
            actionKey: `accept-conn-${conn.id}`,
            onConfirm: () => onUpdateConnectionStatus(conn.id, 'accepted')
          }),
        };
      } else if (conn.status === 'accepted') {
        primaryAction = {
          label: isWorker ? 'View Active Work' : 'Contact Participant',
          icon: isWorker ? ArrowRight : Phone,
          variant: 'primary' as const,
          onClick: () => isWorker ? setActiveTab('progress') : null,
        };
      } else if (!isWorker && isPending) {
        primaryAction = {
          label: 'View Worker Profile',
          icon: UserIcon,
          variant: 'primary' as const,
          onClick: () => {
            const w = getWorker(conn.toUserId);
            if (w) onViewWorkerProfile(w);
          },
        };
      }

      const secondaryActions = [];
      if (isWorker && isPending) {
        secondaryActions.push({
          label: 'Decline Offer',
          icon: X,
          tone: 'danger' as const,
          onClick: () => {
            setDeclineModalConnection(conn);
            setDeclineReason('');
          },
        });
      }

      return {
        id: conn.id,
        type: 'direct_offer',
        title: conn.jobTitle || 'Direct Work Opportunity',
        sourceBadge: 'Direct Offer',
        otherPartyName: isWorker ? conn.fromUserName : conn.toUserName,
        otherPartyRole: isWorker ? 'Employer' : 'Worker',
        otherPartyId: isWorker ? conn.fromUserId : conn.toUserId,
        location: 'Qardho',
        agreedAmount: conn.agreedAmount,
        expectedTimeline: conn.expectedTimeline,
        message: conn.message,
        dateStr: `Updated ${formattedDate}`,
        status,
        statusLabel,
        nextStepText,
        phone: conn.phone,
        isContactUnlocked: conn.status === 'accepted',
        isAgreementConfirmed: conn.status === 'accepted',
        workflowSteps: [
          { key: 'sent', label: 'Offer Sent', isDone: true },
          { key: 'response', label: 'Worker Response', isDone: !isPending, isCurrent: isPending },
          { key: 'contact', label: 'Contact Unlocked', isDone: conn.status === 'accepted' },
          { key: 'active', label: 'Active Work', isDone: conn.status === 'accepted' },
        ],
        primaryAction,
        secondaryActions,
        connection: conn,
      };
    });
  }, [myConnections, isWorker, actionKey]);

  // Employer Posted Jobs & Engagements mapped to WorkItemData
  const employerJobCards: WorkItemData[] = useMemo(() => {
    if (isWorker) return [];
    return myPostedJobs.map(job => {
      const acceptedApp = applications.find(app => app.jobId === job.id && app.status === 'accepted');
      const reviewed = isJobReviewed(job);
      const workerName = job.assignedWorkerName || acceptedApp?.applicantName;
      const jobAppsCount = applications.filter(app => app.jobId === job.id).length;

      let status: DisplayStatus = 'active';
      let statusLabel = 'Open';
      let nextStepText = 'Review applicants or wait for applications.';

      if (job.status === 'open') {
        status = 'under_review';
        statusLabel = 'Open';
        nextStepText = jobAppsCount > 0 ? `Review ${jobAppsCount} applicant${jobAppsCount === 1 ? '' : 's'}` : 'Waiting for applications.';
      } else if (job.status === 'active' || job.status === 'in_progress') {
        status = 'active';
        statusLabel = 'Active Work';
        nextStepText = 'Wait for worker to finish or request completion.';
      } else if (job.status === 'completion_requested_by_worker') {
        status = 'needs_action';
        statusLabel = 'Action Required';
        nextStepText = 'Worker requested job completion. Confirm work done or report issue.';
      } else if (job.status === 'completion_requested_by_employer') {
        status = 'completion_requested';
        statusLabel = 'Completion Requested';
        nextStepText = 'Waiting for worker to confirm completion.';
      } else if (job.status === 'completed') {
        if (!reviewed) {
          status = 'review_pending';
          statusLabel = 'Review Pending';
          nextStepText = 'Rate the worker to close this engagement.';
        } else {
          status = 'completed';
          statusLabel = 'Completed';
          nextStepText = 'Your review was submitted. Engagement closed.';
        }
      }

      let primaryAction;
      if (job.status === 'completion_requested_by_worker') {
        primaryAction = {
          label: 'Confirm Completion',
          icon: CheckCircle2,
          variant: 'success' as const,
          onClick: () => openConfirmation({
            title: 'Confirm job completion?',
            description: `Confirm "${job.title}" is finished.`,
            confirmLabel: 'Confirm completion',
            tone: 'neutral',
            actionKey: `confirm-${job.id}`,
            onConfirm: () => onUpdateJobStatus(job.id, 'completed')
          }),
        };
      } else if (['active', 'in_progress'].includes(job.status)) {
        primaryAction = {
          label: 'Request Completion',
          icon: CheckCircle2,
          variant: 'primary' as const,
          onClick: () => openConfirmation({
            title: 'Request worker completion?',
            description: `Ask assigned worker to confirm "${job.title}" is finished.`,
            confirmLabel: 'Request completion',
            tone: 'neutral',
            actionKey: `complete-${job.id}`,
            onConfirm: () => onUpdateJobStatus(job.id, 'completion_requested_by_employer')
          }),
        };
      } else if (job.status === 'completed' && !reviewed) {
        primaryAction = {
          label: 'Rate Worker',
          icon: Star,
          variant: 'warning' as const,
          onClick: () => {
            const reviewWorker = getWorker(job.assignedWorkerId || acceptedApp?.applicantId);
            if (reviewWorker) onViewWorkerProfile(reviewWorker);
            else onNavigate('workers');
          },
        };
      } else if (job.status === 'open' && jobAppsCount > 0) {
        primaryAction = {
          label: 'Review Applicants',
          icon: Users,
          variant: 'primary' as const,
          onClick: () => setActiveTab('applications'),
        };
      }

      return {
        id: job.id,
        type: 'active_work',
        title: job.title,
        sourceBadge: 'Job Application',
        otherPartyName: workerName || 'No worker accepted yet',
        otherPartyRole: 'Worker',
        otherPartyId: job.assignedWorkerId || acceptedApp?.applicantId,
        location: job.location || 'Qardho',
        rate: job.rate,
        workType: job.category || 'Local Work',
        message: job.description,
        dateStr: `Posted ${new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        status,
        statusLabel,
        nextStepText,
        phone: job.phone || acceptedApp?.phone,
        isContactUnlocked: !!workerName,
        workflowSteps: [
          { key: 'posted', label: 'Posted', isDone: true },
          { key: 'active', label: 'Active', isDone: ['active', 'in_progress', 'completion_requested_by_worker', 'completion_requested_by_employer', 'completed'].includes(job.status) },
          { key: 'completed', label: 'Completed', isDone: job.status === 'completed' },
          { key: 'reviewed', label: 'Reviewed', isDone: reviewed },
        ],
        primaryAction,
        job,
      };
    });
  }, [myPostedJobs, isWorker, applications, actionKey, reviews]);

  // Current active cards dataset based on active tab
  const currentTabItems: WorkItemData[] = useMemo(() => {
    if (activeTab === 'progress') {
      return isWorker
        ? activeWorkCards
        : employerJobCards.filter(c => ['active', 'in_progress', 'completion_requested', 'needs_action'].includes(c.status));
    } else if (activeTab === 'applications') {
      return applicationCards;
    } else if (activeTab === 'connections') {
      return directOfferCards;
    } else if (activeTab === 'jobs') {
      return employerJobCards;
    } else if (activeTab === 'completed') {
      return isWorker
        ? activeWorkCards.filter(c => c.job?.status === 'completed' || c.status === 'completed' || c.status === 'review_pending')
        : employerJobCards.filter(c => c.job?.status === 'completed' || c.status === 'completed' || c.status === 'review_pending');
    }
    return [];
  }, [activeTab, isWorker, activeWorkCards, applicationCards, directOfferCards, employerJobCards]);

  // Needs Action Count across all active items
  const totalNeedsActionCount = useMemo(() => {
    const allCards = isWorker
      ? [...activeWorkCards, ...applicationCards, ...directOfferCards]
      : [...employerJobCards, ...applicationCards, ...directOfferCards];
    return allCards.filter(c => c.status === 'needs_action' || c.status === 'review_pending').length;
  }, [isWorker, activeWorkCards, applicationCards, directOfferCards, employerJobCards]);

  // Filtered & Sorted items for display
  const filteredItems = useMemo(() => {
    return currentTabItems.filter(item => {
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(q);
        const nameMatch = item.otherPartyName.toLowerCase().includes(q);
        const locMatch = item.location.toLowerCase().includes(q);
        if (!titleMatch && !nameMatch && !locMatch) return false;
      }

      // Source filter match
      if (sourceFilter === 'direct_offers' && item.sourceBadge !== 'Direct Offer') return false;
      if (sourceFilter === 'applications' && item.sourceBadge !== 'Job Application') return false;

      // Status filter match
      if (statusFilter === 'needs_action' && item.status !== 'needs_action' && item.status !== 'review_pending') return false;
      if (statusFilter === 'waiting' && item.status !== 'under_review' && item.status !== 'pending') return false;
      if (statusFilter === 'active' && item.status !== 'active' && item.status !== 'in_progress') return false;
      if (statusFilter === 'completion_requested' && item.status !== 'completion_requested') return false;
      if (statusFilter === 'review_pending' && item.status !== 'review_pending') return false;
      if (statusFilter === 'completed' && item.status !== 'completed') return false;
      if (statusFilter === 'closed' && item.status !== 'closed' && item.status !== 'not_selected' && item.status !== 'declined') return false;

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'urgency') {
        const getUrgencyRank = (status: string) => {
          if (status === 'needs_action') return 1;
          if (status === 'review_pending') return 2;
          if (status === 'active' || status === 'in_progress') return 3;
          if (status === 'under_review' || status === 'completion_requested') return 4;
          if (status === 'completed') return 5;
          return 6;
        };
        return getUrgencyRank(a.status) - getUrgencyRank(b.status);
      }

      if (sortOrder === 'oldest') {
        return a.id.localeCompare(b.id);
      }

      // Default newest first
      return b.id.localeCompare(a.id);
    });
  }, [currentTabItems, searchQuery, statusFilter, sourceFilter, sortOrder]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Handle Tab Switch
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const NeedsAttentionCard = ({ title, detail, action, onClick, tone = 'blue' }: { title: string; detail: string; action: string; onClick: () => void; tone?: 'blue' | 'amber' | 'brand' }) => {
    const toneClass = tone === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-100' : tone === 'brand' ? 'bg-brand-50 text-brand-800 border-brand-100' : 'bg-[#93c5fd]/30 text-[#1e40af] border-[#93c5fd]/60';
    return (
      <button onClick={onClick} className={`min-h-28 rounded-xl border p-4 text-left transition hover:shadow-sm ${toneClass}`}>
        <span className="block text-sm font-black">{title}</span>
        <span className="mt-1 block text-xs font-semibold opacity-80">{detail}</span>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-black">{action}<ArrowRight className="h-3.5 w-3.5" /></span>
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-[1140px] px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 pb-[calc(90px+env(safe-area-inset-bottom))] min-w-0" id="dashboard-container">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col gap-5 rounded-2xl bg-[#111615] p-6 text-white shadow-xl shadow-brand-950/15 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-black sm:text-2xl">Dashboard</h1>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${isWorker ? 'bg-brand-500/20 text-brand-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
              {isWorker ? 'Skilled Worker' : 'Employer'}
            </span>
          </div>
          <p className="text-xs text-slate-400 sm:text-sm">
            {isWorker ? 'Track active work, applications, and direct hire offers efficiently.' : 'Manage applicants, active jobs, completion, and worker reviews.'}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {!isWorker && (
            <button onClick={() => onNavigate('post-job')} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-4 py-2.5 text-xs font-black text-[#111615] hover:bg-[#c8ff74] transition">
              <PlusCircle className="h-4 w-4 text-[#1e40af]" />
              Post a Job
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <section className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard data">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-xl border border-slate-100 bg-white p-4 shadow-xs">
              <div className="h-3 w-24 rounded bg-slate-100" />
              <div className="mt-3 h-7 w-12 rounded bg-slate-100" />
              <div className="mt-4 h-3 w-32 rounded bg-slate-100" />
            </div>
          ))}
        </section>
      )}

      {/* Next Actions Urgent Cards */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">Urgent Next Actions</h2>
          <span className="text-xs font-semibold text-slate-400">Items requiring your attention</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {pendingApplications > 0 && (
            <NeedsAttentionCard title={`${pendingApplications} ${isWorker ? 'application' : 'candidate'}${pendingApplications === 1 ? '' : 's'} waiting`} detail={isWorker ? 'Waiting for employer response.' : 'Review applicants and hire one worker.'} action={isWorker ? 'View status' : 'Review candidates'} onClick={() => handleTabChange('applications')} tone="amber" />
          )}
          {pendingConnections > 0 && (
            <NeedsAttentionCard title={`${pendingConnections} hire request${pendingConnections === 1 ? '' : 's'}`} detail={isWorker ? 'Accept to reveal contact details.' : 'Waiting for worker response.'} action="Open requests" onClick={() => handleTabChange('connections')} />
          )}
          {completionRequests > 0 && (
            <NeedsAttentionCard title={`${completionRequests} completion confirmation${completionRequests === 1 ? '' : 's'}`} detail={isWorker ? 'The other participant requested completion.' : 'Waiting for the other participant.'} action="Open progress" onClick={() => handleTabChange(isWorker ? 'progress' : 'jobs')} tone="brand" />
          )}
          {activeJobsCount > 0 && (
            <NeedsAttentionCard title={`${activeJobsCount} active job${activeJobsCount === 1 ? '' : 's'}`} detail={isWorker ? 'Keep contact details handy.' : 'Request completion when finished.'} action="Open progress" onClick={() => handleTabChange('progress')} />
          )}
          {!isWorker && reviewReadyJobs.length > 0 && (
            <NeedsAttentionCard title={`${reviewReadyJobs.length} review${reviewReadyJobs.length === 1 ? '' : 's'} needed`} detail="Completed jobs are waiting for feedback." action="Rate worker" onClick={() => handleTabChange('completed')} tone="brand" />
          )}
          {missingProfileFields.length > 0 && (
            <NeedsAttentionCard title="Profile incomplete" detail={`Missing: ${missingProfileFields.slice(0, 3).join(', ')}${missingProfileFields.length > 3 ? '...' : ''}`} action="Complete profile" onClick={() => onNavigate('profile')} tone="amber" />
          )}
          {pendingApplications === 0 && pendingConnections === 0 && activeJobsCount === 0 && reviewReadyJobs.length === 0 && missingProfileFields.length === 0 && (
            <NeedsAttentionCard title="Nothing urgent" detail="Your dashboard is clear right now." action={isWorker ? 'Browse jobs' : 'Post a job'} onClick={() => onNavigate(isWorker ? 'jobs' : 'post-job')} tone="brand" />
          )}
        </div>
      </section>

      {verificationMessage && !currentUser.verified && (
        <section className="mb-8 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
          <div className="border-b border-amber-200/70 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Message from {verificationMessage.adminName}</p>
            <h2 className="mt-1 text-base font-black text-amber-950">Admin requested profile updates</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">Complete the requested information so the admin can review your account for verification.</p>
          </div>
          <div className="bg-white/60 px-5 py-4">
            {verificationMessage.missingFields.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {verificationMessage.missingFields.map((field) => (
                  <span key={field} className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-black text-amber-800">{PROFILE_FIELD_LABELS[field]}</span>
                ))}
              </div>
            )}
            {verificationMessage.note && <p className="mt-3 rounded-xl border border-amber-100 bg-white px-3 py-3 text-xs font-medium leading-5 text-slate-700">{verificationMessage.note}</p>}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] font-bold text-slate-500">Sent {new Date(verificationMessage.sentAt).toLocaleDateString('en-GB')}</p>
              <button onClick={async () => { await onReadVerificationMessage?.(); onNavigate('profile'); }} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-amber-600 px-4 text-xs font-black text-white transition hover:bg-amber-700">Update my profile</button>
            </div>
          </div>
        </section>
      )}

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: isWorker ? 'Active Work' : 'Active Work', value: isWorker ? activeJobsCount : activeJobsCount },
          { label: isWorker ? 'Applications Sent' : 'Applications Received', value: pendingApplications },
          { label: isWorker ? 'Pending Direct Offers' : 'Direct Offers Sent', value: pendingConnections },
          { label: 'Completed Work', value: isWorker ? allWorkerProgressItems.filter(item => item.job.status === 'completed').length : completedJobs },
        ].map(metric => (
          <div key={metric.label} className="p-3.5">
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">{metric.label}</span>
            <span className="mt-1 block text-2xl font-black text-slate-900">{metric.value}</span>
          </div>
        ))}
      </div>

      {/* COMPACT DASHBOARD TAB BUTTONS WITH COUNTS */}
      <div className="sticky top-[104px] z-30 mb-6 flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-[#f6fbf8]/95 pb-3 backdrop-blur sm:static sm:bg-transparent">
        {[
          { key: 'progress' as const, label: 'Active Work' },
          { key: 'applications' as const, label: isWorker ? 'Applications' : 'Applications Received' },
          { key: 'connections' as const, label: isWorker ? 'Direct Offers' : 'Direct Offers Sent' },
          ...(!isWorker ? [{ key: 'jobs' as const, label: 'Posted Jobs' }] : []),
          { key: 'completed' as const, label: 'Completed' },
        ].map(tab => {
          const isActive = activeTab === tab.key;
          const count = tabCounts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              aria-selected={isActive}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
                isActive
                  ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-700'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* SEARCH, FILTERS & SORTING BAR */}
      <FiltersBar
        searchQuery={searchQuery}
        onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => { setStatusFilter(s); setCurrentPage(1); }}
        sourceFilter={sourceFilter}
        onSourceFilterChange={(src) => { setSourceFilter(src); setCurrentPage(1); }}
        sortOrder={sortOrder}
        onSortOrderChange={(sort) => { setSortOrder(sort); setCurrentPage(1); }}
        needsActionCount={totalNeedsActionCount}
        totalCount={currentTabItems.length}
        onResetFilters={() => {
          setSearchQuery('');
          setStatusFilter('all');
          setSourceFilter('all');
          setSortOrder('newest');
          setCurrentPage(1);
        }}
      />

      {/* COMPACT CARDS LIST CONTAINER */}
      <div className="space-y-3">
        {paginatedItems.length > 0 ? (
          paginatedItems.map(item => (
            <WorkListCard
              key={item.id}
              item={item}
              currentUser={currentUser}
              onViewProfile={(userId, fallbackName, phone) => {
                const targetUser = getEmployerUser(userId, fallbackName, phone);
                onViewWorkerProfile(targetUser);
              }}
              onViewJobDetails={(jobId) => {
                onNavigate('jobs');
              }}
              actionKey={actionKey}
            />
          ))
        ) : (
          <EmptyState
            type={searchQuery || statusFilter !== 'all' || sourceFilter !== 'all' ? 'filtered' : activeTab}
            isWorker={isWorker}
            onAction={() => {
              if (searchQuery || statusFilter !== 'all' || sourceFilter !== 'all') {
                setSearchQuery('');
                setStatusFilter('all');
                setSourceFilter('all');
                setCurrentPage(1);
              } else {
                onNavigate(isWorker ? 'jobs' : 'post-job');
              }
            }}
          />
        )}
      </div>

      {/* PAGINATION BAR */}
      <PaginationBar
        currentPage={currentPage}
        totalItems={filteredItems.length}
        pageSize={pageSize}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* MODALS */}
      {selectedApplication && (
        <CandidateReviewModal
          application={selectedApplication}
          worker={getWorker(selectedApplication.applicantId)}
          currentUser={currentUser}
          job={getJobForApplication(selectedApplication)}
          onClose={() => setSelectedApplication(null)}
          onViewWorkerProfile={onViewWorkerProfile}
          onAccept={(appId) => {
            const app = selectedApplication;
            setSelectedApplication(null);
            openConfirmation({
              title: 'Accept & Hire Candidate?',
              description: `This will hire ${app.applicantName}, move "${app.jobTitle}" to in progress, and notify the candidate.`,
              confirmLabel: 'Hire candidate',
              tone: 'neutral',
              actionKey: `accept-app-${appId}`,
              onConfirm: () => onUpdateApplicationStatus(appId, 'accepted'),
            });
          }}
          onDecline={(appId) => {
            const app = selectedApplication;
            setSelectedApplication(null);
            openConfirmation({
              title: 'Decline application?',
              description: `This will mark ${app.applicantName}'s application as declined.`,
              confirmLabel: 'Decline application',
              tone: 'danger',
              actionKey: `decline-app-${appId}`,
              onConfirm: () => onUpdateApplicationStatus(appId, 'declined'),
            });
          }}
        />
      )}

      {pendingAction && (
        <ConfirmDialog
          title={pendingAction.title}
          description={pendingAction.description}
          confirmLabel={pendingAction.confirmLabel}
          tone={pendingAction.tone}
          onConfirm={() => {
            const action = pendingAction;
            setPendingAction(null);
            void runAction(action.actionKey || action.title, action.onConfirm);
          }}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {declineModalConnection && (
        <ConfirmDialog
          title="Decline this hire request?"
          description="The employer will be notified. Your contact information will remain private."
          confirmLabel={actionKey === `decline-conn-${declineModalConnection.id}` ? 'Declining...' : 'Decline Request'}
          cancelLabel="Cancel"
          tone="danger"
          onCancel={() => {
            setDeclineModalConnection(null);
            setDeclineReason('');
          }}
          onConfirm={async () => {
            const conn = declineModalConnection;
            const reason = declineReason;
            setDeclineModalConnection(null);
            setDeclineReason('');
            await runAction(`decline-conn-${conn.id}`, () => onUpdateConnectionStatus(conn.id, 'declined', reason));
          }}
        >
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Optional reason:
            </label>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {[
                'Not available',
                'Job is not suitable',
                'Rate or terms are unclear',
                'Other'
              ].map(reasonOption => (
                <button
                  key={reasonOption}
                  type="button"
                  onClick={() => setDeclineReason(prev => prev === reasonOption ? '' : reasonOption)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                    declineReason === reasonOption
                      ? 'border-red-300 bg-red-50 text-red-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {declineReason === reasonOption ? '✓ ' : ''}{reasonOption}
                </button>
              ))}
            </div>
          </div>
        </ConfirmDialog>
      )}

      {selectedEmployerReviewJob && (
        <EmployerReviewModal
          job={selectedEmployerReviewJob.job}
          employer={getEmployerUser(selectedEmployerReviewJob.job.employerId, selectedEmployerReviewJob.job.employerName, selectedEmployerReviewJob.job.phone)}
          currentUser={currentUser}
          sourceBadge={selectedEmployerReviewJob.sourceBadge}
          onClose={() => setSelectedEmployerReviewJob(null)}
          onSubmit={async (data) => {
            if (onAddEmployerReview) {
              return await onAddEmployerReview(data);
            }
            return false;
          }}
        />
      )}
    </div>
  );
}
