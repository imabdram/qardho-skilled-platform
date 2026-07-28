import React, { useState } from 'react';
import { ArrowLeft, Bell, Briefcase, ChevronRight, Lock, LogOut, RefreshCw, ShieldCheck, Trash2, UserCheck, UserRound } from 'lucide-react';
import { User } from '../types';
import Avatar from '../components/Avatar';
import { useApi } from '../useApi';

interface SettingsProps {
  currentUser: User;
  onUpdateProfile: (updatedProfile: User) => void | Promise<void>;
  onSwitchRole: () => void;
  onRequestDeleteAccount?: () => void;
  onNavigate: (page: string) => void;
}

export default function Settings({
  currentUser,
  onUpdateProfile,
  onSwitchRole,
  onRequestDeleteAccount,
  onNavigate,
}: SettingsProps) {
  const fetchAuth = useApi();
  const fetch = fetchAuth;

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [savingNotice, setSavingNotice] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const isWorker = currentUser.role === 'worker';

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 sm:pb-12">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => onNavigate('profile')}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </button>
          <span className="text-xs font-bold text-slate-400">Platform Settings</span>
        </div>

        <header className="mb-6 rounded-2xl bg-[#2563eb] p-6 text-white sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#93c5fd]">Account & Preferences</p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">Platform Settings</h1>
          <p className="mt-2 max-w-xl text-xs font-medium text-brand-50/80 sm:text-sm">
            Manage your account security, notification alerts, role preferences, and account settings.
          </p>
        </header>

        {savingNotice && (
          <div className="mb-4 rounded-xl bg-brand-50 border border-brand-200 px-4 py-3 text-xs font-bold text-brand-800">
            Preferences saved.
          </div>
        )}

        <div className="space-y-6">
          {/* Section 1: Account Overview */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4">Account</h2>
            
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <Avatar name={currentUser.name} src={currentUser.avatarUrl} size="lg" eager />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-black text-slate-900 text-base">{currentUser.name}</h3>
                <p className="text-xs font-semibold text-slate-500 capitalize">{currentUser.role} Account · {currentUser.location}</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                  <span>{currentUser.phone}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Verification Status</p>
                    <p className="text-xs text-slate-500">
                      {currentUser.verified ? 'Verified platform member' : 'Unverified profile'}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  currentUser.verified ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {currentUser.verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: Notifications */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4">Notifications</h2>

            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Email Notifications</p>
                    <p className="text-xs text-slate-500">Receive platform news, job alerts, and messages via email</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#2563eb] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                </label>
              </div>
            </div>
          </section>

          {/* Section 3: Role & Profiles */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4">Role & Account Type</h2>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  {isWorker ? <UserRound className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Current Role: <span className="capitalize">{currentUser.role}</span></p>
                  <p className="text-xs text-slate-500">
                    {isWorker
                      ? 'You are operating as a Skilled Worker. You can switch to Employer to post jobs.'
                      : 'You are operating as an Employer. You can switch to Skilled Worker to offer services.'}
                  </p>
                </div>
              </div>

              <button
                onClick={onSwitchRole}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-800 hover:bg-slate-50 shrink-0"
              >
                <RefreshCw className="h-4 w-4 text-[#3b82f6]" />
                Switch to {isWorker ? 'Employer' : 'Worker'}
              </button>
            </div>
          </section>

          {/* Section 4: Privacy Settings */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4">Privacy</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">Profile Visibility</p>
                  <p className="text-xs text-slate-500">Your profile is visible to logged-in users on Qardho Skilled Platform.</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Public</span>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">Contact Number Privacy</p>
                  <p className="text-xs text-slate-500">Phone numbers are revealed only after an employer/worker connection is accepted.</p>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">Protected</span>
              </div>
            </div>
          </section>

          {/* Section 5: Danger Zone */}
          <section className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 sm:p-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-rose-700 mb-4">Danger Zone</h2>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Delete Account</p>
                <p className="text-xs text-slate-500">Permanently delete your profile and account data from the platform.</p>
              </div>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-black text-white hover:bg-rose-700 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Delete your account?</h3>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
              This action cannot be undone. All your profile information, job postings, and connection history will be removed.
            </p>

            <div className="mt-5">
              <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                Type <span className="font-mono text-rose-600">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-mono font-bold text-slate-900 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
              />
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteInput('');
                }}
                className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteInput !== 'DELETE'}
                onClick={() => {
                  setShowDeleteModal(false);
                  onRequestDeleteAccount?.();
                }}
                className="min-h-11 flex-1 rounded-xl bg-rose-600 text-xs font-black text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
