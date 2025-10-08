import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { StockCalculationRequest, DynamicField } from '../api/stock';
import { calculateStock } from '../api/stock';
import { useCreateStock } from '../api/stock';
import { useCreateProduct } from '../api/product';
import { useGetStores } from '../api/store';
import { useGetSuppliers, useCreateSupplier } from '../api/supplier';
import { useGetCategories } from '../api/category';
import { useGetCurrencies } from '../api/currency';
import { useGetMeasurements } from '../api/measurement';
import { toast } from 'sonner';
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
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

interface CreateProductForm {
  product_name: string;
  category_write: number;
  store_write: number;
}

interface CreateSupplierForm {
  name: string;
  phone_number: string;
}

export default function CreateStock() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [dynamicFields, setDynamicFields] = useState<{ [key: string]: DynamicField }>({});
  const [isCalculating, setIsCalculating] = useState(false);

  // API hooks
  const createStock = useCreateStock();
  const createProduct = useCreateProduct();
  const createSupplier = useCreateSupplier();
  const { data: storesData, isLoading: storesLoading } = useGetStores({});
  const { data: suppliersData, isLoading: suppliersLoading } = useGetSuppliers({});
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategories({});
  const { data: currenciesData, isLoading: currenciesLoading } = useGetCurrencies({});
  const { data: measurementsData, isLoading: measurementsLoading } = useGetMeasurements({});

  // State for create new modals
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false);

  // Forms for creating new items
  const productForm = useForm<CreateProductForm>();
  const supplierForm = useForm<CreateSupplierForm>();

  const form = useForm<FormValues>({
    defaultValues: {
      store: '',
      product: '',
      currency: '',
      purchase_unit: '',
      supplier: '',
      date_of_arrived: (() => {
        const date = new Date();
        date.setHours(date.getHours() + 5);
        return date.toISOString().slice(0, 16);
      })(),
      purchase_unit_quantity: '',
      total_price_in_currency: '',
      price_per_unit_currency: ''
    }
  });

  // Get the arrays from response data
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const suppliers = Array.isArray(suppliersData) ? suppliersData : suppliersData?.results || [];
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || [];
  const currencies = Array.isArray(currenciesData) ? currenciesData : currenciesData?.results || [];
  const measurements = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];

  // Fetch all products from all API pages
  useEffect(() => {
    const fetchAllProducts = async () => {
      let page = 1;
      let products: any[] = [];
      let totalPages = 1;
      try {
        do {
          const res = await api.get('items/product/', {
            params: {
              page,
              ...(productSearchTerm ? { product_name: productSearchTerm } : {})
            }
          });
          products = products.concat(res.data.results);
          totalPages = res.data.total_pages;
          page++;
        } while (page <= totalPages);
        setAllProducts(products);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchAllProducts();
  }, [productSearchTerm]);

  // Debounced calculation function
  const debouncedCalculate = useCallback(
    async (formData: FormValues) => {
      if (!formData.store || !formData.product || !formData.currency || 
          !formData.purchase_unit || !formData.supplier || !formData.date_of_arrived) {
        return; // Don't calculate if required fields are missing
      }

      // Only calculate if at least one calculation trigger field has a value
      if (!formData.purchase_unit_quantity && !formData.total_price_in_currency && !formData.price_per_unit_currency) {
        return;
      }

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

        // Update form with calculated values
        Object.entries(response.dynamic_fields).forEach(([fieldName, fieldData]) => {
          if (fieldData.value !== null && fieldData.value !== undefined) {
            form.setValue(fieldName as keyof FormValues, fieldData.value, { shouldValidate: false });
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
            form.setValue(fieldName as keyof FormValues, fieldData.value, { shouldValidate: false });
          }
        });
      } finally {
        setIsCalculating(false);
      }
    },
    [form]
  );

  // State to track previous values for change detection
  const [previousValues, setPreviousValues] = useState<{
    purchase_unit_quantity?: string | number;
    total_price_in_currency?: string | number;
    price_per_unit_currency?: string | number;
  }>({});

  // Watch only calculation trigger fields and trigger calculation when they change
  const watchedFields = form.watch(['purchase_unit_quantity', 'total_price_in_currency', 'price_per_unit_currency']);
  
  useEffect(() => {
    const [purchaseUnitQuantity, totalPriceInCurrency, pricePerUnitCurrency] = watchedFields;
    
    // Check if values have actually changed
    const hasChanged = 
      purchaseUnitQuantity !== previousValues.purchase_unit_quantity ||
      totalPriceInCurrency !== previousValues.total_price_in_currency ||
      pricePerUnitCurrency !== previousValues.price_per_unit_currency;
    
    // Only trigger calculation if values have changed and at least one calculation field has a value
    if (hasChanged && (purchaseUnitQuantity || totalPriceInCurrency || pricePerUnitCurrency)) {
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
  }, [watchedFields, previousValues, form, debouncedCalculate]);

  // Define base stock fields
  const baseStockFields = [
    {
      name: 'store',
      label: t('common.store'),
      type: 'select',
      placeholder: t('common.select_store'),
      required: true,
      options: stores
        .filter(store => store.is_main)
        .map(store => ({
          value: store.id,
          label: store.name
        })),
      isLoading: storesLoading
    },
    {
      name: 'product',
      label: t('common.product'),
      type: 'searchable-select',
      placeholder: t('common.product'),
      required: true,
      options: allProducts.map(product => ({
        value: product.id,
        label: product.product_name
      })),
      searchTerm: productSearchTerm,
      onSearch: (value: string) => setProductSearchTerm(value)
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
      options: suppliers.map(supplier => ({
        value: supplier.id,
        label: supplier.name
      })),
      createNewLabel: t('common.create_new_supplier'),
      onCreateNew: () => setCreateSupplierOpen(true),
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

  // Add dynamic calculation fields
  const calculationFields = [
    {
      name: 'purchase_unit_quantity',
      label: t('common.purchase_unit_quantity') || 'Purchase Unit Quantity',
      type: 'number',
      placeholder: t('common.enter_purchase_unit_quantity') || 'Enter purchase unit quantity',
      required: false
    },
    {
      name: 'total_price_in_currency',
      label: t('common.total_price_in_currency') || 'Total Price in Currency',
      type: 'number',
      placeholder: t('common.enter_total_price') || 'Enter total price',
      required: false
    },
    {
      name: 'price_per_unit_currency',
      label: t('common.price_per_unit_currency') || 'Price per Unit in Currency',
      type: 'number',
      placeholder: t('common.enter_price_per_unit') || 'Enter price per unit',
      required: false
    }
  ];

  // Helper function to safely convert value to string
  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    // If it's an object, try to extract meaningful value
    if (typeof value === 'object') {
      // If it has a 'value' property, use that
      if (value.value !== undefined) {
        return String(value.value);
      }
      // If it has a 'rate' property (for exchange rate), use that
      if (value.rate !== undefined) {
        return String(value.rate);
      }
      // If it has an 'amount' property, use that
      if (value.amount !== undefined) {
        return String(value.amount);
      }
      // Try to JSON stringify if it's a simple object
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    
    return String(value);
  };

  // Add dynamic backend-calculated fields based on API response (filter out duplicates)
  const dynamicCalculatedFields = Object.entries(dynamicFields)
    .filter(([fieldName]) => !['purchase_unit_quantity', 'total_price_in_currency', 'price_per_unit_currency'].includes(fieldName))
    .map(([fieldName, fieldData]) => ({
      name: fieldName,
      label: fieldData.label,
      type: 'text',
      placeholder: fieldData.label,
      required: false,
      readOnly: !fieldData.editable,
      hidden: !fieldData.show,
      value: formatFieldValue(fieldData.value)
    }));

  // Combine all fields
  const allFields = [
    ...baseStockFields,
    ...calculationFields,
    ...dynamicCalculatedFields
  ];

  const handleSubmit = async (data: FormValues) => {
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
        
        // Include all dynamic calculated fields
        ...Object.entries(dynamicFields).reduce((acc, [fieldName, fieldData]) => {
          if (fieldData.value !== null && fieldData.value !== undefined) {
            acc[fieldName] = fieldData.value;
          }
          return acc;
        }, {} as any)
      };

      await createStock.mutateAsync(payload);
      toast.success('Stock created successfully');
      navigate('/stock');
    } catch (error) {
      toast.error('Failed to create stock');
      console.error('Failed to create stock:', error);
    }
  };

  // Handlers for creating new items
  const handleCreateProductSubmit = async (data: CreateProductForm) => {
    try {
      await createProduct.mutateAsync(data);
      toast.success(t('common.product_created'));
      setCreateProductOpen(false);
      productForm.reset();
    } catch (error) {
      toast.error(t('common.error_creating_product'));
    }
  };

  const handleCreateSupplierSubmit = async (data: CreateSupplierForm) => {
    try {
      await createSupplier.mutateAsync(data);
      toast.success(t('common.supplier_created'));
      setCreateSupplierOpen(false);
      supplierForm.reset();
    } catch (error) {
      toast.error(t('common.error_creating_supplier'));
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<FormValues>
        fields={allFields}
        onSubmit={handleSubmit}
        isSubmitting={createStock.isPending || isCalculating}
        title={t('common.create_new_stock')}
        form={form}
      />

      {/* Create Product Modal */}
      <Dialog open={createProductOpen} onOpenChange={setCreateProductOpen}>
        <DialogContent>
          <DialogTitle>{t('common.create_new_product')}</DialogTitle>
          <form onSubmit={productForm.handleSubmit(handleCreateProductSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product_name">{t('common.product_name')}</Label>
              <Input
                id="product_name"
                {...productForm.register('product_name', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_write">{t('common.category')}</Label>
              <Select
                value={productForm.watch('category_write')?.toString()}
                onValueChange={(value) => productForm.setValue('category_write', parseInt(value))}
                disabled={categoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select_category')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={String(category.id)}
                      value={String(category.id || '')}>
                      {category.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_write">{t('common.store')}</Label>
              <Select
                value={productForm.watch('store_write')?.toString()}
                onValueChange={(value) => productForm.setValue('store_write', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select_store')} />
                </SelectTrigger>
                <SelectContent>
                  {stores.filter(store => !store.is_main).map((store) => (
                    <SelectItem key={store.id?.toString() || ''} value={(store.id || 0).toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={createProduct.isPending}>
              {t('common.create')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Supplier Modal */}
      <Dialog open={createSupplierOpen} onOpenChange={setCreateSupplierOpen}>
        <DialogContent>
          <DialogTitle>{t('common.create_new_supplier')}</DialogTitle>
          <form onSubmit={supplierForm.handleSubmit(handleCreateSupplierSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('common.supplier_name')}</Label>
              <Input
                id="name"
                {...supplierForm.register('name', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">{t('common.phone_number')}</Label>
              <Input
                id="phone_number"
                {...supplierForm.register('phone_number', { required: true })}
              />
            </div>
            <Button type="submit" disabled={createSupplier.isPending}>
              {t('common.create')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
