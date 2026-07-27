import React, { useState } from 'react';
import { CheckCircle2, Mail, MapPin, MessageSquare, Send } from 'lucide-react';

export default function AboutContact() {
  const [sent, setSent] = useState(false);
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-[#073f34] px-6 py-10 text-white sm:px-10 sm:py-14">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#93c5fd]">Qardho Skilled Platform</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">Local skill, clearer opportunities, safer connections.</h1>
        <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-brand-50/80 sm:text-base">We help workers in Qardho present their skills and help employers review local talent and job applications before private contact details are shared.</p>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.05fr]">
        <section aria-labelledby="about-us-heading">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#3b82f6]">About Us</p>
          <h2 id="about-us-heading" className="mt-3 text-3xl font-black text-slate-950">Built for practical local hiring.</h2>
          <p className="mt-4 text-sm font-medium leading-7 text-slate-600">Qardho Skilled Platform is a community marketplace for skilled workers, households, farms, schools, and businesses. Its purpose is to make local work easier to discover, compare, coordinate, and complete with a clear record of applications and hiring decisions.</p>
          <div className="mt-7 space-y-4">
            <div className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 text-[#3b82f6]" /><div><p className="font-black text-slate-900">Service area</p><p className="text-sm text-slate-600">Qardho and the wider Karkaar community, Puntland, Somalia.</p></div></div>
            <div className="flex gap-3"><Mail className="mt-0.5 h-5 w-5 text-[#3b82f6]" /><div><p className="font-black text-slate-900">Email</p><a href="mailto:support@qardhoskilled.com" className="text-sm font-bold text-[#2563eb] underline-offset-4 hover:underline">support@qardhoskilled.com</a></div></div>
            <div className="flex gap-3"><MessageSquare className="mt-0.5 h-5 w-5 text-[#3b82f6]" /><div><p className="font-black text-slate-900">Contact hours</p><p className="text-sm text-slate-600">Saturday to Thursday, 8:00 AM to 5:00 PM.</p></div></div>
          </div>
        </section>

        <section aria-labelledby="contact-us-heading" className="rounded-3xl border border-brand-950/10 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#3b82f6]">Contact Us</p>
          <h2 id="contact-us-heading" className="mt-3 text-2xl font-black text-slate-950">Send a message</h2>
          {sent ? (
            <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-5 text-brand-800" role="status">
              <CheckCircle2 className="h-6 w-6" />
              <p className="mt-3 font-black">Message prepared</p>
              <p className="mt-1 text-sm font-medium">Thank you. This demo stores no contact-form data; please email support for a direct response.</p>
              <button onClick={() => setSent(false)} className="mt-4 min-h-11 rounded-full border border-brand-200 bg-white px-4 text-sm font-black">Send another</button>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
              <div><label htmlFor="contact-name" className="mb-1.5 block text-sm font-bold text-slate-800">Name</label><input id="contact-name" required className="min-h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-brand-500/10" /></div>
              <div><label htmlFor="contact-email" className="mb-1.5 block text-sm font-bold text-slate-800">Email</label><input id="contact-email" type="email" required className="min-h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-brand-500/10" /></div>
              <div><label htmlFor="contact-message" className="mb-1.5 block text-sm font-bold text-slate-800">Message</label><textarea id="contact-message" required rows={5} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-brand-500/10" /></div>
              <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#3b82f6] px-5 text-sm font-black text-white hover:bg-[#1d4ed8]"><Send className="h-4 w-4" />Send message</button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}


