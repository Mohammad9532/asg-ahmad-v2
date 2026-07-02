import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, CreditCard, Receipt, BarChart, BookOpen, Plus } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

export function QuickActions() {
  const { user } = useAuthStore();
  const role = user?.role?.name || '';

  if (role === 'Viewer') return null;

  const actions = [];

  if (['Super Admin', 'Owner', 'Shop Manager', 'Cashier'].includes(role)) {
    actions.push({ label: 'New Booking', icon: ShoppingCart, to: '/bookings', color: 'text-blue-600', bg: 'bg-blue-50', hover: 'group-hover:bg-blue-600 group-hover:text-white' });
    actions.push({ label: 'New Payment', icon: CreditCard, to: '/payments', color: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'group-hover:bg-emerald-600 group-hover:text-white' });
  }

  if (['Super Admin', 'Owner', 'Accountant', 'Shop Manager'].includes(role)) {
    actions.push({ label: 'New Expense', icon: Receipt, to: '/expenses/create', color: 'text-amber-600', bg: 'bg-amber-50', hover: 'group-hover:bg-amber-600 group-hover:text-white' });
  }

  if (['Super Admin', 'Owner', 'Accountant', 'Shop Manager'].includes(role)) {
    actions.push({ label: 'Reports', icon: BarChart, to: '/reports', color: 'text-indigo-600', bg: 'bg-indigo-50', hover: 'group-hover:bg-indigo-600 group-hover:text-white' });
    actions.push({ label: 'Ledger', icon: BookOpen, to: '/reports/ledger', color: 'text-purple-600', bg: 'bg-purple-50', hover: 'group-hover:bg-purple-600 group-hover:text-white' });
  }

  let sortedActions = actions;
  if (role === 'Cashier') {
    const order = ['New Booking', 'New Payment', 'New Expense'];
    sortedActions = actions.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  }

  return (
    <div>
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {sortedActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link 
              key={i} 
              to={action.to}
              className="bg-white border border-slate-100 hover:border-slate-200 transition-all duration-300 p-4 rounded-2xl shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-3 group"
            >
              <div className={`${action.bg} ${action.color} ${action.hover} p-3 rounded-xl transition-colors duration-300`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm tracking-wide text-slate-700 group-hover:text-slate-900 transition-colors">{action.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  );
}
