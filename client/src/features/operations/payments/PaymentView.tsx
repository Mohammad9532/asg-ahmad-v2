import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/config/api';
import { PaymentSummary } from './components/PaymentSummary';
import { PaymentTable } from './components/PaymentTable';

// Payment details view
export default function PaymentView() {
  const { id } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      const res = await api.get(`/payments/${id}`);
      return res.data;
    }
  });

  if (isLoading) return <div className="h-64 bg-muted/20 animate-pulse rounded-lg border p-6">Loading payment details...</div>;
  if (isError) return <div className="text-destructive p-6 bg-destructive/10 rounded-lg">Failed to load payment.</div>;

  const payment = data?.data;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Payment Details: #{payment?.id}</h1>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Date</div>
          <div className="font-bold text-lg">{payment?.payment_date}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Amount</div>
          <div className="font-bold text-lg text-green-600">{Number(payment?.amount).toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Method</div>
          <div className="font-bold text-lg">{payment?.payment_method?.name || 'Cash'}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Created By</div>
          <div className="font-bold text-lg">{payment?.creator?.name}</div>
        </div>
        <div className="lg:col-span-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Remarks</div>
          <div className="font-medium">{payment?.remarks || '-'}</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mt-8 mb-4">Associated Booking</h2>
      <PaymentSummary booking={payment?.booking} />

      <h2 className="text-lg font-semibold mt-8 mb-4">All Payments for this Booking</h2>
      {payment?.booking && <PaymentTable bookingId={payment.booking.id} />}
    </div>
  );
}
