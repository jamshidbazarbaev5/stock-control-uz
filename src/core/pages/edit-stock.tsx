import { useNavigate, useParams } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Stock } from '../api/stock';
import { useUpdateStock, useGetStocks } from '../api/stock';
import { useGetProducts, type Product } from '../api/product';
import { useGetStores, type Store } from '../api/store';
import { useGetMeasurements, type Measurement } from '../api/measurement';
import { useGetSuppliers, type Supplier } from '../api/supplier';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

type StockFormValues = {
  store_write: string;
  product_write: string;
  purchase_price_in_us: string;
  exchange_rate: string;
  purchase_price_in_uz: string;
  selling_price: string;
  min_price: string;
  quantity: string;
  supplier_write: string;
  color: string;
  measurement_write: string[];
};

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
    hidden: true, // Initially hidden until we check the product
  },
];

type MeasurementReadType = {
  measurement_read?: {
    id: number;
    measurement_name: string;
  };
};

export default function EditStock() {
  const { id } = useParams();
  const navigate = useNavigate();
  const updateStock = useUpdateStock();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Fetch the stock and dependencies
  const { data: stocksData, isLoading: isLoadingStocks } = useGetStocks({});
  const { data: productsData, isLoading: isLoadingProducts } = useGetProducts({});
  const { data: storesData, isLoading: isLoadingStores } = useGetStores({});
  const { data: measurementsData, isLoading: isLoadingMeasurements } = useGetMeasurements({});
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useGetSuppliers({});

  const isLoading = isLoadingStocks || isLoadingProducts || isLoadingStores || 
                    isLoadingMeasurements || isLoadingSuppliers;

  // Get the arrays from the responses with proper null checking
  const stocks = stocksData ? ('results' in stocksData ? stocksData.results : stocksData) : [];
  const products = productsData ? ('results' in productsData ? productsData.results : productsData) : [];
  const stores = storesData ? ('results' in storesData ? storesData.results : storesData) : [];
  const measurements = measurementsData ? ('results' in measurementsData ? measurementsData.results : measurementsData) : [];
  const suppliers = suppliersData ? ('results' in suppliersData ? suppliersData.results : suppliersData) : [];

  // Debug logging
  console.log('Products:', products);
  console.log('Stores:', stores);
  console.log('Suppliers:', suppliers);

  // Find the stock to edit
  const stock = stocks.find(s => s.id === Number(id));

  const form = useForm<StockFormValues>({
    // Set default values as soon as the form is initialized
    defaultValues: {
      store_write: stock?.store_read?.id?.toString() || '',
      product_write: stock?.product_read?.id?.toString() || '',
      measurement_write: stock?.measurement_read?.map((m: MeasurementReadType) => m.measurement_read?.id?.toString()) || [''],
      purchase_price_in_us: stock?.purchase_price_in_us?.toString() || '',
      exchange_rate: stock?.exchange_rate?.toString() || '',
      purchase_price_in_uz: stock?.purchase_price_in_uz?.toString() || '',
      selling_price: stock?.selling_price?.toString() || '',
      min_price: stock?.min_price?.toString() || '',
      quantity: stock?.quantity?.toString() || '',
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
    if (stock && !isLoading) {
      setSelectedProduct(stock.product_read);
      form.reset({
        store_write: stock.store_read?.id?.toString() || '',
        product_write: stock.product_read?.id?.toString() || '',
        measurement_write: stock.measurement_read?.map((m: MeasurementReadType) => m.measurement_read?.id?.toString()) || [''],
        purchase_price_in_us: stock.purchase_price_in_us?.toString() || '',
        exchange_rate: stock.exchange_rate?.toString() || '',
        purchase_price_in_uz: stock.purchase_price_in_uz?.toString() || '',
        selling_price: stock.selling_price?.toString() || '',
        min_price: stock.min_price?.toString() || '',
        quantity: stock.quantity?.toString() || '',
        supplier_write: stock.supplier_read?.id?.toString() || '',
        color: stock.color || ''
      });
    }
  }, [stock, isLoading, form]);

  // Update fields with product, store, measurement and supplier options
  const fields = stockFields.map(field => {
    const commonSelectProps = {
      type: 'select' as const,
      required: true,
    };

    switch(field.name) {
      case 'product_write':
        return {
          ...field,
          ...commonSelectProps,
          defaultValue: stock?.product_read?.id?.toString() || '',
          options: products
            .filter((product: Product) => product?.id != null)
            .map((product: Product) => ({
              value: product.id!.toString(),
              label: product.product_name || 'Unnamed Product'
            })),
          onChange: (value: string) => {
            const product = products.find((p: Product) => p.id === parseInt(value));
            setSelectedProduct(product);
          }
        };

      case 'store_write':
        return {
          ...field,
          ...commonSelectProps,
          defaultValue: stock?.store_read?.id?.toString() || '',
          options: stores
            .filter((store: Store) => store?.id != null)
            .map((store: Store) => ({
              value: store.id!.toString(),
              label: store.name || 'Unnamed Store'
            })),
        };

      case 'supplier_write':
        return {
          ...field,
          ...commonSelectProps,
          defaultValue: stock?.supplier_read?.id?.toString() || '',
          options: suppliers
            .filter((supplier: Supplier) => supplier?.id != null)
            .map((supplier: Supplier) => ({
              value: supplier.id!.toString(),
              label: supplier.name || 'Unnamed Supplier'
            })),
        };

      case 'measurement_write':
        return {
          ...field,
          ...commonSelectProps,
          defaultValue: stock?.measurement_read?.[0]?.measurement_read?.id?.toString() || '',
          options: measurements
            .filter((measurement: Measurement) => measurement?.id != null)
            .map((measurement: Measurement) => ({
              value: measurement.id!.toString(),
              label: measurement.measurement_name || 'Unnamed Measurement'
            })),
        };

      case 'color':
        return {
          ...field,
          hidden: !selectedProduct?.has_color
        };

      default:
        return field;
    }
  });

  // Debug the fields after mapping
  console.log('Mapped fields:', fields);
  
  // Debug select field options in detail
  const selectFields = fields.filter(f => f.type === 'select');
  console.log('Select fields:', selectFields.map(f => ({
    name: f.name,
    optionsCount: f.options?.length || 0,
    options: f.options
  })));

  const handleSubmit = async (data: StockFormValues) => {
    if (!stock?.id) return;

    try {
      const quantity = parseInt(data.quantity, 10);
      
      // Convert measurement strings to numbers and create measurement objects
      const measurements = (Array.isArray(data.measurement_write) ? data.measurement_write : [data.measurement_write])
        .filter((m: string) => m) // Filter out empty values
        .map((m: string) => ({
          measurement_write: parseInt(m, 10),
          number: quantity
        }));

      // Calculate the UZS price from USD and exchange rate
      const priceInUSD = parseFloat(data.purchase_price_in_us);
      const exchangeRate = parseFloat(data.exchange_rate);
      const priceInUZS = (priceInUSD * exchangeRate).toString();

      // Format the data for the API
      const formattedData: Stock = {
        id: stock.id,
        store_write: parseInt(data.store_write, 10),
        product_write: parseInt(data.product_write, 10),
        purchase_price: priceInUZS,
        selling_price: data.selling_price,
        min_price: data.min_price,
        quantity: quantity,
        supplier_write: parseInt(data.supplier_write, 10),
        color: data.color,
        measurement_write: measurements,
        purchase_price_in_us: data.purchase_price_in_us,
        exchange_rate: data.exchange_rate,
        purchase_price_in_uz: priceInUZS
      };

      await updateStock.mutateAsync(formattedData);
      toast.success('Stock updated successfully');
      navigate('/stock');
    } catch (error) {
      toast.error('Failed to update stock');
      console.error('Failed to update stock:', error);
    }
  };

  if (!stock || isLoading || !products.length || !stores.length || !suppliers.length) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Stock</h1>
      <ResourceForm<StockFormValues>
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={updateStock.isPending}
        title="Edit Stock"
        form={form}
      />
    </div>
  );
}
