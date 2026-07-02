import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/config/api';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editId?: number | null;
}

export function PaymentModal({ isOpen, onClose, onSuccess, editId }: PaymentModalProps) {
  const queryClient = useQueryClient();
  const [billNoSearch, setBillNoSearch] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Fetch existing payment if editing
  const { data: existingPayment } = useQuery({
    queryKey: ['payment', editId],
    queryFn: async () => {
      const res = await api.get(`/payments/${editId}`);
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

  const paymentMethods = lookups?.payment_methods || [];

  const remainingBalance = booking ? Number(booking.booking_amount || 0) - Number(booking.total_paid || 0) : 0;
  // If editing, the user is modifying their previous payment amount, so max allowed is remaining + their current payment amount.
  // We'll keep validation simple: just allow it if editId is present and assume backend validates correctly,
  // or add the existing payment amount to the remaining balance.
  const maxAllowed = editId && existingPayment ? remainingBalance + Number(existingPayment.amount) : remainingBalance;

  const paymentSchema = z.object({
    payment_date: z.string().min(1, 'Required'),
    payment_method_id: z.string().min(1, 'Required'),
    amount: z.any().transform(v => Number(v)).refine(val => val > 0 && val <= maxAllowed, {
      message: `Must be > 0 and <= ${maxAllowed.toFixed(2)}`,
    }),
    remarks: z.string().optional(),
  });

  type PaymentFormValues = z.infer<typeof paymentSchema>;

  const { register, handleSubmit, formState: { errors }, setValue, getValues, reset, watch, setFocus } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      payment_method_id: '1',
      amount: '' as any,
      remarks: '',
    }
  });

  const watchAmount = watch('amount');
  const billNoInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill data when editing
  useEffect(() => {
    if (isOpen && existingPayment) {
      setBooking(existingPayment.booking);
      setBillNoSearch(existingPayment.booking?.bill_no || '');
      reset({
        payment_date: existingPayment.payment_date || new Date().toISOString().split('T')[0],
        payment_method_id: existingPayment.payment_method_id ? String(existingPayment.payment_method_id) : '1',
        amount: existingPayment.amount || ('' as any),
        remarks: existingPayment.remarks || '',
      });
    }
  }, [isOpen, existingPayment, reset]);

  // Set default cash method for NEW entries
  useEffect(() => {
    if (isOpen && !editId && paymentMethods.length > 0) {
      const currentMethod = getValues('payment_method_id');
      if (!currentMethod) {
        const cashMethod = paymentMethods.find((m: any) => m.name.toLowerCase() === 'cash');
        if (cashMethod) {
          setValue('payment_method_id', String(cashMethod.id));
        }
      }
    }
  }, [isOpen, paymentMethods, editId, setValue, getValues]);

  // Reset state when modal opens/closes completely (not triggered during edit mode loading)
  useEffect(() => {
    if (!isOpen) {
      setBillNoSearch('');
      setBooking(null);
      setSearchError('');
      reset({
        payment_date: new Date().toISOString().split('T')[0],
        payment_method_id: '1',
        amount: '' as any,
        remarks: '',
      });
    } else if (!editId) {
      // Focus Bill No when opened for NEW
      setTimeout(() => {
        billNoInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, editId, reset]);

  // Search for booking when billNoSearch changes (only if not editing)
  useEffect(() => {
    if (editId) return; // Don't search while editing

    const timer = setTimeout(async () => {
      if (billNoSearch.trim().length >= 1) {
        setIsSearching(true);
        setSearchError('');
        try {
          const res = await api.get(`/bookings?search=${billNoSearch}&per_page=1`);
          if (res.data.data && res.data.data.length > 0) {
            setBooking(res.data.data[0]);
          } else {
            setBooking(null);
            setSearchError('Booking not found');
          }
        } catch (err) {
          setBooking(null);
          setSearchError('Error finding booking');
        } finally {
          setIsSearching(false);
        }
      } else {
        setBooking(null);
        setSearchError('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [billNoSearch, editId]);

  const mutation = useMutation({
    mutationFn: (data: PaymentFormValues) => {
      if (editId) {
        return api.put(`/payments/${editId}`, {
          ...data,
          payment_date: data.payment_date,
        });
      }
      return api.post('/payments', {
        ...data,
        booking_id: booking.id,
        payment_date: data.payment_date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      if (onSuccess) onSuccess();
      
      if (editId) {
        onClose(); // Close modal if editing
      } else {
        const currentPaymentMethod = getValues('payment_method_id');
        
        // Do not close! Just reset for the next entry
        setBillNoSearch('');
        setBooking(null);
        setSearchError('');
        reset({
          payment_date: new Date().toISOString().split('T')[0],
          payment_method_id: currentPaymentMethod,
          amount: '' as any,
          remarks: '',
        });
        
        // Auto focus back to Bill No
        setTimeout(() => {
          billNoInputRef.current?.focus();
        }, 50);
      }
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'An error occurred while saving.');
    }
  });

  const onSave = (data: PaymentFormValues) => {
    if (!booking && !editId) return;
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
        
        // Check if booking is selected first
        if (!booking && !editId) {
          billNoInputRef.current?.focus();
          foundEmpty = true;
        } else {
          const requiredKeys = ['payment_date', 'payment_method_id', 'amount'];
          for (const key of requiredKeys) {
            const val = values[key as keyof PaymentFormValues];
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

  const handleBillNoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (booking) {
        setFocus('amount');
      }
    }
  };

  const { ref: amountRef, ...amountRest } = register('amount');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editId ? "Edit Payment" : "Add Payment Entry"} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit(onSave)} onKeyDown={handleKeyDown} className="space-y-6">
        
        {/* Search Row */}
        <div>
          <label className="text-sm font-semibold mb-1 block">Bill No *</label>
          <div className="relative">
            <Input 
              ref={billNoInputRef}
              value={billNoSearch}
              onChange={(e) => setBillNoSearch(e.target.value)}
              onKeyDown={handleBillNoKeyDown}
              readOnly={!!editId}
              placeholder="Type Bill No... e.g. 33797"
              className={`font-mono ${!!editId ? 'bg-muted cursor-not-allowed' : ''}`}
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5 text-xs text-slate-400">Searching...</div>
            )}
          </div>
          {searchError && <p className="text-destructive text-sm mt-1">{searchError}</p>}
        </div>

        {/* Dynamic Booking Summary */}
        {booking && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded-lg border">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Amount</div>
              <div className="text-xl font-bold">AED {Number(booking.booking_amount || 0).toFixed(2)}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg border">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Prev Paid</div>
              <div className="text-xl font-bold">AED {Number(booking.total_paid || 0).toFixed(2)}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg border">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Customer</div>
              <div className="text-sm font-semibold truncate">{booking.customer_name}</div>
              <div className="text-xs text-muted-foreground truncate">{booking.mobile}</div>
            </div>
          </div>
        )}

        {/* Payment Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-1 block">Date *</label>
            <Input type="date" {...register('payment_date')} />
            {errors.payment_date && <p className="text-destructive text-sm mt-1">{errors.payment_date.message}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">Amount Type *</label>
            <Select 
              {...register('payment_method_id')} 
              options={[
                { value: '1', label: 'CASH' },
                { value: '2', label: 'CARD' },
                { value: '3', label: 'BANK TRANSFER' },
              ]} 
            />
            {errors.payment_method_id && <p className="text-destructive text-sm mt-1">{errors.payment_method_id.message}</p>}
          </div>

          <div className="col-span-2">
            <label className="text-sm font-semibold mb-1 block">Amount *</label>
            <Input 
              type="number" 
              step="0.01" 
              {...amountRest} 
              ref={amountRef}
              className="text-xl font-mono" 
              disabled={!booking && !editId}
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
            disabled={mutation.isPending || (!booking && !editId) || (watchAmount ?? 0) <= 0 || (watchAmount ?? 0) > maxAllowed}
          >
            Save Entry
          </Button>
        </div>
      </form>
    </Modal>
  );
}
