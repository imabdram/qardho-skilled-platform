import React, { useEffect, useRef } from 'react';
import { X, Filter } from 'lucide-react';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  activeFilterCount?: number;
  onReset?: () => void;
  onApply?: () => void;
  children: React.ReactNode;
}

export default function FilterBottomSheet({
  isOpen,
  onClose,
  title = 'Filters',
  activeFilterCount = 0,
  onReset,
  onApply,
  children,
}: FilterBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity md:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="bottom-sheet-title"
    >
      <div
        ref={sheetRef}
        className="w-full max-h-[85vh] rounded-t-3xl bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle Indicator */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-slate-200" />
        </div>

        {/* Sheet Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#2563eb]" />
            <h2 id="bottom-sheet-title" className="text-base font-black text-slate-900">
              {title}
            </h2>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-black text-blue-800">
                {activeFilterCount} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onReset && activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 min-h-[36px] px-2"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          {children}
        </div>

        {/* Sticky Action Footer */}
        <div className="border-t border-slate-100 bg-white p-4 space-y-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              if (onApply) onApply();
              onClose();
            }}
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#2563eb] px-4 text-sm font-black text-white hover:bg-[#1d4ed8] shadow-md transition"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
