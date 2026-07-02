import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  DollarSign, 
  CreditCard, 
  Wallet, 
  AlertCircle, 
  ShoppingCart, 
  TrendingUp 
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

import { StatCard } from './components/StatCard';
import { QuickActions } from './components/QuickActions';
import { ChartCard } from './components/ChartCard';
import { RecentActivity } from './components/RecentActivity';
import api from '@/config/api';

export default function Dashboard() {
  const { user } = useAuthStore();
  
  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data;
    },
    refetchInterval: 60000, // Refresh every 60s
  });

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10 font-sans">
      
      {/* Welcome Banner */}
      <div className="bg-indigo-600 rounded-3xl p-8 sm:p-10 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-400 opacity-20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-indigo-100 text-base sm:text-lg max-w-xl">
            {/* @ts-ignore */}
            Here's what's happening at <span className="font-semibold text-white">{user?.shop?.name || 'Naseem'}</span> today. Let's make it a productive day.
          </p>
        </div>

        <div className="relative z-10 w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-6">
            
            <div className="text-center sm:text-left">
              <p className="text-indigo-200 text-[11px] font-bold uppercase tracking-wider mb-1">Today's Bookings</p>
              <p className="text-2xl font-bold">AED {Number(summary?.today_booking_amount || 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            
            <div className="hidden sm:block h-12 w-px bg-white/20"></div>
            
            <div className="text-center sm:text-left">
              <p className="text-indigo-200 text-[11px] font-bold uppercase tracking-wider mb-1">Stock Pending</p>
              <p className="text-2xl font-bold">AED {Number(summary?.today_outstanding || 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>

            <div className="hidden sm:block h-12 w-px bg-white/20"></div>
            
            <div className="text-center sm:text-left">
              <p className="text-indigo-200 text-[11px] font-bold uppercase tracking-wider mb-1">Pending %</p>
              <p className="text-2xl font-bold">
                {summary?.today_booking_amount > 0 
                  ? Math.round((Number(summary?.today_outstanding || 0) / Number(summary?.today_booking_amount)) * 100) 
                  : 0}%
              </p>
            </div>
            
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard 
          title="Total Collections" 
          value={isLoading ? 0 : `AED ${Number(summary?.today_payments || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`} 
          icon={<TrendingUp />} 
          linkTo="/payments"
          isLoading={isLoading}
          isError={isError}
          color="emerald"
        />
        <StatCard 
          title="Cash Collections" 
          value={isLoading ? 0 : `AED ${Number(summary?.today_cash_payments || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`} 
          icon={<DollarSign />} 
          linkTo="/payments"
          isLoading={isLoading}
          isError={isError}
          color="emerald"
        />
        <StatCard 
          title="Card Collections" 
          value={isLoading ? 0 : `AED ${Number(summary?.today_card_payments || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`} 
          icon={<CreditCard />} 
          linkTo="/payments"
          isLoading={isLoading}
          isError={isError}
          color="indigo"
        />
        <StatCard 
          title="Today's Expenses" 
          value={isLoading ? 0 : `AED ${Number(summary?.today_expenses || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`} 
          icon={<CreditCard />} 
          linkTo="/expenses"
          isLoading={isLoading}
          isError={isError}
          color="rose"
        />
        <StatCard 
          title="Cash in Box" 
          value={isLoading ? 0 : `AED ${Number(summary?.cash_balance || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`} 
          icon={<Wallet />} 
          linkTo="/reports/ledger"
          isLoading={isLoading}
          isError={isError}
          color="indigo"
        />
        <StatCard 
          title="Bank Balance" 
          value={isLoading ? 0 : `AED ${Number(summary?.bank_balance || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`} 
          icon={<DollarSign />} 
          linkTo="/reports/ledger"
          isLoading={isLoading}
          isError={isError}
          color="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Daily Collections" description="Payments received over the last 7 days" />
        <ChartCard title="Expenses by Category" description="Breakdown of operational costs" />
      </div>

      {/* Lazy-loaded Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bookings */}
        <RecentActivity 
          title="Recent Bookings" 
          queryKey="bookings" 
          endpoint="/bookings?per_page=10" 
          viewAllLink="/bookings"
          renderItem={(booking) => (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider">ORD</div>
                <div>
                  <div className="font-bold text-slate-700">{booking.bill_no}</div>
                  <div className="text-slate-500 font-medium text-xs">{booking.customer_name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-slate-800">AED {Number(booking.booking_amount || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}</div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase">{format(new Date(booking.booking_date), 'MMM dd')}</div>
              </div>
            </div>
          )}
        />

        {/* Payments */}
        <RecentActivity 
          title="Recent Payments" 
          queryKey="payments" 
          endpoint="/payments?per_page=10" 
          viewAllLink="/payments"
          renderItem={(payment) => (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider">CASH</div>
                <div>
                  <div className="font-bold text-slate-700">Receipt #{payment.id}</div>
                  <div className="text-slate-500 font-medium text-xs">For: {payment.booking?.bill_no || '-'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-emerald-600">AED {Number(payment.amount).toLocaleString('en-AE', { minimumFractionDigits: 2 })}</div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase">{format(new Date(payment.payment_date), 'MMM dd')}</div>
              </div>
            </div>
          )}
        />

        {/* Expenses */}
        <RecentActivity 
          title="Recent Expenses" 
          queryKey="expenses" 
          endpoint="/expenses?per_page=10" 
          viewAllLink="/expenses"
          renderItem={(expense) => (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-3">
                <div className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider">EXP</div>
                <div>
                  <div className="font-bold text-slate-700">{expense.expense_category?.name}</div>
                  <div className="text-slate-500 font-medium text-xs truncate max-w-[200px]">{expense.remarks || expense.expense_master?.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-rose-600">AED {Number(expense.amount).toLocaleString('en-AE', { minimumFractionDigits: 2 })}</div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase">{format(new Date(expense.expense_date), 'MMM dd')}</div>
              </div>
            </div>
          )}
        />

        {/* Notifications */}
        <RecentActivity 
          title="Recent Notifications" 
          queryKey="notifications" 
          endpoint="/notifications?per_page=10" 
          viewAllLink="/notifications"
          renderItem={(notif) => (
            <div className="flex flex-col text-sm">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${notif.is_read ? 'bg-slate-200' : 'bg-indigo-500 animate-pulse'}`}></div>
                  <span className={`font-bold ${notif.is_read ? 'text-slate-600' : 'text-slate-800'}`}>{notif.title}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">{format(new Date(notif.created_at), 'MMM dd, HH:mm')}</span>
              </div>
              <div className="text-slate-500 font-medium text-xs ml-4 truncate">{notif.message}</div>
            </div>
          )}
        />

      </div>

    </div>
  );
}
