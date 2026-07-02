import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { createColumnHelper } from '@tanstack/react-table';
import { Plus, Search, Store, Tags, Users, Receipt, Pencil, Trash } from 'lucide-react';
import { ReportTable } from '../../reports/components/ReportTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '../components/StatusBadge';
import api from '@/config/api';

const columnHelper = createColumnHelper<any>();

type TabType = 'departments' | 'categories' | 'employees' | 'expenses';

export default function ExpenseSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('departments');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Generic Fetching for tables
  const { data: listData, isLoading } = useQuery({
    queryKey: ['masters', activeTab],
    queryFn: async () => {
      let endpoint = '';
      if (activeTab === 'departments') endpoint = '/departments';
      if (activeTab === 'categories') endpoint = '/expense-categories';
      if (activeTab === 'employees') endpoint = '/employees';
      if (activeTab === 'expenses') endpoint = '/expense-masters';
      
      const res = await api.get(endpoint, { params: { per_page: 100 } });
      return res.data.data;
    }
  });

  const handleEdit = (id: number) => {
    setEditingId(id);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const tabs = [
    { id: 'departments', label: 'Departments', icon: Store, description: 'Manage top-level departments' },
    { id: 'categories', label: 'Categories', icon: Tags, description: 'Manage expense categories' },
    { id: 'employees', label: 'Employees', icon: Users, description: 'Manage staff and link to categories' },
    { id: 'expenses', label: 'General Expenses', icon: Receipt, description: 'Manage fixed expense types (Rent, Utilities)' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expense Settings</h1>
        <p className="text-muted-foreground">Manage your structural hierarchy for perfect expense tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`w-full flex flex-col items-start p-4 rounded-lg border text-left transition-colors ${activeTab === tab.id ? 'bg-primary/10 border-primary shadow-sm' : 'bg-card border-border hover:bg-muted'}`}
            >
              <div className="flex items-center gap-2 font-semibold mb-1">
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'}`} />
                {tab.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {tab.description}
              </div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 bg-card border rounded-lg shadow-sm">
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h2 className="text-lg font-semibold tracking-tight">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <Button onClick={handleAddNew} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
          
          <div className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading data...</div>
            ) : (
              <DataTable tab={activeTab} data={listData || []} onEdit={handleEdit} />
            )}
          </div>
        </div>

      </div>

      {/* Dynamic Modal */}
      {isModalOpen && (
        <MasterModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          tab={activeTab} 
          editId={editingId} 
        />
      )}
    </div>
  );
}

// Data Table Component
function DataTable({ tab, data, onEdit }: { tab: TabType, data: any[], onEdit: (id: number) => void }) {
  let columns: any[] = [];
  
  const actionCol = columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: (info) => (
      <Button variant="ghost" size="sm" onClick={() => onEdit(info.row.original.id)}>
        <Pencil className="w-4 h-4" />
      </Button>
    )
  });

  const statusCol = columnHelper.accessor('is_active', { 
    header: 'Status', 
    cell: i => <StatusBadge isActive={i.getValue()} /> 
  });

  if (tab === 'departments') {
    columns = [
      columnHelper.accessor('name', { header: 'Department Name', cell: i => <span className="font-semibold">{i.getValue()}</span> }),
      statusCol,
      actionCol
    ];
  } else if (tab === 'categories') {
    columns = [
      columnHelper.accessor('name', { header: 'Category Name', cell: i => <span className="font-semibold">{i.getValue()}</span> }),
      columnHelper.accessor('department.name', { header: 'Department' }),
      statusCol,
      actionCol
    ];
  } else if (tab === 'employees') {
    columns = [
      columnHelper.accessor('employee_code', { header: 'Code', cell: i => <span className="font-mono text-xs text-muted-foreground">{i.getValue()}</span> }),
      columnHelper.accessor('name', { header: 'Employee Name', cell: i => <span className="font-semibold">{i.getValue()}</span> }),
      columnHelper.accessor('department.name', { header: 'Department', cell: i => i.getValue() || '-' }),
      columnHelper.accessor('expense_category.name', { header: 'Category', cell: i => i.getValue() || '-' }),
      statusCol,
      actionCol
    ];
  } else if (tab === 'expenses') {
    columns = [
      columnHelper.accessor('name', { header: 'Expense Name', cell: i => <span className="font-semibold">{i.getValue()}</span> }),
      columnHelper.accessor('expense_category.name', { header: 'Category' }),
      columnHelper.accessor('expense_category.department.name', { header: 'Department', cell: i => i.getValue() || '-' }),
      statusCol,
      actionCol
    ];
  }

  return (
    <ReportTable 
      columns={columns}
      data={data}
      isLoading={false}
    />
  );
}

// Modal Form Component
function MasterModal({ isOpen, onClose, tab, editId }: { isOpen: boolean, onClose: () => void, tab: TabType, editId: number | null }) {
  const queryClient = useQueryClient();
  
  // Lookups
  const { data: lookups } = useQuery({ 
    queryKey: ['lookups'], 
    queryFn: async () => (await api.get('/lookups')).data 
  });

  let endpoint = '';
  if (tab === 'departments') endpoint = '/departments';
  if (tab === 'categories') endpoint = '/expense-categories';
  if (tab === 'employees') endpoint = '/employees';
  if (tab === 'expenses') endpoint = '/expense-masters';

  const { data: initialData, isLoading } = useQuery({
    queryKey: [tab, editId],
    queryFn: async () => {
      const res = await api.get(`${endpoint}/${editId}`);
      return res.data.data;
    },
    enabled: !!editId && isOpen,
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: { name: '', department_id: '', expense_category_id: '', shop_id: '', employee_code: '', mobile: '', is_active: '1' }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        department_id: initialData.department_id ? String(initialData.department_id) : '',
        expense_category_id: initialData.expense_category_id ? String(initialData.expense_category_id) : '',
        shop_id: initialData.shop_id ? String(initialData.shop_id) : '',
        is_active: initialData.is_active ? '1' : '0'
      });
    } else {
      reset({ name: '', department_id: '', expense_category_id: '', shop_id: '', employee_code: '', mobile: '', is_active: '1' });
    }
  }, [initialData, reset]);

  const selectedDeptId = watch('department_id');
  const filteredCategories = lookups?.expense_categories?.filter((c: any) => !selectedDeptId || String(c.department_id) === String(selectedDeptId)) || [];

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data, is_active: data.is_active === '1' };
      if (editId) return api.put(`${endpoint}/${editId}`, payload);
      return api.post(endpoint, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters', tab] });
      queryClient.invalidateQueries({ queryKey: ['lookups'] });
      onClose();
    }
  });

  const onSave = (data: any) => {
    mutation.mutate(data);
  };

  const title = editId ? `Edit ${tab.slice(0, -1)}` : `Create New ${tab.slice(0, -1)}`;

  if (isLoading) return <Modal isOpen={isOpen} onClose={onClose} title={title}><div>Loading...</div></Modal>;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title.replace(/\b\w/g, l => l.toUpperCase())} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit(onSave)} className="space-y-4">
        
        {/* Name Field (Shared by all) */}
        <div>
          <label className="text-sm font-medium mb-1 block">Name *</label>
          <Input {...register('name', { required: true })} autoFocus />
        </div>

        {/* Employee Specific */}
        {tab === 'employees' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Employee Code *</label>
              <Input {...register('employee_code', { required: true })} placeholder="EMP-001" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Mobile</label>
              <Input {...register('mobile')} />
            </div>
          </div>
        )}

        {/* Department Selection (Needed for Categories, Employees, Expenses) */}
        {['categories', 'employees', 'expenses'].includes(tab) && (
          <div>
            <label className="text-sm font-medium mb-1 block">Department *</label>
            <Select 
              {...register('department_id', { required: true })} 
              options={[{value: '', label: 'Select Department'}, ...(lookups?.departments?.map((d:any) => ({value: String(d.id), label: d.name})) || [])]}
            />
          </div>
        )}

        {/* Category Selection (Needed for Employees, Expenses) */}
        {['employees', 'expenses'].includes(tab) && (
          <div>
            <label className="text-sm font-medium mb-1 block">Expense Category *</label>
            <Select 
              {...register('expense_category_id', { required: true })} 
              options={[{value: '', label: 'Select Category'}, ...filteredCategories.map((c:any) => ({value: String(c.id), label: c.name}))]}
            />
          </div>
        )}

        {/* Status (Shared by all) */}
        <div>
          <label className="text-sm font-medium mb-1 block">Status</label>
          <Select 
            {...register('is_active')} 
            options={[{label: 'Active', value: '1'}, {label: 'Inactive', value: '0'}]} 
          />
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}
