import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Eye, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/config/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { Select } from '@/components/ui/Select';

const columnHelper = createColumnHelper<any>();

export function DeliveryTracking() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [shopId, setShopId] = useState<string>(user?.shop_id ? String(user.shop_id) : '');

  const isGlobalUser = ['Super Admin', 'Owner'].includes(user?.role?.name || '');

  // Lookups for shops
  const { data: lookups } = useQuery({
    queryKey: ['lookups'],
    queryFn: async () => {
      const res = await api.get('/lookups');
      return res.data;
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'tracking', { page, shop_id: shopId }],
    queryFn: async () => {
      const res = await api.get('/bookings', {
        params: {
          pending_delivery: true,
          page,
          per_page: 25,
          shop_id: shopId || undefined,
        }
      });
      return res.data;
    }
  });

  const columns = [
    columnHelper.accessor('delivery_date', {
      header: 'Expected Delivery',
      cell: info => {
        const val = info.getValue();
        if (!val) return <span className="text-muted-foreground">-</span>;
        
        const date = new Date(val);
        const isPast = date < new Date(new Date().setHours(0,0,0,0));
        const isToday = val === new Date().toISOString().split('T')[0];
        
        return (
          <div className="flex items-center gap-2">
            <span className={`font-bold ${isPast ? 'text-destructive' : isToday ? 'text-orange-500' : ''}`}>
              {format(date, 'MMM dd, yyyy')}
            </span>
            {isPast && <Badge variant="destructive">OVERDUE</Badge>}
            {isToday && <Badge className="bg-orange-500 hover:bg-orange-600">TODAY</Badge>}
          </div>
        );
      }
    }),
    columnHelper.accessor('bill_no', {
      header: 'Bill No',
      cell: info => <span className="font-mono font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor('customer_name', {
      header: 'Customer',
      cell: info => (
        <div>
          <div className="font-medium">{info.getValue()}</div>
          <div className="text-xs text-muted-foreground">
            {info.row.original.country_code} {info.row.original.mobile}
          </div>
        </div>
      )
    }),
    columnHelper.accessor('pcs', {
      header: 'Qty',
      cell: info => <div className="text-center font-bold">{info.getValue()}</div>
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const val = info.getValue();
        if (val === 0) return <Badge variant="secondary">STOCK</Badge>;
        if (val === 1) return <Badge variant="outline" className="text-yellow-600 border-yellow-600">PARTIAL</Badge>;
        if (val === 2) return <Badge className="bg-green-600 hover:bg-green-700 text-white">FULLY PAID</Badge>;
        return <Badge variant="outline">{val}</Badge>;
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: info => (
        <div className="flex justify-end gap-2">
          <Link to={`/bookings/${info.row.original.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4 mr-1" /> View
            </Button>
          </Link>
        </div>
      )
    })
  ];

  if (isGlobalUser) {
    columns.splice(2, 0, columnHelper.accessor('shop.name', {
      header: 'Shop',
    }));
  }

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {isGlobalUser && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-sm font-semibold whitespace-nowrap">Filter by Shop:</label>
          <div className="w-full sm:w-64">
            <Select 
              value={shopId} 
              onChange={(e) => setShopId(e.target.value)}
              options={[{value: '', label: 'All Shops'}, ...(lookups?.shops?.map((s: any) => ({ value: String(s.id), label: s.name })) || [])]}
            />
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading deliveries...</div>
        ) : (
          <>
            {/* ── Mobile Card View (< md) ── */}
            <div className="block md:hidden divide-y">
              {data?.data?.length ? data.data.map((booking: any) => {
                const val = booking.delivery_date;
                const date = val ? new Date(val) : null;
                const isPast = date ? date < new Date(new Date().setHours(0,0,0,0)) : false;
                const isToday = val === new Date().toISOString().split('T')[0];

                return (
                  <div key={booking.id} className="p-3 hover:bg-muted/40 transition-colors">
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {date && (
                          <span className={`text-sm font-bold ${isPast ? 'text-destructive' : isToday ? 'text-orange-500' : 'text-foreground'}`}>
                            {format(date, 'MMM dd, yyyy')}
                          </span>
                        )}
                        {isPast && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">OVERDUE</Badge>}
                        {isToday && <Badge className="bg-orange-500 hover:bg-orange-600 text-[10px] px-1.5 py-0">TODAY</Badge>}
                      </div>
                      {booking.status === 0 && <Badge variant="secondary">STOCK</Badge>}
                      {booking.status === 1 && <Badge variant="outline" className="text-yellow-600 border-yellow-600">PARTIAL</Badge>}
                      {booking.status === 2 && <Badge className="bg-green-600 hover:bg-green-700 text-white">PAID</Badge>}
                    </div>
                    <div className="text-sm font-mono font-bold text-foreground mb-0.5">{booking.bill_no}</div>
                    <div className="text-sm font-medium text-foreground">{booking.customer_name}</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {booking.country_code} {booking.mobile} · {booking.pcs} pcs
                      {isGlobalUser && booking.shop?.name && ` · ${booking.shop.name}`}
                    </div>
                    <Link to={`/bookings/${booking.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        <ArrowRight className="h-3 w-3 mr-1" /> View
                      </Button>
                    </Link>
                  </div>
                );
              }) : (
                <div className="p-8 text-center text-muted-foreground text-sm">No pending deliveries found.</div>
              )}
            </div>

            {/* ── Desktop Table View (md+) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="px-4 py-3 font-medium">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-muted/50">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {data?.data?.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                        No pending deliveries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {data?.meta && data.meta.total > 0 && (
          <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {data.meta.from} to {data.meta.to} of {data.meta.total} pending deliveries
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                disabled={page === data.meta.last_page}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
