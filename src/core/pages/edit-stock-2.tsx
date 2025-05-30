import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Stock } from '../api/stock';
import { useGetStock, useUpdateStock } from '../api/stock';
import { useGetProducts } from '../api/product';
import { useGetStores } from '../api/store';
import { useGetSuppliers } from '../api/supplier';

interface FormValues extends Partial<Stock> {
  purchase_price_in_us: string;
  exchange_rate: string;
  purchase_price_in_uz: string;
  date_of_arrived: string;
}

export default function EditStock() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Fetch the stock and related data
  const { data: stock, isLoading: stockLoading } = useGetStock(Number(id));
  const { data: productsData, isLoading: productsLoading } = useGetProducts({});
  const { data: storesData, isLoading: storesLoading } = useGetStores({});
  const { data: suppliersData, isLoading: suppliersLoading } = useGetSuppliers({});
  const updateStock = useUpdateStock();

  const form = useForm<FormValues>({
    defaultValues: {
      purchase_price_in_us: '',
      exchange_rate: '',
      purchase_price_in_uz: '',
      date_of_arrived: ''
    }
  });

  // Watch specific fields for changes
  const usdPrice = form.watch('purchase_price_in_us');
  const exchangeRate = form.watch('exchange_rate');

  // Get the arrays from response data
  const products = Array.isArray(productsData) ? productsData : productsData?.results || [];
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const suppliers = Array.isArray(suppliersData) ? suppliersData : suppliersData?.results || [];

  console.log('Data loaded:', { 
    productsCount: products.length, 
    storesCount: stores.length, 
    suppliersCount: suppliers.length,
    productsLoading,
    storesLoading,
    suppliersLoading
  });

  // Effect to update purchase_price_in_uz when its dependencies change
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

  // Load stock data when it's available and related data is loaded
  useEffect(() => {
    if (stock && products.length && stores.length && suppliers.length) {
      console.log('Raw stock data:', stock);
      console.log('Available products:', products);
      console.log('Available stores:', stores);
      console.log('Available suppliers:', suppliers);
      
      // Convert values to appropriate types for the form
      const formValues: FormValues = {
        store_write: stock.store_read?.id ? Number(stock.store_read.id) : undefined,
        product_write: stock.product_read?.id ? Number(stock.product_read.id) : undefined,
        purchase_price_in_us: stock.purchase_price_in_us?.toString() || '',
        exchange_rate: stock.exchange_rate?.toString() || '',
        purchase_price_in_uz: stock.purchase_price_in_uz?.toString() || '',
        selling_price: stock.selling_price?.toString() || '',
        min_price: stock.min_price?.toString() || '',
        quantity: stock.quantity || 0,
        supplier_write: stock.supplier_read?.id ? Number(stock.supplier_read.id) : undefined,
        date_of_arrived: new Date(stock.date_of_arrived || '').toISOString().slice(0, 16)
      };

      console.log('Setting form values:', formValues);
      form.reset(formValues);
      setSelectedProduct(stock.product_read);
      
      // Directly set values after a brief delay to ensure the UI updates
      setTimeout(() => {
        if (stock.store_read?.id) form.setValue('store_write', Number(stock.store_read.id));
        if (stock.product_read?.id) form.setValue('product_write', Number(stock.product_read.id));
        if (stock.supplier_read?.id) form.setValue('supplier_write', Number(stock.supplier_read.id));
        
        // Force re-render select components by triggering a change event
        document.querySelectorAll('select').forEach(select => {
          const event = new Event('change', { bubbles: true });
          select.dispatchEvent(event);
        });
      }, 100);
      
      console.log('Form reset with data:', {
        stock,
        products: products.length,
        stores: stores.length,
        suppliers: suppliers.length
      });
    }
  }, [stock, products, stores, suppliers, form]);

  // Define stock fields with translations
  const stockFields = [
    {
      name: 'store_write',
      label: t('common.store'),
      type: 'select',
      placeholder: t('common.select_store'),
      required: true,
      options: [], // Will be populated with stores
    },
    {
      name: 'product_write',
      label: t('common.product'),
      type: 'select',
      placeholder: t('common.product'),
      required: true,
      options: [], // Will be populated with products
    },
    {
      name: 'purchase_price_in_us',
      label: t('common.enter_purchase_price_usd'),
      type: 'text',
      placeholder: t('common.enter_purchase_price_usd'),
      required: true,
    },
    {
      name: 'exchange_rate',
      label: t('common.enter_exchange_rate'),
      type: 'text',
      placeholder: t('common.enter_exchange_rate'),
      required: true,
    },
    {
      name: 'purchase_price_in_uz',
      label: t('common.calculated_purchase_price_uzs'),
      type: 'text',
      placeholder: t('common.calculated_purchase_price_uzs'),
      readOnly: true,
    },
    {
      name: 'selling_price',
      label: t('common.enter_selling_price'),
      type: 'text',
      placeholder: t('common.enter_selling_price'),
      required: true,
    },
    {
      name: 'min_price',
      label: t('common.enter_minimum_price'),
      type: 'text',
      placeholder: t('common.enter_minimum_price'),
      required: true,
    },
    {
      name: 'date_of_arrived',
      label: t('common.date_of_arrival'),
      type: 'datetime-local',
      placeholder: t('common.enter_arrival_date'),
      required: true,
    },
    {
      name: 'quantity',
      label: t('common.quantity'),
      type: 'text',
      placeholder: t('common.enter_quantity'),
      required: true,
    },
    {
      name: 'supplier_write',
      label: t('common.supplier'),
      type: 'select',
      placeholder: t('common.select_supplier'),
      required: true,
      options: [], // Will be populated with suppliers
    },
  ];

  // Update fields with product, store, and supplier options
  const fields = stockFields.map(field => {
    if (field.name === 'product_write') {
      return {
        ...field,
        options: products.map(product => ({
          value: product.id,
          label: product.product_name
        })),
        isLoading: productsLoading,
        onChange: (value: number) => {
          const product = products.find(p => p.id === value);
          setSelectedProduct(product);
        }
      };
    }
    if (field.name === 'store_write') {
      return {
        ...field,
        options: stores
          .filter(store => store.is_main) // Only show main stores
          .map(store => ({
            value: store.id,
            label: store.name
          })),
        isLoading: storesLoading
      };
    }
    if (field.name === 'supplier_write') {
      return {
        ...field,
        options: suppliers.map(supplier => ({
          value: supplier.id,
          label: supplier.name
        })),
        isLoading: suppliersLoading
      };
    }
    if (field.name === 'color') {
      return {
        ...field,
        hidden: !selectedProduct?.has_color
      };
    }
    return field;
  });

  const handleSubmit = async (data: FormValues) => {
    if (!id) return;

    try {
      const quantity = typeof data.quantity === 'string' ? parseInt(data.quantity, 10) : data.quantity!;
      
      // Format data for API
      const formattedData: Stock = {
        id: Number(id),
        store_write: typeof data.store_write === 'string' ? parseInt(data.store_write, 10) : data.store_write!,
        product_write: typeof data.product_write === 'string' ? parseInt(data.product_write, 10) : data.product_write!,
        purchase_price: data.purchase_price_in_uz, // Send the UZS price as purchase_price
        purchase_price_in_us: data.purchase_price_in_us,
        exchange_rate: data.exchange_rate,
        purchase_price_in_uz: data.purchase_price_in_uz,
        selling_price: data.selling_price!,
        min_price: data.min_price!,
        quantity: quantity,
        supplier_write: typeof data.supplier_write === 'string' ? parseInt(data.supplier_write, 10) : data.supplier_write!,
        date_of_arrived: data.date_of_arrived,
        measurement_write: []
      };

      await updateStock.mutateAsync(formattedData);
      toast.success(t('messages.success.updated', { item: t('navigation.stock') }));
      navigate('/stock');
    } catch (error) {
      toast.error(t('messages.error.update', { item: t('navigation.stock') }));
      console.error('Failed to update stock:', error);
    }
  };

  if (stockLoading || productsLoading || storesLoading || suppliersLoading) {
    return <div className="container mx-auto py-8 px-4">{t('common.loading')}</div>;
  }

  if (!stock || !products.length || !stores.length || !suppliers.length) {
    return <div className="container mx-auto py-8 px-4">{t('messages.error.not_found')}</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<FormValues>
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={updateStock.isPending}
        title={t('common.edit_stock')}
        form={form}
      />
    </div>
  );
}