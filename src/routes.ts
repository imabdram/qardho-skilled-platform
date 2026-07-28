export type PageId = 'home' | 'workers' | 'jobs' | 'job-detail' | 'profile' | 'profile-edit' | 'settings' | 'dashboard' | 'admin' | 'post-job' | 'auth' | 'register' | 'forgot-password' | 'reset-password' | 'about' | 'unauthorized' | 'not-found';

export const PAGE_ROUTES: Record<PageId, string> = {
  home: '/',
  workers: '/workers',
  jobs: '/jobs',
  'job-detail': '/jobs',
  profile: '/profile',
  'profile-edit': '/profile/edit',
  settings: '/settings',
  dashboard: '/dashboard',
  admin: '/admin',
  'post-job': '/post-job',
  auth: '/login',
  register: '/register',
  'forgot-password': '/forgot-password',
  'reset-password': '/reset-password',
  about: '/about-contact',
  unauthorized: '/unauthorized',
  'not-found': '/404',
};

export const ROUTE_PAGES: Record<string, PageId> = {
  '/': 'home',
  '/workers': 'workers',
  '/jobs': 'jobs',
  '/profile': 'profile',
  '/profile/edit': 'profile-edit',
  '/settings': 'settings',
  '/dashboard': 'dashboard',
  '/worker/dashboard': 'dashboard',
  '/employer/dashboard': 'dashboard',
  '/admin': 'admin',
  '/post-job': 'post-job',
  '/login': 'auth',
  '/auth': 'auth',
  '/register': 'register',
  '/forgot-password': 'forgot-password',
  '/reset-password': 'reset-password',
  '/about-contact': 'about',
  '/unauthorized': 'unauthorized',
  '/404': 'not-found',
};

export const getRouteForPage = (page: string) => PAGE_ROUTES[page as PageId] || PAGE_ROUTES.home;
export const getPageForPath = (pathname: string): PageId => {
  if (/^\/jobs\/[^/]+$/.test(pathname)) return 'job-detail';
  return ROUTE_PAGES[pathname] || 'not-found';
};
