import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { createColumnHelper } from '@tanstack/react-table';

import { ReportLayout } from '../components/ReportLayout';
import { FilterPanel } from '../components/FilterPanel';
import { ReportTable } from '../components/ReportTable';
import { SummaryCards } from '../components/SummaryCards';
import api from '@/config/api';

const columnHelper = createColumnHelper<any>();

export default function OutstandingReport() {
  const [searchParams] = useSearchParams();
  const page = searchParams.get('page') || '1';

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'outstanding', searchParams.toString()],
    queryFn: async () => {
      const params = Object.fromEntries(searchParams.entries());
      const res = await api.get('/reports/outstanding', { params });
      return res.data;
    },
  });

  const rawData = data?.data || [];

  const columns = useMemo(() => [
    columnHelper.accessor('bill_no', {
      header: 'Bill No',
      cell: info => <span className="font-semibold">{info.getValue()}</span>
    }),
    columnHelper.accessor('customer_name', {
      header: 'Customer',
    }),
    columnHelper.accessor('mobile_number', {
      header: 'Mobile',
    }),
    columnHelper.accessor('booking_date', {
      header: 'Booking Date',
      cell: info => format(new Date(info.getValue()), 'MMM dd, yyyy')
    }),
    columnHelper.accessor('amount', {
      header: 'Total Amount',
      cell: info => Number(info.getValue() || 0).toFixed(2)
    }),
    columnHelper.accessor('remaining_balance', {
      header: 'Outstanding Balance',
      cell: info => <span className="font-bold text-red-600">د.إ {Number(info.getValue() || 0).toFixed(2)}</span>
    }),
    columnHelper.accessor('ageing_bracket', {
      header: 'Ageing',
      cell: info => {
        const val = info.getValue();
        let color = 'bg-gray-100 text-gray-800';
        if (val === '0-7') color = 'bg-green-100 text-green-800';
        if (val === '8-30') color = 'bg-yellow-100 text-yellow-800';
        if (val === '31-60') color = 'bg-orange-100 text-orange-800';
        if (val === '60+') color = 'bg-red-100 text-red-800';
        
        return (
          <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>
            {val} Days
          </span>
        );
      }
    }),
  ], []);

  const totalOutstanding = rawData.reduce((sum: number, row: any) => sum + Number(row.remaining_balance || 0), 0);
  const totalBookings = rawData.length;

  const metrics = [
    { label: 'Total Bookings', value: totalBookings },
    { label: 'Total Outstanding', value: `د.إ ${totalOutstanding.toFixed(2)}`, highlight: true },
    { label: 'Average Outstanding', value: `د.إ ${(totalBookings ? (totalOutstanding / totalBookings) : 0).toFixed(2)}` },
  ];

  return (
    <ReportLayout 
      title="Outstanding Report" 
      description="Monitor unpaid bookings and their ageing brackets."
    >
      <SummaryCards metrics={metrics} />
      <FilterPanel filters={['shop']} />
      <ReportTable 
        data={rawData} 
        columns={columns} 
        isLoading={isLoading} 
        virtualize={rawData.length > 500} 
      />
    </ReportLayout>
  );
}
