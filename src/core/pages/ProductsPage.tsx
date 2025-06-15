import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceTable } from '../helpers/ResourseTable';
import { toast } from 'sonner';
import { type Product, useGetProducts, useDeleteProduct } from '../api/product';
import { useGetCategories } from '../api/category';
import { useTranslation } from 'react-i18next';
import { useGetMeasurements } from '../api/measurement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const columns = (t: any) => [
  {
    header: t('table.name'),
    accessorKey: 'product_name',
  },
  {
    header: t('table.category'),
    accessorKey: (row: Product) => row.category_read?.category_name || row.category_write,
  },
  {
    header: t('table.measurements'),
    accessorKey: (row: Product) => {
      if (!row.measurement || row.measurement.length === 0) return '-';
      return row.measurement.map((m: any) => {
        const measurementName = m.measurement_read ? m.measurement_read.measurement_name : '';
        const number = typeof m.number === 'string' ? parseFloat(m.number) : m.number;
        return `${measurementName}: ${number}${m.for_sale ? ' (продажа)' : ''}`;
      }).join(', ');
    },
  },
];

export default function ProductsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMeasurement, setSelectedMeasurement] = useState<string>('');

  const { data: productsData, isLoading } = useGetProducts({
    params: {
      page,
      ...(searchTerm && { product_name: searchTerm }),
      ...(selectedCategory && { category: selectedCategory }),
      ...(selectedMeasurement && { measurement: selectedMeasurement }),
    },
  });

  // Handle both array and object response formats
  const results = Array.isArray(productsData) ? productsData : productsData?.results || [];
  const totalCount = Array.isArray(productsData) ? productsData.length : productsData?.count || 0;

  const products = results.map((product, index) => ({
    ...product,
    displayId: (page - 1) * 10 + index + 1,
  }));

  const { mutate: deleteProduct } = useDeleteProduct();

  // Fetch categories and measurements for the select dropdowns
  const { data: categoriesData } = useGetCategories({});
  const { data: measurementsData } = useGetMeasurements({});

  // Get the categories and measurements arrays
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || [];
  const measurementsList = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];

  const handleEdit = (product: Product) => {
    navigate(`/edit-product/${product.id}`);
  };

  const handleDelete = (id: number) => {
    deleteProduct(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('table.product') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('table.product') })),
    });
  };

  return (
    <div className="container mx-auto py-3">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-bold">{t('navigation.products')}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <Input
          type="text"
          placeholder={t('placeholders.search_product')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <Select 
          value={selectedCategory} 
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('placeholders.select_category')} />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.category_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={selectedMeasurement} 
          onValueChange={setSelectedMeasurement}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('placeholders.select_measurement')} />
          </SelectTrigger>
          <SelectContent>
            {measurementsList?.map(measurement => (
              <SelectItem key={measurement.id} value={String(measurement.id)}>
                {measurement.measurement_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ResourceTable
        data={products}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-product')}
        totalCount={totalCount}
        pageSize={30}
        currentPage={page}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
}
