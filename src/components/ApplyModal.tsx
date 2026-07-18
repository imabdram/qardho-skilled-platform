import React, { useState } from 'react';
import { X, Send, Phone, MapPin } from 'lucide-react';
import { Job, User } from '../types';
import { QARDHO_NEIGHBORHOODS } from '../constants';

interface ApplyModalProps {
  job: Job;
  currentUser: User | null;
  onClose: () => void;
  onSubmit: (data: { message: string; phone: string; location: string }) => void | Promise<void>;
}

type FieldErrors = Partial<Record<'phone' | 'message', string>>;

export default function ApplyModal({ job, currentUser, onClose, onSubmit }: ApplyModalProps) {
  const [message, setMessage] = useState(
    `Hello, I would like to apply for the "${job.title}" position. I have relevant experience and am ready to start as needed.`
  );
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [location, setLocation] = useState(currentUser?.location || '');
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
    if (!phone.trim()) nextErrors.phone = 'Contact phone is required.';
    if (!message.trim()) nextErrors.message = 'Application message is required.';

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await Promise.resolve(onSubmit({ message: message.trim(), phone: phone.trim(), location: location.trim() }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="apply-modal-overlay">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden" id="apply-modal-container">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
              Apply For Job
            </span>
            <h3 className="text-base font-bold text-slate-900 truncate max-w-[280px]">
              Apply: {job.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close application form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Your Phone Number *
            </label>
            <div className="relative rounded-md shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearFieldError('phone');
                }}
                placeholder="+252 90 XXXXXXX"
                className={`block w-full pl-10 pr-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${fieldErrors.phone ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}
                aria-invalid={!!fieldErrors.phone}
              />
            </div>
            {fieldErrors.phone && <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.phone}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Your Current Neighborhood in Qardho (Optional)
            </label>
            <div className="relative rounded-md shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
              Message/Cover Letter *
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                clearFieldError('message');
              }}
              placeholder="Introduce your skills, qualifications, and when you can start..."
              className={`block w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${fieldErrors.message ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}
              aria-invalid={!!fieldErrors.message}
            ></textarea>
            {fieldErrors.message && <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.message}</p>}
          </div>

          <div className="flex space-x-3 pt-3 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center space-x-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
