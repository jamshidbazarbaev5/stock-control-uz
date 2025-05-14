import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { type Store, useGetStores, useUpdateStore, useDeleteStore } from '../api/store';

const storeFields = [
  {
    name: 'name',
    label: 'Название магазина',
    type: 'text',
    placeholder: 'Введите название магазина',
    required: true,
  },
  {
    name: 'address',
    label: 'Адрес',
    type: 'text',
    placeholder: 'Введите адрес магазина',
    required: true,
  },
  {
    name: 'phone_number',
    label: 'Телефон',
    type: 'text',
    placeholder: 'Введите номер телефона',
    required: true,
  },
  {
    name: 'is_main',
    label: 'Main Store',
    type: 'select',
    placeholder: 'Is this a main store?',
    required: true,
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' },
    ],
  },
  {
    name: 'owner',
    label: 'Owner',
    type: 'text',
    placeholder: 'Owner ID',
    required: true,
  },
];

const columns = [
  {
    header: '№',
    accessorKey: 'displayId',
  },
  {
    header: 'Название',
    accessorKey: 'name',
  },
  {
    header: 'Адрес',
    accessorKey: 'address',
  },
  {
    header: 'Телефон',
    accessorKey: 'phone_number',
  },
  {
    header: 'Главный магазин',
    accessorKey: (row: Store) => (row.is_main ? 'Да' : 'Нет'),
  },
];

export default function StoresPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  const { data: storesData, isLoading } = useGetStores({
    params: {
      page: page,
      page_size: 10,
      ordering: '-created_at',
    },
  });

  // Handle both array and object response formats
  const results = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const totalCount = Array.isArray(storesData) ? storesData.length : storesData?.count || 0;

  const stores = results.map((store, index) => ({
    ...store,
    displayId: (page - 1) * 10 + index + 1,
  }));

  const { mutate: updateStore, isPending: isUpdating } = useUpdateStore();
  const { mutate: deleteStore } = useDeleteStore();

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<Store>) => {
    if (!editingStore?.id) return;

    const updatedData = {
      ...data,
      owner: typeof data.owner === 'string' ? parseInt(data.owner, 10) : data.owner,
    };

    updateStore(
      { ...updatedData, id: editingStore.id } as Store,
      {
        onSuccess: () => {
          toast.success('Store successfully updated');
          setIsFormOpen(false);
          setEditingStore(null);
        },
        onError: () => toast.error('Failed to update store'),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this store?')) {
      deleteStore(id, {
        onSuccess: () => toast.success('Store successfully deleted'),
        onError: () => toast.error('Failed to delete store'),
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <ResourceTable
        data={stores}
        columns={columns}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-store')}
        totalCount={totalCount}
        pageSize={10}
        currentPage={page}
        onPageChange={(newPage) => setPage(newPage)}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={storeFields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingStore || undefined}
            isSubmitting={isUpdating}
            title="Edit Store"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}