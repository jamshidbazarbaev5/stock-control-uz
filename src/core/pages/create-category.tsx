import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import type { Category } from '../api/category';
import { useCreateCategory } from '../api/category';
import { useGetStores } from '../api/store';

const categoryFields = [
  {
    name: 'category_name',
    label: 'Category Name',
    type: 'text',
    placeholder: 'Enter category name',
    required: true,
  },
  {
    name: 'store_write',
    label: 'Store',
    type: 'select',
    placeholder: 'Select store',
    required: true,
    options: [], // Will be populated with stores
  },
];

export default function CreateCategory() {
  const navigate = useNavigate();
  const createCategory = useCreateCategory();
  
  // Fetch stores for the select dropdown
  const { data: storesData } = useGetStores({});
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const storeOptions = stores.map(store => ({
    value: store.id,
    label: store.name
  }));

  // Update fields with store options
  const fields = categoryFields.map(field => 
    field.name === 'store_write' 
      ? { ...field, options: storeOptions }
      : field
  );

  const handleSubmit = async (data: Category) => {
    try {
      // Convert string values to proper types
      const formattedData = {
        ...data,
        store_write: typeof data.store_write === 'string' ? 
          parseInt(data.store_write, 10) : data.store_write,
      };

      await createCategory.mutateAsync(formattedData);
      toast.success('Category created successfully');
      navigate('/categories');
    } catch (error) {
      toast.error('Failed to create category');
      console.error('Failed to create category:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<Category>
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={createCategory.isPending}
        title="Create New Category"
      />
    </div>
  );
}
