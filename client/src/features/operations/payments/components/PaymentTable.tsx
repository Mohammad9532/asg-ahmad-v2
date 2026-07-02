import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import api from '@/config/api';
import { Button } from '@/components/ui/Button';

interface PaymentTableProps {
  bookingId?: number;
  isCompact?: boolean;
  onEdit?: (id: number) => void;
  search?: string;
  method?: string;
  date?: string;
}

export function PaymentTable({ bookingId, isCompact = false, onEdit, search = '', method = 'all', date = '' }: PaymentTableProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['payments', bookingId, isCompact ? 'recent' : 'all', search, method, date],
    queryFn: async () => {
      let url = `/payments?per_page=${isCompact ? 5 : 20}&sort=desc`;
      if (bookingId) url += `&booking_id=${bookingId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (method && method !== 'all') url += `&payment_method_id=${method}`;
      if (date) url += `&date=${date}`;
      
      const res = await api.get(url);
      return res.data;
    }
  });

  const columns = React.useMemo(
    () => {
      const baseCols = [
        {
          accessorKey: 'payment_date',
          header: 'Date',
        },
        {
          accessorKey: 'amount',
          header: 'Amount',
          cell: (info: any) => <span className="font-bold text-green-600">{Number(info.getValue()).toFixed(2)}</span>,
        },
        {
          accessorKey: 'payment_method.name',
          header: 'Method',
          cell: (info: any) => info.row.original.payment_method?.name || 'Cash',
        },
        {
          accessorKey: 'remarks',
          header: 'Remarks',
        },
        {
          accessorKey: 'created_by.name',
          header: 'Created By',
          cell: (info: any) => info.row.original.creator?.name || 'System',
        },
      ];

      if (!bookingId) {
        baseCols.unshift({
          accessorKey: 'booking.bill_no',
          header: 'Bill No',
          cell: (info: any) => info.row.original.booking?.bill_no,
        } as any);
      }

      baseCols.push({
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
      } as any);

      return baseCols;
    },
    [bookingId, onEdit]
  );

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <div className="h-48 bg-card border rounded-lg animate-pulse"></div>;
  }

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="overflow-auto max-h-[400px]">
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
                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No payments recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
