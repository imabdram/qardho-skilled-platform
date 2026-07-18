import React from 'react';
import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { PAGE_ROUTES } from '../routes';

export default function NotFound() {
  return (
    <div className='bg-white'>
      <section className='mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8'>
        <div className='inline-flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-600'>
          <SearchX className='h-7 w-7' aria-hidden='true' />
        </div>
        <h1 className='mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl'>Page not found</h1>
        <p className='mt-3 max-w-xl text-sm leading-6 text-slate-600'>
          The page you opened does not exist in this version of Xirfad Qardho.
        </p>
        <div className='mt-7 flex flex-wrap justify-center gap-3'>
          <Link to={PAGE_ROUTES.home} className='inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700'>Go home</Link>
          <Link to={PAGE_ROUTES.workers} className='inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-700 hover:bg-slate-50'>Find workers</Link>
        </div>
      </section>
    </div>
  );
}
