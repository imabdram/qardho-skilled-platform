import React, { useState } from 'react';
import { X, Send, Phone, MapPin } from 'lucide-react';
import { Job, User } from '../types';

interface ApplyModalProps {
  job: Job;
  currentUser: User | null;
  onClose: () => void;
  onSubmit: (data: { message: string; phone: string; location: string }) => void;
}

export default function ApplyModal({ job, currentUser, onClose, onSubmit }: ApplyModalProps) {
  const [message, setMessage] = useState(
    `Hello, I would like to apply for the "${job.title}" position. I have relevant experience and am ready to start as needed.`
  );
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please provide a contact phone number.');
      return;
    }
    if (!message.trim()) {
      setError('Please write a short application letter.');
      return;
    }
    onSubmit({ message, phone, location: location.trim() });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="apply-modal-overlay">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden" id="apply-modal-container">
        
        {/* Modal Header */}
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
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  setError('');
                }}
                placeholder="+252 90 XXXXXXX"
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Your Current Neighborhood in Qardho (Optional)
            </label>
            <div className="relative rounded-md shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Horseed, Wadajir..."
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
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
                setError('');
              }}
              placeholder="Introduce your skills, qualifications, and when you can start..."
              className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            ></textarea>
          </div>

          {error && (
            <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-3 pt-3 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center space-x-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Application</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
