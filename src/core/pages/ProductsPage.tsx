import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { type Product, useGetProducts, useUpdateProduct, useDeleteProduct } from '../api/product';
import { useGetCategories } from '../api/category';
import { useGetStores } from '../api/store';

const productFields = [
  {
    name: 'product_name',
    label: 'Название товара',
    type: 'text',
    placeholder: 'Введите название товара',
    required: true,
  },
  {
    name: 'category_write',
    label: 'Категория',
    type: 'select',
    placeholder: 'Выберите категорию',
    required: true,
    options: [], // Will be populated with categories
  },
  {
    name: 'store_write',
    label: 'Магазин',
    type: 'select',
    placeholder: 'Выберите магазин',
    required: true,
    options: [], // Will be populated with stores
  },
];

const columns = [
  {
    header: '№',
    accessorKey: 'displayId',
  },
  {
    header: 'Название',
    accessorKey: 'product_name',
  },
  {
    header: 'Категория',
    accessorKey: (row: Product) => row.category_read?.category_name || row.category_write,
  },
  {
    header: 'Магазин',
    accessorKey: (row: Product) => row.store_read?.name || row.store_write,
  },
];

export default function ProductsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data: productsData, isLoading } = useGetProducts({
    params: {
      page: page,
      page_size: 10,
      ordering: '-created_at',
    },
  });

  // Handle both array and object response formats
  const results = Array.isArray(productsData) ? productsData : productsData?.results || [];
  const totalCount = Array.isArray(productsData) ? productsData.length : productsData?.count || 0;

  const products = results.map((product, index) => ({
    ...product,
    displayId: (page - 1) * 10 + index + 1,
  }));

  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();

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

  const handleEdit = (product: Product) => {
    setEditingProduct({
      ...product,
      category_write: product.category_read?.id || product.category_write,
      store_write: product.store_read?.id || product.store_write
    });
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<Product>) => {
    if (!editingProduct?.id) return;

    const updatedData = {
      ...data,
      category_write: typeof data.category_write === 'string' ? parseInt(data.category_write, 10) : data.category_write,
      store_write: typeof data.store_write === 'string' ? parseInt(data.store_write, 10) : data.store_write,
    };

    updateProduct(
      { ...updatedData, id: editingProduct.id } as Product,
      {
        onSuccess: () => {
          toast.success('Товар успешно обновлен');
          setIsFormOpen(false);
          setEditingProduct(null);
        },
        onError: () => toast.error('Не удалось обновить товар'),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
      deleteProduct(id, {
        onSuccess: () => toast.success('Товар успешно удален'),
        onError: () => toast.error('Не удалось удалить товар'),
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <ResourceTable
        data={products}
        columns={columns}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-product')}
        totalCount={totalCount}
        pageSize={10}
        currentPage={page}
        onPageChange={(newPage) => setPage(newPage)}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingProduct || undefined}
            isSubmitting={isUpdating}
            title="Редактировать товар"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
