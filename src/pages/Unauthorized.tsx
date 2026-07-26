import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();
  return <main className="mx-auto flex min-h-[calc(100dvh-140px)] max-w-xl items-center px-4 py-12">
    <section className="w-full rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl">
      <ShieldAlert className="mx-auto h-10 w-10 text-amber-600" />
      <h1 className="mt-4 text-2xl font-black text-slate-950">Access restricted</h1>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">You do not have permission to access this page.</p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <button onClick={() => navigate(-1)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Go back</button>
        <Link to="/" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#008060] px-4 text-sm font-black text-white hover:bg-[#006b50]">Go to home</Link>
      </div>
    </section>
  </main>;
}