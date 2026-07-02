import React, { useEffect } from 'react';
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

interface LedgerEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ledgerEntrySchema = z.object({
  source: z.string().min(1, 'Required'),
  type: z.string().min(1, 'Required'),
  amount: z.any().transform(v => Number(v)).refine(val => val > 0, 'Must be positive'),
  entry_date: z.string().min(1, 'Required'),
  shop_id: z.string().min(1, 'Required'),
  payment_method_id: z.string().min(1, 'Required'),
  remarks: z.string().min(1, 'Required'),
});

type LedgerEntryFormValues = z.infer<typeof ledgerEntrySchema>;

export function LedgerEntryModal({ isOpen, onClose }: LedgerEntryModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdminOrOwner = ['Super Admin', 'Owner'].includes(user?.role?.name || '');

  const { data: lookups } = useQuery({
    queryKey: ['lookups'],
    queryFn: async () => {
      const res = await api.get('/lookups');
      return res.data;
    },
    enabled: isOpen
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<LedgerEntryFormValues>({
    resolver: zodResolver(ledgerEntrySchema),
    defaultValues: {
      source: 'Opening Balance',
      type: 'CREDIT',
      amount: '' as any,
      entry_date: new Date().toISOString().split('T')[0],
      shop_id: user?.shop_id ? String(user.shop_id) : '',
      payment_method_id: '',
      remarks: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        source: 'Opening Balance',
        type: 'CREDIT',
        amount: '' as any,
        entry_date: new Date().toISOString().split('T')[0],
        shop_id: user?.shop_id ? String(user.shop_id) : '',
        payment_method_id: '',
        remarks: '',
      });
      
      if (lookups?.payment_methods) {
        const cashMethod = lookups.payment_methods.find((m: any) => m.name.toLowerCase() === 'cash');
        if (cashMethod) setValue('payment_method_id', String(cashMethod.id));
      }
    }
  }, [isOpen, reset, user?.shop_id, lookups, setValue]);

  const mutation = useMutation({
    mutationFn: (data: LedgerEntryFormValues) => api.post('/ledgers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'ledger'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'An error occurred while saving the entry.');
    }
  });

  const onSubmit = (data: LedgerEntryFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      <div className="flex items-center gap-2">
        <div className="text-indigo-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
        <span>Ledger Settings</span>
      </div>
    } maxWidth="max-w-md">
      <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl text-sm mb-6 leading-relaxed border border-indigo-100">
        {/* @ts-ignore */}
        Set the opening cash balance for <span className="font-bold">{user?.shop?.name || 'Naseem'}</span> as of a specific starting date. All subsequent daily balances will calculate forward from this amount.
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Hidden required fields for the backend payload */}
        <input type="hidden" {...register('source')} value="Opening Balance" />
        <input type="hidden" {...register('type')} value="CREDIT" />
        <input type="hidden" {...register('remarks')} value="Initial Opening Balance" />
        <input type="hidden" {...register('shop_id')} value={user?.shop_id ? String(user.shop_id) : ''} />
        
        <div>
          <label className="text-sm font-semibold mb-1.5 block text-slate-700">Initial Starting Cash Balance</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 sm:text-sm font-medium">AED</span>
            </div>
            <Input type="number" step="0.01" {...register('amount')} className="pl-12 font-mono h-11" placeholder="15921" />
          </div>
          {errors.amount && <p className="text-destructive text-sm mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="text-sm font-semibold mb-1.5 block text-slate-700">Start Date</label>
          <Input type="date" {...register('entry_date')} className="h-11 text-slate-600" />
          <p className="text-xs text-slate-500 mt-2">The balance above will be applied exactly on this physical date.</p>
          {errors.entry_date && <p className="text-destructive text-sm mt-1">{errors.entry_date.message}</p>}
        </div>

        {/* Hidden select to properly register payment_method_id since setValue is used in useEffect */}
        <div className="hidden">
          <Select 
            {...register('payment_method_id')} 
            options={lookups?.payment_methods?.map((m: any) => ({ value: String(m.id), label: m.name })) || []} 
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 px-6 font-medium">
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="h-10 px-6 bg-indigo-600 text-white hover:bg-indigo-700 font-medium"
            disabled={mutation.isPending}
          >
            Save Settings
          </Button>
        </div>
      </form>
    </Modal>
  );
}
