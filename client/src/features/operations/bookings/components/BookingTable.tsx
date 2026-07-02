import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import api from '@/config/api';
import { BookingStatusBadge } from './BookingStatusBadge';
import { Button } from '@/components/ui/Button';

// Mocking link component for simplicity, in a real scenario use react-router-dom Link
import { Link } from 'react-router-dom';

interface BookingTableProps {
  isCompact?: boolean;
  onEdit?: (id: number) => void;
  search?: string;
  status?: string;
  date?: string;
}

export function BookingTable({ isCompact = false, onEdit, search = '', status = 'all', date = '' }: BookingTableProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', isCompact ? 'recent' : 'all', search, status, date],
    queryFn: async () => {
      let url = `/bookings?per_page=${isCompact ? 5 : 20}&sort=desc`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status && status !== 'all') url += `&status=${status}`;
      if (date) url += `&date=${date}`;
      
      const res = await api.get(url);
      return res.data;
    }
  });

  const columns = React.useMemo(
    () => [
      {
        accessorKey: 'bill_no',
        header: 'Bill No',
        cell: (info: any) => <span className="font-medium">{info.getValue()}</span>,
      },
      {
        accessorKey: 'booking_date',
        header: 'Date',
      },
      {
        accessorKey: 'customer_name',
        header: 'Customer',
      },
      {
        accessorKey: 'mobile',
        header: 'Mobile',
      },
      {
        accessorKey: 'pcs',
        header: 'PCS',
      },
      {
        accessorKey: 'booking_amount',
        header: 'Amount',
      },
      {
        accessorKey: 'advance_amount',
        header: 'Advance',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info: any) => <BookingStatusBadge status={info.getValue()} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info: any) => (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={() => onEdit && onEdit(info.row.original.id)}
            >
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [onEdit]
  );

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <div className="h-64 bg-card border rounded-lg animate-pulse"></div>;
  }

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="overflow-auto max-h-[600px]">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-muted text-muted-foreground uppercase text-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium whitespace-nowrap">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {!isCompact && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {data?.from || 0} to {data?.to || 0} of {data?.total || 0} entries
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
