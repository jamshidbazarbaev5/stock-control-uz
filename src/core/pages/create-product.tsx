import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Product } from '../api/product';
import { useCreateProduct } from '../api/product';
import { useGetCategories } from '../api/category';
import { useGetMeasurements } from '../api/measurement';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface MeasurementItem {
  measurement_write: number;
  number: number;
}

export default function CreateProduct() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const { t } = useTranslation();
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([{ measurement_write: 0, number: 0 }]);

  // Fetch categories, stores and measurements for the select dropdowns
  const { data: categoriesData } = useGetCategories({});
  const { data: measurementsData } = useGetMeasurements({});

  // Get the arrays from response data
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || [];
  const availableMeasurements = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];

  const handleAddMeasurement = () => {
    setMeasurements([...measurements, { measurement_write: 0, number: 0 }]);
  };

  const handleRemoveMeasurement = (index: number) => {
    setMeasurements(measurements.filter((_: MeasurementItem, i: number) => i !== index));
  };

  const handleMeasurementChange = (index: number, field: keyof MeasurementItem, value: string) => {
    const newMeasurements = [...measurements];
    newMeasurements[index] = {
      ...newMeasurements[index],
      [field]: parseInt(value, 10) || 0
    };
    setMeasurements(newMeasurements);
  };

  const handleSubmit = async (data: any) => {
    try {
      const formattedData = {
        product_name: data.product_name,
        category_write: typeof data.category_write === 'string' ? parseInt(data.category_write, 10) : data.category_write,
        measurement: measurements.map((m: MeasurementItem) => ({
          measurement_write: m.measurement_write,
          number: m.number
        }))
      };

      await createProduct.mutateAsync(formattedData);
      toast.success(t('messages.success.created', { item: t('table.product') }));
      navigate('/products');
    } catch (error) {
      toast.error(t('messages.error.create', { item: t('table.product') }));
      console.error('Failed to create product:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<Product>
        fields={[
          {
            name: 'product_name',
            label: t('forms.product_name'),
            type: 'text',
            placeholder: t('placeholders.enter_name'),
            required: true,
          },
          {
            name: 'category_write',
            label: t('table.category'),
            type: 'select',
            placeholder: t('placeholders.select_category'),
            required: true,
            options: categories.map(category => ({
              value: category.id,
              label: category.category_name
            }))
          },
          
        ]}
        onSubmit={handleSubmit}
        isSubmitting={createProduct.isPending}
        title={t('common.create') + ' ' + t('table.product')}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('table.measurements')}</h3>
          {measurements.map((measurement: MeasurementItem, index: number) => (
            <div key={index} className="flex gap-4 items-end">
              <div className="flex-1">
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={measurement.measurement_write || ''}
                  onChange={(e) => handleMeasurementChange(index, 'measurement_write', e.target.value)}
                >
                  <option value="">{t('placeholders.select_measurement')}</option>
                  {availableMeasurements?.map(m => (
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
    </div>
  );
}
