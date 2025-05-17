import { useNavigate, useParams } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Stock } from '../api/stock';
import { useUpdateStock, useGetStocks } from '../api/stock';
import { useGetProducts } from '../api/product';
import { useGetStores } from '../api/store';
import { useGetMeasurements } from '../api/measurement';
import { useGetSuppliers } from '../api/supplier';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface FormValues extends Partial<Stock> {
  purchase_price_in_us: string;
  exchange_rate: string;
  purchase_price_in_uz: string;
}

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

export default function EditStock() {
  const { id } = useParams();
  const navigate = useNavigate();
  const updateStock = useUpdateStock();
  
  // Fetch the stock and dependencies
  const { data: stocksData, isLoading: isLoadingStocks } = useGetStocks({});
  const { data: productsData, isLoading: isLoadingProducts } = useGetProducts({});
  const { data: storesData, isLoading: isLoadingStores } = useGetStores({});
  const { data: measurementsData, isLoading: isLoadingMeasurements } = useGetMeasurements({});
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useGetSuppliers({});

  const isLoading = isLoadingStocks || isLoadingProducts || isLoadingStores || 
                    isLoadingMeasurements || isLoadingSuppliers;

  // Get the arrays from the responses
  const stocks = Array.isArray(stocksData) ? stocksData : [];
  const products = Array.isArray(productsData) ? productsData : productsData?.results || [];
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const measurements = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];
  const suppliers = Array.isArray(suppliersData) ? suppliersData : suppliersData?.results || [];

  // Find the stock to edit
  const stock = stocks.find(s => s.id === Number(id));

  console.log('Current stock:', stock);
  console.log('Current stores:', stores);
  console.log('Current measurements:', measurements);
  
  const form = useForm<FormValues>({
    defaultValues: {
      store_write: stock?.store_read?.id?.toString() || '',
      product_write: stock?.product_read?.id?.toString() || '',
      measurement_write: stock?.measurement_read?.[0]?.measurement_read?.id?.toString() || '',
      purchase_price_in_us: stock?.purchase_price_in_us?.toString() || '0',
      exchange_rate: stock?.exchange_rate?.toString() || '0',
      purchase_price_in_uz: stock?.purchase_price_in_uz?.toString() || '0',
      selling_price: stock?.selling_price?.toString() || '0',
      min_price: stock?.min_price?.toString() || '0',
      quantity: stock?.quantity?.toString() || '0',
      supplier_write: stock?.supplier_read?.id?.toString() || '',
      color: stock?.color || ''
    }
  });

  // Watch specific fields for changes
  const usdPrice = form.watch('purchase_price_in_us');
  const exchangeRate = form.watch('exchange_rate');

  // Update UZS price when USD price or exchange rate changes
  useEffect(() => {
    if (usdPrice && exchangeRate) {
      const priceInUSD = parseFloat(usdPrice);
      const rate = parseFloat(exchangeRate);
      
      if (!isNaN(priceInUSD) && !isNaN(rate)) {
        const calculatedPrice = priceInUSD * rate;
        form.setValue('purchase_price_in_uz', calculatedPrice.toString(), {
          shouldValidate: false,
          shouldDirty: true
        });
      }
    }
  }, [usdPrice, exchangeRate, form]);

  // Update form values when stock data is loaded
  useEffect(() => {
    if (stock) {
      console.log('Setting form values for stock:', stock);
      const values = {
        store_write: stock.store_read?.id?.toString() || '',
        product_write: stock.product_read?.id?.toString() || '',
        measurement_write: stock.measurement_read?.[0]?.measurement_read?.id?.toString() || '',
        purchase_price_in_us: stock.purchase_price_in_us?.toString() || '0',
        exchange_rate: stock.exchange_rate?.toString() || '0',
        purchase_price_in_uz: stock.purchase_price_in_uz?.toString() || '0',
        selling_price: stock.selling_price?.toString() || '0',
        min_price: stock.min_price?.toString() || '0',
        quantity: stock.quantity?.toString() || '0',
        supplier_write: stock.supplier_read?.id?.toString() || '',
        color: stock.color || ''
      };

      Object.entries(values).forEach(([key, value]) => {
        form.setValue(key as keyof FormValues, value);
      });
    }
  }, [stock, form]);

  // Update fields with product, store, measurement and supplier options
  const fields = stockFields.map(field => {
    if (field.name === 'product_write') {
      const productOptions = products.map(product => ({
        value: product.id?.toString() || '',
        label: product.product_name
      })).filter(opt => opt.value);
      console.log('Product options:', productOptions);
      return {
        ...field,
        options: productOptions
      };
    }
    if (field.name === 'store_write') {
      const storeOptions = stores.map(store => ({
        value: store.id?.toString() || '',
        label: store.name
      })).filter(opt => opt.value);
      console.log('Store options:', storeOptions);
      return {
        ...field,
        options: storeOptions
      };
    }
    if (field.name === 'measurement_write') {
      const measurementOptions = measurements.map(measurement => ({
        value: measurement.id?.toString() || '',
        label: measurement.measurement_name
      })).filter(opt => opt.value);
      console.log('Measurement options:', measurementOptions);
      return {
        ...field,
        options: measurementOptions
      };
    }
    if (field.name === 'supplier_write') {
      const supplierOptions = suppliers.map(supplier => ({
        value: supplier.id?.toString() || '',
        label: supplier.name
      })).filter(opt => opt.value);
      console.log('Supplier options:', supplierOptions);
      return {
        ...field,
        options: supplierOptions
      };
    }
    return field;
  });

  const handleSubmit = async (data: FormValues) => {
    if (!stock?.id) return;

    try {
      const quantity = typeof data.quantity === 'string' ? parseInt(data.quantity, 10) : data.quantity!;
      const measurement = typeof data.measurement_write === 'string' ? parseInt(data.measurement_write, 10) : data.measurement_write!;
      
      // Calculate the UZS price from USD and exchange rate
      const priceInUSD = parseFloat(data.purchase_price_in_us);
      const exchangeRate = parseFloat(data.exchange_rate);
      const priceInUZS = (priceInUSD * exchangeRate).toString();

      // Format the data for the API
      const formattedData: Stock = {
        id: stock.id,
        store_write: typeof data.store_write === 'string' ? parseInt(data.store_write, 10) : data.store_write!,
        product_write: typeof data.product_write === 'string' ? parseInt(data.product_write, 10) : data.product_write!,
        purchase_price: priceInUZS,
        selling_price: data.selling_price!,
        min_price: data.min_price!,
        quantity: quantity,
        supplier_write: typeof data.supplier_write === 'string' ? parseInt(data.supplier_write, 10) : data.supplier_write!,
        color: data.color!,
        measurement_write: [{
          measurement_write: typeof measurement === 'number' ? measurement : measurement[0].measurement_write,
          number: quantity
        }],
        purchase_price_in_us: data.purchase_price_in_us || '0',
        exchange_rate: data.exchange_rate || '0',
        purchase_price_in_uz: priceInUZS
      };

      await updateStock.mutateAsync(formattedData);
      toast.success('Stock updated successfully');
      navigate('/stocks');
    } catch (error) {
      toast.error('Failed to update stock');
      console.error('Failed to update stock:', error);
    }
  };

  if (!stock || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Stock</h1>
      <ResourceForm<FormValues>
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={updateStock.isPending}
        title="Edit Stock"
        form={form}
      />
    </div>
  );
}
