import React, { useState } from 'react';
import { Briefcase, MapPin, DollarSign, Phone, Send, CheckCircle } from 'lucide-react';
import { User } from '../types';
import { QARDHO_NEIGHBORHOODS } from '../constants';

interface PostJobProps {
  currentUser: User | null;
  onPostJob: (jobData: { title: string; location: string; description: string; rate: string; phone: string }) => void | Promise<void>;
  onNavigate: (page: string) => void;
}

type FieldErrors = Partial<Record<'title' | 'rate' | 'phone' | 'description', string>>;

export default function PostJob({ currentUser, onPostJob, onNavigate }: PostJobProps) {
  if (!currentUser || currentUser.role !== 'employer') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-900">Access Denied</h2>
        <p className="text-sm text-slate-500 mt-2">Only verified Employers can post new job vacancies on this platform.</p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-4 inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState(currentUser.location || '');
  const [rate, setRate] = useState('');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const nextErrors: FieldErrors = {};
    if (!title.trim()) nextErrors.title = 'Job title is required.';
    if (!rate.trim()) nextErrors.rate = 'Payment offer is required.';
    if (!phone.trim()) nextErrors.phone = 'Contact phone is required.';
    if (!description.trim()) nextErrors.description = 'Job description is required.';

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await Promise.resolve(onPostJob({
        title: title.trim(),
        location,
        rate: rate.trim(),
        phone: phone.trim(),
        description: description.trim(),
      }));

      setSuccess(true);
      setTitle('');
      setRate('');
      setDescription('');
      setTimeout(() => {
        setSuccess(false);
        onNavigate('dashboard');
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="post-job-page">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden p-6 sm:p-8">
        <div className="border-b border-slate-50 pb-4 mb-6">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block font-mono">
            Employers Workspace
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">Post a Skilled Job Vacancy</h1>
          <p className="text-xs text-slate-500 mt-1">
            Describe the skills, location, and payment rate you offer to find specialized workers in Qardho.
          </p>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3" id="post-job-success">
            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Job Posted Successfully!</h3>
            <p className="text-xs text-slate-500">
              Your job has been added to the public board. Redirecting you to your dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" id="post-job-form" noValidate>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Job Title / Position *
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); clearFieldError('title'); }}
                  placeholder="e.g. Mason needed for house foundation"
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${fieldErrors.title ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}
                  aria-invalid={!!fieldErrors.title}
                />
              </div>
              {fieldErrors.title && <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.title}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Neighborhood Location in Qardho (Optional)
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select neighborhood</option>
                    {QARDHO_NEIGHBORHOODS.map((neighborhood) => (
                      <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Offer / Budget *
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <input
                    type="text"
                    value={rate}
                    onChange={(e) => { setRate(e.target.value); clearFieldError('rate'); }}
                    placeholder="e.g. $20 / day, $150 total"
                    className={`block w-full pl-10 pr-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${fieldErrors.rate ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}
                    aria-invalid={!!fieldErrors.rate}
                  />
                </div>
                {fieldErrors.rate && <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.rate}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone Number for Inquiries *
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); clearFieldError('phone'); }}
                  placeholder="+252 90 XXXXXXX"
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${fieldErrors.phone ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}
                  aria-invalid={!!fieldErrors.phone}
                />
              </div>
              {fieldErrors.phone && <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Job Description & Requirements *
              </label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => { setDescription(e.target.value); clearFieldError('description'); }}
                placeholder="List the requirements, tools needed, timeline, and expected work schedule..."
                className={`block w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${fieldErrors.description ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}
                aria-invalid={!!fieldErrors.description}
              ></textarea>
              {fieldErrors.description && <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.description}</p>}
            </div>

            <div className="flex space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Posting...' : 'Post Listing'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
