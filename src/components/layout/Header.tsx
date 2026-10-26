import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Moon,
  Sun,
  Plus,
  Target,
  Layers,
  CheckSquare,
  Users,
  Building,
  User,
  LogOut,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';

export const Header: React.FC<{
  onOpenMobileSidebar: () => void;
  onQuickCreate?: (type: 'lead' | 'deal' | 'task' | 'contact') => void;
}> = ({ onOpenMobileSidebar, onQuickCreate }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user, organizationName, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const createRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Compute title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/leads')) return 'Leads';
    if (path.startsWith('/contacts')) return 'Contacts';
    if (path.startsWith('/deals')) return 'Deals Pipeline';
    if (path.startsWith('/tasks')) return 'Tasks';
    if (path.startsWith('/activity')) return 'Activity Timeline';
    if (path.startsWith('/manage/organizations')) return 'Organizations';
    if (path.startsWith('/manage/users')) return 'Users';
    if (path.startsWith('/manage/invitations')) return 'Invitations';
    if (path.startsWith('/settings/profile')) return 'Profile Settings';
    if (path.startsWith('/settings/organization')) return 'Organization Settings';
    return 'CRM';
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6">
      {/* Left side: mobile toggle + page breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {getPageTitle()}
          </span>
          {organizationName && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Building className="h-3 w-3" />
              {organizationName}
            </span>
          )}
        </div>
      </div>

      {/* Right side: quick add, theme toggle, user avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Menu */}
        <div className="relative" ref={createRef}>
          <Button
            size="sm"
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className="h-8 gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Create</span>
          </Button>

          {createMenuOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-lg border border-border bg-popover p-1 shadow-elevated z-50 animate-in fade-in-50 zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  if (onQuickCreate) onQuickCreate('lead');
                  else navigate('/leads?action=new');
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <Target className="h-3.5 w-3.5 text-blue-500" />
                <span>New Lead</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  if (onQuickCreate) onQuickCreate('deal');
                  else navigate('/deals?action=new');
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                <span>New Deal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  if (onQuickCreate) onQuickCreate('task');
                  else navigate('/tasks?action=new');
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                <span>New Task</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  if (onQuickCreate) onQuickCreate('contact');
                  else navigate('/contacts?action=new');
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <Users className="h-3.5 w-3.5 text-purple-500" />
                <span>New Contact</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* User avatar and dropdown */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shadow-subtle',
                getAvatarColor(user?.email || user?.firstName)
              )}
            >
              {getInitials(
                user ? `${user.firstName} ${user.lastName}` : null,
                user?.email
              )}
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-1 w-52 rounded-lg border border-border bg-popover p-1 shadow-elevated z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-2 border-b border-border/60 mb-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {user ? `${user.firstName} ${user.lastName}` : 'My Account'}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {user?.email || ''}
                </p>
              </div>
              <Link
                to="/settings/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Profile Settings</span>
              </Link>
              <Link
                to="/settings/organization"
                onClick={() => setUserMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Organization Settings</span>
              </Link>
              <div className="my-1 border-t border-border/60" />
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
