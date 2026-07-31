import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, BriefcaseBusiness, Globe2, Home, LayoutDashboard, UserRound, Users } from 'lucide-react';
import { User } from '../types';
import { PAGE_ROUTES } from '../routes';
import { useLanguage } from '../LanguageContext';

interface BottomNavProps {
  currentUser: User | null;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenMore?: () => void;
  isHidden?: boolean;
}

interface NavTabItem {
  route: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isNotification?: boolean;
  isMore?: boolean;
}

export default function BottomNav({
  currentUser,
  unreadCount = 0,
  onOpenNotifications,
  onOpenMore,
  isHidden = false,
}: BottomNavProps) {
  const location = useLocation();
  const { t } = useLanguage();

  if (isHidden) return null;

  const isAdmin = currentUser?.role === 'admin';
  const isEmployer = currentUser?.role === 'employer';

  const guestTabs: NavTabItem[] = [
    { route: PAGE_ROUTES.home, label: t('guest_tab_home', 'Home'), icon: Home },
    { route: PAGE_ROUTES.jobs, label: t('nav_jobs', 'Jobs'), icon: BriefcaseBusiness },
    { route: PAGE_ROUTES.workers, label: t('nav_workers', 'Workers'), icon: Users },
    { route: 'more', label: t('nav_more', 'More'), icon: Globe2, isMore: true },
  ];

  const userTabs: NavTabItem[] = isAdmin ? [
    { route: PAGE_ROUTES.workers, label: 'Workers', icon: Users },
    { route: PAGE_ROUTES.jobs, label: 'Jobs', icon: BriefcaseBusiness },
    { route: PAGE_ROUTES.admin, label: 'Admin', icon: LayoutDashboard },
    { route: PAGE_ROUTES.profile, label: 'Profile', icon: UserRound },
  ] : [
    { route: PAGE_ROUTES.jobs, label: 'Jobs', icon: BriefcaseBusiness },
    { route: PAGE_ROUTES.workers, label: 'Workers', icon: Users },
    { route: PAGE_ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
    { route: PAGE_ROUTES.profile, label: 'Profile', icon: UserRound },
  ];

  const tabs = currentUser ? userTabs : guestTabs;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-white/95 border-t border-slate-200/90 backdrop-blur-md shadow-lg md:hidden pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="grid grid-cols-4 h-[60px] items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.isNotification || tab.isMore
            ? false
            : location.pathname === tab.route ||
              (tab.route === PAGE_ROUTES.dashboard && location.pathname.startsWith('/dashboard')) ||
              (tab.route === PAGE_ROUTES.profile && location.pathname.startsWith('/profile'));

          if (tab.isNotification) {
            return (
              <button
                key="notifications"
                type="button"
                onClick={onOpenNotifications}
                className="flex flex-col items-center justify-center h-full min-h-[48px] w-full py-1 text-slate-500 hover:text-[#2563eb] transition relative"
                aria-label={unreadCount ? `Notifications (${unreadCount} unread)` : 'Notifications'}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="mt-1 text-[10px] font-bold tracking-tight">Notifications</span>
              </button>
            );
          }

          if (tab.isMore) {
            return (
              <button
                key="more"
                type="button"
                onClick={onOpenMore}
                className="flex flex-col items-center justify-center h-full min-h-[48px] w-full py-1 text-slate-500 hover:text-slate-900 transition"
                aria-label="More menu"
              >
                <div className="p-1 rounded-full">
                  <Icon className="h-5 w-5 text-slate-500" />
                </div>
                <span className="mt-1 text-[10px] font-semibold tracking-tight">{tab.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={tab.label}
              to={tab.route}
              className={`flex flex-col items-center justify-center h-full min-h-[48px] w-full py-1 transition ${
                isActive ? 'text-[#2563eb] font-extrabold' : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className={`p-1 rounded-full ${isActive ? 'bg-blue-50' : ''}`}>
                <Icon className={`h-5 w-5 ${isActive ? 'text-[#2563eb]' : 'text-slate-500'}`} />
              </div>
              <span className={`text-[10px] tracking-tight ${isActive ? 'font-black text-[#2563eb]' : 'font-semibold'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
