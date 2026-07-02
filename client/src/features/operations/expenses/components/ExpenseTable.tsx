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
  if (isLoading) return <div>Loading expenses...</div>;

  return (
    <div className="overflow-x-auto rounded-md border">
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
  );
}
