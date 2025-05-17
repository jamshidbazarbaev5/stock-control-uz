import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { type Store, useGetStores, useUpdateStore, useDeleteStore } from '../api/store';
import { useGetUsers } from '../api/user';

interface StoreFormData {
  id?: number;
  name: string;
  address: string;
  phone_number: string;
  is_main: boolean;
  parent_store: string;
  owner: string;
}

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
    label: 'Главный магазин',
    type: 'select',
    placeholder: 'Выберите тип магазина',
    required: true,
    options: [
      { value: true, label: 'Да' },
      { value: false, label: 'Нет' },
    ],
  },
  {
    name: 'parent_store',
    label: 'Родительский магазин',
    type: 'select',
    placeholder: 'Выберите родительский магазин',
    required: false,
    options: [], // Will be populated with stores
  },
  {
    name: 'owner',
    label: 'Владелец',
    type: 'select',
    placeholder: 'Выберите владельца',
    required: true,
    options: [], // Will be populated with users
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
  const [editingStore, setEditingStore] = useState<StoreFormData | null>(null);

  const { data: storesData, isLoading } = useGetStores({
    params: {
      page: page,
      page_size: 10,
      ordering: '-created_at',
    },
  });
  
  const { data: usersData } = useGetUsers({});
  // Get all stores for parent store dropdown
  const { data: allStoresData } = useGetStores({});

  // Handle both array and object response formats
  const results = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const totalCount = Array.isArray(storesData) ? storesData.length : storesData?.count || 0;

  const stores = results.map((store, index) => ({
    ...store,
    displayId: (page - 1) * 10 + index + 1,
  }));

  // Prepare options for select inputs
  const users = Array.isArray(usersData) ? usersData : usersData?.results || [];
  const allStores = Array.isArray(allStoresData) ? allStoresData : allStoresData?.results || [];

  // Update field options with dynamic data
  const fields = storeFields.map(field => {
    if (field.name === 'owner') {
      return {
        ...field,
        options: users.map(user => ({ value: String(user?.id ?? ''), label: user.name }))
      };
    }
    if (field.name === 'parent_store') {
      return {
        ...field,
        options: [
          { value: '0', label: 'Нет' }, // Use '0' instead of empty string
          ...allStores.map(store => ({ value: String(store?.id ?? ''), label: store.name }))
        ]
      };
    }
    return field;
  });

  const { mutate: updateStore, isPending: isUpdating } = useUpdateStore();
  const { mutate: deleteStore } = useDeleteStore();

  const handleEdit = (store: Store) => {
    const formattedStore: StoreFormData = {
      ...store,
      is_main: store.is_main,
      parent_store: store.parent_store?.toString() ?? '0', // Use '0' for no parent store
      owner: store.owner.toString()
    };
    setEditingStore(formattedStore);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: StoreFormData) => {
    if (!editingStore?.id) return;

    const formattedData = {
      ...data,
      id: editingStore.id,
      owner: parseInt(data.owner, 10),
      parent_store: data.parent_store === '0' ? null : parseInt(data.parent_store, 10),
      is_main: data.is_main === true || data.is_main.toString() === 'true'
    };

    updateStore(
      formattedData as Store,
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
          <DialogTitle className="text-xl font-bold mb-4">Редактировать магазин</DialogTitle>
          <DialogDescription className="mb-4">
            Измените информацию о магазине
          </DialogDescription>
          <ResourceForm
            fields={fields}
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