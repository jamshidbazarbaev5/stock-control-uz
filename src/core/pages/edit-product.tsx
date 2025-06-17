import { useNavigate, useParams } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Product } from '../api/product';
import { useUpdateProduct, useGetProduct } from '../api/product';
import { useGetCategories } from '../api/category';
import { useGetMeasurements } from '../api/measurement';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from '@/components/ui/scroll-area';

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

export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();
  const updateProduct = useUpdateProduct();
  const { data: product } = useGetProduct(Number(id));
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [color, setColor] = useState('');
  const [kub, setKub] = useState('');
  const [categoriesForRecycling, setCategoriesForRecycling] = useState<number[]>([]);

  // Fetch categories and measurements for the select dropdowns
  const { data: categoriesData } = useGetCategories({});
  const { data: measurementsData } = useGetMeasurements({});

  // Get the arrays from response data
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || [];
  const availableMeasurements = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];

  useEffect(() => {
    if (product?.measurement) {
      setMeasurements(product.measurement.map((m: any) => ({
        id: m.id,
        measurement_write: m.measurement_read?.id || m.measurement_write,
        number: typeof m.number === 'string' ? Number(m.number) : m.number,
        for_sale: m.for_sale || false
      })));
    }
    // Set initial values if product data exists
    if (product?.has_color) {
      setColor(product.color || '');
    }
    if (product?.has_kub || product?.kub) {
      setKub(product.kub?.toString() || '');
    }
    if (product?.has_recycling && product?.categories_for_recycling) {
      setCategoriesForRecycling(product.categories_for_recycling || []);
    }
  }, [product]);

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
      [field]: field === 'for_sale' ? value : (parseInt(value as string, 10) || 0)
    };
    setMeasurements(newMeasurements);
  };

  const handleSubmit = async (data: any) => {
    if (!id) return;

    try {
      const formattedData: any = {
        id: Number(id),
        product_name: data.product_name,
        category_write: typeof data.category_write === 'string' ? parseInt(data.category_write, 10) : data.category_write,
        has_color: (data.has_color === 'true') as boolean,
        // If kub has a value, has_kub should be true
        has_kub: (data.has_kub === 'true' || (kub !== '' && parseFloat(kub) > 0)) as boolean,
        has_recycling: (data.has_recycling === 'true') as boolean,
        measurement: measurements.map((m: MeasurementItem) => ({
          id: m.id,
          measurement_write: m.measurement_write,
          measurement_read: m.measurement_read,
          number: m.number.toString(),
          for_sale: m.for_sale
        }))
      };

      // Only add color if has_color is true
      if (data.has_color === 'true') {
        formattedData.color = color;
      }

      // Only add kub if has_kub is true or kub has a value
      if (kub !== '' && parseFloat(kub) > 0) {
        formattedData.kub = parseFloat(kub);
      }

      // Only add categories_for_recycling if has_recycling is true and categories are selected
      if (data.has_recycling === 'true' && categoriesForRecycling.length > 0) {
        formattedData.categories_for_recycling = categoriesForRecycling;
      }

      await updateProduct.mutateAsync(formattedData);
      toast.success(t('messages.success.updated', { item: t('table.product') }));
      navigate('/products');
    } catch (error) {
      toast.error(t('messages.error.update', { item: t('table.product') }));
      console.error('Failed to update product:', error);
    }
  };

  if (!product) {
    return <div>Loading...</div>;
  }

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
            // No need for onChange since visibility is handled by nestedField
            nestedField: (
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder={t('placeholders.enter_color')}
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            )
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
            // No need for onChange since visibility is handled by nestedField
            nestedField: (
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                placeholder={t('placeholders.enter_kub')}
                value={kub}
                onChange={(e) => setKub(e.target.value)}
                step="0.1"
              />
            )
          },
          {
            name: 'has_recycling',
            label: t('forms.has_recycling'),
            type: 'select',
            placeholder: t('placeholders.select_has_recycling'),
            required: true,
            options: [
              { value: 'false', label: t('common.no') },
              { value: 'true', label: t('common.yes') }
            ],
            // No need for onChange since visibility is handled by nestedField
            nestedField: (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full flex justify-between items-center">
                    <span>
                      {categoriesForRecycling.length
                        ? `${categoriesForRecycling.length} ${t('forms.categories_selected')}`
                        : t('placeholders.select_categories')}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  <ScrollArea className="h-[200px] p-2">
                    {categories.map(category => (
                      <DropdownMenuCheckboxItem
                        key={category.id?.toString()}
                        checked={categoriesForRecycling.includes(category.id || 0)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCategoriesForRecycling([...categoriesForRecycling, category.id || 0]);
                          } else {
                            setCategoriesForRecycling(categoriesForRecycling.filter(id => id !== category.id));
                          }
                        }}
                      >
                        {category.category_name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
        ]}
        onSubmit={handleSubmit}
        isSubmitting={updateProduct.isPending}
        title={t('common.edit') + ' ' + t('table.product')}
        defaultValues={{
          product_name: product.product_name,
          category_write: product.category_read?.id || product.category_write,
          has_color: (product.has_color ? 'true' : 'false') as any,
          has_kub: (product.has_kub ? 'true' : 'false') as any,
          has_recycling: (product.has_recycling ? 'true' : 'false') as any,
        }}
      >
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
                    <SelectValue placeholder={t('common.select')} />
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