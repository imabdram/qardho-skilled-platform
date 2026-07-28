import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle, Bell, BriefcaseBusiness, CheckCircle2, ChevronDown, Edit3, Globe2,
  LayoutDashboard, Loader2, LogOut, Menu, Monitor, Moon, Settings, Sun, UserRound,
  Users, X,
} from 'lucide-react';
import { Application, Connection, Job, Notification, Review, User } from '../types';
import { PAGE_ROUTES } from '../routes';
import Avatar from './Avatar';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import { useApi } from '../useApi';

interface NavbarProps {
  currentUser: User | null;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  workersCount: number;
  jobsCount: number;
  onSwitchRole?: () => void;
  isSwitchingRole?: boolean;
  connections?: Connection[];
  applications?: Application[];
  jobs?: Job[];
  reviews?: Review[];
}

type ThemeMode = 'light' | 'dark' | 'system';

const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2';

export default function Navbar({
  currentUser,
  currentPage,
  onNavigate,
  onLogout,
  workersCount,
  jobsCount,
  onSwitchRole,
  isSwitchingRole,
  connections = [],
  applications = [],
  jobs = [],
  reviews = [],
}: NavbarProps) {
  const fetchAuth = useApi();
  const fetch = fetchAuth;
  const navigate = useNavigate();
  const shellRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationState, setNotificationState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('qardho-theme') as ThemeMode) || 'system');
  const [language, setLanguage] = useState(() => localStorage.getItem('qardho-language') || 'EN');

  const closeMenus = () => {
    setMobileOpen(false);
    setMoreOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
  };

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (shellRef.current && !shellRef.current.contains(event.target as Node)) closeMenus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenus();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    localStorage.setItem('qardho-theme', theme);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', dark ? '#08110e' : '#f6fbf8');
    };
    applyTheme();
    if (theme === 'system') media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('qardho-language', language);
    document.documentElement.lang = language === 'SO' ? 'so' : language === 'AR' ? 'ar' : 'en';
    document.documentElement.dir = language === 'AR' ? 'rtl' : 'ltr';
  }, [language]);

  const loadNotifications = async () => {
    if (!currentUser) return;
    setNotificationState('loading');
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Could not load notifications.');
      setNotifications(await response.json());
      setNotificationState('idle');
    } catch {
      setNotificationState('error');
    }
  };

  useEffect(() => {
    if (currentUser) loadNotifications();
    else setNotifications([]);
  }, [currentUser?.id]);

  const openNotifications = () => {
    setNotificationsOpen((open) => !open);
    setMoreOpen(false);
    setProfileOpen(false);
    if (!notifications.length && notificationState !== 'loading') loadNotifications();
  };

  const openNotification = async (notification: Notification) => {
    if (!notification.readAt) {
      await fetch(`/api/notifications/${notification.id}/read`, { method: 'POST' }).catch(() => undefined);
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
    }
    closeMenus();
    if (notification.href) navigate(notification.href);
  };

  const mainLink = currentUser?.role === 'employer' ? { page: 'workers', label: 'Workers', icon: Users, count: workersCount } : { page: 'jobs', label: 'Jobs', icon: BriefcaseBusiness, count: jobsCount };
  const unreadCount = notifications.filter((item) => !item.readAt).length;
  const firstName = currentUser?.name?.trim().split(/\s+/)[0] || 'Profile';

  const NavLink = ({ page, label, count, Icon }: { page: string; label: string; count?: number; Icon?: React.ComponentType<{ className?: string }> }) => (
    <Link
      to={page === 'workers' ? PAGE_ROUTES.workers : page === 'jobs' ? PAGE_ROUTES.jobs : PAGE_ROUTES.dashboard}
      onClick={closeMenus}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-black transition ${focusRing} ${currentPage === page ? 'bg-[#3b82f6] text-white' : 'text-slate-700 hover:bg-brand-50 hover:text-[#1d4ed8]'}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{label}</span>
      {typeof count === 'number' && <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${currentPage === page ? 'bg-white/20' : 'bg-brand-100 text-brand-800'}`}>{count}</span>}
    </Link>
  );

  const ThemeControls = () => (
    <div className="p-2">
      <p className="px-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Theme</p>
      <div className="grid grid-cols-3 gap-1">
        {([
          ['light', 'Light', Sun],
          ['dark', 'Dark', Moon],
          ['system', 'System', Monitor],
        ] as const).map(([value, label, Icon]) => (
          <button key={value} onClick={() => setTheme(value)} className={`min-h-11 rounded-xl px-2 text-[11px] font-black ${theme === value ? 'bg-brand-100 text-brand-900' : 'hover:bg-slate-50'}`} aria-pressed={theme === value}>
            <Icon className="mx-auto mb-1 h-4 w-4" />{label}
          </button>
        ))}
      </div>
      <p className="mt-2 px-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Language</p>
      <div className="grid grid-cols-3 gap-1">
        {['SO', 'EN', 'AR'].map((value) => <button key={value} onClick={() => setLanguage(value)} className={`min-h-11 rounded-xl text-xs font-black ${language === value ? 'bg-[#3b82f6] text-white' : 'hover:bg-slate-50'}`} aria-pressed={language === value}>{value}</button>)}
      </div>
    </div>
  );

  const NotificationButton = () => currentUser ? (
    <div className="relative">
      <button onClick={openNotifications} className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-950/10 bg-white text-slate-700 hover:bg-brand-50 ${focusRing}`} aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'} aria-expanded={notificationsOpen}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute right-0 top-0 min-w-5 rounded-full bg-rose-600 px-1 text-center text-[10px] font-black leading-5 text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {notificationsOpen && (
        <section className="fixed left-3 right-3 top-[76px] z-[70] max-h-[min(70vh,32rem)] overflow-hidden rounded-2xl border border-brand-950/10 bg-white shadow-2xl md:absolute md:left-auto md:right-0 md:top-12 md:w-[24rem]" aria-label="Notifications">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><h2 className="font-black text-slate-950">Notifications</h2><p className="text-xs font-semibold text-slate-500">{unreadCount ? `${unreadCount} unread` : 'You are up to date'}</p></div><button onClick={loadNotifications} className="min-h-10 rounded-full px-3 text-xs font-black text-[#2563eb] hover:bg-brand-50">Refresh</button></div>
          <div className="max-h-[calc(min(70vh,32rem)-4.5rem)] overflow-y-auto overscroll-contain">
            {notificationState === 'loading' ? <div className="flex items-center justify-center gap-2 p-8 text-sm font-bold text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Loading notifications...</div>
              : notificationState === 'error' ? <div className="p-6 text-center"><AlertCircle className="mx-auto h-6 w-6 text-rose-500" /><p className="mt-2 text-sm font-bold text-slate-700">Notifications could not be loaded.</p><button onClick={loadNotifications} className="mt-3 min-h-11 rounded-full bg-slate-900 px-4 text-xs font-black text-white">Try again</button></div>
              : notifications.length === 0 ? <div className="p-8 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-brand-600" /><p className="mt-2 font-black text-slate-800">No notifications yet</p><p className="mt-1 text-xs font-medium text-slate-500">Applications, hiring requests, and completion updates will appear here.</p></div>
              : notifications.map((notification) => (
                <button key={notification.id} onClick={() => openNotification(notification)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-brand-50/60 ${!notification.readAt ? 'bg-brand-50/45' : 'bg-white'}`}>
                  <span className="flex items-start gap-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.readAt ? 'bg-slate-200' : 'bg-[#3b82f6]'}`} /><span className="min-w-0"><span className="block text-sm font-black text-slate-900">{notification.title}</span><span className="mt-1 block whitespace-normal break-words text-xs font-medium leading-5 text-slate-600">{notification.message}</span><span className="mt-1 block text-[10px] font-bold text-slate-400">{new Date(notification.createdAt).toLocaleString()}</span></span></span>
                </button>
              ))}
          </div>
        </section>
      )}
    </div>
  ) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-brand-950/10 glass-panel" id="main-navbar">
      <nav ref={shellRef} className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-[70px] items-center justify-between gap-2">
          <div className="order-1 flex min-w-0 items-center gap-2 md:order-none">
            <div className="md:hidden"><NotificationButton /></div>
            <Link to={PAGE_ROUTES.home} onClick={closeMenus} className={`inline-flex min-h-11 items-center rounded-full px-1 ${focusRing}`}>
              <img src="/assets/suuqa-Xirfadaha-logo.png" alt="Qardho Skilled Platform" className="h-11 w-[7.2rem] object-contain object-left sm:w-[8.5rem]" width="1536" height="1024" decoding="async" />
            </Link>
            <div className="ml-2 hidden items-center gap-1 md:flex">
              {currentUser ? <><NavLink {...mainLink} /><NavLink page="dashboard" label="Dashboard" Icon={LayoutDashboard} /></> : <><NavLink page="workers" label="Workers" count={workersCount} /><NavLink page="jobs" label="Jobs" count={jobsCount} /></>}
            </div>
          </div>

          <div className="order-2 hidden items-center gap-2 md:flex">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-[#3b82f6] px-5 text-sm font-black text-white hover:bg-[#1d4ed8] ${focusRing}`}>
                  <UserRound className="h-4 w-4" />Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-950/10 bg-white px-4 text-sm font-black text-slate-700 hover:bg-brand-50 ${focusRing}`}>
                  Sign Up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton showName appearance={{ elements: { userButtonBox: 'flex-row-reverse gap-2 font-black text-slate-800' } }}>
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="View Profile"
                    labelIcon={<UserRound className="h-4 w-4" />}
                    onClick={() => navigate(PAGE_ROUTES.profile)}
                  />
                  <UserButton.Action
                    label="Edit Profile"
                    labelIcon={<Edit3 className="h-4 w-4" />}
                    onClick={() => navigate(PAGE_ROUTES['profile-edit'])}
                  />
                  <UserButton.Action
                    label="Platform Settings"
                    labelIcon={<Settings className="h-4 w-4" />}
                    onClick={() => navigate(PAGE_ROUTES.settings)}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </Show>
            {currentUser && (
              <>
                <NotificationButton />
                <span title={currentUser.role === 'worker' ? 'Worker account' : currentUser.role === 'employer' ? 'Employer account' : 'Administrator account'} aria-label={currentUser.role ? `${currentUser.role} account` : 'Account role'} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-950/10 bg-white text-[#2563eb]">{currentUser.role === 'employer' ? <BriefcaseBusiness className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}</span>
              </>
            )}
            {!currentUser && (
              <>
                <div className="relative">
                  <button onClick={() => setMoreOpen((open) => !open)} className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-950/10 bg-white px-4 text-sm font-black text-slate-700 hover:bg-brand-50 ${focusRing}`} aria-expanded={moreOpen}>More<ChevronDown className="h-4 w-4" /></button>
                  {moreOpen && <div className="absolute right-0 top-12 w-72 overflow-hidden rounded-2xl border border-brand-950/10 bg-white shadow-xl"><ThemeControls /><Link to={PAGE_ROUTES.about} onClick={closeMenus} className="flex min-h-12 items-center gap-2 border-t border-slate-100 px-4 text-sm font-black hover:bg-brand-50"><Globe2 className="h-4 w-4" />About & Contact</Link></div>}
                </div>
              </>
            )}
          </div>

          <button type="button" onClick={() => setMobileOpen((open) => !open)} className={`order-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-950/10 bg-white text-slate-700 md:hidden ${focusRing}`} aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen}>{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>

        {mobileOpen && (
          <div className="fixed inset-x-0 top-[70px] z-50 h-[calc(100dvh-70px)] bg-slate-950/35 md:hidden" onClick={(event) => { if (event.target === event.currentTarget) closeMenus(); }}>
            <div className="ml-auto flex h-full w-[min(90vw,22rem)] flex-col overflow-y-auto border-l border-brand-950/10 bg-white p-4 shadow-2xl">
              {currentUser && <div className="mb-4 flex items-center gap-3 rounded-2xl bg-brand-50 p-3"><Avatar name={currentUser.name} src={currentUser.avatarUrl} /><div className="min-w-0"><p className="truncate font-black text-slate-950">{currentUser.name}</p><p className="text-xs font-bold capitalize text-[#2563eb]">{currentUser.role} account</p></div></div>}
              <div className="space-y-1">
                {currentUser ? <><NavLink {...mainLink} /><NavLink page="dashboard" label="Dashboard" Icon={LayoutDashboard} /><Link to={PAGE_ROUTES.profile} onClick={closeMenus} className="flex min-h-12 items-center gap-2 rounded-xl px-4 text-sm font-black hover:bg-brand-50"><UserRound className="h-4 w-4" />View profile</Link><Link to={PAGE_ROUTES['profile-edit']} onClick={closeMenus} className="flex min-h-12 items-center gap-2 rounded-xl px-4 text-sm font-black hover:bg-brand-50"><Edit3 className="h-4 w-4" />Edit profile</Link><Link to={PAGE_ROUTES.settings} onClick={closeMenus} className="flex min-h-12 items-center gap-2 rounded-xl px-4 text-sm font-black hover:bg-brand-50"><Settings className="h-4 w-4" />Settings</Link></> : <><NavLink page="workers" label="Workers" count={workersCount} /><NavLink page="jobs" label="Jobs" count={jobsCount} /><Link to={PAGE_ROUTES.auth} onClick={closeMenus} className="flex min-h-12 items-center gap-2 rounded-xl bg-[#3b82f6] px-4 text-sm font-black text-white"><UserRound className="h-4 w-4" />Sign In</Link></>}
                <Link to={PAGE_ROUTES.about} onClick={closeMenus} className="flex min-h-12 items-center gap-2 rounded-xl px-4 text-sm font-black hover:bg-brand-50"><Globe2 className="h-4 w-4" />About & Contact</Link>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-100"><ThemeControls /></div>
              {currentUser && <button onClick={onLogout} className="mt-auto flex min-h-12 items-center justify-center gap-2 rounded-full border border-rose-200 text-sm font-black text-rose-700 hover:bg-rose-50"><LogOut className="h-4 w-4" />Sign out</button>}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}


