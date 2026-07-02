import React from 'react';
import { BookingStatusBadge } from '@/features/operations/bookings/components/BookingStatusBadge';

interface PaymentSummaryProps {
  booking: any;
}

export function PaymentSummary({ booking }: PaymentSummaryProps) {
  if (!booking) return null;

  const paid = Number(booking.total_paid || 0);
  const totalAmount = Number(booking.booking_amount || 0);
  const remaining = totalAmount - paid;

  return (
    <div className="bg-muted/50 p-6 rounded-lg border grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Bill No</div>
        <div className="font-bold text-lg">{booking.bill_no}</div>
      </div>
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Customer</div>
        <div className="font-medium truncate">{booking.customer_name}</div>
        <div className="text-sm text-muted-foreground truncate">{booking.mobile}</div>
      </div>
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Amount</div>
        <div className="font-bold text-lg">{totalAmount.toFixed(2)}</div>
      </div>
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Paid</div>
        <div className="font-bold text-lg text-green-600">{paid.toFixed(2)}</div>
      </div>
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Remaining</div>
        <div className="font-bold text-lg text-destructive">{remaining.toFixed(2)}</div>
      </div>
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</div>
        <BookingStatusBadge status={booking.status} />
      </div>
    </div>
  );
}
