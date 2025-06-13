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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MeasurementItem {
  id?: number;
  measurement_write: number;
  measurement_read?: {
    id: number;
    measurement_name: string;
  };
  number: number;
  for_sale: boolean;
}

export default function CreateProduct() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const { t } = useTranslation();
  const [color, setColor] = useState('');
  const [hasColor, setHasColor] = useState(false);
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([{ measurement_write: 0, number: 0, for_sale: false }]);
  const [hasKub, setHasKub] = useState(false);
  const [kub, setKub] = useState('');

  // Fetch categories, stores and measurements for the select dropdowns
  const { data: categoriesData } = useGetCategories({});
  const { data: measurementsData } = useGetMeasurements({});

  // Get the arrays from response data
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || [];
  const availableMeasurements = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];

  const handleAddMeasurement = () => {
    setMeasurements([...measurements, { measurement_write: 0, number: 0, for_sale: false }]);
  };

  const handleRemoveMeasurement = (index: number) => {
    setMeasurements(measurements.filter((_: MeasurementItem, i: number) => i !== index));
  };

  const handleMeasurementChange = (index: number, field: keyof MeasurementItem, value: string | boolean) => {
    const newMeasurements = [...measurements];
    newMeasurements[index] = {
      ...newMeasurements[index],
      [field]: field === 'for_sale' ? value : parseInt(value as string, 10) || 0
    };
    setMeasurements(newMeasurements);
  };

  const handleSubmit = async (data: any) => {
    try {
      const formattedData = {
        product_name: data.product_name,
        category_write: typeof data.category_write === 'string' ? parseInt(data.category_write, 10) : data.category_write,
        measurement: measurements.map((m: MeasurementItem) => ({
          id: m.id,
          measurement_write: m.measurement_write,
          measurement_read: m.measurement_read,
          number: m.number.toString(),
          for_sale: m.for_sale
        })),
        has_color: data.has_color === 'true',
        ...(data.has_color === 'true' && { color }),
        has_kub: data.has_kub === 'true',
        ...(data.has_kub === 'true' && { kub: parseFloat(kub) || 0 })
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
          {
            name: 'has_color',
            label: t('forms.has_color'),
            type: 'select',
            placeholder: t('placeholders.select_has_color'),
            required: true,
            options: [
              { value: 'false', label: t('common.no') },
              { value: 'true', label: t('common.yes') }
            ],
            onChange: (value: string) => setHasColor(value === 'true')
          },
          {
            name: 'has_kub',
            label: t('forms.has_kub'),
            type: 'select',
            placeholder: t('placeholders.select_has_kub'),
            required: true,
            options: [
              { value: 'false', label: t('common.no') },
              { value: 'true', label: t('common.yes') }
            ],
            onChange: (value: string) => setHasKub(value === 'true')
          }
        ]}
        onSubmit={handleSubmit}
        isSubmitting={createProduct.isPending}
        title={t('common.create') + ' ' + t('table.product')}
      >
        {hasColor && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{t('forms.color')}</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder={t('placeholders.enter_color')}
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
        )}
        {hasKub && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{t('forms.kub')}</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md"
              placeholder={t('placeholders.enter_kub')}
              value={kub}
              onChange={(e) => setKub(e.target.value)}
            />
          </div>
        )}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('table.measurements')}</h3>
          {measurements.map((measurement: MeasurementItem, index: number) => (
            <div key={index} className="flex gap-4 items-end">
              <div className="flex-1">
                <Select
                  value={measurement.measurement_write?.toString() || ''}
                  onValueChange={(value) => handleMeasurementChange(index, 'measurement_write', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholders.select_measurement')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMeasurements?.map(m => (
                      <SelectItem key={m.id?.toString()} value={(m.id || 0).toString()}>
                        {m.measurement_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="flex-1">
                <Select 
                  value={measurement.for_sale.toString()} 
                  onValueChange={(value) => handleMeasurementChange(index, 'for_sale', value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholders.select_for_sale')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">{t('common.no')}</SelectItem>
                    <SelectItem value="true">{t('common.yes')}</SelectItem>
                  </SelectContent>
                </Select>
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
