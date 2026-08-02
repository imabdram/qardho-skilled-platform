import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle, Bell, BriefcaseBusiness, CheckCircle2, ChevronDown, Edit3, Globe2,
  LayoutDashboard, Loader2, LogOut, Menu, RefreshCw, Settings, ShieldCheck, UserRound, Users, X,
} from 'lucide-react';
import { Application, Connection, Job, Notification, Review, User } from '../types';
import { PAGE_ROUTES } from '../routes';
import Avatar from './Avatar';
import BottomNav from './BottomNav';
import { Show, SignInButton, SignUpButton, useUser } from '@clerk/react';
import { useApi } from '../useApi';
import { useLanguage } from '../LanguageContext';

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
  isModalOpen?: boolean;
  realtimeNotification?: Notification | null;
}

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
  isModalOpen = false,
  realtimeNotification,
}: NavbarProps) {
  const fetchAuth = useApi();
  const fetch = fetchAuth;
  const { user: clerkUser } = useUser();
  const activeUser = currentUser ? {
    ...currentUser,
    avatarUrl: currentUser.avatarUrl || clerkUser?.imageUrl,
  } : (clerkUser ? {
    id: clerkUser.id,
    name: clerkUser.fullName || clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress || 'User Account',
    avatarUrl: clerkUser.imageUrl,
    phone: '',
    role: 'worker' as const,
  } as User : null);
  const navigate = useNavigate();
  const shellRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationState, setNotificationState] = useState<'idle' | 'loading' | 'error'>('idle');
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    if (realtimeNotification) {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === realtimeNotification.id)) return prev;
        return [realtimeNotification, ...prev];
      });
    }
  }, [realtimeNotification]);

  const closeMenus = () => {
    if (mobileOpen) {
      setMobileOpen(false);
      setTimeout(() => menuButtonRef.current?.focus(), 50);
    }
    setMoreOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
  };

  // Close menus on click outside or Escape key
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (shellRef.current && !shellRef.current.contains(event.target as Node) && !drawerRef.current?.contains(event.target as Node)) {
        closeMenus();
      }
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
  }, [mobileOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Focus trap for mobile drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const drawerEl = drawerRef.current;
    if (!drawerEl) return;

    const focusables = drawerEl.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', '#f8fafc');
  }, []);

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

  const isEmployer = currentUser?.role === 'employer';
  const mainLink = isEmployer
    ? { page: 'workers', label: t('nav_workers'), icon: Users, count: workersCount }
    : { page: 'jobs', label: t('nav_jobs'), icon: BriefcaseBusiness, count: jobsCount };

  const secondaryLink = isEmployer
    ? { page: 'jobs', label: t('nav_jobs'), icon: BriefcaseBusiness, count: jobsCount }
    : { page: 'workers', label: t('nav_workers'), icon: Users, count: workersCount };

  const unreadCount = notifications.filter((item) => !item.readAt).length;

  const NavLink = ({ page, label, count, Icon }: { page: string; label: string; count?: number; Icon?: React.ComponentType<{ className?: string }> }) => (
    <Link
      to={page === 'workers' ? PAGE_ROUTES.workers : page === 'jobs' ? PAGE_ROUTES.jobs : page === 'admin' ? PAGE_ROUTES.admin : PAGE_ROUTES.dashboard}
      onClick={closeMenus}
      className={`inline-flex min-h-[48px] md:min-h-11 items-center gap-2 rounded-xl md:rounded-full px-4 text-sm font-black transition ${focusRing} ${
        currentPage === page ? 'bg-[#2563eb] text-white' : 'text-slate-700 hover:bg-blue-50 hover:text-[#2563eb]'
      }`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span>{label}</span>
      {typeof count === 'number' && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${currentPage === page ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-900'}`}>
          {count}
        </span>
      )}
    </Link>
  );

  const SegmentedLanguageControl = () => (
    <div className="p-2.5">
      <div className="flex items-center justify-between px-1 pb-1.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Language / Luqadda</p>
        <span className="text-[10px] font-bold text-[#2563eb]">{language === 'SO' ? 'Somali' : language === 'EN' ? 'English' : 'العربية'}</span>
      </div>
      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
        {[
          { key: 'SO', label: 'SO' },
          { key: 'EN', label: 'EN' },
          { key: 'AR', label: 'AR' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setLanguage(key)}
            className={`min-h-[36px] rounded-lg text-xs font-black transition-all ${
              language === key
                ? 'bg-[#2563eb] text-white shadow-xs scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            aria-pressed={language === key}
            aria-label={`Switch language to ${label}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  const NotificationButton = () => currentUser ? (
    <div className="relative">
      <button
        onClick={openNotifications}
        className={`relative inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 ${focusRing}`}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={notificationsOpen}
      >
        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-600 px-1 text-center text-[10px] font-black leading-4 text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {notificationsOpen && (
        <section
          className="fixed inset-x-3 top-[70px] z-[70] max-h-[min(70vh,32rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl md:absolute md:left-auto md:right-0 md:top-12 md:w-[24rem]"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="font-black text-slate-950 text-sm sm:text-base">Notifications</h2>
              <p className="text-xs font-semibold text-slate-500">{unreadCount ? `${unreadCount} unread` : 'You are up to date'}</p>
            </div>
            <button onClick={loadNotifications} className="min-h-[36px] rounded-full px-3 text-xs font-black text-[#2563eb] hover:bg-blue-50">
              Refresh
            </button>
          </div>
          <div className="max-h-[calc(min(70vh,32rem)-4.5rem)] overflow-y-auto overscroll-contain">
            {notificationState === 'loading' ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm font-bold text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />Loading notifications...
              </div>
            ) : notificationState === 'error' ? (
              <div className="p-6 text-center">
                <AlertCircle className="mx-auto h-6 w-6 text-rose-500" />
                <p className="mt-2 text-sm font-bold text-slate-700">Notifications could not be loaded.</p>
                <button onClick={loadNotifications} className="mt-3 min-h-[40px] rounded-full bg-slate-900 px-4 text-xs font-black text-white">
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto h-7 w-7 text-blue-600" />
                <p className="mt-2 font-black text-slate-800">No notifications yet</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Applications, hiring requests, and completion updates will appear here.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => openNotification(notification)}
                  className={`block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-blue-50/60 ${!notification.readAt ? 'bg-blue-50/40' : 'bg-white'}`}
                >
                  <span className="flex items-start gap-3">
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.readAt ? 'bg-slate-200' : 'bg-[#2563eb]'}`} />
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-slate-900">{notification.title}</span>
                      <span className="mt-1 block whitespace-normal break-words text-xs font-medium leading-5 text-slate-600">{notification.message}</span>
                      <span className="mt-1 block text-[10px] font-bold text-slate-400">{new Date(notification.createdAt).toLocaleString()}</span>
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  ) : null;

  return (
    <>
      <header className="relative md:fixed md:top-0 md:inset-x-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs" id="main-navbar" dir="ltr">
        <nav ref={shellRef} className="mx-auto max-w-[1180px] px-3 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex h-[56px] sm:h-[64px] items-center justify-between gap-2.5">
            {/* Logo & Desktop Nav Links */}
            <div className="flex items-center gap-4">
              <Link to={PAGE_ROUTES.home} onClick={closeMenus} className={`inline-flex min-h-11 items-center rounded-full px-1 ${focusRing}`}>
                <img
                  src="/assets/suuqa-Xirfadaha-logo.png"
                  alt="Suuqa Xirfadaha Logo"
                  className="h-9 sm:h-10 w-[6.8rem] sm:w-[8.5rem] object-contain object-left"
                  width="1536"
                  height="1024"
                  decoding="async"
                />
              </Link>
              <div className="hidden items-center gap-1.5 md:flex">
                {currentUser?.role === 'admin' ? (
                  <>
                    <NavLink page="workers" label={t('nav_workers')} count={workersCount} Icon={Users} />
                    <NavLink page="jobs" label={t('nav_jobs')} count={jobsCount} Icon={BriefcaseBusiness} />
                    <NavLink page="admin" label={t('nav_admin')} Icon={ShieldCheck} />
                  </>
                ) : currentUser ? (
                  <>
                    <NavLink {...mainLink} />
                    <NavLink page="dashboard" label={t('nav_dashboard')} Icon={LayoutDashboard} />
                  </>
                ) : (
                  <>
                    <NavLink page="workers" label={t('nav_workers')} count={workersCount} />
                    <NavLink page="jobs" label={t('nav_jobs')} count={jobsCount} />
                  </>
                )}
              </div>
            </div>

            {/* Desktop / Responsive Right Actions */}
            <div className="flex items-center gap-2">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-[#2563eb] px-5 text-sm font-black text-white hover:bg-[#1d4ed8] transition ${focusRing}`}>
                    <UserRound className="h-4 w-4" />{t('nav_signin')}
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                {activeUser && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen((open) => !open);
                        setMoreOpen(false);
                        setNotificationsOpen(false);
                      }}
                      className={`flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-1 md:p-1.5 md:pl-2 md:pr-3 hover:bg-slate-50 hover:border-slate-300 transition ${focusRing}`}
                      aria-expanded={profileOpen}
                      aria-label="Open account menu"
                    >
                      <Avatar name={activeUser.name} src={activeUser.avatarUrl} size="sm" />
                      <div className="hidden md:flex flex-col text-left leading-tight">
                        <span className="text-xs sm:text-sm font-black text-slate-900 leading-tight whitespace-nowrap">
                          {activeUser.name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 capitalize tracking-tight leading-none mt-0.5 whitespace-nowrap">
                          {activeUser.role === 'worker' ? 'worker account' : activeUser.role === 'employer' ? 'employer account' : activeUser.role === 'admin' ? 'admin account' : 'account'}
                        </span>
                      </div>
                      <span
                        title={activeUser.role === 'worker' ? 'Worker account' : activeUser.role === 'employer' ? 'Employer account' : 'Administrator account'}
                        aria-label={activeUser.role ? `${activeUser.role} account` : 'Account role'}
                        className={`hidden md:inline-flex h-9 w-9 items-center justify-center rounded-xl shrink-0 font-bold ml-0.5 ${
                          activeUser.role === 'employer'
                            ? 'bg-emerald-50 text-emerald-600'
                            : activeUser.role === 'admin'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-blue-50 text-[#2563eb]'
                        }`}
                      >
                        {activeUser.role === 'employer' ? <BriefcaseBusiness className="h-4.5 w-4.5" /> : <UserRound className="h-4.5 w-4.5" />}
                      </span>
                      <ChevronDown className={`hidden md:block h-4 w-4 text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {profileOpen && (
                      <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-1.5 space-y-0.5">
                          {activeUser.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                closeMenus();
                                navigate(PAGE_ROUTES.admin);
                              }}
                              className="flex min-h-[40px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 transition text-left"
                            >
                              <ShieldCheck className="h-4 w-4 text-amber-600" />
                              <span>{t('nav_admin')}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              closeMenus();
                              navigate(PAGE_ROUTES.profile);
                            }}
                            className="flex min-h-[40px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition text-left"
                          >
                            <UserRound className="h-4 w-4 text-[#2563eb]" />
                            <span>{t('nav_profile')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              closeMenus();
                              navigate(PAGE_ROUTES['profile-edit']);
                            }}
                            className="flex min-h-[40px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition text-left"
                          >
                            <Edit3 className="h-4 w-4 text-[#2563eb]" />
                            <span>{t('nav_edit_profile')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              closeMenus();
                              navigate(PAGE_ROUTES.settings);
                            }}
                            className="flex min-h-[40px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition text-left"
                          >
                            <Settings className="h-4 w-4 text-[#2563eb]" />
                            <span>{t('nav_settings')}</span>
                          </button>

                          {onSwitchRole && activeUser.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                closeMenus();
                                onSwitchRole();
                              }}
                              className="flex min-h-[40px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-[#2563eb] transition text-left"
                            >
                              <RefreshCw className="h-4 w-4 text-[#2563eb]" />
                              <span>{activeUser.role === 'worker' ? t('nav_switch_employer') : t('nav_switch_worker')}</span>
                            </button>
                          )}
                        </div>

                        <div className="border-t border-slate-100 p-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              closeMenus();
                              onLogout();
                            }}
                            className="flex min-h-[40px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>{t('nav_signout')}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Show>
              {activeUser && (
                <div className="hidden md:block">
                  <NotificationButton />
                </div>
              )}

              {/* Direct Desktop More Settings Menu Button (Far Right) */}
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen((open) => !open);
                    setProfileOpen(false);
                    setNotificationsOpen(false);
                  }}
                  className={`inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition ${focusRing} ${
                    moreOpen || currentPage === 'settings'
                      ? 'bg-blue-50 text-[#2563eb] border-blue-200'
                      : ''
                  }`}
                  aria-expanded={moreOpen}
                  aria-label="More Settings"
                  title="More Settings"
                >
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                </button>

                {moreOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          closeMenus();
                          navigate(PAGE_ROUTES.settings);
                        }}
                        className="flex min-h-[40px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition text-left"
                      >
                        <Settings className="h-4 w-4 text-[#2563eb]" />
                        <span>{t('nav_settings')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          closeMenus();
                          navigate(PAGE_ROUTES.about);
                        }}
                        className="flex min-h-[40px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition text-left"
                      >
                        <Globe2 className="h-4 w-4 text-[#2563eb]" />
                        <span>About & Contact</span>
                      </button>
                    </div>
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      <SegmentedLanguageControl />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Header Right Actions */}
            <div className="flex items-center gap-1.5 md:hidden">
              <Show when="signed-in">
                <NotificationButton />
              </Show>
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 ${focusRing}`}
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Side Drawer Modal Backdrop & Sliding Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-slate-950/60 backdrop-blur-xs md:hidden transition-opacity"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeMenus();
          }}
          aria-modal="true"
          role="dialog"
          aria-label="Navigation drawer"
        >
          <div
            ref={drawerRef}
            style={{ width: 'min(88vw, 390px)' }}
            className={`flex h-full flex-col overflow-y-auto bg-white p-5 shadow-2xl transition-transform duration-300 ease-in-out ${
              language === 'AR' ? 'mr-auto border-r border-slate-200' : 'ml-auto border-l border-slate-200'
            }`}
          >
            {/* Drawer Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Menu</span>
              <button
                type="button"
                onClick={closeMenus}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Signed-in Mobile Drawer Content */}
            {activeUser ? (
              <div className="flex flex-col flex-1 min-h-0 pt-3">
                {/* 1. Profile summary */}
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-100">
                  <Avatar name={activeUser.name} src={activeUser.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-950 break-words">{activeUser.name}</p>
                    <p className="text-[10px] font-bold capitalize text-slate-500 mt-0.5">
                      {activeUser.role === 'worker' ? 'worker account' : activeUser.role === 'employer' ? 'employer account' : activeUser.role === 'admin' ? 'admin account' : 'account'}
                    </p>
                  </div>
                  <span
                    title={activeUser.role === 'worker' ? 'Worker account' : activeUser.role === 'employer' ? 'Employer account' : 'Administrator account'}
                    aria-label={activeUser.role ? `${activeUser.role} account` : 'Account role'}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl shrink-0 font-bold ${
                      activeUser.role === 'employer'
                        ? 'bg-emerald-50 text-emerald-600'
                        : activeUser.role === 'admin'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-blue-50 text-[#2563eb]'
                    }`}
                  >
                    {activeUser.role === 'employer' ? <BriefcaseBusiness className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                  </span>
                </div>

                {/* Secondary Links & Account Actions */}
                <div className="space-y-1">
                  <Link
                    to={PAGE_ROUTES.profile}
                    onClick={closeMenus}
                    className="flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-sm font-black text-slate-800 hover:bg-slate-50 transition"
                  >
                    <UserRound className="h-4 w-4 text-[#2563eb]" />
                    <span>View profile</span>
                  </Link>
                  <Link
                    to={PAGE_ROUTES['profile-edit']}
                    onClick={closeMenus}
                    className="flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-sm font-black text-slate-800 hover:bg-slate-50 transition"
                  >
                    <Edit3 className="h-4 w-4 text-[#2563eb]" />
                    <span>Edit profile</span>
                  </Link>
                  {onSwitchRole && activeUser.role !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        closeMenus();
                        onSwitchRole();
                      }}
                      className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-4 text-sm font-black text-slate-800 hover:bg-blue-50 hover:text-[#2563eb] transition text-left"
                    >
                      <RefreshCw className="h-4 w-4 text-[#2563eb]" />
                      <span>{activeUser.role === 'worker' ? t('nav_switch_employer') : t('nav_switch_worker')}</span>
                    </button>
                  )}
                  <Link
                    to={PAGE_ROUTES.settings}
                    onClick={closeMenus}
                    className="flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-sm font-black text-slate-800 hover:bg-slate-50 transition"
                  >
                    <Settings className="h-4 w-4 text-[#2563eb]" />
                    <span>Settings</span>
                  </Link>
                  <Link
                    to={PAGE_ROUTES.about}
                    onClick={closeMenus}
                    className="flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-sm font-black text-slate-800 hover:bg-slate-50 transition"
                  >
                    <Globe2 className="h-4 w-4 text-[#2563eb]" />
                    <span>About & Contact</span>
                  </Link>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <SegmentedLanguageControl />
                </div>

                {/* Sign Out Button visually separated near bottom */}
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      closeMenus();
                      onLogout();
                    }}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/60 px-4 text-sm font-black text-rose-700 hover:bg-rose-100/80 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Signed-out Mobile Drawer Content */
              <div className="flex flex-col flex-1 pt-3 space-y-4">
                {/* Sign In & Create Account buttons */}
                <div className="space-y-2">
                  <Show when="signed-out">
                    <SignInButton mode="modal">
                      <button
                        onClick={closeMenus}
                        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 text-sm font-black text-white hover:bg-[#1d4ed8] shadow-xs transition"
                      >
                        <UserRound className="h-4 w-4" />
                        <span>Sign In</span>
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        onClick={closeMenus}
                        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50 transition"
                      >
                        <span>Create Account</span>
                      </button>
                    </SignUpButton>
                  </Show>
                </div>

                {/* Navigation Links */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <Link
                    to={PAGE_ROUTES.about}
                    onClick={closeMenus}
                    className="flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-sm font-black text-slate-800 hover:bg-slate-50 transition"
                  >
                    <Globe2 className="h-4 w-4 text-[#2563eb]" />
                    <span>About & Contact</span>
                  </Link>
                </div>

                <div className="mt-auto rounded-2xl border border-slate-100 bg-slate-50/50">
                  <SegmentedLanguageControl />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fixed Mobile Bottom Navigation for Signed-In Users */}
      <BottomNav
        currentUser={currentUser}
        unreadCount={unreadCount}
        onOpenNotifications={openNotifications}
        onOpenMore={() => setMobileOpen(true)}
        isHidden={mobileOpen || notificationsOpen || isModalOpen}
      />
    </>
  );
}
