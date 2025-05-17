import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Stock, CreateStockDTO } from '../api/stock';
import { useCreateStock } from '../api/stock';
import { useGetProducts } from '../api/product';
import { useGetStores } from '../api/store';
import { useGetMeasurements } from '../api/measurement';
import { useGetSuppliers } from '../api/supplier';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

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
    name: 'purchase_price_in_us',
    label: 'Purchase Price (USD)',
    type: 'text',
    placeholder: 'Enter purchase price in USD',
    required: true,
  },
  {
    name: 'exchange_rate',
    label: 'Exchange Rate',
    type: 'text',
    placeholder: 'Enter exchange rate',
    required: true,
  },
  {
    name: 'purchase_price_in_uz',
    label: 'Purchase Price (UZS)',
    type: 'text',
    placeholder: 'Calculated purchase price in UZS',
    readOnly: true,
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
    name: 'supplier_write',
    label: 'Supplier',
    type: 'select',
    placeholder: 'Select supplier',
    required: true,
    options: [], // Will be populated with suppliers
  },
  {
    name: 'color',
    label: 'Color',
    type: 'text',
    placeholder: 'Enter color',
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

interface FormValues extends Partial<Stock> {
  purchase_price_in_us: string;
  exchange_rate: string;
  purchase_price_in_uz: string;
}

export default function CreateStock() {
  const navigate = useNavigate();
  const createStock = useCreateStock();
  const form = useForm<FormValues>({
    defaultValues: {
      purchase_price_in_us: '',
      exchange_rate: '',
      purchase_price_in_uz: ''
    }
  });

  
  // Watch specific fields for changes
  const usdPrice = form.watch('purchase_price_in_us');
  const exchangeRate = form.watch('exchange_rate');
  
  // Fetch products, stores and measurements for the select dropdowns
  const { data: productsData } = useGetProducts({});
  const { data: storesData } = useGetStores({});
  const { data: measurementsData } = useGetMeasurements({});
  const { data: suppliersData } = useGetSuppliers({});

  // Get the products, stores, measurements and suppliers arrays
  const products = Array.isArray(productsData) ? productsData : productsData?.results || [];
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const measurements = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];
  const suppliers = Array.isArray(suppliersData) ? suppliersData : suppliersData?.results || [];


  // Effect to update purchase_price_in_uz when its dependencies change
  useEffect(() => {
    if (usdPrice && exchangeRate) {
      const priceInUSD = parseFloat(usdPrice);
      const rate = parseFloat(exchangeRate);
      
      if (!isNaN(priceInUSD) && !isNaN(rate)) {
        const calculatedPrice = priceInUSD * rate;
        console.log('Calculated price in UZS:', calculatedPrice);
        form.setValue('purchase_price_in_uz', calculatedPrice.toString(), {
          shouldValidate: false,
          shouldDirty: true
        });
      }
    }
  }, [usdPrice, exchangeRate, form]);

  // Update fields with product, store, measurement and supplier options
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
    if (field.name === 'supplier_write') {
      return {
        ...field,
        options: suppliers.map(supplier => ({
          value: supplier.id,
          label: supplier.name
        }))
      };
    }
    return field;
  });

  const handleSubmit = async (data: FormValues) => {
    try {
      const quantity = typeof data.quantity === 'string' ? parseInt(data.quantity, 10) : data.quantity!;
      const measurement = typeof data.measurement_write === 'string' ? parseInt(data.measurement_write, 10) : data.measurement_write!;
      
      // Calculate the UZS price from USD and exchange rate
      const purchasePriceUSD = data.purchase_price_in_us;
      const exchangeRate = data.exchange_rate;
      const purchasePriceUZS = data.purchase_price_in_uz;

      const formattedData: CreateStockDTO = {
        store_write: typeof data.store_write === 'string' ? parseInt(data.store_write, 10) : data.store_write!,
        product_write: typeof data.product_write === 'string' ? parseInt(data.product_write, 10) : data.product_write!,
        purchase_price: purchasePriceUZS, // Send the UZS price as purchase_price
        purchase_price_in_us: purchasePriceUSD,
        exchange_rate: exchangeRate,
        purchase_price_in_uz: purchasePriceUZS,
        selling_price: data.selling_price!,
        min_price: data.min_price!,
        quantity: quantity,
        supplier_write: typeof data.supplier_write === 'string' ? parseInt(data.supplier_write, 10) : data.supplier_write!,
        color: data.color!,
        measurement_write: [{
          measurement_write: typeof measurement === 'number' ? measurement : measurement[0].measurement_write,
          number: quantity
        }]
      };

      console.log('Submitting data:', formattedData);
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
      <ResourceForm<FormValues>
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={createStock.isPending}
        title="Create New Stock"
        form={form}
      />
    </div>
  );
}
