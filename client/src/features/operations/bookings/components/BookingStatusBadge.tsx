import React from 'react';
import { Badge } from '@/components/ui/Badge';

export function BookingStatusBadge({ status }: { status: string | number }) {
  let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "stock" = "default";
  
  const statusMap: Record<number, string> = {
    0: 'Stock',
    1: 'Partially Paid',
    2: 'Fully Paid',
    3: 'Delivered',
    4: 'Cancelled'
  };

  const statusLabel = typeof status === 'number' ? (statusMap[status] || 'Unknown') : status;

  switch (statusLabel) {
    case 'Stock':
      variant = 'stock';
      break;
    case 'Partially Paid':
      variant = 'info';
      break;
    case 'Fully Paid':
      variant = 'success';
      break;
    case 'Delivered':
      variant = 'success';
      break;
    case 'Cancelled':
      variant = 'destructive';
      break;
  }

  return <Badge variant={variant}>{statusLabel}</Badge>;
}
