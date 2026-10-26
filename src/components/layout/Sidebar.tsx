import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Users,
  Layers,
  CheckSquare,
  Activity,
  Building2,
  UserCheck,
  Mail,
  UserCog,
  Sliders,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';

export const Sidebar: React.FC<{
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}> = ({ isOpenMobile, onCloseMobile }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, organizationName, logout } = useAuth();
  const location = useLocation();

  const navSections = [
    {
      title: 'CRM',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Leads', path: '/leads', icon: Target },
        { name: 'Contacts', path: '/contacts', icon: Users },
        { name: 'Deals', path: '/deals', icon: Layers },
        { name: 'Tasks', path: '/tasks', icon: CheckSquare },
        { name: 'Activity Timeline', path: '/activity', icon: Activity },
      ],
    },
    {
      title: 'Manage',
      items: [
        { name: 'Organizations', path: '/manage/organizations', icon: Building2 },
        { name: 'Users', path: '/manage/users', icon: UserCheck },
        { name: 'Invitations', path: '/manage/invitations', icon: Mail },
      ],
    },
    {
      title: 'Settings',
      items: [
        { name: 'Profile Settings', path: '/settings/profile', icon: UserCog },
        { name: 'Organization Settings', path: '/settings/organization', icon: Sliders },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-200 lg:static',
          collapsed ? 'w-16' : 'w-64',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-border/80 px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold shadow-sm text-sm">
              Q1
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold tracking-tight text-foreground truncate">
                  Logic-Q1 CRM
                </span>
                <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1 font-medium">
                  <Building className="w-2.5 h-2.5" />
                  {organizationName || 'Sales Workspace'}
                </span>
              </div>
            )}
          </div>
          {/* Collapse button on desktop */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === '/dashboard'
                      ? location.pathname === '/dashboard'
                      : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => onCloseMobile?.()}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all group select-none',
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-subtle'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        collapsed && 'justify-center px-0 py-2'
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-105',
                          isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User profile footer */}
        <div className="border-t border-border/80 p-3">
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-lg p-2 transition-colors',
              collapsed ? 'justify-center' : 'hover:bg-muted/50'
            )}
          >
            <div
              className={cn(
                'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold select-none',
                getAvatarColor(user?.email || user?.firstName)
              )}
            >
              {getInitials(
                user ? `${user.firstName} ${user.lastName}` : null,
                user?.email
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium text-foreground truncate">
                  {user ? `${user.firstName} ${user.lastName}` : 'Account'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user?.email || ''}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                type="button"
                onClick={logout}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
