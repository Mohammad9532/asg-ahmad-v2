import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  BarChart, 
  Settings, 
  Plus, 
  CreditCard, 
  Receipt, 
  Truck 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNavigation() {
  const location = useLocation();
  const [fabOpen, setFabOpen] = useState(false);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border/50 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-50 px-2 pb-safe">
      <div className="flex h-full items-center justify-around">
        
        <NavLink to="/" className={navClass}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </NavLink>

        <NavLink to="/bookings" className={navClass}>
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] font-medium">Bookings</span>
        </NavLink>

        {/* FAB (Floating Action Button) */}
        <div className="relative -top-5 flex flex-col items-center justify-center">
          <button 
            onClick={() => setFabOpen(!fabOpen)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-50",
              fabOpen ? "bg-rose-500 text-white rotate-45" : "bg-primary text-primary-foreground"
            )}
            aria-label="Create New"
          >
            <Plus className="w-6 h-6" />
          </button>

          {/* FAB Menu */}
          {fabOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-30" 
                onClick={() => setFabOpen(false)}
              />
              
              {/* Menu Items */}
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 bg-card border border-border/50 rounded-2xl shadow-xl p-2 flex flex-col gap-1 z-40 animate-in fade-in slide-in-from-bottom-5 duration-200">
                <Link to="/bookings" onClick={() => setFabOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl hover:bg-muted/50 text-foreground">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><ShoppingCart className="w-4 h-4" /></div>
                  New Booking
                </Link>
                <Link to="/payments" onClick={() => setFabOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl hover:bg-muted/50 text-foreground">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><CreditCard className="w-4 h-4" /></div>
                  New Payment
                </Link>
                <Link to="/expenses" onClick={() => setFabOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl hover:bg-muted/50 text-foreground">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center"><Receipt className="w-4 h-4" /></div>
                  New Expense
                </Link>
                <Link to="/bookings" onClick={() => setFabOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl hover:bg-muted/50 text-foreground">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><Truck className="w-4 h-4" /></div>
                  Delivery
                </Link>
              </div>
            </>
          )}
        </div>

        <NavLink to="/reports" className={navClass}>
          <BarChart className="w-5 h-5" />
          <span className="text-[10px] font-medium">Reports</span>
        </NavLink>

        <NavLink to="/admin/settings" className={navClass}>
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </NavLink>

      </div>
    </div>
  );
}
