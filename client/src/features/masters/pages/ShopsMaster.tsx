import React, { useRef, useEffect } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';

import { MasterLayout } from '../components/MasterLayout';
import { StatusBadge } from '../components/StatusBadge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

const columnHelper = createColumnHelper<any>();

const ShopForm: React.FC<{
  initialData?: any;
  onSubmit: (data: any, action: 'save' | 'save_new') => void;
  isPending: boolean;
  onCancel: () => void;
}> = ({ initialData, onSubmit, isPending, onCancel }) => {
  const { register, handleSubmit, reset, setFocus } = useForm({
    defaultValues: initialData || { name: '', code: '', address: '', phone: '', email: '', is_active: '1' }
  });
  
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (initialData) {
      reset({ ...initialData, is_active: initialData.is_active ? '1' : '0' });
    } else {
      reset({ name: '', code: '', address: '', phone: '', email: '', is_active: '1' });
    }
    setTimeout(() => setFocus('name'), 100);
  }, [initialData, reset, setFocus]);

  const submitWrapper = (action: 'save' | 'save_new') => {
    handleSubmit((data) => {
      onSubmit({ ...data, is_active: data.is_active === '1' }, action);
    })();
  };

  useKeyboardNavigation(formRef, () => submitWrapper('save'), () => submitWrapper('save_new'));

  return (
    <form ref={formRef} onSubmit={(e) => { e.preventDefault(); submitWrapper('save'); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Shop Name <span className="text-red-500">*</span></label>
          <Input {...register('name', { required: true })} placeholder="Main Branch" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Code</label>
          <Input {...register('code')} placeholder="SHP-01" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">Address</label>
          <Input {...register('address')} placeholder="123 Main St" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Phone</label>
          <Input {...register('phone')} placeholder="+971 50 123 4567" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <Input type="email" {...register('email')} placeholder="shop@example.com" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Status</label>
          <Select {...register('is_active')} options={[{label: 'Active', value: '1'}, {label: 'Inactive', value: '0'}]} />
        </div>
      </div>
      
      <div className="flex gap-2 justify-end pt-4 border-t mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => submitWrapper('save_new')}>
          Save & New <span className="text-[10px] ml-1 opacity-50 text-foreground">(Ctrl+Shift+Enter)</span>
        </Button>
        <Button type="submit" disabled={isPending}>
          {initialData ? 'Update Shop' : 'Save Shop'} <span className="text-[10px] ml-1 opacity-50 text-white">(Ctrl+Enter)</span>
        </Button>
      </div>
    </form>
  );
};

export default function ShopsMaster() {
  const columns = [
    columnHelper.accessor('name', { header: 'Shop Name', cell: i => <span className="font-semibold">{i.getValue()}</span> }),
    columnHelper.accessor('code', { header: 'Code' }),
    columnHelper.accessor('phone', { header: 'Phone' }),
    columnHelper.accessor('email', { header: 'Email' }),
    columnHelper.accessor('is_active', { header: 'Status', cell: i => <StatusBadge isActive={i.getValue()} /> }),
  ];

  return (
    <MasterLayout 
      title="Shops Management"
      description="Manage all shop branches and locations."
      endpoint="/shops"
      queryKey="shops"
      columns={columns}
      FormComponent={ShopForm}
    />
  );
}
