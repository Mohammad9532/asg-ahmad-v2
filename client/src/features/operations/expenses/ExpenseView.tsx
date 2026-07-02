import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import api from '@/config/api';

export default function ExpenseView() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', id],
    queryFn: async () => {
      const res = await api.get(`/expenses/${id}`);
      return res.data.data;
    },
    enabled: !!id
  });

  if (isLoading) return <div>Loading expense details...</div>;
  if (!data) return <div>Expense not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/expenses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">View Expense #{data.id}</h1>
          <p className="text-muted-foreground">Read-only view of the expense record.</p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Shop</label>
            <div className="font-semibold">{data.shop?.name || '-'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Department</label>
            <div className="font-semibold">{data.department?.name || '-'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Category</label>
            <div className="font-semibold">{data.expense_category?.name || '-'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Payee (General/Master)</label>
            <div className="font-semibold">{data.expense_master?.name || '-'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Employee</label>
            <div className="font-semibold">{data.employee?.name || '-'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Payment Method</label>
            <div className="font-semibold">{data.payment_method?.name || '-'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Date</label>
            <div className="font-semibold">{data.expense_date}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Amount</label>
            <div className="font-bold text-red-600">AED {Number(data.amount).toFixed(2)}</div>
          </div>
          <div className="lg:col-span-3">
            <label className="text-sm font-medium text-muted-foreground block mb-1">Remarks</label>
            <div className="font-semibold">{data.remarks || '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
