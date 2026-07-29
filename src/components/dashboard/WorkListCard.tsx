import React, { useState, useRef, useEffect } from 'react';
import { User, Job, Application, Connection } from '../../types';
import StatusBadge, { DisplayStatus } from './StatusBadge';
import ContactMenu from './ContactMenu';
import CompactProgress, { StepItem } from './CompactProgress';
import WorkAgreementSummary from './WorkAgreementSummary';
import {
  MoreVertical, ChevronDown, ChevronUp, User as UserIcon, Briefcase,
  FileText, CheckCircle2, Star, AlertCircle, RefreshCw, Check, X, Phone, Copy, Handshake, Send
} from 'lucide-react';

export interface WorkItemData {
  id: string;
  type: 'direct_offer' | 'application' | 'active_work';
  title: string;
  sourceBadge: 'Direct Offer' | 'Job Application';
  otherPartyName: string;
  otherPartyRole: 'Employer' | 'Worker' | 'Applicant';
  otherPartyId?: string;
  location: string;
  rate?: string;
  workType?: string;
  message?: string;
  dateStr: string;
  status: DisplayStatus | string;
  statusLabel?: string;
  nextStepText: string;
  phone?: string;
  isContactUnlocked?: boolean;
  agreedAmount?: string;
  expectedTimeline?: string;
  isAgreementConfirmed?: boolean;
  workflowSteps?: StepItem[];

  // Quick Action Config
  primaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    isLoading?: boolean;
    variant?: 'primary' | 'success' | 'warning' | 'danger';
    disabled?: boolean;
  };

  secondaryActions?: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    isMoreMenuOnly?: boolean;
    tone?: 'default' | 'danger';
  }>;

  // Raw data references if needed
  job?: Job;
  application?: Application;
  connection?: Connection;
}

interface WorkListCardProps {
  key?: React.Key;
  item: WorkItemData;
  currentUser: User;
  onViewProfile?: (userId?: string, fallbackName?: string, phone?: string) => void;
  onViewJobDetails?: (jobId?: string) => void;
  actionKey?: string | null;
}

export default function WorkListCard({
  item,
  currentUser,
  onViewProfile,
  onViewJobDetails,
  actionKey,
}: WorkListCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDirectOffer = item.sourceBadge === 'Direct Offer';

  // Distinct Visual Branding
  const cardBorderLeft = isDirectOffer
    ? 'border-l-4 border-l-purple-600'
    : 'border-l-4 border-l-blue-600';

  const sourceBadgeColor = isDirectOffer
    ? 'bg-purple-50 text-purple-900 border-purple-200/90 font-black'
    : 'bg-blue-50 text-blue-900 border-blue-200/90 font-black';

  const sourceSummaryText = isDirectOffer
    ? 'An employer invited you directly.'
    : 'You applied to a public job.';

  const SourceIcon = isDirectOffer ? Handshake : FileText;

  const primaryBtnClass = item.primaryAction?.variant === 'success'
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
    : item.primaryAction?.variant === 'warning'
    ? 'bg-amber-600 hover:bg-amber-700 text-white'
    : item.primaryAction?.variant === 'danger'
    ? 'bg-rose-600 hover:bg-rose-700 text-white'
    : 'bg-brand-600 hover:bg-brand-700 text-white';

  const moreMenuActions = (item.secondaryActions || []).filter(a => a.isMoreMenuOnly);
  const visibleSecondaryActions = (item.secondaryActions || []).filter(a => !a.isMoreMenuOnly);

  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-white transition-all duration-200 shadow-2xs hover:shadow-md ${cardBorderLeft} ${
        isExpanded ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* Collapsed Card Main Content */}
      <div className="p-4 sm:p-5">
        {/* TOP ROW: Type Header + Source Summary | Main Status Badge | Date */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-3.5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Distinct Type Badge with Icon */}
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition ${sourceBadgeColor}`}>
                <SourceIcon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.sourceBadge}</span>
              </span>

              {/* Opportunity Title */}
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-950 transition line-clamp-1">
                {item.title}
              </h3>
            </div>

            {/* Small Visual Source Summary */}
            <p className={`text-[11px] font-semibold ${isDirectOffer ? 'text-purple-700/90' : 'text-blue-700/90'} pl-0.5`}>
              {sourceSummaryText}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start">
            <StatusBadge status={item.status} customLabel={item.statusLabel} />
            <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
              {item.dateStr}
            </span>
          </div>
        </div>

        {/* SECOND ROW: Employer Name | Location | Agreed Rate / Offer | Work Type */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
          <div className="flex items-center gap-1 font-semibold text-slate-800">
            <span className="text-slate-400">{item.otherPartyRole}:</span>
            <span>{item.otherPartyName}</span>
          </div>

          {item.location && (
            <div className="flex items-center gap-1">
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">{item.location}</span>
            </div>
          )}

          {(item.rate || item.agreedAmount) && (
            <div className="flex items-center gap-1 font-mono font-bold text-emerald-700">
              <span className="text-slate-300">•</span>
              <span>{item.agreedAmount || item.rate}</span>
            </div>
          )}

          {item.workType && (
            <div className="flex items-center gap-1 text-slate-500">
              <span className="text-slate-300">•</span>
              <span>{item.workType}</span>
            </div>
          )}
        </div>

        {/* THIRD ROW: Short message limited to 1-2 lines OR Work Agreement Summary */}
        <div className="mt-2.5">
          {item.message ? (
            <p className="text-xs text-slate-600 italic leading-relaxed line-clamp-2 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
              "{item.message}"
            </p>
          ) : item.agreedAmount ? (
            <WorkAgreementSummary
              agreedAmount={item.agreedAmount}
              location={item.location}
              expectedTimeline={item.expectedTimeline}
              isConfirmed={item.isAgreementConfirmed}
              expanded={false}
            />
          ) : null}
        </div>

        {/* BOTTOM ROW: Next-step text | Primary Action | Secondary Actions | More menu */}
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Next Step Info */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-900 shrink-0">Next step:</span>
            <span className="text-slate-600 font-medium line-clamp-1">{item.nextStepText}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Primary Action Button */}
            {item.primaryAction && (
              <button
                type="button"
                onClick={item.primaryAction.onClick}
                disabled={item.primaryAction.disabled || item.primaryAction.isLoading}
                className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-2xs transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${primaryBtnClass}`}
              >
                {item.primaryAction.isLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  item.primaryAction.icon && <item.primaryAction.icon className="h-3.5 w-3.5" />
                )}
                <span>{item.primaryAction.label}</span>
              </button>
            )}

            {/* Contact Menu if unlocked */}
            {item.isContactUnlocked && (
              <ContactMenu
                phone={item.phone}
                name={item.otherPartyName}
                jobTitle={item.title}
                label={item.otherPartyRole}
              />
            )}

            {/* View Details Expander */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition"
              aria-expanded={isExpanded}
            >
              <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
            </button>

            {/* More ⋮ Dropdown Menu */}
            <div className="relative inline-block text-left" ref={moreRef}>
              <button
                type="button"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
                title="More actions"
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {isMoreOpen && (
                <div className="absolute right-0 z-50 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                  {onViewProfile && item.otherPartyId && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        onViewProfile(item.otherPartyId, item.otherPartyName, item.phone);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition text-left"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                      <span>View {item.otherPartyRole} Profile</span>
                    </button>
                  )}

                  {onViewJobDetails && item.job?.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        onViewJobDetails(item.job?.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition text-left"
                    >
                      <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                      <span>View Related Job</span>
                    </button>
                  )}

                  {visibleSecondaryActions.map((action, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        action.onClick();
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition text-left ${
                        action.tone === 'danger'
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {action.icon && <action.icon className="h-3.5 w-3.5" />}
                      <span>{action.label}</span>
                    </button>
                  ))}

                  {moreMenuActions.map((action, idx) => (
                    <button
                      key={`more-${idx}`}
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        action.onClick();
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition text-left ${
                        action.tone === 'danger'
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {action.icon && <action.icon className="h-3.5 w-3.5" />}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EXPANDED DETAILS (PROGRESSIVE DISCLOSURE) */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6 space-y-4 rounded-b-2xl animate-in slide-in-from-top-2 duration-150">
          {/* Detailed Workflow Stepper */}
          {item.workflowSteps && item.workflowSteps.length > 0 && (
            <CompactProgress steps={item.workflowSteps} />
          )}

          {/* Full Message Section */}
          {item.message && (
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Full Message / Details
              </span>
              <p className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 leading-relaxed">
                "{item.message}"
              </p>
            </div>
          )}

          {/* Detailed Work Agreement */}
          {(item.agreedAmount || item.job?.rate) && (
            <WorkAgreementSummary
              agreedAmount={item.agreedAmount || item.job?.rate}
              location={item.location}
              expectedTimeline={item.expectedTimeline || item.job?.expectedDuration}
              jobTitle={item.title}
              isConfirmed={item.isAgreementConfirmed}
              expanded={true}
            />
          )}

          {/* Expanded Secondary Actions & Information */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60 pt-3">
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-700">Record ID:</span> {item.id}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onViewProfile && item.otherPartyId && (
                <button
                  type="button"
                  onClick={() => onViewProfile(item.otherPartyId, item.otherPartyName, item.phone)}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                  <span>View {item.otherPartyRole} Profile</span>
                </button>
              )}

              {onViewJobDetails && (item.job?.id || item.connection?.jobId) && (
                <button
                  type="button"
                  onClick={() => onViewJobDetails(item.job?.id || item.connection?.jobId)}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                  <span>View Related Job</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
