import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'neutral' | 'brand';
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmClasses =
    tone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
      : tone === 'brand'
      ? 'bg-brand-600 hover:bg-brand-700 text-white border-brand-600'
      : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <div className={`rounded-xl p-2 ${tone === 'danger' ? 'bg-rose-50 text-rose-600' : tone === 'brand' ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-700'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-slate-900">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{description}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children && <div className="border-b border-slate-100 px-5 py-3.5 bg-white">{children}</div>}

        <div className="flex gap-3 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 min-h-[44px]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors ${confirmClasses}`}
          >
            <Check className="h-4 w-4" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}


