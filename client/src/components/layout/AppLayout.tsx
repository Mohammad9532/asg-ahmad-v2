import React, { useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  CreditCard, 
  Receipt, 
  BookOpen, 
  BarChart, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import api from '@/config/api';
import { NotificationBell } from './NotificationBell';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore
    } finally {
      logout();
    }
  };

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // NavLink class helper — also closes sidebar on mobile tap
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
    }`;

  const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
    <NavLink to={to} className={navClass} onClick={closeSidebar}>
      {icon}
      {label}
    </NavLink>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Mobile Backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:flex lg:z-auto
        `}
      >
        {/* Logo row + close btn on mobile */}
        <div className="h-16 flex items-center justify-between px-6 border-b flex-shrink-0">
          <span className="font-bold text-lg text-primary tracking-tight">ASG ERP V2</span>
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground p-1 rounded"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-3">
              Dashboard
            </div>
            <div className="space-y-0.5">
              <NavItem to="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Overview" />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-3">
              Operations
            </div>
            <div className="space-y-0.5">
              <NavItem to="/bookings" icon={<ShoppingCart className="w-4 h-4" />} label="Bookings" />
              <NavItem to="/payments" icon={<CreditCard className="w-4 h-4" />} label="Payments" />
              <NavItem to="/expenses" icon={<Receipt className="w-4 h-4" />} label="Expenses" />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-3">
              Accounting
            </div>
            <div className="space-y-0.5">
              <NavItem to="/reports/ledger" icon={<BookOpen className="w-4 h-4" />} label="Ledger" />
              <NavItem to="/reports" icon={<BarChart className="w-4 h-4" />} label="Reports" />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-3">
              Master Data
            </div>
            <div className="space-y-0.5">
              <NavItem to="/masters/expense-settings" icon={<Settings className="w-4 h-4" />} label="Expense Settings" />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-3">
              System
            </div>
            <div className="space-y-0.5">
              <NavItem to="/admin/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t flex-shrink-0">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.role?.name}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 sm:px-6 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors text-foreground"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              id="mobile-menu-btn"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm text-muted-foreground hidden sm:block">
              Dashboard <span className="mx-1">/</span> Overview
            </div>
            {/* App name on mobile instead of breadcrumb */}
            <span className="text-sm font-bold text-primary sm:hidden">ASG ERP V2</span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-muted/20 p-3 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
