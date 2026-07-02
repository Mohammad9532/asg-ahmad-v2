import React, { useRef, useEffect, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';

import { MasterLayout } from '../../masters/components/MasterLayout';
import { StatusBadge } from '../../masters/components/StatusBadge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import api from '@/config/api';

const columnHelper = createColumnHelper<any>();

const UserForm: React.FC<{
  initialData?: any;
  onSubmit: (data: any, action: 'save' | 'save_new') => void;
  isPending: boolean;
  onCancel: () => void;
}> = ({ initialData, onSubmit, isPending, onCancel }) => {
  const { data: lookups } = useQuery({ queryKey: ['lookups'], queryFn: async () => (await api.get('/lookups')).data });
  const { data: rolesResp } = useQuery({ queryKey: ['roles'], queryFn: async () => (await api.get('/roles')).data });

  const [showPasswordFields, setShowPasswordFields] = useState(!initialData);

  const { register, handleSubmit, reset, setFocus, watch, setError, clearErrors, formState: { errors } } = useForm({
    defaultValues: initialData ? {
      name: initialData.name,
      email: initialData.email,
      mobile: initialData.mobile || '',
      shop_id: initialData.shop_id || '',
      role: initialData.roles?.[0]?.name || '',
      is_active: initialData.is_active ? '1' : '0',
      password: '',
      confirm_password: ''
    } : {
      name: '', email: '', mobile: '', shop_id: '', role: '', is_active: '1', password: '', confirm_password: ''
    }
  });

  const formRef = useRef<HTMLFormElement>(null);
  const password = watch('password');
  const confirmPassword = watch('confirm_password');

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        email: initialData.email,
        mobile: initialData.mobile || '',
        shop_id: initialData.shop_id || '',
        role: initialData.roles?.[0]?.name || '',
        is_active: initialData.is_active ? '1' : '0',
        password: '',
        confirm_password: ''
      });
      setShowPasswordFields(false);
    } else {
      reset({ name: '', email: '', mobile: '', shop_id: '', role: '', is_active: '1', password: '', confirm_password: '' });
      setShowPasswordFields(true);
    }
    setTimeout(() => setFocus('name'), 100);
  }, [initialData, reset, setFocus]);

  useEffect(() => {
    if (password && confirmPassword && password !== confirmPassword) {
      setError('confirm_password', { type: 'manual', message: 'Passwords do not match' });
    } else {
      clearErrors('confirm_password');
    }
  }, [password, confirmPassword, setError, clearErrors]);

  const submitWrapper = (action: 'save' | 'save_new') => {
    handleSubmit((data) => {
      if (showPasswordFields && (!data.password && !initialData)) {
        setError('password', { type: 'manual', message: 'Password is required' });
        return;
      }
      if (showPasswordFields && data.password !== data.confirm_password) {
        return; // Handled by useEffect error
      }

      onSubmit({ ...data, is_active: data.is_active === '1' }, action);
    })();
  };

  useKeyboardNavigation(formRef, () => submitWrapper('save'), () => submitWrapper('save_new'));

  const rolesList = rolesResp?.data || [];

  return (
    <form ref={formRef} onSubmit={(e) => { e.preventDefault(); submitWrapper('save'); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Full Name <span className="text-red-500">*</span></label>
          <Input {...register('name', { required: true })} placeholder="John Doe" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email <span className="text-red-500">*</span></label>
          <Input type="email" {...register('email', { required: true })} placeholder="john@example.com" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Mobile</label>
          <Input {...register('mobile')} placeholder="+971 50 123 4567" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Role <span className="text-red-500">*</span></label>
          <Select 
            {...register('role', { required: true })} 
            options={[{value: '', label: 'Select Role'}, ...rolesList.map((r:any) => ({value: r.name, label: r.name}))]}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Shop Assignment</label>
          <Select 
            {...register('shop_id')} 
            options={[{value: '', label: 'Global / All Shops'}, ...(lookups?.shops?.map((s:any) => ({value: String(s.id), label: s.name})) || [])]}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Status</label>
          <Select {...register('is_active')} options={[{label: 'Active', value: '1'}, {label: 'Inactive', value: '0'}]} />
        </div>
      </div>

      {initialData && !showPasswordFields && (
        <div className="pt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowPasswordFields(true)}>
            Change Password
          </Button>
        </div>
      )}

      {showPasswordFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 border rounded-lg bg-muted/20">
          <div>
            <label className="text-sm font-medium mb-1 block">
              {initialData ? 'New Password' : 'Password'} <span className="text-red-500">*</span>
            </label>
            <Input type="password" {...register('password')} placeholder="••••••••" />
            {errors.password && <span className="text-xs text-red-500">{String(errors.password.message)}</span>}
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Confirm Password <span className="text-red-500">*</span></label>
            <Input type="password" {...register('confirm_password')} placeholder="••••••••" />
            {errors.confirm_password && <span className="text-xs text-red-500">{String(errors.confirm_password.message)}</span>}
          </div>
        </div>
      )}
      
      <div className="flex gap-2 justify-end pt-4 border-t mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => submitWrapper('save_new')}>
          Save & New
        </Button>
        <Button type="submit" disabled={isPending}>
          {initialData ? 'Update User' : 'Save User'}
        </Button>
      </div>
    </form>
  );
};

export default function UsersAdmin() {
  const columns = [
    columnHelper.accessor('name', { header: 'Name', cell: i => <span className="font-semibold">{i.getValue()}</span> }),
    columnHelper.accessor('email', { header: 'Email' }),
    columnHelper.accessor('roles', { header: 'Role', cell: i => i.getValue()?.[0]?.name || 'N/A' }),
    columnHelper.accessor('shop.name', { header: 'Shop', cell: i => i.getValue() || 'Global' }),
    columnHelper.accessor('is_active', { header: 'Status', cell: i => <StatusBadge isActive={i.getValue()} /> }),
  ];

  return (
    <MasterLayout 
      title="User Management"
      description="Manage system access, roles, and shop assignments."
      endpoint="/users"
      queryKey="users"
      columns={columns}
      FormComponent={UserForm}
    />
  );
}
