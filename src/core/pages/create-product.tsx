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
} from "@/components/ui/select";
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
  number: string; // store as string for input, allow comma
  for_sale: boolean;
}

export default function CreateProduct() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const { t } = useTranslation();
  const [color, setColor] = useState('');
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([{ measurement_write: 0, number: '', for_sale: false }]);
  const [kub, setKub] = useState('');
  const [categoriesForRecycling, setCategoriesForRecycling] = useState<number[]>([]);
  const [isList, setIsList] = useState<'true' | 'false'>('false');
  const [length, setLength] = useState('');
  const [staticWeight, setStaticWeight] = useState('');
  const [hasMetr, setHasMetr] = useState(false);
  const [hasShtuk, setHasShtuk] = useState(false);
  const [hasBarcode, setHasBarcode] = useState(false);
  const [barcode, setBarcode] = useState('');

  // Fetch categories, stores and measurements for the select dropdowns
  const { data: categoriesData } = useGetCategories({});
  const { data: measurementsData } = useGetMeasurements({});

  // Get the arrays from response data
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || [];
  const availableMeasurements = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];

  const handleAddMeasurement = () => {
    setMeasurements([...measurements, { measurement_write: 0, number: '', for_sale: false }]);
  };

  const handleRemoveMeasurement = (index: number) => {
    setMeasurements(measurements.filter((_: MeasurementItem, i: number) => i !== index));
  };

  const handleMeasurementChange = (index: number, field: keyof MeasurementItem, value: string | boolean) => {
    const newMeasurements = [...measurements];
    if (field === 'for_sale') {
      newMeasurements[index] = {
        ...newMeasurements[index],
        [field]: Boolean(value)
      };
    } else if (field === 'number') {
      newMeasurements[index] = {
        ...newMeasurements[index],
        [field]: value as string
      };
    } else {
      newMeasurements[index] = {
        ...newMeasurements[index],
        [field]: value
      };
    }
    setMeasurements(newMeasurements);
  };

  const handleSubmit = async (data: any) => {
    console.log('Form data received:', data);
    console.log('Length state:', length);
    console.log('Static weight state:', staticWeight);
    
    try {
      const formattedData: Product = {
        product_name: data.product_name,
        category_write: typeof data.category_write === 'string' ? parseInt(data.category_write, 10) : data.category_write,
        has_barcode: hasBarcode,
        ...(hasBarcode && { barcode }),
        measurement: measurements.map((m: MeasurementItem) => ({
          id: m.id,
          measurement_write: m.measurement_write,
          measurement_read: m.measurement_read,
          number: m.number.toString().replace(',', '.'), // convert comma to dot
          for_sale: m.for_sale
        })),
        has_color: data.has_color === 'true',
        ...(data.has_color === 'true' && { color }),
        has_kub: data.has_kub === 'true',
        ...(data.has_kub === 'true' && { kub: parseFloat(kub.replace(',', '.')) || 0 }),
        has_recycling: data.has_recycling === 'true',
        ...((data.has_recycling === 'true' && categoriesForRecycling.length > 0) && { categories_for_recycling: categoriesForRecycling }),
        is_list: isList === 'true',
        ...(isList === 'true' && { 
          length: data.length ? parseFloat(data.length) : (parseFloat(length) || 0),
          static_weight: data.static_weight ? parseFloat(data.static_weight) : (parseFloat(staticWeight) || 0)
        }),
        has_metr: hasMetr,
        has_shtuk: hasShtuk,
      };

      console.log('Formatted data:', formattedData);
      
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
            // No need for onChange since visibility is handled by nestedField,
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
            // No need for onChange since visibility is handled by nestedField,
            nestedField: (
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder={t('placeholders.enter_kub')}
                value={kub}
                onChange={(e) => setKub(e.target.value)}
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
            // No need for onChange since visibility is handled by nestedField,
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
          },
          {
            name: 'is_list',
            label: t('forms.is_list'),
            type: 'select',
            placeholder: t('placeholders.select_is_list'),
            required: true,
            options: [
              { value: 'false', label: t('common.no') },
              { value: 'true', label: t('common.yes') }
            ],
            defaultValue: isList,
            onChange: (value: 'true' | 'false') => setIsList(value)
          },
          ...(isList === 'true'
            ? [
                {
                  name: 'length',
                  label: t('forms.length'),
                  type: 'number',
                  placeholder: t('placeholders.enter_length'),
                  required: true,
                  value: length,
                  onChange: (value: string) => setLength(value)
                },
                {
                  name: 'static_weight',
                  label: t('forms.static_weight'),
                  type: 'number',
                  placeholder: t('placeholders.enter_static_weight'),
                  required: true,
                  value: staticWeight,
                  onChange: (value: string) => setStaticWeight(value)
                }
              ]
            : []),
        ]}
        onSubmit={handleSubmit}
        isSubmitting={createProduct.isPending}
        title={t('common.create') + ' ' + t('table.product')}
      >
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hasMetr}
              onChange={e => {
                setHasMetr(e.target.checked);
                if (e.target.checked) setHasShtuk(false);
              }}
              disabled={hasShtuk}
            />
            {t('forms.has_metr')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hasShtuk}
              onChange={e => {
                setHasShtuk(e.target.checked);
                if (e.target.checked) setHasMetr(false);
              }}
              disabled={hasMetr}
            />
            {t('forms.has_shtuk')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hasBarcode}
              onChange={e => setHasBarcode(e.target.checked)}
            />
            {t('forms.has_barcode')}
          </label>
          {hasBarcode && (
            <input
              type="text"
              className="px-3 py-2 border rounded-md"
              placeholder={t('placeholders.enter_barcode')}
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
            />
          )}
        </div>
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
                  type="text"
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