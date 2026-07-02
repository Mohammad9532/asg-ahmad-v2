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

export default function CashBookReport() {
  const [searchParams] = useSearchParams();
  const page = searchParams.get('page') || '1';

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'cash-book', searchParams.toString()],
    queryFn: async () => {
      const params = Object.fromEntries(searchParams.entries());
      const res = await api.get('/reports/cash-book', { params });
      return res.data;
    },
  });

  const rawData = data?.data?.data || [];
  const openingBalance = Number(data?.opening_balance || 0);

  // Calculate Running Balance
  const tableData = useMemo(() => {
    let running = openingBalance;
    return rawData.map((row: any) => {
      // Assuming backend value exists (as per user instruction fallback)
      if (row.running_balance !== undefined) {
        running = Number(row.running_balance);
      } else {
        const credit = Number(row.credit || 0);
        const debit = Number(row.debit || 0);
        running += (credit - debit);
      }
      return { ...row, calculated_running_balance: running };
    });
  }, [rawData, openingBalance]);

  const closingBalance = tableData.length > 0 ? tableData[tableData.length - 1].calculated_running_balance : openingBalance;

  const columns = useMemo(() => [
    columnHelper.accessor('entry_date', {
      header: 'Date',
      cell: info => format(new Date(info.getValue()), 'MMM dd, yyyy')
    }),
    columnHelper.accessor('transaction_type', {
      header: 'Type'
    }),
    columnHelper.accessor('reference_id', {
      header: 'Ref / Bill No'
    }),
    columnHelper.accessor('description', {
      header: 'Description'
    }),
    columnHelper.accessor('debit', {
      header: 'Debit (-)',
      cell: info => <span className="text-red-600 font-medium">{Number(info.getValue() || 0).toFixed(2)}</span>
    }),
    columnHelper.accessor('credit', {
      header: 'Credit (+)',
      cell: info => <span className="text-green-600 font-medium">{Number(info.getValue() || 0).toFixed(2)}</span>
    }),
    columnHelper.accessor('calculated_running_balance', {
      header: 'Running Balance',
      cell: info => <span className="font-bold">{Number(info.getValue() || 0).toFixed(2)}</span>
    }),
  ], []);

  const metrics = [
    { label: 'Opening Balance', value: `د.إ ${openingBalance.toFixed(2)}` },
    { label: 'Closing Balance', value: `د.إ ${closingBalance.toFixed(2)}`, highlight: true },
    { label: 'Total Credits', value: `د.إ ${rawData.reduce((sum: number, row: any) => sum + Number(row.credit || 0), 0).toFixed(2)}` },
    { label: 'Total Debits', value: `د.إ ${rawData.reduce((sum: number, row: any) => sum + Number(row.debit || 0), 0).toFixed(2)}` },
  ];

  return (
    <ReportLayout 
      title="Cash Book Report" 
      description="Track detailed cash inflows, outflows, and running balances."
    >
      <SummaryCards metrics={metrics} />
      
      <FilterPanel filters={['date_range', 'shop', 'payment_method']} />

      <ReportTable 
        data={tableData} 
        columns={columns} 
        isLoading={isLoading} 
        virtualize={tableData.length > 500} 
      />
    </ReportLayout>
  );
}
