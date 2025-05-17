import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { type Product, useGetProducts, useUpdateProduct, useDeleteProduct } from '../api/product';
import { useGetCategories } from '../api/category';
import { useGetStores } from '../api/store';
import { useTranslation } from 'react-i18next';

const productFields = (t: any) => [
  {
    name: 'product_name',
    label: t('forms.product_name'),
    type: 'text',
    placeholder: t('placeholders.select_product'),
    required: true,
  },
  {
    name: 'category_write',
    label: t('table.category'),
    type: 'select',
    placeholder: t('placeholders.select_category'),
    required: true,
    options: [], // Will be populated with categories
  },
  {
    name: 'store_write',
    label: t('table.store'),
    type: 'select',
    placeholder: t('placeholders.select_store'),
    required: true,
    options: [], // Will be populated with stores
  },
];

const columns = (t: any) => [
  // {
  //   header: '№',
  //   accessorKey: 'displayId',
  // },
  {
    header: t('table.name'),
    accessorKey: 'product_name',
  },
  {
    header: t('table.category'),
    accessorKey: (row: Product) => row.category_read?.category_name || row.category_write,
  },
  {
    header: t('table.store'),
    accessorKey: (row: Product) => row.store_read?.name || row.store_write,
  },
];

export default function ProductsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { t } = useTranslation();

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
  const fields = productFields(t).map((field: any) => {
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
          toast.success(t('messages.success.updated', { item: t('table.product') }));
          setIsFormOpen(false);
          setEditingProduct(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('table.product') })),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm(t('messages.confirmation.delete'))) {
      deleteProduct(id, {
        onSuccess: () => toast.success(t('messages.success.deleted', { item: t('table.product') })),
        onError: () => toast.error(t('messages.error.delete', { item: t('table.product') })),
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <ResourceTable
        data={products}
        columns={columns(t)}
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
            title={t('common.edit') + ' ' + t('table.product')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
