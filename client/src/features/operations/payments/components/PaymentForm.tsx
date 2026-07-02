import React, { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/config/api';

export function PaymentForm({ booking, onSuccess }: { booking: any; onSuccess: (payment: any, fullyPaid: boolean) => void }) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  
  const remainingBalance = booking ? Number(booking.booking_amount || 0) - Number(booking.total_paid || 0) : 0;

  const paymentSchema = z.object({
    payment_date: z.string().min(1, 'Required'),
    payment_method_id: z.string().min(1, 'Required'),
    amount: z.any().transform(v => Number(v)).refine(val => val > 0 && val <= remainingBalance, {
      message: `Amount must be > 0 and <= ${remainingBalance.toFixed(2)}`,
    }),
    remarks: z.string().optional(),
  });

  type PaymentFormValues = z.infer<typeof paymentSchema>;

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch, setFocus } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      payment_method_id: '1', // Default to Cash
      amount: undefined,
      remarks: '',
    }
  });

  const watchAmount = watch('amount');

  // Auto focus amount when booking changes
  useEffect(() => {
    if (booking) {
      setTimeout(() => setFocus('amount'), 50);
    }
  }, [booking, setFocus]);

  const mutation = useMutation({
    mutationFn: (data: PaymentFormValues) => {
      return api.post('/payments', {
        ...data,
        booking_id: booking.id,
        payment_date: data.payment_date,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['booking', booking.id] }); // specifically invalidate the active booking
      
      const savedAmount = Number(res.data.data.amount);
      const isFullyPaid = savedAmount >= remainingBalance;
      
      reset({
        payment_date: new Date().toISOString().split('T')[0],
        payment_method_id: '1',
        amount: 0,
        remarks: '',
      });
      
      onSuccess(res.data.data, isFullyPaid);
    }
  });

  const onSave = () => {
    if (!booking) return;
    handleSubmit((data) => {
      mutation.mutate(data as PaymentFormValues);
    })();
  };

  const onSaveAndNew = () => {
    if (!booking) return;
    handleSubmit((data) => {
      mutation.mutate(data as PaymentFormValues);
      // Wait, Save & New behavior might be controlled by parent since search is outside.
      // We will handle it in parent via onSuccess callback
    })();
  };

  useKeyboardNavigation(formRef, onSave, onSaveAndNew);

  if (!booking) return null;

  return (
    <form ref={formRef} className="bg-card p-6 rounded-lg border shadow-sm space-y-6" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className="text-sm font-medium mb-1 block">Payment Date</label>
          <Input type="date" {...register('payment_date')} />
          {errors.payment_date && <p className="text-destructive text-sm mt-1">{errors.payment_date.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Payment Method</label>
          <Select 
            {...register('payment_method_id')} 
            options={[
              { value: '1', label: 'Cash' },
              { value: '2', label: 'Card' },
              { value: '3', label: 'Bank Transfer' },
            ]} 
          />
          {errors.payment_method_id && <p className="text-destructive text-sm mt-1">{errors.payment_method_id.message}</p>}
        </div>

        <div className="lg:col-span-2">
          <label className="text-sm font-medium mb-1 block">Amount Received</label>
          <Input type="number" step="0.01" {...register('amount')} className="text-xl font-bold font-mono h-14" />
          {errors.amount && <p className="text-destructive text-sm mt-1">{errors.amount.message}</p>}
          
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setValue('amount', remainingBalance, { shouldValidate: true })}>
              Full Balance
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setValue('amount', 50, { shouldValidate: true })}>
              50
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setValue('amount', 100, { shouldValidate: true })}>
              100
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setValue('amount', 200, { shouldValidate: true })}>
              200
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setValue('amount', 500, { shouldValidate: true })}>
              500
            </Button>
          </div>
        </div>

        <div className="lg:col-span-4">
          <label className="text-sm font-medium mb-1 block">Remarks</label>
          <Input {...register('remarks')} placeholder="Optional notes..." />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t">
        <Button type="button" onClick={onSave} disabled={mutation.isPending || (watchAmount ?? 0) <= 0 || (watchAmount ?? 0) > remainingBalance}>
          Save (Ctrl+Enter)
        </Button>
      </div>
    </form>
  );
}
