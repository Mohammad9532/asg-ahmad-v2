import React from 'react';
import { AppCard } from '@/components/ui/AppCard';
import { format } from 'date-fns';
import { ShoppingCart, CreditCard, Receipt, FileText } from 'lucide-react';

interface ActivityProps {
  isLoading?: boolean;
  activities: {
    id: number;
    title: string;
    description: string;
    time: string;
    type: 'booking' | 'payment' | 'expense' | 'other';
  }[];
}

export function RecentActivityCard({ isLoading, activities }: ActivityProps) {
  
  const getIcon = (type: string) => {
    switch(type) {
      case 'booking': return <ShoppingCart className="w-4 h-4 text-blue-600" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'expense': return <Receipt className="w-4 h-4 text-rose-600" />;
      default: return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getBg = (type: string) => {
    switch(type) {
      case 'booking': return 'bg-blue-100 ring-blue-50';
      case 'payment': return 'bg-emerald-100 ring-emerald-50';
      case 'expense': return 'bg-rose-100 ring-rose-50';
      default: return 'bg-slate-100 ring-slate-50';
    }
  };

  return (
    <AppCard 
      title="Recent Activity" 
      isLoading={isLoading} 
      isEmpty={activities.length === 0}
      noPadding
    >
      <div className="p-5">
        <div className="relative border-l border-muted-foreground/20 ml-3 space-y-6 pb-2">
          {activities.map((act, i) => (
            <div key={i} className="relative pl-6">
              
              {/* Timeline dot */}
              <div className={`absolute -left-[13px] top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ${getBg(act.type)}`}>
                {getIcon(act.type)}
              </div>

              {/* Content */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">{act.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{act.description}</div>
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">
                  {format(new Date(act.time), 'hh:mm a')}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </AppCard>
  );
}
