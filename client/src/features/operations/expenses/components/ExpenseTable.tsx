import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ExpenseTableProps {
  expenses: any[];
  isLoading?: boolean;
  onEdit?: (id: number) => void;
}

export function ExpenseTable({ expenses, isLoading, onEdit }: ExpenseTableProps) {
  if (isLoading) return <div className="h-48 bg-card border rounded-lg animate-pulse"></div>;

  return (
    <div className="overflow-hidden rounded-md border">

      {/* ── Mobile Card View (< md) ── */}
      <div className="block md:hidden divide-y">
        {expenses?.map((expense) => (
          <div key={expense.id} className="p-3 hover:bg-muted/40 transition-colors">
            <div className="flex justify-between items-start gap-2 mb-1.5">
              <div>
                <span className="text-sm font-bold text-foreground">{expense.expense_category?.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</span>
              </div>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                AED {Number(expense.amount).toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mb-0.5">
              {expense.expense_master?.name && <span>{expense.expense_master.name}</span>}
              {expense.department?.name && <span className="ml-2 opacity-70">· {expense.department.name}</span>}
            </div>
            {expense.payment_method?.name && (
              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground mb-2">
                {expense.payment_method.name}
              </span>
            )}
            <div className="flex gap-2 mt-1">
              {onEdit && (
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-primary" onClick={(e) => {
                  e.preventDefault();
                  onEdit(expense.id);
                }}>
                  Edit
                </Button>
              )}
              <Link to={`/expenses/${expense.id}`}>
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
                  <Eye className="h-3 w-3 mr-1" /> View
                </Button>
              </Link>
            </div>
          </div>
        ))}
        {!expenses?.length && (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">No expenses found.</div>
        )}
      </div>

      {/* ── Desktop Table View (md+) ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground sticky top-0">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Master</th>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {expenses?.map((expense) => (
              <tr key={expense.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</td>
                <td className="px-4 py-3">{expense.department?.name}</td>
                <td className="px-4 py-3">{expense.expense_category?.name}</td>
                <td className="px-4 py-3 font-medium">{expense.expense_master?.name}</td>
                <td className="px-4 py-3">{expense.employee?.name || '-'}</td>
                <td className="px-4 py-3">{expense.payment_method?.name}</td>
                <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">
                  {Number(expense.amount).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    {onEdit && (
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-primary" onClick={(e) => {
                        e.preventDefault();
                        onEdit(expense.id);
                      }}>
                        Edit
                      </Button>
                    )}
                    <Link to={`/expenses/${expense.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!expenses?.length && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No expenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
