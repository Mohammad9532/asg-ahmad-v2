import React from 'react';
import GenericReport from './GenericReport';
import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';

const helper = createColumnHelper<any>();

export const PaymentReport = () => (
  <GenericReport
    title="Payment Report"
    description="Detailed view of all collected payments."
    endpoint="/reports/payments"
    queryKey="payments"
    filters={['date_range', 'shop', 'payment_method']}
    columns={[
      helper.accessor('payment_date', { header: 'Date', cell: i => format(new Date(i.getValue()), 'MMM dd, yyyy') }),
      helper.accessor('booking.bill_no', { header: 'Bill No' }),
      helper.accessor('amount', { header: 'Amount', cell: i => `د.إ ${Number(i.getValue()).toFixed(2)}` }),
      helper.accessor('payment_method.name', { header: 'Method' }),
      helper.accessor('remarks', { header: 'Remarks' })
    ]}
    calculateMetrics={data => [
      { label: 'Total Collections', value: `د.إ ${data.reduce((sum, r) => sum + Number(r.amount), 0).toFixed(2)}`, highlight: true },
      { label: 'Transactions', value: data.length }
    ]}
  />
);

export const ExpenseReport = () => (
  <GenericReport
    title="Expense Report"
    description="Detailed operational expenses."
    endpoint="/reports/expenses"
    queryKey="expenses"
    filters={['date_range', 'shop', 'department']}
    columns={[
      helper.accessor('expense_date', { header: 'Date', cell: i => format(new Date(i.getValue()), 'MMM dd, yyyy') }),
      helper.accessor('department.name', { header: 'Department' }),
      helper.accessor('expense_category.name', { header: 'Category' }),
      helper.accessor('expense_master.name', { header: 'Master' }),
      helper.accessor('amount', { header: 'Amount', cell: i => <span className="text-red-600">د.إ {Number(i.getValue()).toFixed(2)}</span> }),
    ]}
    calculateMetrics={data => [
      { label: 'Total Expenses', value: `د.إ ${data.reduce((sum, r) => sum + Number(r.amount), 0).toFixed(2)}`, highlight: true }
    ]}
  />
);

export const BookingReport = () => (
  <GenericReport
    title="Booking Report"
    description="Complete log of customer bookings."
    endpoint="/reports/bookings"
    queryKey="bookings"
    filters={['date_range', 'shop', 'search']}
    columns={[
      helper.accessor('booking_date', { header: 'Date', cell: i => format(new Date(i.getValue()), 'MMM dd, yyyy') }),
      helper.accessor('bill_no', { header: 'Bill No', cell: i => <span className="font-bold">{i.getValue()}</span> }),
      helper.accessor('customer_name', { header: 'Customer' }),
      helper.accessor('amount', { header: 'Total', cell: i => `د.إ ${Number(i.getValue()).toFixed(2)}` }),
      helper.accessor('status', { header: 'Status' })
    ]}
  />
);

export const ShopSummary = () => (
  <GenericReport
    title="Shop Summary"
    description="High-level metrics aggregated by shop."
    endpoint="/reports/shop-summary"
    queryKey="shop-summary"
    filters={[]}
    columns={[
      helper.accessor('shop_name', { header: 'Shop' }),
      helper.accessor('bookings_count', { header: 'Bookings' }),
      helper.accessor('collections', { header: 'Collections', cell: i => `د.إ ${Number(i.getValue()).toFixed(2)}` }),
      helper.accessor('expenses', { header: 'Expenses', cell: i => `د.إ ${Number(i.getValue()).toFixed(2)}` }),
      helper.accessor('outstanding', { header: 'Outstanding', cell: i => `د.إ ${Number(i.getValue()).toFixed(2)}` }),
    ]}
  />
);

export const MonthlySummary = () => (
  <GenericReport
    title="Monthly Collection"
    description="Revenue grouped by month."
    endpoint="/reports/monthly-collection"
    queryKey="monthly-collection"
    filters={['shop']}
    columns={[
      helper.accessor('month', { header: 'Month' }),
      helper.accessor('total_collection', { header: 'Total Collection', cell: i => `د.إ ${Number(i.getValue()).toFixed(2)}` }),
    ]}
  />
);

export const PaymentMethodSummary = () => (
  <GenericReport
    title="Payment Method Summary"
    description="Revenue breakdown by payment type."
    endpoint="/reports/payment-methods"
    queryKey="payment-methods"
    filters={['date_range', 'shop']}
    columns={[
      helper.accessor('name', { header: 'Method' }),
      helper.accessor('transaction_count', { header: 'Transactions' }),
      helper.accessor('total_amount', { header: 'Total Amount', cell: i => `د.إ ${Number(i.getValue()).toFixed(2)}` }),
    ]}
  />
);

export const ActivityLogReport = () => (
  <GenericReport
    title="Activity Logs"
    description="System-wide audit trail."
    endpoint="/reports/activity-logs"
    queryKey="activity-logs"
    filters={['date_range']}
    columns={[
      helper.accessor('created_at', { header: 'Time', cell: i => format(new Date(i.getValue()), 'MMM dd HH:mm') }),
      helper.accessor('user.name', { header: 'User' }),
      helper.accessor('module', { header: 'Module' }),
      helper.accessor('action', { header: 'Action', cell: i => <span className="font-semibold">{i.getValue()}</span> }),
      helper.accessor('description', { header: 'Details' })
    ]}
  />
);

export const NotificationReport = () => (
  <GenericReport
    title="Notifications"
    description="Historical alerts and messages."
    endpoint="/reports/notifications"
    queryKey="notifications"
    filters={['date_range']}
    columns={[
      helper.accessor('created_at', { header: 'Time', cell: i => format(new Date(i.getValue()), 'MMM dd HH:mm') }),
      helper.accessor('title', { header: 'Title' }),
      helper.accessor('message', { header: 'Message' }),
      helper.accessor('is_read', { header: 'Status', cell: i => i.getValue() ? 'Read' : 'Unread' })
    ]}
  />
);

export const UserActivityReport = () => (
  <GenericReport
    title="User Activity"
    description="Auth events and sessions."
    endpoint="/reports/user-activity"
    queryKey="user-activity"
    filters={['date_range']}
    columns={[
      helper.accessor('created_at', { header: 'Time', cell: i => format(new Date(i.getValue()), 'MMM dd HH:mm') }),
      helper.accessor('user.name', { header: 'User' }),
      helper.accessor('action', { header: 'Action' }),
      helper.accessor('ip_address', { header: 'IP' })
    ]}
  />
);
