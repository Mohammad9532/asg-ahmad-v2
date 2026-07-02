import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '@/config/api';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';

interface AdjustCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

const adjustCashSchema = z.object({
  short_cash: z.string().optional(),
  extra_cash: z.string().optional(),
}).refine(data => {
  const short = Number(data.short_cash || 0);
  const extra = Number(data.extra_cash || 0);
  return short > 0 || extra > 0;
}, {
  message: "You must enter an amount for either Short Cash or Extra Cash.",
  path: ["short_cash"]
}).refine(data => {
  const short = Number(data.short_cash || 0);
  const extra = Number(data.extra_cash || 0);
  return !(short > 0 && extra > 0);
}, {
  message: "You cannot enter both Short Cash and Extra Cash at the same time.",
  path: ["extra_cash"]
});

type AdjustCashFormValues = z.infer<typeof adjustCashSchema>;

export function AdjustCashModal({ isOpen, onClose, selectedDate }: AdjustCashModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: lookups } = useQuery({
    queryKey: ['lookups'],
    queryFn: async () => {
      const res = await api.get('/lookups');
      return res.data;
    },
    enabled: isOpen
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AdjustCashFormValues>({
    resolver: zodResolver(adjustCashSchema),
    defaultValues: {
      short_cash: '',
      extra_cash: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        short_cash: '',
        extra_cash: '',
      });
    }
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: async (data: AdjustCashFormValues) => {
      const short = Number(data.short_cash || 0);
      const extra = Number(data.extra_cash || 0);
      
      const isShort = short > 0;
      const amount = isShort ? short : extra;
      const type = isShort ? 'DEBIT' : 'CREDIT';
      const remarks = isShort ? 'Short Cash (Money Missing)' : 'Extra Cash (Money Found)';

      let cashMethodId = '';
      if (lookups?.payment_methods) {
        const cashMethod = lookups.payment_methods.find((m: any) => m.name.toLowerCase() === 'cash');
        if (cashMethod) cashMethodId = String(cashMethod.id);
      }

      const payload = {
        source: 'Adjustment',
        type: type,
        amount: amount,
        entry_date: format(selectedDate, 'yyyy-MM-dd'),
        shop_id: user?.shop_id ? String(user.shop_id) : '',
        payment_method_id: cashMethodId,
        remarks: remarks,
      };

      return api.post('/ledgers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'ledger'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'cash-book'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'An error occurred while saving the entry.');
    }
  });

  const onSubmit = (data: AdjustCashFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjust Cash Balance" maxWidth="max-w-sm">
      <div className="mb-4 text-slate-600 font-medium">
        Date: <span className="font-bold text-slate-900">{format(selectedDate, 'yyyy-MM-dd')}</span>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        <div>
          <label className="text-sm font-semibold mb-1 block">Short Cash (Money Missing)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 sm:text-sm">AED</span>
            </div>
            <Input type="number" step="0.01" {...register('short_cash')} className="pl-12" placeholder="0.00" />
          </div>
          {errors.short_cash && <p className="text-destructive text-sm mt-1">{errors.short_cash.message}</p>}
        </div>

        <div>
          <label className="text-sm font-semibold mb-1 block">Extra Cash (Money Found)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 sm:text-sm">AED</span>
            </div>
            <Input type="number" step="0.01" {...register('extra_cash')} className="pl-12" placeholder="0.00" />
          </div>
          {errors.extra_cash && <p className="text-destructive text-sm mt-1">{errors.extra_cash.message}</p>}
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={mutation.isPending}
          >
            Save Adjustments
          </Button>
        </div>
      </form>
    </Modal>
  );
}
