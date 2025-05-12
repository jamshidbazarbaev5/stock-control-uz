import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Store } from '../api/store';
import { useCreateStore } from '../api/store';
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
    type: 'text',
    placeholder: 'Parent Store ID (Optional)',
    required: false,
  },
  {
    name: 'owner',
    label: 'Owner',
    type: 'text',
    placeholder: 'Owner ID',
    required: true,
  },
];

export default function CreateStore() {
  const navigate = useNavigate();
  const createStore = useCreateStore();

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
        fields={storeFields}
        onSubmit={handleSubmit}
        isSubmitting={createStore.isPending}
        title="Create New Store"
      />
    </div>
  );
}