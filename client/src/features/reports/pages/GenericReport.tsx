import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { ReportLayout } from '../components/ReportLayout';
import { FilterPanel } from '../components/FilterPanel';
import { ReportTable } from '../components/ReportTable';
import { SummaryCards } from '../components/SummaryCards';
import api from '@/config/api';

interface GenericReportProps {
  title: string;
  description: string;
  endpoint: string;
  queryKey: string;
  filters: string[];
  columns: any[];
  calculateMetrics?: (data: any[]) => any[];
}

export default function GenericReport({ 
  title, 
  description, 
  endpoint, 
  queryKey, 
  filters, 
  columns, 
  calculateMetrics 
}: GenericReportProps) {
  const [searchParams] = useSearchParams();

  const { data, isLoading } = useQuery({
    queryKey: ['reports', queryKey, searchParams.toString()],
    queryFn: async () => {
      const params = Object.fromEntries(searchParams.entries());
      const res = await api.get(endpoint, { params });
      return res.data;
    },
  });

  // Some endpoints return paginated data (data.data), others return array (data)
  const rawData = Array.isArray(data) ? data : (data?.data || []);
  const metrics = calculateMetrics ? calculateMetrics(rawData) : [];

  return (
    <ReportLayout title={title} description={description}>
      {metrics.length > 0 && <SummaryCards metrics={metrics} />}
      <FilterPanel filters={filters} />
      <ReportTable 
        data={rawData} 
        columns={columns} 
        isLoading={isLoading} 
        virtualize={rawData.length > 500} 
      />
    </ReportLayout>
  );
}
