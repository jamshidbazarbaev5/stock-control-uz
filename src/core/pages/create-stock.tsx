import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Stock, CreateStockDTO } from '../api/stock';
import { useCreateStock } from '../api/stock';
import { useGetProducts } from '../api/product';
import { useGetStores } from '../api/store';
import { useGetMeasurements } from '../api/measurement';
import { toast } from 'sonner';

const stockFields = [
  {
    name: 'store_write',
    label: 'Store',
    type: 'select',
    placeholder: 'Select store',
    required: true,
    options: [], // Will be populated with stores
  },
  {
    name: 'product_write',
    label: 'Product',
    type: 'select',
    placeholder: 'Select product',
    required: true,
    options: [], // Will be populated with products
  },
  {
    name: 'purchase_price',
    label: 'Purchase Price',
    type: 'text',
    placeholder: 'Enter purchase price',
    required: true,
  },
  {
    name: 'selling_price',
    label: 'Selling Price',
    type: 'text',
    placeholder: 'Enter selling price',
    required: true,
  },
  {
    name: 'min_price',
    label: 'Minimum Price',
    type: 'text',
    placeholder: 'Enter minimum price',
    required: true,
  },
  {
    name: 'quantity',
    label: 'Quantity',
    type: 'text',
    placeholder: 'Enter quantity',
    required: true,
  },
  {
    name: 'measurement_write',
    label: 'Measurement',
    type: 'select',
    placeholder: 'Select measurement',
    required: true,
    options: [], // Will be populated with measurements
  },
];

export default function CreateStock() {
  const navigate = useNavigate();
  const createStock = useCreateStock();

  // Fetch products, stores and measurements for the select dropdowns
  const { data: productsData } = useGetProducts({});
  const { data: storesData } = useGetStores({});
  const { data: measurementsData } = useGetMeasurements({});

  // Get the products, stores and measurements arrays
  const products = Array.isArray(productsData) ? productsData : productsData?.results || [];
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const measurements = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];

  // Update fields with product, store and measurement options
  const fields = stockFields.map(field => {
    if (field.name === 'product_write') {
      return {
        ...field,
        options: products.map(product => ({
          value: product.id,
          label: product.product_name
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
    if (field.name === 'measurement_write') {
      return {
        ...field,
        options: measurements.map(measurement => ({
          value: measurement.id,
          label: measurement.measurement_name
        }))
      };
    }
    return field;
  });

  const handleSubmit = async (data: Partial<Stock>) => {
    try {
      const quantity = typeof data.quantity === 'string' ? parseInt(data.quantity, 10) : data.quantity!;
      const measurement = typeof data.measurement_write === 'string' ? parseInt(data.measurement_write, 10) : data.measurement_write!;
      
      const formattedData: CreateStockDTO = {
        store_write: typeof data.store_write === 'string' ? parseInt(data.store_write, 10) : data.store_write!,
        product_write: typeof data.product_write === 'string' ? parseInt(data.product_write, 10) : data.product_write!,
        purchase_price: data.purchase_price!,
        selling_price: data.selling_price!,
        min_price: data.min_price!,
        quantity: quantity,
        measurement_write: [{
          measurement_write: typeof measurement === 'number' ? measurement : measurement[0].measurement_write,
          number: quantity
        }]
      };

      await createStock.mutateAsync(formattedData);
      toast.success('Stock created successfully');
      navigate('/stocks');
    } catch (error) {
      toast.error('Failed to create stock');
      console.error('Failed to create stock:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<Stock>
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={createStock.isPending}
        title="Create New Stock"
      />
    </div>
  );
}
