import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  type Staff,
  useGetStaffs,
  useUpdateStaff,
  useDeleteStaff,
} from '../api/staff';
import { useGetStores } from '../api/store';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface StaffFormData {
  is_active: boolean;
  store: number;
}

export default function StaffPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const { t } = useTranslation();
    const navigate = useNavigate();
  // Fetch data
  const { data: staffData, isLoading } = useGetStaffs({});
  const { data: storesData } = useGetStores({});
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  // Transform data for the table
  const staffs = Array.isArray(staffData) ? staffData : staffData?.results || [];
  const totalCount = Array.isArray(staffData) ? staffData.length : staffData?.count || 0;

  // Get stores for the form
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const storeOptions = stores.map(store => ({
    value: store.id,
    label: store.name,
  }));

  const columns = [
    {
      header: t('forms.name'),
      accessorKey: 'user_read',
      cell: (staff: Staff) => staff.user_read?.name || '-',
    },
    {
      header: t('forms.phone_number'),
      accessorKey: 'user_read',
      cell: (staff: Staff) => staff.user_read?.phone_number || '-',
    },
    {
      header: t('forms.role'),
      accessorKey: 'user_read',
      cell: (staff: Staff) => staff.user_read?.role || '-',
    },
    {
      header: t('forms.store'),
      accessorKey: 'store_read',
      cell: (staff: Staff) => staff.store_read?.name || '-',
    },
    {
      header: t('forms.status'),
      accessorKey: 'is_active',
      cell: (staff: Staff) => (
        <span className={staff.is_active ? 'text-green-600' : 'text-red-600'}>
          {staff.is_active ? t('common.active') : t('common.inactive')}
        </span>
      ),
    },
    {
      header: t('forms.date_joined'),
      accessorKey: 'date_joined',
      cell: (staff: Staff) => new Date(staff.date_joined).toLocaleDateString(),
    },
  ];

  const staffFields = [
    {
      name: 'store',
      label: t('forms.store'),
      type: 'select',
      placeholder: t('placeholders.select_store'),
      required: true,
      options: storeOptions,
    },
    {
      name: 'is_active',
      label: t('forms.status'),
      type: 'select',
      placeholder: t('placeholders.select_status'),
      required: true,
      options: [
        { value: true, label: t('common.active') },
        { value: false, label: t('common.inactive') },
      ],
    },
  ];

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = async (data: StaffFormData) => {
    if (!editingStaff) return;

    try {
      await updateStaff.mutateAsync({
        ...editingStaff,
        ...data,
        store: typeof data.store === 'string' ? parseInt(data.store) : data.store,
      });
      toast.success(t('messages.success.updated', { item: t('navigation.staff') }));
      setIsFormOpen(false);
      setEditingStaff(null);
    } catch (error) {
      toast.error(t('messages.error.update', { item: t('navigation.staff') }));
      console.error('Failed to update staff:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteStaff.mutateAsync(id);
      toast.success(t('messages.success.deleted', { item: t('navigation.staff') }));
    } catch (error) {
      toast.error(t('messages.error.delete', { item: t('navigation.staff') }));
      console.error('Failed to delete staff:', error);
    }
  };

  return (
    <div className="container py-8 px-4">
         <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.staff')}</h1>
        <Button onClick={() => navigate('/create-staff')}>{t('common.create')} </Button>
      </div>
      <ResourceTable<Staff>
        data={staffs}
        columns={columns}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        totalCount={totalCount}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.edit') + ' ' + t('navigation.staff')}</DialogTitle>
          </DialogHeader>
          <ResourceForm
            fields={staffFields}
            onSubmit={handleUpdateSubmit}
            isSubmitting={updateStaff.isPending}
            defaultValues={editingStaff || {}}
            title=''
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
