import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';

import { ReportLayout } from '../../reports/components/ReportLayout';
import { FilterPanel } from '../../reports/components/FilterPanel';
import { ReportTable } from '../../reports/components/ReportTable';
import api from '@/config/api';

const columnHelper = createColumnHelper<any>();

export default function ActivityLogsAdmin() {
  const [searchParams] = useSearchParams();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'activity-logs', searchParams.toString()],
    queryFn: async () => {
      const params = Object.fromEntries(searchParams.entries());
      const res = await api.get('/reports/activity-logs', { params });
      return res.data;
    },
  });

  const rawData = data?.data || [];

  const columns = [
    columnHelper.accessor('created_at', { 
      header: 'Date & Time',
      cell: i => <span className="whitespace-nowrap">{format(new Date(i.getValue()), 'MMM dd, yyyy HH:mm:ss')}</span>
    }),
    columnHelper.accessor('user.name', { header: 'User' }),
    columnHelper.accessor('module', { header: 'Module' }),
    columnHelper.accessor('action', { 
      header: 'Action',
      cell: i => <span className="font-semibold uppercase text-xs">{i.getValue()}</span>
    }),
    columnHelper.accessor('description', { header: 'Details', cell: i => <span className="text-sm">{i.getValue()}</span> }),
    columnHelper.accessor('ip_address', { header: 'IP Address', cell: i => <span className="font-mono text-xs text-muted-foreground">{i.getValue() || 'N/A'}</span> }),
  ];

  return (
    <ReportLayout 
      title="System Activity Logs" 
      description="Immutable audit trail of all system actions."
    >
      <FilterPanel filters={['date_range', 'user', 'module', 'action', 'shop']} />
      
      <ReportTable 
        data={rawData} 
        columns={columns} 
        isLoading={isLoading} 
        virtualize={rawData.length > 300} // Virtualize if large
      />
    </ReportLayout>
  );
}
