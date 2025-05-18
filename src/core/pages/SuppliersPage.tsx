import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { type Supplier, useGetSuppliers, useUpdateSupplier, useDeleteSupplier } from '../api/supplier';
import { useTranslation } from 'react-i18next';

const supplierFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.supplier_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
  {
    name: 'phone_number',
    label: t('forms.phone'),
    type: 'text',
    placeholder: t('placeholders.enter_phone'),
    required: true,
  },
];

const columns = (t: any) => [
  {
    header: t('table.name'),
    accessorKey: 'name',
  },
  {
    header: t('table.phone'),
    accessorKey: 'phone_number',
  },
];

export default function SuppliersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Queries and Mutations
  const { data: suppliersData, isLoading } = useGetSuppliers({ params: { page } });
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  // Get suppliers array and total count
  const suppliers = Array.isArray(suppliersData) ? suppliersData : suppliersData?.results || [];
  const totalCount = Array.isArray(suppliersData) ? suppliers.length : suppliersData?.count || 0;

  // Handlers
  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Supplier) => {
    if (!editingSupplier?.id) return;

    updateSupplier.mutate(
      { ...data, id: editingSupplier.id },
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.suppliers') }));
          setIsFormOpen(false);
          setEditingSupplier(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.suppliers') }))
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteSupplier.mutate(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.suppliers') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.suppliers') })),
    });
  };

  return (
    <div className="container mx-auto py-6">
         <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.suppliers')}</h1>
        {/* <Button onClick={() => navigate('/create-recycling')}>
          {t('common.create')} {t('navigation.recyclings')}
        </Button> */}
      </div>
      <ResourceTable
        data={suppliers}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-supplier')}
        totalCount={totalCount}
        pageSize={10}
        currentPage={page}
        onPageChange={(newPage) => setPage(newPage)}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={supplierFields(t)}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingSupplier || undefined}
            isSubmitting={updateSupplier.isPending}
            title={t('common.edit') + ' ' + t('navigation.suppliers')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}