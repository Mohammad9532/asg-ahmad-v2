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

  const rows = data?.data || [];

  return (
    <div className="rounded-md border bg-card overflow-hidden">

      {/* ── Mobile Card View (< md) ── */}
      <div className="block md:hidden divide-y divide-border">
        {rows.length ? rows.map((booking: any) => (
          <div key={booking.id} className="p-3 hover:bg-muted/40 transition-colors">
            <div className="flex justify-between items-start gap-2 mb-1.5">
              <div>
                <span className="font-mono font-bold text-sm text-foreground">{booking.bill_no}</span>
                <span className="ml-2 text-xs text-muted-foreground">{booking.booking_date}</span>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
            <div className="text-sm font-medium text-foreground mb-0.5">{booking.customer_name}</div>
            <div className="text-xs text-muted-foreground mb-2">{booking.mobile} · {booking.pcs} pcs</div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-foreground">AED {Number(booking.booking_amount || 0).toFixed(2)}</span>
                {booking.advance_amount > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">Adv: {Number(booking.advance_amount).toFixed(2)}</span>
                )}
              </div>
              {onEdit && (
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" onClick={() => onEdit(booking.id)}>
                  Edit
                </Button>
              )}
            </div>
          </div>
        )) : (
          <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">No results.</div>
        )}
      </div>

      {/* ── Desktop Table View (md+) ── */}
      <div className="hidden md:block overflow-auto max-h-[600px]">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-muted text-muted-foreground uppercase text-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium whitespace-nowrap">
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">No results.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isCompact && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-t gap-2">
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
