import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  Receipt, 
  BookOpen, 
  BarChart, 
  Store, 
  Users, 
  Tags, 
  Settings,
  LogOut,
  ShieldAlert,
  Bell
} from 'lucide-react';
import api from '@/config/api';
import { NotificationBell } from './NotificationBell';

export default function AppLayout() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore
    } finally {
      logout();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <span className="font-bold text-lg text-primary tracking-tight">ASG ERP V2</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Dashboard
            </div>
            <div className="space-y-1">
              <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'}`}>
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </NavLink>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Operations
            </div>
            <div className="space-y-1">
              <NavLink to="/bookings" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors">
                <ShoppingCart className="w-4 h-4" /> Bookings
              </NavLink>
              <NavLink to="/payments" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors">
                <CreditCard className="w-4 h-4" /> Payments
              </NavLink>
              <NavLink to="/expenses" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors">
                <Receipt className="w-4 h-4" /> Expenses
              </NavLink>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Accounting
            </div>
            <div className="space-y-1">
              <NavLink to="/reports/ledger" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors">
                <BookOpen className="w-4 h-4" /> Ledger
              </NavLink>
              <NavLink to="/reports" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors">
                <BarChart className="w-4 h-4" /> Reports
              </NavLink>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Master Data
            </div>
            <div className="space-y-1">
              <NavLink to="/masters/expense-settings" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors">
                <Settings className="w-4 h-4" /> Expense Settings
              </NavLink>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              System
            </div>
            <div className="space-y-1">
              <NavLink to="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors">
                <Settings className="w-4 h-4" /> Settings
              </NavLink>
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.role.name}</div>
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {/* Breadcrumb Placeholder */}
            Dashboard <span className="mx-2">/</span> Overview
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-muted/20 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
