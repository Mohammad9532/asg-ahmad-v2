import React from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppCard } from '@/components/ui/AppCard';

interface ChartProps {
  isLoading?: boolean;
  data: any[];
}

export function MonthlyBookingChart({ isLoading, data }: ChartProps) {
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border shadow-lg rounded-lg p-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">{label}</p>
          <p className="text-sm font-black text-blue-600">
            AED {payload[0].value.toLocaleString('en-AE')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <AppCard title="Monthly Booking (This Year)" isLoading={isLoading} isEmpty={!data || data.length === 0}>
      <div className="h-[250px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }} barSize={24}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar 
              dataKey="amount" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AppCard>
  );
}
