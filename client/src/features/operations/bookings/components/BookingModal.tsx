import React, { useRef, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/config/api';

const bookingSchema = z.object({
  shop_id: z.any().transform(v => Number(v)),
  bill_no: z.string().min(1, 'Bill No is required'),
  booking_date: z.string().min(1, 'Date is required'),
  delivery_date: z.string().min(1, 'Delivery Date is required'),
  customer_name: z.string().min(1, 'Customer name is required'),
  country_code: z.string().min(1, 'Required'),
  mobile: z.string().min(1, 'Mobile is required'),
  pcs: z.any().transform(v => Number(v)),
  booking_amount: z.any().transform(v => Number(v)),
  advance_amount: z.any().transform(v => Number(v)),
  advance_payment_method_id: z.string().optional(),
  remarks: z.string().optional(),
  status: z.any().transform(v => Number(v)).optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: number | null;
  onSuccess?: () => void;
}

export function BookingModal({ isOpen, onClose, editId, onSuccess }: BookingModalProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [hasAdvance, setHasAdvance] = useState(false);

  const isSuperAdminOrOwner = ['Super Admin', 'Owner'].includes(user?.role?.name || '');

  // Fetch Lookups
  const { data: lookups } = useQuery({
    queryKey: ['lookups'],
    queryFn: async () => {
      const res = await api.get('/lookups');
      return res.data;
    },
    enabled: isOpen
  });

  const shops = lookups?.shops || [];
  const paymentMethods = lookups?.payment_methods || [];

  // Fetch existing booking if editId is present
  const { data: existingBooking } = useQuery({
    queryKey: ['booking', editId],
    queryFn: async () => {
      const res = await api.get(`/bookings/${editId}`);
      return res.data.data;
    },
    enabled: !!editId && isOpen,
  });

  const { register, handleSubmit, formState: { errors }, reset, getValues, setValue, setError, watch } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      shop_id: user?.shop_id || ('' as any),
      bill_no: '',
      booking_date: new Date().toISOString().split('T')[0],
      delivery_date: new Date().toISOString().split('T')[0],
      customer_name: '',
      country_code: '+971',
      mobile: '',
      pcs: '' as any,
      booking_amount: '' as any,
      advance_amount: '' as any,
      advance_payment_method_id: '',
      remarks: '',
      status: 0,
    }
  });

  const watchAdvanceAmount = watch('advance_amount');

  // Auto-generate Bill No when opening modal for NEW booking
  useEffect(() => {
    if (isOpen && !editId) {
      api.get('/bookings/next-number').then(res => {
        setValue('bill_no', res.data.next_bill_no);
      }).catch(() => {
        setValue('bill_no', 'BOK-AUTO');
      });
    }
  }, [isOpen, editId, setValue]);

  // Pre-fill data when editing
  useEffect(() => {
    if (isOpen && existingBooking) {
      const isAdvance = Number(existingBooking.advance_amount || existingBooking.expected_advance || 0) > 0;
      setHasAdvance(isAdvance);

      reset({
        shop_id: existingBooking.shop_id || user?.shop_id || ('' as any),
        bill_no: existingBooking.bill_no || '',
        booking_date: existingBooking.booking_date || new Date().toISOString().split('T')[0],
        delivery_date: existingBooking.delivery_date || new Date().toISOString().split('T')[0],
        customer_name: existingBooking.customer_name || '',
        country_code: existingBooking.country_code || '+971',
        mobile: existingBooking.mobile || existingBooking.mobile_number || '',
        pcs: existingBooking.pcs || ('' as any),
        booking_amount: existingBooking.booking_amount || existingBooking.amount || 0,
        advance_amount: existingBooking.advance_amount || existingBooking.expected_advance || ('' as any),
        advance_payment_method_id: existingBooking.advance_payment_method_id ? String(existingBooking.advance_payment_method_id) : '',
        remarks: existingBooking.remarks || '',
        status: existingBooking.status ?? 0,
      });
    }
  }, [isOpen, existingBooking, reset, user?.shop_id]);

  // Set default cash method for advance
  useEffect(() => {
    if (isOpen && !editId && paymentMethods.length > 0) {
      const currentMethod = getValues('advance_payment_method_id');
      if (!currentMethod) {
        const cashMethod = paymentMethods.find((m: any) => m.name.toLowerCase() === 'cash');
        if (cashMethod) {
          setValue('advance_payment_method_id', String(cashMethod.id));
        }
      }
    }
  }, [isOpen, paymentMethods, editId, setValue, getValues]);

  // Reset form when modal closes completely
  useEffect(() => {
    if (!isOpen) {
      setHasAdvance(false);
      reset({
        shop_id: user?.shop_id || ('' as any),
        bill_no: '',
        booking_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0],
        customer_name: '',
        country_code: '+971',
        mobile: '',
        pcs: '' as any,
        booking_amount: '' as any,
        advance_amount: '' as any,
        advance_payment_method_id: '',
        remarks: '',
        status: 0,
      });
    } else {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, reset, user?.shop_id]);

  // Force advance method requirement if advance > 0
  useEffect(() => {
    if (hasAdvance && Number(watchAdvanceAmount) > 0 && !getValues('advance_payment_method_id')) {
      const cashMethod = paymentMethods.find((m: any) => m.name.toLowerCase() === 'cash');
      if (cashMethod) {
        setValue('advance_payment_method_id', String(cashMethod.id));
      }
    }
  }, [hasAdvance, watchAdvanceAmount, getValues, setValue, paymentMethods]);

  const mutation = useMutation({
    mutationFn: (data: BookingFormValues) => {
      if (editId) {
        return api.put(`/bookings/${editId}`, data);
      }
      return api.post('/bookings', data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      if (onSuccess) onSuccess();

      if (editId) {
        // If editing, just close the modal
        onClose();
      } else {
        // CONTINUOUS ENTRY MODE (New Booking only)
        
        const currentMethod = getValues('advance_payment_method_id');
        let nextBillNo = 'BOK-AUTO';
        try {
          const res = await api.get('/bookings/next-number');
          nextBillNo = res.data.next_bill_no;
        } catch (e) { }

        setHasAdvance(false);
        reset({
          ...getValues(),
          bill_no: nextBillNo,
          delivery_date: new Date().toISOString().split('T')[0],
          customer_name: '',
          mobile: '',
          pcs: '' as any,
          booking_amount: '' as any,
          advance_amount: '' as any,
          advance_payment_method_id: currentMethod,
        });
        
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 50);
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
    if (!hasAdvance) {
      sanitized.advance_amount = 0;
      sanitized.advance_payment_method_id = undefined;
    } else if (sanitized.advance_payment_method_id === '') {
      sanitized.advance_payment_method_id = undefined;
    }
    return sanitized;
  };

  const onSubmit = (data: any) => {
    mutation.mutate(prepareData(data));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey) {
        e.preventDefault();
        handleSubmit(onSubmit)();
      } else {
        if ((e.target as HTMLElement).tagName === 'TEXTAREA') {
          return; // Let them type newlines in remarks
        }
        e.preventDefault();
        
        const values = getValues();
        const requiredKeys = ['customer_name', 'mobile', 'booking_date', 'delivery_date', 'pcs', 'booking_amount'];
        if (hasAdvance) {
          requiredKeys.push('advance_amount', 'advance_payment_method_id');
        }
        
        let foundEmpty = false;
        for (const key of requiredKeys) {
          const val = values[key as keyof BookingFormValues];
          if (val === '' || val === null || val === undefined || Number.isNaN(val)) {
            const el = document.querySelector(`[name="${key}"]`) as HTMLElement;
            if (el) {
              el.focus();
              foundEmpty = true;
              break;
            }
          }
        }
        
        if (!foundEmpty) {
          handleSubmit(onSubmit)();
        }
      }
    }
  };

  const { ref: nameRef, ...nameRest } = register('customer_name');
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editId ? "Edit Booking" : "Add Booking Entry"} maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-5">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Row 1: Shop & Bill No */}
          {isSuperAdminOrOwner ? (
            <div>
              <label className="text-sm font-semibold mb-1 block">Shop</label>
              <Select 
                {...register('shop_id')} 
                options={shops.map((s: any) => ({ value: s.id, label: s.name }))} 
              />
              {errors.shop_id && <p className="text-destructive text-sm mt-1">{errors.shop_id.message as string}</p>}
            </div>
          ) : (
            <div className="hidden">
              <input type="hidden" {...register('shop_id')} />
            </div>
          )}

          <div className={!isSuperAdminOrOwner ? "sm:col-span-2" : ""}>
            <label className="text-sm font-semibold mb-1 block">Bill No *</label>
            <Input 
              {...register('bill_no')} 
              readOnly={!isSuperAdminOrOwner}
              className={`font-mono ${!isSuperAdminOrOwner ? 'bg-muted cursor-not-allowed' : ''}`}
            />
            {errors.bill_no && <p className="text-destructive text-sm mt-1">{errors.bill_no.message as string}</p>}
          </div>

          {/* Row 2: Customer Name & Phone */}
          <div>
            <label className="text-sm font-semibold mb-1 block">Name *</label>
            <Input 
              {...nameRest}
              ref={(e) => {
                nameRef(e);
                (nameInputRef as any).current = e;
              }}
            />
            {errors.customer_name && <p className="text-destructive text-sm mt-1">{errors.customer_name.message as string}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">Phone *</label>
            <div className="flex gap-2">
              <div className="w-1/3">
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
                <Input {...register('mobile')} />
              </div>
            </div>
            {errors.mobile && <p className="text-destructive text-sm mt-1">{errors.mobile.message as string}</p>}
          </div>

          {/* Row 3: Date, Delivery Date & Qty */}
          <div>
            <label className="text-sm font-semibold mb-1 block">Date *</label>
            <Input type="date" {...register('booking_date')} />
            {errors.booking_date && <p className="text-destructive text-sm mt-1">{errors.booking_date.message as string}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">Delivery Date *</label>
            <Input type="date" {...register('delivery_date')} />
            {errors.delivery_date && <p className="text-destructive text-sm mt-1">{errors.delivery_date.message as string}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">Qty *</label>
            <Input type="number" {...register('pcs')} />
          </div>

          {/* Row 4: Amount & Status */}
          <div>
            <label className="text-sm font-semibold mb-1 block">Amount *</label>
            <Input type="number" step="0.01" {...register('booking_amount')} />
            {errors.booking_amount && <p className="text-destructive text-sm mt-1">{errors.booking_amount.message as string}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">Status</label>
            <Select 
              {...register('status')} 
              disabled={!editId}
              className={!editId ? "bg-muted cursor-not-allowed" : ""}
              options={[
                { value: '0', label: 'STOCK' },
                { value: '1', label: 'PARTIALLY PAID' },
                { value: '2', label: 'FULLY PAID' },
                { value: '3', label: 'DELIVERED' },
                { value: '4', label: 'CANCELLED' }
              ]} 
            />
          </div>

        </div>

        {/* Row 5: Advance Toggle */}
        <div className="pt-2 border-t">
          <label className="flex items-center gap-2 cursor-pointer w-max mb-4">
            <input 
              type="checkbox" 
              checked={hasAdvance}
              onChange={(e) => setHasAdvance(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary"
            />
            <span className="text-sm font-semibold">Advance Payment</span>
          </label>

          {hasAdvance && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="text-sm font-semibold mb-1 block">Advance Amount *</label>
                <Input type="number" step="0.01" {...register('advance_amount')} />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Payment Method *</label>
                <Select 
                  {...register('advance_payment_method_id')} 
                  options={paymentMethods.map((m: any) => ({ value: String(m.id), label: m.name }))} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Row 6: Remarks */}
        <div>
          <label className="text-sm font-semibold mb-1 block">Remarks</label>
          <Input {...register('remarks')} placeholder="Optional notes" />
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={mutation.isPending || (!isSuperAdminOrOwner && !user?.shop_id)}
          >
            Save Entry (Ctrl+Enter)
          </Button>
        </div>

      </form>
    </Modal>
  );
}
