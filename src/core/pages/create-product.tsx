import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Product } from '../api/product';
import { useCreateProduct } from '../api/product';
import { useGetCategories } from '../api/category';
import { useGetStores } from '../api/store';
import { toast } from 'sonner';

const productFields = [
  {
    name: 'product_name',
    label: 'Product Name',
    type: 'text',
    placeholder: 'Enter product name',
    required: true,
  },
  {
    name: 'category_write',
    label: 'Category',
    type: 'select',
    placeholder: 'Select category',
    required: true,
    options: [], // Will be populated with categories
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

export default function CreateProduct() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();

  // Fetch categories and stores for the select dropdowns
  const { data: categoriesData } = useGetCategories({});
  const { data: storesData } = useGetStores({});

  // Get the categories and stores arrays
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || [];
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];

  // Update fields with category and store options
  const fields = productFields.map(field => {
    if (field.name === 'category_write') {
      return {
        ...field,
        options: categories.map(category => ({
          value: category.id,
          label: category.category_name
        }))
      };
    }
    if (field.name === 'store_write') {
      return {
        ...field,
        options: stores.map(store => ({
          value: store.id,
          label: store.name
        }))
      };
    }
    return field;
  });

  const handleSubmit = async (data: Product) => {
    try {
      // Convert string values to proper types
      const formattedData = {
        ...data,
        category_write: typeof data.category_write === 'string' ? parseInt(data.category_write, 10) : data.category_write,
        store_write: typeof data.store_write === 'string' ? parseInt(data.store_write, 10) : data.store_write,
      };

      await createProduct.mutateAsync(formattedData);
      toast.success('Product created successfully');
      navigate('/products');
    } catch (error) {
      toast.error('Failed to create product');
      console.error('Failed to create product:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<Product>
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={createProduct.isPending}
        title="Create New Product"
      />
    </div>
  );
}
