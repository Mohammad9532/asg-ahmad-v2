import React, { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/config/api';

const bookingSchema = z.object({
  shop_id: z.any().transform(v => Number(v)),
  bill_no: z.string().min(1, 'Bill No is required'),
  booking_date: z.string().min(1, 'Date is required'),
  customer_name: z.string().min(1, 'Customer name is required'),
  country_code: z.string().min(1, 'Required'),
  mobile: z.string().min(1, 'Mobile is required'),
  pcs: z.any().transform(v => Number(v)),
  booking_amount: z.any().transform(v => Number(v)),
  advance_amount: z.any().transform(v => Number(v)),
  advance_payment_method_id: z.string().optional(),
  remarks: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function BookingForm({ initialData = {} as any, defaultBillNo = '' }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);

  const isSuperAdminOrOwner = ['Super Admin', 'Owner'].includes(user?.role?.name || '');

  // Fetch Lookups
  const { data: lookups } = useQuery({
    queryKey: ['lookups'],
    queryFn: async () => {
      const res = await api.get('/lookups');
      return res.data;
    }
  });

  const shops = lookups?.shops || [];
  const paymentMethods = lookups?.payment_methods || [];

  const { register, handleSubmit, formState: { errors }, reset, getValues, setValue, setError } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      shop_id: initialData.shop_id || user?.shop_id || '',
      bill_no: initialData.bill_no || defaultBillNo,
      booking_date: initialData.booking_date || new Date().toISOString().split('T')[0],
      customer_name: initialData.customer_name || '',
      country_code: initialData.country_code || '+971',
      mobile: initialData.mobile || initialData.mobile_number || '',
      pcs: initialData.pcs || 1,
      booking_amount: initialData.booking_amount || initialData.amount || 0,
      advance_amount: initialData.advance_amount || initialData.expected_advance || 0,
      advance_payment_method_id: initialData.advance_payment_method_id || '',
      remarks: initialData.remarks || '',
    }
  });

  // Set default values once lookups load (for new bookings)
  useEffect(() => {
    if (!initialData.id && paymentMethods.length > 0) {
      const currentMethod = getValues('advance_payment_method_id');
      if (!currentMethod) {
        const cashMethod = paymentMethods.find((m: any) => m.name.toLowerCase() === 'cash');
        if (cashMethod) {
          setValue('advance_payment_method_id', String(cashMethod.id));
        }
      }
    }
  }, [paymentMethods, initialData.id, setValue, getValues]);

  // If user is super admin/owner but has no default shop_id, and shops load, optionally select the first shop
  useEffect(() => {
    if (!initialData.id && isSuperAdminOrOwner && !getValues('shop_id') && shops.length > 0) {
      setValue('shop_id', shops[0].id);
    }
  }, [shops, isSuperAdminOrOwner, initialData.id, setValue, getValues]);

  const mutation = useMutation({
    mutationFn: (data: BookingFormValues) => {
      if (initialData.id) {
        return api.put(`/bookings/${initialData.id}`, data);
      }
      return api.post('/bookings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      if (!initialData.id) {
        alert('Booking created successfully!');
      } else {
        alert('Booking updated successfully!');
      }
    },
    onError: (error: any) => {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        Object.keys(validationErrors).forEach((field) => {
          setError(field as keyof BookingFormValues, {
            type: 'manual',
            message: validationErrors[field][0],
          });
        });
        alert('Please fix the validation errors in the form.');
      } else {
        alert(error.response?.data?.message || 'An error occurred while saving the booking.');
      }
    }
  });

  const prepareData = (data: BookingFormValues) => {
    const sanitized: any = { ...data };
    if (!sanitized.shop_id || isNaN(sanitized.shop_id)) {
      sanitized.shop_id = undefined;
    }
    if (sanitized.advance_payment_method_id === '') {
      sanitized.advance_payment_method_id = undefined;
    }
    return sanitized;
  };

  const onSubmit = (data: BookingFormValues) => {
    mutation.mutate(prepareData(data));
  };

  const onSubmitAndNew = (data: BookingFormValues) => {
    mutation.mutate(prepareData(data), {
      onSuccess: async () => {
        const cashMethod = paymentMethods.find((m: any) => m.name.toLowerCase() === 'cash');
        
        let nextBillNo = 'BOK-AUTO';
        try {
          const res = await api.get('/bookings/next-number');
          nextBillNo = res.data.next_bill_no;
        } catch (e) {
          // fallback
        }

        reset({
          ...getValues(),
          bill_no: nextBillNo,
          customer_name: '',
          mobile: '',
          booking_amount: 0,
          advance_amount: 0,
          advance_payment_method_id: cashMethod ? String(cashMethod.id) : '',
        });
        const firstInput = formRef.current?.querySelector('input:not([disabled])') as HTMLInputElement;
        if (firstInput) firstInput.focus();
      }
    });
  };

  const onSave = () => handleSubmit(onSubmit)();
  const onSaveAndNew = () => handleSubmit(onSubmitAndNew)();

  useKeyboardNavigation(formRef, onSave, onSaveAndNew);

  return (
    <form ref={formRef} className="bg-card p-6 rounded-lg border shadow-sm space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div>
          <label className="text-sm font-medium mb-1 block">Shop</label>
          <Select 
            {...register('shop_id')} 
            disabled={!isSuperAdminOrOwner}
            options={shops.map((s: any) => ({ value: s.id, label: s.name }))} 
          />
          {errors.shop_id && <p className="text-destructive text-sm mt-1">{errors.shop_id.message as string}</p>}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Bill No</label>
          <Input 
            {...register('bill_no')} 
            readOnly={!isSuperAdminOrOwner}
            className={!isSuperAdminOrOwner ? 'bg-muted' : ''}
          />
          {errors.bill_no && <p className="text-destructive text-sm mt-1">{errors.bill_no.message as string}</p>}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Booking Date</label>
          <Input type="date" {...register('booking_date')} />
          {errors.booking_date && <p className="text-destructive text-sm mt-1">{errors.booking_date.message as string}</p>}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Customer Name</label>
          <Input 
            {...register('customer_name')} 
            autoFocus
          />
          {errors.customer_name && <p className="text-destructive text-sm mt-1">{errors.customer_name.message as string}</p>}
        </div>

        <div className="flex gap-2">
          <div className="w-1/3">
            <label className="text-sm font-medium mb-1 block">Code</label>
            <Select 
              {...register('country_code')} 
              options={[
                {value: '+971', label: 'UAE (+971)'}, 
                {value: '+968', label: 'OMN (+968)'},
                {value: '+966', label: 'KSA (+966)'}, 
                {value: '+91', label: 'IND (+91)'}
              ]}
            />
          </div>
          <div className="w-2/3">
            <label className="text-sm font-medium mb-1 block">Mobile</label>
            <Input {...register('mobile')} />
            {errors.mobile && <p className="text-destructive text-sm mt-1">{errors.mobile.message as string}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">PCS</label>
          <Input type="number" {...register('pcs')} />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Total Amount</label>
          <Input type="number" step="0.01" {...register('booking_amount')} />
          {errors.booking_amount && <p className="text-destructive text-sm mt-1">{errors.booking_amount.message as string}</p>}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Expected Advance</label>
          <Input type="number" step="0.01" {...register('advance_amount')} />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Advance Payment Method</label>
          <Select 
            {...register('advance_payment_method_id')} 
            options={paymentMethods.map((m: any) => ({ value: String(m.id), label: m.name }))} 
          />
        </div>

        <div className="lg:col-span-3">
          <label className="text-sm font-medium mb-1 block">Remarks</label>
          <Input {...register('remarks')} />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Status</label>
          <div className="h-12 flex items-center">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {initialData.id ? ['Stock', 'Partially Paid', 'Fully Paid', 'Delivered', 'Cancelled'][initialData.status] || 'Unknown' : 'Stock'}
            </span>
          </div>
        </div>

      </div>

      {!isSuperAdminOrOwner && !user?.shop_id && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
          Error: You are not assigned to a shop. You cannot create a booking.
        </div>
      )}

      <div className="flex items-center gap-4 pt-4 border-t">
        <Button type="submit" disabled={mutation.isPending || (!isSuperAdminOrOwner && !user?.shop_id)}>
          Save (Ctrl+Enter)
        </Button>
        
        {!initialData.id && (
          <Button type="button" variant="secondary" onClick={onSaveAndNew} disabled={mutation.isPending || (!isSuperAdminOrOwner && !user?.shop_id)}>
            Save & New (Ctrl+Shift+Enter)
          </Button>
        )}

        <Button type="button" variant="ghost" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
