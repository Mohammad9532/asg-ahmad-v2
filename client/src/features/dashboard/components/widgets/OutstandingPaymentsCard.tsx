import React from 'react';
import { AppCard } from '@/components/ui/AppCard';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface OutstandingProps {
  isLoading?: boolean;
  customers: {
    id: number;
    name: string;
    amount: number;
    daysOverdue: number;
  }[];
}

export function OutstandingPaymentsCard({ isLoading, customers }: OutstandingProps) {
  return (
    <AppCard 
      title="Outstanding Payments" 
      isLoading={isLoading} 
      isEmpty={customers.length === 0}
      noPadding
      footer={
        <Link to="/reports/outstanding" className="flex items-center justify-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      }
    >
      <div className="flex flex-col">
        {customers.map((c, i) => (
          <div key={i} className="flex items-center justify-between p-4 sm:px-5 border-b border-border/50 hover:bg-muted/30 transition-colors last:border-0 cursor-pointer">
            
            {/* Customer Info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {c.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">{c.name}</div>
                <div className="text-[11px] font-medium text-muted-foreground">ID: #{c.id}</div>
              </div>
            </div>

            {/* Amount & Status */}
            <div className="text-right">
              <div className="text-sm font-black text-foreground">
                AED {c.amount.toLocaleString('en-AE')}
              </div>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${c.daysOverdue > 0 ? 'text-rose-500' : 'text-amber-500'}`}>
                {c.daysOverdue > 0 ? `Overdue ${c.daysOverdue} Days` : 'Pending'}
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </AppCard>
  );
}
