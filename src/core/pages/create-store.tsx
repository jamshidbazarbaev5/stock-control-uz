import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Store } from '../api/store';
import { useCreateStore, useGetStores } from '../api/store';
import { useGetUsers } from '../api/user';
import { toast } from 'sonner';

const storeFields = [
  {
    name: 'name',
    label: 'Store Name',
    type: 'text',
    placeholder: 'Enter store name',
    required: true,
  },
  {
    name: 'address',
    label: 'Address',
    type: 'text',
    placeholder: 'Enter store address',
    required: true,
  },
  {
    name: 'phone_number',
    label: 'Phone Number',
    type: 'text',
    placeholder: 'Enter phone number',
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
    name: 'parent_store',
    label: 'Parent Store',
    type: 'select',
    placeholder: 'Select parent store',
    required: false,
  },
  {
    name: 'owner',
    label: 'Owner',
    type: 'select',
    placeholder: 'Select owner',
    required: true,
  },
];

export default function CreateStore() {
  const navigate = useNavigate();
  const createStore = useCreateStore();
  const { data: usersData } = useGetUsers({});
  const { data: storesData } = useGetStores({});

  // Prepare options for select inputs
  const users = Array.isArray(usersData) ? usersData : usersData?.results || [];
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];

  // Update field options with dynamic data
  const fields = storeFields.map(field => {
    if (field.name === 'owner') {
      return {
        ...field,
        options: users.map(user => ({ value: user.id, label: user.name }))
      };
    }
    if (field.name === 'parent_store') {
      return {
        ...field,
        options: stores.map(store => ({ value: store.id, label: store.name }))
      };
    }
    return field;
  });

  const handleSubmit = async (data: Store) => {
    try {
      // Convert string values to proper types
      const formattedData = {
        ...data,
        owner: typeof data.owner === 'string' ? parseInt(data.owner, 10) : data.owner,
        parent_store: data.parent_store 
          ? (typeof data.parent_store === 'string' 
            ? parseInt(data.parent_store, 10) 
            : data.parent_store)
          : undefined,
      };

      await createStore.mutateAsync(formattedData);
      toast.success('Store created successfully');
      navigate('/stores');
    } catch (error) {
      toast.error('Failed to create store');
      console.error('Failed to create store:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<Store>
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={createStore.isPending}
        title="Create New Store"
      />
    </div>
  );
}