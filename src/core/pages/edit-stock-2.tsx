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
import api from '../api/api';
import axios from 'axios';
import { getAccessToken } from '../api/auth';

interface FormValues extends Partial<Stock> {
  purchase_price_in_us: string;
  exchange_rate: string;
  purchase_price_in_uz: string;
  date_of_arrived: string;
  income_weight?: string;
  selling_price_us?: string; // Added for has_kub calculation
  price_per_tone?: string; // Added for is_list products
}

export default function EditStock() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoadingAllProducts, setIsLoadingAllProducts] = useState(false);
  const [currency, setCurrency] = useState<{ id: number; currency_rate: string } | null>(null);
  const [_currencyLoading, setCurrencyLoading] = useState(true);
  
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
      date_of_arrived: '',
      income_weight: ''
    }
  });

  // Fetch currency rate on mount
  useEffect(() => {
    const fetchCurrency = async () => {
      setCurrencyLoading(true);
      try {
        const token = getAccessToken();
        const res = await axios.get('https://stock-control.uz/api/v1/items/currency/', {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        if (res.data.results && res.data.results.length > 0) {
          setCurrency(res.data.results[0]);
          form.setValue('exchange_rate', res.data.results[0].currency_rate);
        }
      } catch (e) {
        setCurrency(null);
      } finally {
        setCurrencyLoading(false);
      }
    };
    fetchCurrency();
    // eslint-disable-next-line
  }, []);

  // Watch specific fields for changes
  const usdPrice = form.watch('purchase_price_in_us');
  // const exchangeRate = form.watch('exchange_rate');
  const exchangeRateValue = currency?.currency_rate || '';
  // const incomeWeight = form.watch('income_weight' as any) as string | undefined;

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
    if (usdPrice && exchangeRateValue) {
      const priceInUSD = parseFloat(usdPrice);
      const rate = parseFloat(exchangeRateValue);
      // const quantityString = form.watch('quantity')?.toString() || '0';
      // const quantity = parseFloat(quantityString);
      if (!isNaN(priceInUSD) && !isNaN(rate)) {
        const calculatedPrice = priceInUSD * rate;
        form.setValue('purchase_price_in_uz', calculatedPrice.toString(), {
          shouldValidate: false,
          shouldDirty: true
        });
        // Calculate per unit price (optional, for helper text)
        // if (!isNaN(quantity) && quantity > 0) {
        //   const perUnit = calculatedPrice / quantity;
        //   setPerUnitPrice(perUnit);
        // } else {
        //   setPerUnitPrice(null);
        // }
      }
    }
  }, [usdPrice, exchangeRateValue, form, form.watch('quantity')]);

  // Watch income_weight and price_per_tone for is_list products
  const pricePerTone = form.watch('price_per_tone' as any) as string | undefined;
  useEffect(() => {
    if (selectedProduct?.is_list) {
      const weight = typeof form.watch('income_weight' as any) === 'string' ? parseFloat(form.watch('income_weight' as any)) : Number(form.watch('income_weight' as any));
      const staticWeight = selectedProduct.static_weight || 0;
      if (!isNaN(weight) && staticWeight) {
        form.setValue('quantity', (weight * staticWeight).toString() as any);
      } else {
        form.setValue('quantity', '' as any);
      }
      // Set purchase_price_in_us as price_per_tone * income_weight
      const price = typeof pricePerTone === 'string' ? parseFloat(pricePerTone) : Number(pricePerTone);
      if (!isNaN(price) && !isNaN(weight)) {
        form.setValue('purchase_price_in_us', (price * weight).toString());
      } else {
        form.setValue('purchase_price_in_us', '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('income_weight' as any), pricePerTone, selectedProduct]);

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
        // Use exchange_rate_read.currency_rate if available (type assertion)
        exchange_rate: (stock as any).exchange_rate_read?.currency_rate?.toString() || '',
        purchase_price_in_uz: stock.purchase_price_in_uz?.toString() || '',
        selling_price: stock.selling_price?.toString() || '',
        min_price: stock.min_price?.toString() || '',
        quantity: stock.quantity || 0,
        supplier_write: stock.supplier_read?.id ? Number(stock.supplier_read.id) : undefined,
        date_of_arrived: new Date(stock.date_of_arrived || '').toISOString().slice(0, 16),
        income_weight: stock.income_weight?.toString(),
        selling_price_us: stock.selling_price_in_us?.toString() || '', // Set from backend
        price_per_tone: (stock as any).price_per_ton?.toString() || '', // Set from backend if present
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
  let stockFields = [
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
      name: 'selling_price_us',
      label: t('common.enter_selling_price_usd') || 'Selling Price (USD)',
      type: 'text',
      placeholder: t('common.enter_selling_price_usd') || 'Enter selling price in USD',
      required: selectedProduct?.has_kub || false,
      hidden: !selectedProduct?.has_kub,
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

  // Add dynamic fields for is_list products
  if (selectedProduct?.is_list) {
    // Only add income_weight field if income_weight is NOT null
    if (stock?.income_weight !== null && stock?.income_weight !== undefined) {
      const quantityIndex = stockFields.findIndex(f => f.name === 'quantity');
      if (quantityIndex !== -1) {
        // Add price_per_tone before income_weight (no onChange)
        stockFields.splice(quantityIndex, 0, {
          name: 'price_per_tone',
          label: t('common.price_per_tone') || 'Price per Tone',
          type: 'number',
          placeholder: t('common.enter_price_per_tone') || 'Enter price per tone',
          required: true,
        });
        stockFields.splice(quantityIndex + 1, 0, {
          name: 'income_weight',
          label: t('common.income_weight') || 'Income Weight',
          type: 'number',
          placeholder: t('common.enter_income_weight') || 'Enter income weight',
          required: true,
        });
        // Make quantity readOnly if supported
        const quantityField = stockFields.find(f => f.name === 'quantity');
        if (quantityField) {
          (quantityField as any).readOnly = true;
        }
      }
    } else {
      // If income_weight is null, ensure quantity is editable
      const quantityField = stockFields.find(f => f.name === 'quantity');
      if (quantityField) {
        (quantityField as any).readOnly = false;
      }
    }
  }

  // Hide USD and exchange rate fields if has_metr or has_shtuk
  let hideUsdFields = selectedProduct?.has_metr || selectedProduct?.has_shtuk;
  const fields = stockFields.map(field => {
    if (field.name === 'product_write') {
      let productOptions = allProducts;
      if (stock?.product_read && stock.product_read.id && !allProducts.some(p => p.id === stock?.product_read?.id)) {
        productOptions = [stock.product_read, ...allProducts];
      }
      // Remove duplicates by id
      const uniqueProductOptions = productOptions.filter((product, idx, arr) =>
        arr.findIndex(p => p.id === product.id) === idx
      );
      return {
        ...field,
        options: uniqueProductOptions.map(product => ({
          value: product.id,
          label: product.product_name
        })),
        isLoading: isLoadingAllProducts,
        onChange: (value: number) => {
          const product = uniqueProductOptions.find(p => p.id === value);
          setSelectedProduct(product);
        }
      };
    }
    if (field.name === 'store_write') {
      let storeOptions = stores.filter(store => store.is_main);
      if (stock?.store_read && stock.store_read.id && !storeOptions.some(s => s.id === stock?.store_read?.id)) {
        const apiStore = {
          id: stock.store_read.id,
          name: stock.store_read.name,
          address: stock.store_read.address || '',
          phone_number: stock.store_read.phone_number || '',
          created_at: stock.store_read.created_at || '',
          is_main: stock.store_read.is_main || false,
          parent_store: stock.store_read.parent_store ?? undefined,
          budget: (stock.store_read as any).budget || '',
          color: (stock.store_read as any).color || '',
          owner: (stock.store_read as any).owner || 0,
        };
        storeOptions = [apiStore, ...storeOptions];
      }
      // Remove duplicates by id
      const uniqueStoreOptions = storeOptions.filter((store, idx, arr) =>
        arr.findIndex(s => s.id === store.id) === idx
      );
      return {
        ...field,
        options: uniqueStoreOptions.map(store => ({
          value: store.id,
          label: store.name
        })),
        isLoading: storesLoading
      };
    }
    if (field.name === 'supplier_write') {
      let supplierOptions = suppliers;
      if (stock?.supplier_read && stock.supplier_read.id && !suppliers.some(s => s.id === stock?.supplier_read?.id)) {
        supplierOptions = [stock.supplier_read, ...suppliers];
      }
      // Remove duplicates by id
      const uniqueSupplierOptions = supplierOptions.filter((supplier, idx, arr) =>
        arr.findIndex(s => s.id === supplier.id) === idx
      );
      return {
        ...field,
        options: uniqueSupplierOptions.map(supplier => ({
          value: supplier.id,
          label: supplier.name
        })),
        isLoading: suppliersLoading
      };
    }
    // ...existing code for hiding fields and placeholders...
    if (hideUsdFields && [
      'exchange_rate',
      'purchase_price_in_us',
      'selling_price_us',
    ].includes(field.name)) {
      return { ...field, hidden: true };
    }
    if (field.name === 'purchase_price_in_uz') {
      return {
        ...field,
        readOnly: !(hideUsdFields),
        required: true,
        placeholder: t('common.enter_purchase_price_uzs') || 'Введите цену покупки в UZS',
      };
    }
    if (field.name === 'quantity') {
      let placeholder = field.placeholder;
      if (selectedProduct?.has_shtuk) {
        placeholder = t('common.enter_quantity') || 'Введите штук';
      } else if (selectedProduct?.has_metr) {

       placeholder = t('common.enter_quantity') || 'Введите метр';
      }
      return {
        ...field,
        placeholder,
      };
    }
    return field;
  });

  const handleSubmit = async (data: FormValues) => {
    if (!id) return;
    try {
      // Build payload only with typed fields
      const formattedData: any = {
        id: Number(id),
        store_write: typeof data.store_write === 'string' ? parseInt(data.store_write, 10) : data.store_write!,
        product_write: typeof data.product_write === 'string' ? parseInt(data.product_write, 10) : data.product_write!,
        purchase_price: data.purchase_price_in_uz !== '' ? String(data.purchase_price_in_uz) : undefined,
        purchase_price_in_uz: data.purchase_price_in_uz !== '' ? String(data.purchase_price_in_uz) : undefined,
        selling_price: data.selling_price !== '' ? String(data.selling_price) : undefined,
        min_price: data.min_price !== '' ? String(data.min_price) : undefined,
        quantity: typeof data.quantity === 'string' ? parseFloat(data.quantity) : data.quantity!,
        supplier_write: typeof data.supplier_write === 'string' ? parseInt(data.supplier_write, 10) : data.supplier_write!,
        date_of_arrived: data.date_of_arrived,
        measurement_write: [],
        ...(data.income_weight ? { income_weight: data.income_weight } : {})
      };
      if (data.purchase_price_in_us && data.purchase_price_in_us !== '') {
        formattedData.purchase_price_in_us = String(data.purchase_price_in_us);
      }
      // Add price_per_ton if present
      if ((data as any).price_per_tone && (data as any).price_per_tone !== '') {
        formattedData.price_per_ton = String((data as any).price_per_tone);
      }
      if (data.exchange_rate && data.exchange_rate !== '') {
        formattedData.exchange_rate = currency ? currency.id.toString() : '';
      }
      if (data.selling_price_us && data.selling_price_us !== '') {
        formattedData.selling_price_in_us = String(data.selling_price_us);
      }
      // Remove undefined fields
      Object.keys(formattedData).forEach(key => formattedData[key] === undefined && delete formattedData[key]);
      await updateStock.mutateAsync(formattedData);
      toast.success(t('messages.success.updated', { item: t('navigation.stock') }));
      navigate('/stock');
    } catch (error) {
      toast.error(t('messages.error.update', { item: t('navigation.stock') }));
      console.error('Failed to update stock:', error);
    }
  };

  // Fetch all products across all pages
  useEffect(() => {
    async function fetchAllProducts() {
      setIsLoadingAllProducts(true);
      let results: any[] = [];
      let page = 1;
      let hasMore = true;
      try {
        while (hasMore) {
          const response = await api.get('items/product/', { params: { page } });
          const data = response.data;
          results = results.concat(data.results || []);
          if (!data.links?.next) {
            hasMore = false;
          } else {
            page++;
          }
        }
        setAllProducts(results);
      } catch (error) {
        toast.error(t('messages.error.load', { item: t('navigation.products') }));
      } finally {
        setIsLoadingAllProducts(false);
      }
    }
    fetchAllProducts();
  }, []);

  // Effect to update selling_price and min_price for has_kub products
  useEffect(() => {
    if (selectedProduct?.has_kub && !selectedProduct?.has_metr && !selectedProduct.has_shtuk) {
      const measurements = selectedProduct.measurement || [];
      const baseValue = measurements.reduce((acc: number, m: any) => {
        const num = parseFloat(m.number);
        return !isNaN(num) ? acc * num : acc;
      }, 1);
      const exchangeRate = parseFloat(form.watch('exchange_rate')?.toString() || currency?.currency_rate || '0');
      // const exchangeRate = exchangeRatee / 10
      const sellingPriceUs = parseFloat(form.watch('selling_price_us')?.toString() || '0');
      const purchasePriceUs = parseFloat(form.watch('purchase_price_in_us')?.toString() || '0');
      if (!isNaN(baseValue) && !isNaN(exchangeRate) && !isNaN(sellingPriceUs) && !isNaN(purchasePriceUs)) {
        const calculatedSelling = baseValue * exchangeRate * sellingPriceUs;
        const calculatedMin = baseValue * exchangeRate * purchasePriceUs;
        form.setValue('selling_price', calculatedSelling.toFixed(2), { shouldValidate: false, shouldDirty: true });
        form.setValue('min_price', calculatedMin.toFixed(2), { shouldValidate: false, shouldDirty: true });
      } else {
        form.setValue('selling_price', '', { shouldValidate: false, shouldDirty: true });
        form.setValue('min_price', '', { shouldValidate: false, shouldDirty: true });
      }
    }
  }, [selectedProduct, form.watch('exchange_rate'), form.watch('selling_price_us'), form.watch('purchase_price_in_us')]);

  if (stockLoading || productsLoading || storesLoading || suppliersLoading || isLoadingAllProducts) {
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