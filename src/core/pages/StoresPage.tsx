import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const storeFields = (t: (key: string) => string) => [
  {
    name: 'name',
    label: t('forms.store_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
  {
    name: 'address',
    label: t('forms.address'),
    type: 'text',
    placeholder: t('placeholders.enter_address'),
    required: true,
  },
  {
    name: 'phone_number',
    label: t('forms.phone'),
    type: 'text',
    placeholder: t('placeholders.enter_phone'),
    required: true,
  },
  {
    name: 'is_main',
    label: t('forms.is_main_store'),
    type: 'select',
    placeholder: t('placeholders.select_store_type'),
    required: true,
    options: [
      { value: true, label: t('common.yes') },
      { value: false, label: t('common.no') },
    ],
  },
  {
    name: 'parent_store',
    label: t('forms.parent_store'),
    type: 'select',
    placeholder: t('placeholders.select_store'),
    required: false,
    options: [], // Will be populated with stores
  },
  {
    name: 'owner',
    label: t('forms.owner'),
    type: 'select',
    placeholder: t('placeholders.select_owner'),
    required: true,
    options: [], // Will be populated with users
  },
];

export default function StoresPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreFormData | null>(null);

  const columns = [
    {
      header: t('table.number'),
      accessorKey: 'displayId',
    },
    {
      header: t('table.name'),
      accessorKey: 'name',
    },
    {
      header: t('table.address'),
      accessorKey: 'address',
    },
    {
      header: t('table.phone'),
      accessorKey: 'phone_number',
    },
    {
      header: t('forms.is_main_store'),
      accessorKey: (row: Store) => (row.is_main ? t('common.yes') : t('common.no')),
    },
  ];

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
  const fields = storeFields(t).map(field => {
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
          { value: '0', label: t('common.no') },
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
      parent_store: store.parent_store?.toString() ?? '0',
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
          toast.success(t('messages.success.updated', { item: t('navigation.stores') }));
          setIsFormOpen(false);
          setEditingStore(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.stores') })),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm(t('messages.confirmation.delete'))) {
      deleteStore(id, {
        onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.stores') })),
        onError: () => toast.error(t('messages.error.delete', { item: t('navigation.stores') })),
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
          <DialogTitle className="text-xl font-bold mb-4">{t('common.edit')}</DialogTitle>
          <DialogDescription className="mb-4">
            {t('messages.edit', { item: t('navigation.stores').toLowerCase() })}
          </DialogDescription>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingStore || undefined}
            isSubmitting={isUpdating}
            title={t('common.edit') + ' ' + t('navigation.stores').toLowerCase()}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}