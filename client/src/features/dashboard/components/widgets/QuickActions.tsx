import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  Receipt, 
  BookOpen, 
  BarChart, 
  Users, 
  Settings 
} from 'lucide-react';

const ACTIONS = [
  { label: 'Booking', icon: ShoppingCart, color: 'text-blue-600 bg-blue-50', to: '/bookings' },
  { label: 'Payment', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50', to: '/payments' },
  { label: 'Delivery', icon: Truck, color: 'text-amber-600 bg-amber-50', to: '/bookings' },
  { label: 'Expense', icon: Receipt, color: 'text-rose-600 bg-rose-50', to: '/expenses' },
  { label: 'Ledger', icon: BookOpen, color: 'text-purple-600 bg-purple-50', to: '/reports/ledger' },
  { label: 'Reports', icon: BarChart, color: 'text-indigo-600 bg-indigo-50', to: '/reports' },
  { label: 'Customers', icon: Users, color: 'text-teal-600 bg-teal-50', to: '/' },
  { label: 'Settings', icon: Settings, color: 'text-slate-600 bg-slate-50', to: '/admin/settings' },
];

export function QuickActions() {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4">
        {ACTIONS.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Link
              key={idx}
              to={action.to}
              className="group flex flex-col items-center justify-center p-4 sm:p-5 bg-card border border-border/50 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${action.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
