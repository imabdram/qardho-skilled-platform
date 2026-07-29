import React, { useState, useRef, useEffect } from 'react';
import { Phone, ChevronDown, MessageSquare, Copy, Check } from 'lucide-react';

interface ContactMenuProps {
  phone?: string;
  name?: string;
  jobTitle?: string;
  whatsappMessage?: string;
  label?: string;
}

export default function ContactMenu({ phone, name, jobTitle, whatsappMessage, label = 'Employer' }: ContactMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!phone) {
    return (
      <span className="text-[11px] italic text-slate-400">Contact locked</span>
    );
  }

  const cleanPhone = phone.replace(/[^+\d]/g, '');
  const digitsOnly = phone.replace(/\D/g, '');
  const formattedPhone = digitsOnly.startsWith('252') ? `+252 ${digitsOnly.slice(3)}` : phone;

  const defaultMsg = whatsappMessage || `Hello ${name || ''}, I am contacting you through Qardho Skilled Platform${jobTitle ? ` regarding "${jobTitle}"` : ''}.`;
  const whatsappUrl = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(defaultMsg)}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition active:scale-[0.98]"
        aria-expanded={isOpen}
      >
        <Phone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
        <span>Contact</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
          <div className="border-b border-slate-100 pb-2 px-2 pt-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label} Phone</span>
            <span className="block text-xs font-mono font-bold text-slate-900 select-all">{formattedPhone}</span>
          </div>

          <div className="mt-1 space-y-1">
            <a
              href={`tel:${cleanPhone}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white">
                <Phone className="h-3.5 w-3.5" />
              </div>
              <span>Call Phone</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 transition"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#25D366] text-white">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
              <span>WhatsApp Message</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition text-left"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </div>
              <span>{copied ? 'Copied Number!' : 'Copy Phone Number'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
