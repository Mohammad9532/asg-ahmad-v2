import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Briefcase, 
  CreditCard, 
  Wallet, 
  TrendingUp,
  Receipt,
  AlertCircle
} from 'lucide-react';

import api from '@/config/api';

// Components
import { WelcomeSection, DATE_PRESETS } from './components/widgets/WelcomeSection';
import { KPICard } from './components/widgets/KPICard';
import { QuickActions } from './components/widgets/QuickActions';
import { TodayWorkCard } from './components/widgets/TodayWorkCard';
import { OutstandingPaymentsCard } from './components/widgets/OutstandingPaymentsCard';
import { RecentActivityCard } from './components/widgets/RecentActivityCard';
import { AIInsightCard } from './components/widgets/AIInsightCard';
import { CollectionsChart } from './components/charts/CollectionsChart';
import { ExpenseChart } from './components/charts/ExpenseChart';
import { MonthlyBookingChart } from './components/charts/MonthlyBookingChart';

export default function Dashboard() {
  
  const [activePreset, setActivePreset] = useState(DATE_PRESETS[2]); // Default 'This Month'

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary', activePreset.start(), activePreset.end()],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard', {
        params: { start_date: activePreset.start(), end_date: activePreset.end() }
      });
      return res.data;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="max-w-[1600px] mx-auto font-sans flex flex-col gap-6">
      
      {/* Hero Section */}
      <WelcomeSection 
        activePresetLabel={activePreset.label}
        onPresetSelect={setActivePreset}
        startDate={summary?.period_start || activePreset.start()}
        endDate={summary?.period_end || activePreset.end()}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard 
          title="Today's Booking"
          value={`AED ${(summary?.today_booking_amount || 0).toLocaleString()}`}
          icon={<Briefcase />}
          colorTheme="primary"
          isLoading={isLoading}
        />
        <KPICard 
          title="Today's Collection"
          value={`AED ${(summary?.today_payments || 0).toLocaleString()}`}
          icon={<TrendingUp />}
          colorTheme="success"
          isLoading={isLoading}
        />
        <KPICard 
          title="Outstanding"
          value={`AED ${(summary?.today_outstanding || 0).toLocaleString()}`}
          icon={<AlertCircle />}
          colorTheme="warning"
          isLoading={isLoading}
        />
        <KPICard 
          title="Cash in Hand"
          value={`AED ${(summary?.cash_balance || 0).toLocaleString()}`}
          icon={<Wallet />}
          colorTheme="primary"
          isLoading={isLoading}
        />
        <KPICard 
          title="Bank Balance"
          value={`AED ${(summary?.bank_balance || 0).toLocaleString()}`}
          icon={<CreditCard />}
          colorTheme="primary"
          isLoading={isLoading}
        />
        <KPICard 
          title="Today's Expense"
          value={`AED ${(summary?.today_expenses || 0).toLocaleString()}`}
          icon={<Receipt />}
          colorTheme="danger"
          isLoading={isLoading}
        />
      </div>

      <QuickActions />

      {/* Main Content Grid (12 Columns Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <CollectionsChart isLoading={isLoading} data={summary?.chart_collections || []} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ExpenseChart isLoading={isLoading} data={summary?.chart_expenses || []} />
            <MonthlyBookingChart isLoading={isLoading} data={summary?.chart_monthly_bookings || []} />
          </div>

        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <AIInsightCard isLoading={isLoading} insights={summary?.insights || []} />

          <TodayWorkCard 
            isLoading={isLoading}
            deliveries={summary?.today_deliveries || 0}
            pending={summary?.today_bookings || 0}
            late={0}
            pickups={0}
          />

          <OutstandingPaymentsCard 
            isLoading={isLoading}
            customers={summary?.outstanding_customers || []}
          />

          <RecentActivityCard 
            isLoading={isLoading}
            activities={summary?.latest_activities || []}
          />

        </div>
        
      </div>

    </div>
  );
}


