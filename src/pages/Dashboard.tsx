import React, { useState } from 'react';
import { Connection, Application, Job, JobStatus, User } from '../types';
import { 
  Users, Briefcase, FileText, Check, X, Phone, MapPin, 
  Clock, AlertCircle, Sparkles, Send, CheckCircle2, RefreshCw 
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

interface DashboardProps {
  currentUser: User | null;
  connections: Connection[];
  applications: Application[];
  jobs: Job[];
  onUpdateConnectionStatus: (id: string, status: 'accepted' | 'declined') => void;
  onUpdateApplicationStatus: (id: string, status: 'accepted' | 'declined') => void;
  onUpdateJobStatus: (id: string, status: JobStatus) => void;
  onNavigate: (page: string) => void;
  onSwitchRole: () => void;
}

export default function Dashboard({
  currentUser,
  connections,
  applications,
  jobs,
  onUpdateConnectionStatus,
  onUpdateApplicationStatus,
  onUpdateJobStatus,
  onNavigate,
  onSwitchRole
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'connections' | 'applications' | 'jobs'>('connections');
  const [pendingAction, setPendingAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    tone?: 'danger' | 'neutral';
    onConfirm: () => void;
  } | null>(null);

  if (!currentUser) return null;

  const isWorker = currentUser.role === 'worker';

  // Filters based on User Role
  const myConnections = isWorker
    ? connections.filter(c => c.toUserId === currentUser.id) // Received requests
    : connections.filter(c => c.fromUserId === currentUser.id); // Sent requests

  const myApplications = isWorker
    ? applications.filter(a => a.applicantId === currentUser.id) // Applications sent to jobs
    : applications.filter(a => a.employerId === currentUser.id); // Applications received for posted jobs

  const myPostedJobs = jobs.filter(j => j.employerId === currentUser.id);
  const jobStatusOptions: JobStatus[] = ['open', 'in_progress', 'completed', 'closed'];
  const pendingConnections = myConnections.filter(c => c.status === 'pending').length;
  const pendingApplications = myApplications.filter(a => a.status === 'pending').length;
  const openJobs = myPostedJobs.filter(j => j.status === 'open').length;
  const completedJobs = myPostedJobs.filter(j => j.status === 'completed').length;
  const workerAcceptedApplications = myApplications.filter(a => a.status === 'accepted').length;

  const getStatusBadge = (status: 'pending' | 'accepted' | 'declined') => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Accepted</span>
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
            <X className="h-3 w-3 text-rose-500" />
            <span>Declined</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
            <Clock className="h-3 w-3 text-amber-500" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const getJobStatusBadge = (status: JobStatus) => {
    const label = status.replace('_', ' ');
    const styles = {
      open: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
      completed: 'bg-slate-100 text-slate-700 border-slate-200',
      closed: 'bg-rose-50 text-rose-700 border-rose-100',
    }[status];

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${styles}`}>
        {label}
      </span>
    );
  };

  const openConfirmation = (action: {
    title: string;
    description: string;
    confirmLabel: string;
    tone?: 'danger' | 'neutral';
    onConfirm: () => void;
  }) => {
    setPendingAction(action);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="dashboard-container">
      
      {/* Dashboard Summary Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-xl sm:text-2xl font-black">My Dashboard Panel</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isWorker
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              {isWorker ? 'Skilled Worker' : 'Employer'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            {isWorker 
              ? 'Manage incoming hire requests and track your active job applications.' 
              : 'Monitor the jobs you posted and review candidates who applied.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: isWorker ? 'Pending Hire Requests' : 'Pending Connections', value: pendingConnections },
          { label: isWorker ? 'Pending Applications' : 'Candidates Waiting', value: pendingApplications },
          { label: isWorker ? 'Accepted Applications' : 'Open Jobs', value: isWorker ? workerAcceptedApplications : openJobs },
          { label: isWorker ? 'Total Activity Items' : 'Completed Jobs', value: isWorker ? myConnections.length + myApplications.length : completedJobs },
        ].map((metric) => (
          <div key={metric.label} className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">{metric.label}</span>
            <span className="block text-2xl font-black text-slate-900 mt-1">{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
        {[
          { key: 'connections' as const, label: isWorker ? 'Hire Requests' : 'Connections' },
          { key: 'applications' as const, label: isWorker ? 'Applications' : 'Candidates' },
          ...(!isWorker ? [{ key: 'jobs' as const, label: 'Posted Jobs' }] : []),
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Connections Section */}
        {activeTab === 'connections' && (
        <div className="lg:col-span-12 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                {isWorker ? 'Hire Requests Received' : 'Connections Initiated'}
              </h2>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
              {myConnections.length}
            </span>
          </div>

          {myConnections.length > 0 ? (
            <div className="space-y-4" id="connections-list">
              {myConnections.map((conn) => (
                <div key={conn.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {isWorker ? conn.fromUserName : `Connected with: ${conn.toUserName}`}
                        </h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                          {new Date(conn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div>{getStatusBadge(conn.status)}</div>
                    </div>
                    
                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100/50 p-3 rounded-lg mt-3 italic font-normal">
                      "{conn.message}"
                    </p>
                  </div>

                  {/* Actions or Contact sharing info */}
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    {conn.phone && (conn.status === 'accepted' || !isWorker) ? (
                      <div className="flex items-center text-xs font-semibold text-slate-700">
                        <Phone className="h-3.5 w-3.5 text-blue-600 mr-1.5" />
                        <span>Phone: {conn.phone}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        {conn.status === 'pending' ? 'Accept request to reveal phone' : 'Contact hidden'}
                      </span>
                    )}

                    {isWorker && conn.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openConfirmation({
                            title: 'Decline this hire request?',
                            description: `This will mark the request from ${conn.fromUserName} as declined.`,
                            confirmLabel: 'Decline request',
                            tone: 'danger',
                            onConfirm: () => onUpdateConnectionStatus(conn.id, 'declined'),
                          })}
                          className="p-1.5 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-lg cursor-pointer"
                          title="Decline"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openConfirmation({
                            title: 'Accept this hire request?',
                            description: `This will reveal contact info for ${conn.fromUserName} and mark the request as accepted.`,
                            confirmLabel: 'Accept request',
                            tone: 'neutral',
                            onConfirm: () => onUpdateConnectionStatus(conn.id, 'accepted'),
                          })}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Accept</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No active connections yet.</p>
              <button 
                onClick={() => onNavigate('home')} 
                className="text-blue-600 text-xs font-semibold mt-2 hover:underline cursor-pointer"
              >
                {isWorker ? 'Complete your Profile' : 'Find Workers to hire'}
              </button>
            </div>
          )}
        </div>
        )}

        {/* Applications Section */}
        {activeTab === 'applications' && (
        <div className="lg:col-span-12 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                {isWorker ? 'Job Applications Submitted' : 'Applications Received'}
              </h2>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {myApplications.length}
            </span>
          </div>

          {myApplications.length > 0 ? (
            <div className="space-y-4" id="applications-list">
              {myApplications.map((app) => (
                <div key={app.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {isWorker ? app.jobTitle : `Applicant: ${app.applicantName}`}
                        </h4>
                        {!isWorker && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 mt-1">
                            {app.applicantSkill}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                          {isWorker ? 'Status' : `Job Applied to: "${app.jobTitle}"`}
                        </span>
                      </div>
                      <div>{getStatusBadge(app.status)}</div>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100/50 p-3 rounded-lg mt-3 italic font-normal">
                      "{app.message}"
                    </p>
                  </div>

                  {/* Contact & Status updates */}
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-xs font-semibold text-slate-700">
                        <Phone className="h-3.5 w-3.5 text-blue-600 mr-1.5" />
                        <span>Phone: {app.phone}</span>
                      </div>
                      <div className="flex items-center text-[11px] text-slate-500">
                        <MapPin className="h-3 w-3 text-slate-400 mr-1.5" />
                        <span>Location: Qardho ({app.location})</span>
                      </div>
                    </div>

                    {!isWorker && app.status === 'pending' && (
                      <div className="flex space-x-2 shrink-0">
                        <button
                          onClick={() => openConfirmation({
                            title: 'Decline this candidate application?',
                            description: `This will mark ${app.applicantName}'s application for "${app.jobTitle}" as declined.`,
                            confirmLabel: 'Decline application',
                            tone: 'danger',
                            onConfirm: () => onUpdateApplicationStatus(app.id, 'declined'),
                          })}
                          className="p-1.5 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-lg cursor-pointer"
                          title="Decline Candidate"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openConfirmation({
                            title: 'Accept this candidate application?',
                            description: `This will mark ${app.applicantName} as accepted for "${app.jobTitle}".`,
                            confirmLabel: 'Hire candidate',
                            tone: 'neutral',
                            onConfirm: () => onUpdateApplicationStatus(app.id, 'accepted'),
                          })}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Hire</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No applications found.</p>
              <button 
                onClick={() => onNavigate('home')} 
                className="text-blue-600 text-xs font-semibold mt-2 hover:underline cursor-pointer"
              >
                {isWorker ? 'Browse available jobs' : 'Check other candidate profiles'}
              </button>
            </div>
          )}
        </div>
        )}

      </div>

      {/* Posted Jobs section - Employers only */}
      {!isWorker && activeTab === 'jobs' && (
        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Your Posted Jobs</h2>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {myPostedJobs.length}
            </span>
          </div>

          {myPostedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="posted-jobs-grid">
              {myPostedJobs.map((job) => (
                <div key={job.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-bold text-slate-900">{job.title}</h3>
                      {getJobStatusBadge(job.status)}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md">
                        <MapPin className="h-3 w-3 text-slate-400 mr-1" />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {job.rate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mt-3 line-clamp-3">
                      {job.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>Contact: {job.phone}</span>
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Job Status
                    </label>
                    <select
                      value={job.status}
                      onChange={(e) => {
                        const nextStatus = e.target.value as JobStatus;
                        if (nextStatus === job.status) return;
                        openConfirmation({
                          title: `Move this job to ${nextStatus.replace('_', ' ')}?`,
                          description: `This updates the status for "${job.title}".`,
                          confirmLabel: 'Update status',
                          tone: 'neutral',
                          onConfirm: () => onUpdateJobStatus(job.id, nextStatus),
                        });
                      }}
                      className="w-full border border-slate-200 bg-slate-50 text-slate-700 rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer"
                    >
                      {jobStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500">You haven't posted any jobs yet.</p>
            </div>
          )}
        </div>
      )}

      {pendingAction && (
        <ConfirmDialog
          title={pendingAction.title}
          description={pendingAction.description}
          confirmLabel={pendingAction.confirmLabel}
          tone={pendingAction.tone}
          onConfirm={() => {
            pendingAction.onConfirm();
            setPendingAction(null);
          }}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}
