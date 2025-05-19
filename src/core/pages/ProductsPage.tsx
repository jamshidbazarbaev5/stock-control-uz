import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { type Product, type ProductMeasurement, useGetProducts, useUpdateProduct, useDeleteProduct } from '../api/product';
import { useGetCategories } from '../api/category';
import { useTranslation } from 'react-i18next';
import { useGetMeasurements } from '../api/measurement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MeasurementWithRead {
  id?: number;
  measurement_read?: {
    id: number;
    measurement_name: string;
  };
  measurement_write: number;
  number: string | number;
}

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
  
];

export default function ProductsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMeasurement, setSelectedMeasurement] = useState<string>('');
  const [measurements, setMeasurements] = useState<ProductMeasurement[]>([]);

  const { data: productsData, isLoading } = useGetProducts({
    params: {
      page,
      page_size: 10,
      ordering: '-created_at',
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

  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();

  // Fetch categories and measurements for the select dropdowns
  const { data: categoriesData } = useGetCategories({});
  const { data: measurementsData } = useGetMeasurements({});

  // Get the categories and measurements arrays
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || [];
  const measurementsList = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];

  // Update fields with category options
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
    return field;
  });

  const handleEdit = (product: Product) => {
    setEditingProduct({
      ...product,
      category_write: product.category_read?.id || product.category_write,
    });
    // Initialize measurements from the product
    if (product.measurement && product.measurement.length > 0) {
      setMeasurements(product.measurement.map((m: MeasurementWithRead) => ({
        measurement_write: m.measurement_read ? m.measurement_read.id : m.measurement_write,
        number: typeof m.number === 'string' ? Number(m.number) : m.number
      })));
    } else {
      setMeasurements([{ measurement_write: 0, number: 0 }]);
    }
    setIsFormOpen(true);
  };

  const handleAddMeasurement = () => {
    setMeasurements([...measurements, { measurement_write: 0, number: 0 }]);
  };

  const handleRemoveMeasurement = (index: number) => {
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  const handleMeasurementChange = (index: number, field: keyof ProductMeasurement, value: string) => {
    const newMeasurements = [...measurements];
    newMeasurements[index] = {
      ...newMeasurements[index],
      [field]: field === 'number' ? Number(value) : (parseInt(value, 10) || 0)
    };
    setMeasurements(newMeasurements);
  };

  const handleUpdateSubmit = (data: Partial<Product>) => {
    if (!editingProduct?.id) return;

    const updatedData = {
      ...data,
      category_write: typeof data.category_write === 'string' ? parseInt(data.category_write, 10) : data.category_write,
      measurement: measurements
    };

    updateProduct(
      { ...updatedData, id: editingProduct.id } as Product,
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('table.product') }));
          setIsFormOpen(false);
          setEditingProduct(null);
          setMeasurements([]);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('table.product') })),
      }
    );
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
        {/* <Button onClick={() => navigate('/create-recycling')}>
          {t('common.create')} {t('navigation.recyclings')}
        </Button> */}
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
          >
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('table.measurements')}</h3>
              {measurements.map((measurement: ProductMeasurement, index: number) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={measurement.measurement_write?.toString() || ''}
                      onChange={(e) => handleMeasurementChange(index, 'measurement_write', e.target.value)}
                    >
                      <option value="">{t('placeholders.select_measurement')}</option>
                      {measurementsList?.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.measurement_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder={t('placeholders.enter_quantity')}
                      value={measurement.number || ''}
                      onChange={(e) => handleMeasurementChange(index, 'number', e.target.value)}
                    />
                  </div>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleRemoveMeasurement(index)}
                    >
                      {t('common.delete')}
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddMeasurement}
              >
                {t('common.add')} {t('table.measurement')}
              </Button>
            </div>
          </ResourceForm>
        </DialogContent>
      </Dialog>
    </div>
  );
}
