import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { type Supplier, useGetSuppliers, useUpdateSupplier, useDeleteSupplier } from '../api/supplier';

const supplierFields = [
  {
    name: 'name',
    label: 'Supplier Name',
    type: 'text',
    placeholder: 'Enter supplier name',
    required: true,
  },
  {
    name: 'phone_number',
    label: 'Phone Number',
    type: 'text',
    placeholder: '+998 XX XXX XX XX',
    required: true,
  },
];

const columns = [
  {
    header: '№',
    accessorKey: 'id',
  },
  {
    header: 'Name',
    accessorKey: 'name',
  },
  {
    header: 'Phone Number',
    accessorKey: 'phone_number',
  },
];

export default function SuppliersPage() {
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
          toast.success('Supplier updated successfully');
          setIsFormOpen(false);
          setEditingSupplier(null);
        },
        onError: () => toast.error('Failed to update supplier'),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      deleteSupplier.mutate(id, {
        onSuccess: () => toast.success('Supplier deleted successfully'),
        onError: () => toast.error('Failed to delete supplier'),
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <ResourceTable
        data={suppliers}
        columns={columns}
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
            fields={supplierFields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingSupplier || undefined}
            isSubmitting={updateSupplier.isPending}
            title="Edit Supplier"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}