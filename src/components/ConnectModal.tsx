import React, { useState } from 'react';
import { X, Send, Phone, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface ConnectModalProps {
  worker: User;
  currentUser: User | null;
  onClose: () => void;
  onSubmit: (data: { message: string; phone: string }) => void;
}

export default function ConnectModal({ worker, currentUser, onClose, onSubmit }: ConnectModalProps) {
  const [message, setMessage] = useState(
    `Hello ${worker.name}, I found your profile on Xirfad Qardho and would like to talk to you about a potential job. Please let me know your availability.`
  );
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please provide a contact phone number.');
      return;
    }
    if (!message.trim()) {
      setError('Please write a short message.');
      return;
    }
    onSubmit({ message, phone });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="connect-modal-overlay">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden" id="connect-modal-container">
        
        {/* Modal Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest font-mono">
              Hire Talent
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Connect with {worker.name}
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
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              Worker Skill
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {worker.skill}
            </span>
          </div>

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
              Connection Message *
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError('');
              }}
              className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            ></textarea>
            <p className="text-[11px] text-slate-400 mt-1">
              Your contact details will be shared with the worker when you connect.
            </p>
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
              className="flex-1 inline-flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send Connect</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
