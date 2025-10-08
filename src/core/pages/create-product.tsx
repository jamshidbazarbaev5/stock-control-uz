import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import { type Product, useCreateProduct } from '../api/product';
import { useGetCategories } from '../api/category';
import { useGetMeasurements } from '../api/measurement';
import type { Attribute } from '@/types/attribute';
import { attributeApi } from '../api/attribute';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface AttributeValue {
  attribute_id: number;
  value: string | number | boolean;
}

export default function CreateProduct() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const { t } = useTranslation();
  const [barcode, setBarcode] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([]);
  const [measurements, setMeasurements] = useState([{ measurement_write: 0, number: '' }]);
  const [baseUnit, setBaseUnit] = useState('');

  // Fetch categories and measurements for the select dropdowns
  const { data: categoriesData } = useGetCategories({});
  const { data: measurementsData } = useGetMeasurements({});

  // Get the arrays from response data
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || [];
  const availableMeasurements = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];

  // Fetch attributes and filter by selected category
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  
  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        if (selectedCategory) {
          const allAttributes = await attributeApi.getAll();
          // For now, show all attributes - category filtering can be added later
          setAttributes(allAttributes);
        } else {
          setAttributes([]);
        }
      } catch (error) {
        console.error('Failed to fetch attributes:', error);
      }
    };
    
    fetchAttributes();
  }, [selectedCategory]);

  const handleSubmit = async (data: any) => {
    console.log('Form data received:', data);
    
    try {
      const formattedData: Product = {
        product_name: data.product_name,
        category_write: typeof data.category_write === 'string' ? parseInt(data.category_write, 10) : data.category_write,
        barcode: barcode,
        base_unit: baseUnit ? parseInt(baseUnit, 10) : undefined,
        min_price: typeof data.min_price === 'string' ? parseFloat(data.min_price) : data.min_price,
        selling_price: typeof data.selling_price === 'string' ? parseFloat(data.selling_price) : data.selling_price,
        measurement: measurements.filter(m => m.measurement_write && m.number).map(m => ({
          measurement_write: m.measurement_write,
          number: m.number,
          for_sale: false
        })),
        attribute_values: attributeValues.map(av => ({
          ...av,
          value: typeof av.value === 'string' && !isNaN(Number(av.value)) ? Number(av.value) : av.value
        }))
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
            })),
            onChange: (value: string) => setSelectedCategory(Number(value))
          },
         
          {
            name: 'base_unit',
            label: 'Base Unit',
            type: 'select',
            placeholder: 'Select base unit',
            options: availableMeasurements.map(measurement => ({
              value: measurement.id,
              label: measurement.measurement_name
            })),
            value: baseUnit,
            onChange: (value: string) => setBaseUnit(value)
          },
          {
            name: 'barcode',
            label: t('forms.barcode'),
            type: 'number',
            placeholder: t('placeholders.enter_barcode'),
            value: barcode,
            onChange: (value: string) => setBarcode(value)
          },
          {
            name: 'min_price',
            label: t('forms.min_price'),
            type: 'number',
            placeholder: t('placeholders.enter_min_price'),
            required: true,
            value: minPrice,
            onChange: (value: string) => setMinPrice(value)
          },
          {
            name: 'selling_price',
            label: t('forms.selling_price'),
            type: 'number',
            placeholder: t('placeholders.enter_selling_price'),
            required: true,
            value: sellingPrice,
            onChange: (value: string) => setSellingPrice(value)
          },
        ]}
        onSubmit={handleSubmit}
        isSubmitting={createProduct.isPending}
        title={t('common.create') + ' ' + t('table.product')}
      >
        {/* Measurements Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Measurements</h3>
          {measurements.map((measurement, index) => (
            <div key={index} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  Measurement
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={measurement.measurement_write || ''}
                  onChange={(e) => {
                    const newMeasurements = [...measurements];
                    newMeasurements[index] = {
                      ...newMeasurements[index],
                      measurement_write: parseInt(e.target.value, 10)
                    };
                    setMeasurements(newMeasurements);
                  }}
                >
                  <option value="">Select measurement</option>
                  {availableMeasurements.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.measurement_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  Number
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter quantity"
                  value={measurement.number || ''}
                  onChange={(e) => {
                    const newMeasurements = [...measurements];
                    newMeasurements[index] = {
                      ...newMeasurements[index],
                      number: e.target.value
                    };
                    setMeasurements(newMeasurements);
                  }}
                />
              </div>
              {index > 0 && (
                <button
                  type="button"
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  onClick={() => {
                    setMeasurements(measurements.filter((_, i) => i !== index));
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={() => {
              setMeasurements([...measurements, { measurement_write: 0, number: '' }]);
            }}
          >
            Add Measurement
          </button>
        </div>
        {/* Dynamic Attribute Fields */}
        {selectedCategory && attributes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('forms.attributes')}</h3>
            {attributes.map((attribute) => {
              const handleAttributeChange = (value: string | boolean) => {
                setAttributeValues((prev) => {
                  const existing = prev.find((v) => v.attribute_id === attribute.id);
                  if (existing) {
                    return prev.map((v) =>
                      v.attribute_id === attribute.id ? { ...v, value } : v
                    );
                  }
                  return [...prev, { attribute_id: attribute.id!, value }];
                });
              };

              switch (attribute.field_type) {
                case 'string':
                  return (
                    <div key={attribute.id} className="form-control">
                      <label className="label">
                        <span className="label-text">{attribute.translations.ru}</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md"
                        onChange={(e) => handleAttributeChange(e.target.value)}
                      />
                    </div>
                  );
                case 'number':
                  return (
                    <div key={attribute.id} className="form-control">
                      <label className="label">
                        <span className="label-text">{attribute.translations.ru}</span>
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border rounded-md"
                        onChange={(e) => handleAttributeChange(e.target.value)}
                      />
                    </div>
                  );
                case 'boolean':
                  return (
                    <div key={attribute.id} className="form-control">
                      <label className="label cursor-pointer">
                        <span className="label-text">{attribute.translations.ru}</span>
                        <input
                          type="checkbox"
                          className="checkbox"
                          onChange={(e) => handleAttributeChange(e.target.checked)}
                        />
                      </label>
                    </div>
                  );
                case 'choice':
                  return attribute.choices ? (
                    <div key={attribute.id} className="form-control">
                      <label className="label">
                        <span className="label-text">{attribute.translations.ru}</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        onChange={(e) => handleAttributeChange(e.target.value)}
                      >
                        <option value="">{t('placeholders.select_option')}</option>
                        {attribute.choices.map((choice) => (
                          <option key={choice} value={choice}>
                            {choice}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null;
                case 'date':
                  return (
                    <div key={attribute.id} className="form-control">
                      <label className="label">
                        <span className="label-text">{attribute.translations.ru}</span>
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border rounded-md"
                        onChange={(e) => handleAttributeChange(e.target.value)}
                      />
                    </div>
                  );
                default:
                  return null;
              }
            })}
          </div>
        )}

      </ResourceForm>
    </div>
  );
}