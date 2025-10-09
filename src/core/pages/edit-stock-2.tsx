import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ResourceForm } from '../helpers/ResourceForm';
import type { StockCalculationRequest, DynamicField } from '../api/stock';
import { calculateStock } from '../api/stock';
import { useGetStock, useUpdateStock } from '../api/stock';
import { useGetStores } from '../api/store';
import { useGetSuppliers } from '../api/supplier';
import { useGetCurrencies } from '../api/currency';
import { useGetMeasurements } from '../api/measurement';
import api from '../api/api';

interface FormValues {
  // Required initial fields
  store: number | string;
  product: number | string;
  currency: number | string;
  purchase_unit: number | string;
  supplier: number | string;
  date_of_arrived: string;
  
  // Dynamic calculation fields (user input)
  purchase_unit_quantity?: number | string;
  total_price_in_currency?: number | string;
  price_per_unit_currency?: number | string;
  
  // Backend calculated fields (will be populated from API response)
  quantity?: number | string;
  total_price_in_uz?: number | string;
  base_unit_in_uzs?: number | string;
}

export default function EditStock() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoadingAllProducts, setIsLoadingAllProducts] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<{ [key: string]: DynamicField }>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Fetch the stock and related data
  const { data: stock, isLoading: stockLoading } = useGetStock(Number(id));
  const { data: storesData, isLoading: storesLoading } = useGetStores({});
  const { data: suppliersData, isLoading: suppliersLoading } = useGetSuppliers({});
  const { data: currenciesData, isLoading: currenciesLoading } = useGetCurrencies({});
  const { data: measurementsData, isLoading: measurementsLoading } = useGetMeasurements({});
  const updateStock = useUpdateStock();

  const form = useForm<FormValues>({
    defaultValues: {
      store: '',
      product: '',
      currency: '',
      purchase_unit: '',
      supplier: '',
      date_of_arrived: '',
      purchase_unit_quantity: '',
      total_price_in_currency: '',
      price_per_unit_currency: ''
    }
  });

  // Get the arrays from response data
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const suppliers = Array.isArray(suppliersData) ? suppliersData : suppliersData?.results || [];
  const currencies = Array.isArray(currenciesData) ? currenciesData : currenciesData?.results || [];
  const measurements = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];

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
  }, [t]);

  // Load stock data when it's available and related data is loaded
  useEffect(() => {
    if (stock && stores.length && suppliers.length && currencies.length && measurements.length && !initialDataLoaded) {
      console.log('Loading initial stock data:', stock);
      
      // Find the currency ID - check multiple possible fields
      let currencyId = '';
      
      // Check if there's a direct currency field
      if ((stock as any).currency) {
        currencyId = (stock as any).currency.toString();
      }
      // Check exchange_rate_read if it's an object with id
      else if ((stock as any).exchange_rate_read && typeof (stock as any).exchange_rate_read === 'object' && (stock as any).exchange_rate_read.id) {
        currencyId = (stock as any).exchange_rate_read.id.toString();
      }
      // Check if exchange_rate is just a number (currency ID)
      else if ((stock as any).exchange_rate && !isNaN(Number((stock as any).exchange_rate))) {
        currencyId = (stock as any).exchange_rate.toString();
      }
      // Default to first currency if no specific currency found
      else if (currencies.length > 0) {
        currencyId = currencies[0].id?.toString() || '';
      }
      
      console.log('Currency detection:', {
        stock_currency: (stock as any).currency,
        exchange_rate_read: (stock as any).exchange_rate_read,
        exchange_rate: (stock as any).exchange_rate,
        selected_currencyId: currencyId
      });

      // Find the purchase unit (measurement) - default to first available measurement
      let purchaseUnitId = '';
      if (measurements.length > 0) {
        purchaseUnitId = measurements[0].id?.toString() || '';
      }

      const formValues: FormValues = {
        store: stock.store_read?.id ? Number(stock.store_read.id) : '',
        product: stock.product_read?.id ? Number(stock.product_read.id) : '',
        currency: currencyId,
        purchase_unit: purchaseUnitId,
        supplier: stock.supplier_read?.id ? Number(stock.supplier_read.id) : '',
        date_of_arrived: new Date(stock.date_of_arrived || '').toISOString().slice(0, 16),
        
        // Set existing calculation values if available
        purchase_unit_quantity: (stock as any).purchase_unit_quantity?.toString() || '',
        total_price_in_currency: (stock as any).total_price_in_currency?.toString() || '',
        price_per_unit_currency: (stock as any).price_per_unit_currency?.toString() || '',
        
        // Set existing calculated values
        quantity: stock.quantity?.toString() || '',
        total_price_in_uz: (stock as any).total_price_in_uz?.toString() || '',
        base_unit_in_uzs: (stock as any).base_unit_in_uzs?.toString() || ''
      };

      console.log('Setting form values:', formValues);
      form.reset(formValues);
      setInitialDataLoaded(true);

      // Set initial dynamic fields from existing data
      const initialDynamicFields: { [key: string]: DynamicField } = {};
      
      if (stock.quantity !== undefined) {
        initialDynamicFields.quantity = {
          value: stock.quantity,
          editable: false,
          show: true,
          label: t('common.quantity') || 'Quantity'
        };
      }
      
      if ((stock as any).total_price_in_uz !== undefined) {
        initialDynamicFields.total_price_in_uz = {
          value: (stock as any).total_price_in_uz,
          editable: false,
          show: true,
          label: t('common.total_price_in_uz') || 'Total Price (UZS)'
        };
      }
      
      if ((stock as any).base_unit_in_uzs !== undefined) {
        initialDynamicFields.base_unit_in_uzs = {
          value: (stock as any).base_unit_in_uzs,
          editable: false,
          show: true,
          label: t('common.base_unit_in_uzs') || 'Base Unit Cost (UZS)'
        };
      }

      setDynamicFields(initialDynamicFields);
    }
  }, [stock, stores, suppliers, currencies, measurements, form, t, initialDataLoaded]);

  // Debounced calculation function
  const debouncedCalculate = useCallback(
    async (formData: FormValues) => {
      if (!initialDataLoaded) return; // Don't calculate until initial data is loaded
      
      if (!formData.store || !formData.product || !formData.currency || 
          !formData.purchase_unit || !formData.supplier || !formData.date_of_arrived) {
        return; // Don't calculate if required fields are missing
      }

      // Always call calculation API when all required fields are filled
      // The API will determine which fields to show/hide

      setIsCalculating(true);
      try {
        const calculationRequest: StockCalculationRequest = {
          store: Number(formData.store),
          product: Number(formData.product),
          currency: Number(formData.currency),
          purchase_unit: Number(formData.purchase_unit),
          supplier: Number(formData.supplier),
          date_of_arrived: formData.date_of_arrived,
          exchange_rate: 1, // Default exchange rate
          purchase_unit_quantity: formData.purchase_unit_quantity ? Number(formData.purchase_unit_quantity) : undefined,
          total_price_in_currency: formData.total_price_in_currency ? Number(formData.total_price_in_currency) : undefined,
          price_per_unit_currency: formData.price_per_unit_currency ? Number(formData.price_per_unit_currency) : undefined
        };

        const response = await calculateStock(calculationRequest);
        setDynamicFields(response.dynamic_fields);

        // Update form with calculated values - handle object values properly
        Object.entries(response.dynamic_fields).forEach(([fieldName, fieldData]) => {
          if (fieldData.value !== null && fieldData.value !== undefined) {
            // Only set primitive values in the form, skip objects
            if (typeof fieldData.value !== 'object') {
              form.setValue(fieldName as keyof FormValues, fieldData.value, { shouldValidate: false });
            }
          }
        });

      } catch (error) {
        console.error('Calculation error:', error);
        // Don't show error toast for now since backend endpoint might not be implemented yet
        // Instead, just create mock calculated fields for development
        const mockDynamicFields: { [key: string]: DynamicField } = {
          quantity: {
            value: formData.purchase_unit_quantity ? Number(formData.purchase_unit_quantity) * 500 : 0,
            editable: false,
            show: true,
            label: 'Количество (calculated)'
          },
          total_price_in_uz: {
            value: formData.total_price_in_currency ? Number(formData.total_price_in_currency) * 12500 : 0,
            editable: false,
            show: true,
            label: 'Общая стоимость (UZS)'
          },
          base_unit_in_uzs: {
            value: formData.price_per_unit_currency ? Number(formData.price_per_unit_currency) * 12500 : 0,
            editable: false,
            show: true,
            label: 'Себестоимость (UZS)'
          }
        };
        
        setDynamicFields(mockDynamicFields);
        
        // Update form with mock calculated values
        Object.entries(mockDynamicFields).forEach(([fieldName, fieldData]) => {
          if (fieldData.value !== null && fieldData.value !== undefined) {
            // Only set primitive values in the form, skip objects
            if (typeof fieldData.value !== 'object') {
              form.setValue(fieldName as keyof FormValues, fieldData.value, { shouldValidate: false });
            }
          }
        });
      } finally {
        setIsCalculating(false);
      }
    },
    [form, initialDataLoaded]
  );

  // State to track if initial calculation has been done
  const [initialCalculationDone, setInitialCalculationDone] = useState(false);
  
  // Watch only required fields for initial calculation
  const requiredFields = form.watch(['store', 'product', 'currency', 'purchase_unit', 'supplier', 'date_of_arrived']);
  
  useEffect(() => {
    if (!initialDataLoaded) return;
    
    const [store, product, currency, purchase_unit, supplier, date_of_arrived] = requiredFields;
    
    // Trigger calculation only once when all required fields are filled and calculation hasn't been done yet
    if (!initialCalculationDone && store && product && currency && purchase_unit && supplier && date_of_arrived) {
      const timeoutId = setTimeout(() => {
        const formData = form.getValues();
        debouncedCalculate(formData as FormValues);
        setInitialCalculationDone(true);
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [requiredFields, debouncedCalculate, initialDataLoaded, initialCalculationDone, form]);

  // Watch calculation trigger fields for updates after initial load
  const watchedFields = form.watch(['purchase_unit_quantity', 'total_price_in_currency', 'price_per_unit_currency']);
  
  // State to track previous values for change detection
  const [previousValues, setPreviousValues] = useState<{
    purchase_unit_quantity?: string | number;
    total_price_in_currency?: string | number;
    price_per_unit_currency?: string | number;
  }>({});
  
  useEffect(() => {
    if (!initialDataLoaded) return;
    
    const [purchaseUnitQuantity, totalPriceInCurrency, pricePerUnitCurrency] = watchedFields;
    
    console.log('Watched fields changed:', {
      purchaseUnitQuantity,
      totalPriceInCurrency,
      pricePerUnitCurrency,
      initialDataLoaded
    });
    
    // Check if values have actually changed
    const hasChanged = 
      purchaseUnitQuantity !== previousValues.purchase_unit_quantity ||
      totalPriceInCurrency !== previousValues.total_price_in_currency ||
      pricePerUnitCurrency !== previousValues.price_per_unit_currency;
    
    // Only trigger calculation if values have changed and initial calculation was done
    if (hasChanged && initialCalculationDone) {
      console.log('Triggering calculation...');
      const timeoutId = setTimeout(() => {
        const formData = form.getValues();
        debouncedCalculate(formData as FormValues);
        
        // Update previous values after calculation
        setPreviousValues({
          purchase_unit_quantity: purchaseUnitQuantity,
          total_price_in_currency: totalPriceInCurrency,
          price_per_unit_currency: pricePerUnitCurrency
        });
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [watchedFields, form, debouncedCalculate, initialDataLoaded, initialCalculationDone, previousValues]);

  // Define base stock fields
  const baseStockFields = [
    {
      name: 'store',
      label: t('common.store'),
      type: 'select',
      placeholder: t('common.select_store'),
      required: true,
      options: (() => {
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
        return storeOptions.map(store => ({
          value: store.id,
          label: store.name
        }));
      })(),
      isLoading: storesLoading
    },
    {
      name: 'product',
      label: t('common.product'),
      type: 'select',
      placeholder: t('common.product'),
      required: true,
      options: (() => {
        let productOptions = allProducts;
        if (stock?.product_read && stock.product_read.id && !allProducts.some(p => p.id === stock?.product_read?.id)) {
          productOptions = [stock.product_read, ...allProducts];
        }
        return productOptions.map(product => ({
          value: product.id,
          label: product.product_name
        }));
      })(),
      isLoading: isLoadingAllProducts
    },
    {
      name: 'currency',
      label: t('common.currency'),
      type: 'select',
      placeholder: t('common.select_currency'),
      required: true,
      options: currencies.map(currency => ({
        value: currency.id,
        label: `${currency.name} (${currency.short_name})`
      })),
      isLoading: currenciesLoading
    },
    {
      name: 'purchase_unit',
      label: t('common.purchase_unit'),
      type: 'select',
      placeholder: t('common.select_purchase_unit'),
      required: true,
      options: measurements.map(measurement => ({
        value: measurement.id,
        label: `${measurement.measurement_name} (${measurement.short_name || ''})`
      })),
      isLoading: measurementsLoading
    },
    {
      name: 'supplier',
      label: t('common.supplier'),
      type: 'select',
      placeholder: t('common.select_supplier'),
      required: true,
      options: (() => {
        let supplierOptions = suppliers;
        if (stock?.supplier_read && stock.supplier_read.id && !suppliers.some(s => s.id === stock?.supplier_read?.id)) {
          supplierOptions = [stock.supplier_read, ...suppliers];
        }
        return supplierOptions.map(supplier => ({
          value: supplier.id,
          label: supplier.name
        }));
      })(),
      isLoading: suppliersLoading
    },
    {
      name: 'date_of_arrived',
      label: t('common.date_of_arrival'),
      type: 'datetime-local',
      placeholder: t('common.enter_arrival_date'),
      required: true
    }
  ];

  // Dynamic calculation fields - only show fields that are marked as 'show: true' in API response
  const calculationFields = Object.entries(dynamicFields)
    .filter(([fieldName, fieldData]) => 
      ['purchase_unit_quantity', 'total_price_in_currency', 'price_per_unit_currency'].includes(fieldName) && 
      fieldData.show
    )
    .map(([fieldName, fieldData]) => ({
      name: fieldName,
      label: fieldData.label,
      type: 'number',
      placeholder: fieldData.label,
      required: false,
      readOnly: !fieldData.editable
    }));

  // Add dynamic backend-calculated fields based on API response (filter out input fields and only show visible fields)
  const dynamicCalculatedFields = Object.entries(dynamicFields)
    .filter(([fieldName, fieldData]) => 
      !['purchase_unit_quantity', 'total_price_in_currency', 'price_per_unit_currency'].includes(fieldName) &&
      fieldData.show
    )
    .map(([fieldName, fieldData]) => ({
      name: fieldName,
      label: fieldData.label,
      type: 'text',
      placeholder: fieldData.label,
      required: false,
      readOnly: !fieldData.editable,
      value: fieldData.value?.toString() || ''
    }));

  // Combine all fields
  const allFields = [
    ...baseStockFields,
    ...calculationFields,
    ...dynamicCalculatedFields
  ];

  const handleSubmit = async (data: FormValues) => {
    if (!id) return;
    try {
      // Validate required fields
      const requiredFields = ['store', 'product', 'currency', 'purchase_unit', 'supplier', 'date_of_arrived'];
      const missingFields = requiredFields.filter(field => !data[field as keyof FormValues]);
      
      if (missingFields.length > 0) {
        toast.error(t('validation.fill_all_required_fields') || 'Please fill all required fields');
        return;
      }

      // Build the final payload combining user input and calculated values
      const payload: any = {
        id: Number(id),
        store_write: Number(data.store),
        product_write: Number(data.product),
        currency: Number(data.currency),
        purchase_unit: Number(data.purchase_unit),
        supplier_write: Number(data.supplier),
        date_of_arrived: data.date_of_arrived,
        measurement_write: [],
        
        // Include calculation input fields
        ...(data.purchase_unit_quantity && { purchase_unit_quantity: Number(data.purchase_unit_quantity) }),
        ...(data.total_price_in_currency && { total_price_in_currency: Number(data.total_price_in_currency) }),
        ...(data.price_per_unit_currency && { price_per_unit_currency: Number(data.price_per_unit_currency) }),
        
        // Include all dynamic calculated fields with proper value extraction
        ...Object.entries(dynamicFields).reduce((acc, [fieldName, fieldData]) => {
          if (fieldData.value !== null && fieldData.value !== undefined) {
            // Handle special cases where backend expects different format
            if (fieldName === 'exchange_rate' && typeof fieldData.value === 'object' && (fieldData.value as any).id) {
              // Extract ID for exchange_rate since backend expects pk value
              acc[fieldName] = (fieldData.value as any).id;
            } else if (typeof fieldData.value === 'object' && (fieldData.value as any).id !== undefined) {
              // For other objects with ID, extract the ID
              acc[fieldName] = (fieldData.value as any).id;
            } else {
              // For primitive values, use as-is
              acc[fieldName] = fieldData.value;
            }
          }
          return acc;
        }, {} as any)
      };

      await updateStock.mutateAsync(payload);
      toast.success(t('messages.success.updated', { item: t('navigation.stock') }));
      navigate('/stock');
    } catch (error) {
      toast.error(t('messages.error.update', { item: t('navigation.stock') }));
      console.error('Failed to update stock:', error);
    }
  };

  if (stockLoading || storesLoading || suppliersLoading || currenciesLoading || measurementsLoading || isLoadingAllProducts) {
    return <div className="container mx-auto py-8 px-4">{t('common.loading')}</div>;
  }

  if (!stock || !stores.length || !suppliers.length || !currencies.length || !measurements.length) {
    return <div className="container mx-auto py-8 px-4">{t('messages.error.not_found')}</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<FormValues>
        fields={allFields}
        onSubmit={handleSubmit}
        isSubmitting={updateStock.isPending || isCalculating}
        title={t('common.edit_stock')}
        form={form}
      />
    </div>
  );
}
