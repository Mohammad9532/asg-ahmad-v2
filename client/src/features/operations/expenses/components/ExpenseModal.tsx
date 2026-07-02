import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/config/api';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: number | null;
}

export function ExpenseModal({ isOpen, onClose, editId }: ExpenseModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [payeeSearch, setPayeeSearch] = useState('');
  const payeeInputRef = useRef<HTMLInputElement>(null);
  
  const isGlobalUser = ['Super Admin', 'Owner'].includes(user?.role?.name || '');
  const defaultShopId = user?.shop_id ? String(user.shop_id) : '';

  // Fetch existing expense if editing
  const { data: existingExpense } = useQuery({
    queryKey: ['expense', editId],
    queryFn: async () => {
      const res = await api.get(`/expenses/${editId}`);
      return res.data.data;
    },
    enabled: !!editId && isOpen,
  });

  // Fetch Lookups
  const { data: lookups } = useQuery({
    queryKey: ['lookups'],
    queryFn: async () => {
      const res = await api.get('/lookups');
      return res.data;
    },
    enabled: isOpen
  });

  const expenseSchema = z.object({
    shop_id: z.string().min(1, 'Required'),
    department_id: z.string().min(1, 'Required'),
    expense_category_id: z.string().min(1, 'Required'),
    expense_master_id: z.string().optional().nullable(),
    employee_id: z.string().optional().nullable(),
    payment_method_id: z.string().min(1, 'Required'),
    expense_date: z.string().min(1, 'Required'),
    amount: z.any().transform(v => Number(v)).refine(val => val > 0, 'Must be positive'),
    remarks: z.string().optional(),
  }).refine(data => data.expense_master_id || data.employee_id, {
    message: "A valid Payee must be selected",
    path: ["expense_master_id"]
  });

  type ExpenseFormValues = z.infer<typeof expenseSchema>;

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch, setFocus, getValues } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      shop_id: defaultShopId,
      department_id: '',
      expense_category_id: '',
      expense_master_id: '',
      employee_id: '',
      payment_method_id: '1',
      expense_date: new Date().toISOString().split('T')[0],
      amount: '' as any,
      remarks: '',
    }
  });

  const selectedShopId = watch('shop_id');
  
  // Build Unified Payee List
  const unifiedPayees = useMemo(() => {
    if (!lookups) return [];
    
    const employees = lookups.employees
      ?.map((e: any) => ({
        type: 'employee',
        id: String(e.id),
        name: e.name,
        code: e.employee_code,
        department_id: e.department_id ? String(e.department_id) : null,
        category_id: e.expense_category_id ? String(e.expense_category_id) : null,
        label: `${e.employee_code} - ${e.name} (Employee)`
      })) || [];

    const masters = lookups.expense_masters?.map((m: any) => ({
        type: 'master',
        id: String(m.id),
        name: m.name,
        code: '',
        department_id: m.expense_category?.department_id ? String(m.expense_category.department_id) : null,
        category_id: m.expense_category_id ? String(m.expense_category_id) : null,
        label: `${m.name} (General)`
      })) || [];

    return [...employees, ...masters];
  }, [lookups, selectedShopId]);

  // Pre-fill data when editing
  useEffect(() => {
    if (isOpen && existingExpense) {
      reset({
        shop_id: existingExpense.shop_id ? String(existingExpense.shop_id) : defaultShopId,
        department_id: existingExpense.department_id ? String(existingExpense.department_id) : '',
        expense_category_id: existingExpense.expense_category_id ? String(existingExpense.expense_category_id) : '',
        expense_master_id: existingExpense.expense_master_id ? String(existingExpense.expense_master_id) : '',
        employee_id: existingExpense.employee_id ? String(existingExpense.employee_id) : '',
        payment_method_id: existingExpense.payment_method_id ? String(existingExpense.payment_method_id) : '1',
        expense_date: existingExpense.expense_date || new Date().toISOString().split('T')[0],
        amount: existingExpense.amount || ('' as any),
        remarks: existingExpense.remarks || '',
      });
      
      if (existingExpense.employee) {
        setPayeeSearch(`${existingExpense.employee.employee_code} - ${existingExpense.employee.name} (Employee)`);
      } else if (existingExpense.expense_master) {
        setPayeeSearch(`${existingExpense.expense_master.name} (General)`);
      }
    }
  }, [isOpen, existingExpense, reset, defaultShopId]);

  // Reset state when modal opens/closes completely
  useEffect(() => {
    if (!isOpen) {
      setPayeeSearch('');
      reset({
        shop_id: defaultShopId,
        department_id: '',
        expense_category_id: '',
        expense_master_id: '',
        employee_id: '',
        payment_method_id: '1',
        expense_date: new Date().toISOString().split('T')[0],
        amount: '' as any,
        remarks: '',
      });
    } else if (!editId) {
      // Set default cash method for NEW entries
      if (lookups?.payment_methods) {
        const cashMethod = lookups.payment_methods.find((m: any) => m.name.toLowerCase() === 'cash');
        if (cashMethod) setValue('payment_method_id', String(cashMethod.id));
      }
      setTimeout(() => payeeInputRef.current?.focus(), 100);
    }
  }, [isOpen, editId, reset, defaultShopId, lookups, setValue]);

  // Search autocomplete
  const [showPayeeDropdown, setShowPayeeDropdown] = useState(false);
  
  const filteredPayees = useMemo(() => {
    if (!payeeSearch) return [];
    const searchLower = payeeSearch.toLowerCase();
    return unifiedPayees.filter(p => p.label.toLowerCase().includes(searchLower)).slice(0, 5); // top 5
  }, [payeeSearch, unifiedPayees]);

  const handleSelectPayee = (payee: any) => {
    setPayeeSearch(payee.label);
    setShowPayeeDropdown(false);
    
    // Auto-fill Dept & Cat
    if (payee.department_id) setValue('department_id', payee.department_id);
    if (payee.category_id) setValue('expense_category_id', payee.category_id);
    
    // Set exact target ID
    if (payee.type === 'employee') {
      setValue('employee_id', payee.id);
      setValue('expense_master_id', '');
    } else {
      setValue('expense_master_id', payee.id);
      setValue('employee_id', '');
    }
    
    // Focus Amount
    setTimeout(() => setFocus('amount'), 50);
  };

  const mutation = useMutation({
    mutationFn: (data: ExpenseFormValues) => {
      if (editId) {
        return api.put(`/expenses/${editId}`, data);
      }
      return api.post('/expenses', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      if (editId) {
        onClose();
      } else {
        const currentMethod = getValues('payment_method_id');
        
        // Reset for Rapid Entry
        setPayeeSearch('');
        reset({
          ...getValues(),
          department_id: '',
          expense_category_id: '',
          expense_master_id: '',
          employee_id: '',
          payment_method_id: currentMethod,
          amount: '' as any,
          remarks: '',
        });
        
        setTimeout(() => payeeInputRef.current?.focus(), 50);
      }
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'An error occurred while saving.');
    }
  });

  const onSave = (data: ExpenseFormValues) => {
    mutation.mutate(data);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey) {
        e.preventDefault();
        handleSubmit(onSave)();
      } else {
        if ((e.target as HTMLElement).tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        
        const values = getValues();
        let foundEmpty = false;
        
        // Custom check for Payee
        if (!values.expense_master_id && !values.employee_id) {
          payeeInputRef.current?.focus();
          foundEmpty = true;
        } else {
          const requiredKeys = ['expense_date', 'payment_method_id', 'amount'];
          for (const key of requiredKeys) {
            const val = values[key as keyof ExpenseFormValues];
            if (val === '' || val === null || val === undefined || Number.isNaN(val)) {
              const el = document.querySelector(`[name="${key}"]`) as HTMLElement;
              if (el) {
                el.focus();
                foundEmpty = true;
                break;
              }
            }
          }
        }
        
        if (!foundEmpty) {
          handleSubmit(onSave)();
        }
      }
    }
  };

  const handlePayeeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPayees.length > 0) {
        handleSelectPayee(filteredPayees[0]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowPayeeDropdown(true);
    }
  };

  const { ref: amountRef, ...amountRest } = register('amount');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editId ? "Edit Expense" : "Rapid Expense Entry"} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit(onSave)} onKeyDown={handleKeyDown} className="space-y-6">
        
        {/* Search Row */}
        <div>
          <label className="text-sm font-semibold mb-1 block">Search Payee (Employee or General) *</label>
          <div className="relative">
            <Input 
              ref={payeeInputRef}
              value={payeeSearch}
              onChange={(e) => {
                setPayeeSearch(e.target.value);
                setShowPayeeDropdown(true);
              }}
              onFocus={() => setShowPayeeDropdown(true)}
              onBlur={() => setTimeout(() => setShowPayeeDropdown(false), 200)}
              onKeyDown={handlePayeeKeyDown}
              placeholder="Search by name or code..."
              className="text-lg"
              autoComplete="off"
            />
            {showPayeeDropdown && filteredPayees.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg overflow-hidden">
                {filteredPayees.map((payee) => (
                  <div
                    key={`${payee.type}-${payee.id}`}
                    className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                    onMouseDown={() => handleSelectPayee(payee)}
                  >
                    <span className="font-semibold">{payee.name}</span>
                    <span className="text-xs text-muted-foreground uppercase">{payee.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {errors.expense_master_id && <p className="text-destructive text-sm mt-1">{errors.expense_master_id.message}</p>}
        </div>

        {/* Read-Only Lookups */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-1 block">Department</label>
            <Select 
              {...register('department_id')} 
              disabled
              className="bg-muted"
              options={[{value: '', label: 'Auto-filled'}, ...(lookups?.departments?.map((d: any) => ({ value: String(d.id), label: d.name })) || [])]}
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Category</label>
            <Select 
              {...register('expense_category_id')} 
              disabled
              className="bg-muted"
              options={[{value: '', label: 'Auto-filled'}, ...(lookups?.expense_categories?.map((c: any) => ({ value: String(c.id), label: c.name })) || [])]}
            />
          </div>
        </div>

        {/* Payment Fields */}
        <div className="grid grid-cols-2 gap-4">
          {isGlobalUser && (
            <div>
              <label className="text-sm font-semibold mb-1 block">Shop</label>
              <Select 
                {...register('shop_id')} 
                options={lookups?.shops?.map((s: any) => ({ value: String(s.id), label: s.name })) || []} 
              />
            </div>
          )}
          
          <div className={!isGlobalUser ? "col-span-2" : ""}>
            <label className="text-sm font-semibold mb-1 block">Date *</label>
            <Input type="date" {...register('expense_date')} />
            {errors.expense_date && <p className="text-destructive text-sm mt-1">{errors.expense_date.message}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">Payment Method *</label>
            <Select 
              {...register('payment_method_id')} 
              options={lookups?.payment_methods?.map((m: any) => ({ value: String(m.id), label: m.name })) || []} 
            />
            {errors.payment_method_id && <p className="text-destructive text-sm mt-1">{errors.payment_method_id.message}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">Amount *</label>
            <Input 
              type="number" 
              step="0.01" 
              {...amountRest} 
              ref={amountRef}
              className="text-xl font-mono" 
            />
            {errors.amount && <p className="text-destructive text-sm mt-1">{errors.amount.message}</p>}
          </div>

          <div className="col-span-2">
            <label className="text-sm font-semibold mb-1 block">Remarks</label>
            <Input {...register('remarks')} placeholder="Optional notes" />
          </div>
        </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-bold"
            disabled={mutation.isPending}
          >
            Save Entry (Ctrl+Enter)
          </Button>
        </div>
      </form>
    </Modal>
  );
}
