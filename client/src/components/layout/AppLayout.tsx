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
  X,
  Search
} from 'lucide-react';
import api from '@/config/api';
import { NotificationBell } from './NotificationBell';
import { MobileBottomNavigation } from './MobileBottomNavigation';

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

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive 
        ? 'bg-primary/10 text-primary font-semibold' 
        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
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

      {/* ── Sidebar (Desktop) ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[260px] bg-card border-r border-border/50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:flex lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-primary">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              E
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">ERP V1</span>
          </div>
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground p-1 rounded"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">

          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Dashboard
            </div>
            <div className="space-y-1">
              <NavItem to="/" icon={<LayoutDashboard className="w-[18px] h-[18px]" />} label="Overview" />
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Operations
            </div>
            <div className="space-y-1">
              <NavItem to="/bookings" icon={<ShoppingCart className="w-[18px] h-[18px]" />} label="Bookings" />
              <NavItem to="/payments" icon={<CreditCard className="w-[18px] h-[18px]" />} label="Payments" />
              <NavItem to="/expenses" icon={<Receipt className="w-[18px] h-[18px]" />} label="Expenses" />
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Accounting
            </div>
            <div className="space-y-1">
              <NavItem to="/reports/ledger" icon={<BookOpen className="w-[18px] h-[18px]" />} label="Ledger" />
              <NavItem to="/reports" icon={<BarChart className="w-[18px] h-[18px]" />} label="Reports" />
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Master Data
            </div>
            <div className="space-y-1">
              <NavItem to="/masters/expense-settings" icon={<Settings className="w-[18px] h-[18px]" />} label="Expense Settings" />
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              System
            </div>
            <div className="space-y-1">
              <NavItem to="/admin/settings" icon={<Settings className="w-[18px] h-[18px]" />} label="Settings" />
            </div>
          </div>
        </div>

        {/* User Footer (Desktop Only) */}
        <div className="p-4 border-t border-border/50 hidden lg:block">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Topbar */}
        <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-10 flex-shrink-0">
          
          {/* Left: Mobile Menu & Breadcrumb */}
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="text-sm text-muted-foreground hidden sm:block font-medium">
              Overview
            </div>
            <span className="font-bold text-foreground text-lg sm:hidden">ERP V1</span>
          </div>

          {/* Right: Search, Notifications, User */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Mock Global Search */}
            <div className="hidden md:flex items-center relative text-muted-foreground focus-within:text-foreground">
              <Search className="w-4 h-4 absolute left-3" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="h-9 w-[280px] rounded-full border border-border/50 bg-muted/30 pl-9 pr-14 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition-all"
              />
              <div className="absolute right-2 top-1.5 flex items-center gap-1 bg-background border rounded px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                <span>Ctrl</span><span>K</span>
              </div>
            </div>
            
            {/* Search Icon Mobile */}
            <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground">
              <Search className="w-5 h-5" />
            </button>

            <NotificationBell />

            <div className="h-6 w-px bg-border hidden sm:block"></div>

            {/* User Profile */}
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-foreground leading-none">{user?.name?.split(' ')[0] || 'User'}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Super Admin</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNavigation />
      </main>
    </div>
  );
}

