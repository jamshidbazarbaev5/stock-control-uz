import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Stock, CreateStockDTO } from '../api/stock';
import { useCreateStock } from '../api/stock';
import { useGetProducts, useCreateProduct } from '../api/product';
import { useGetStores } from '../api/store';
import { useGetMeasurements, useCreateMeasurement } from '../api/measurement';
import { useGetSuppliers, useCreateSupplier } from '../api/supplier';
import { useGetCategories } from '../api/category';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

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

interface CreateProductForm {
  product_name: string;
  category_write: number;
  store_write: number;
}

interface CreateSupplierForm {
  name: string;
  phone_number: string;
}

interface CreateMeasurementForm {
  measurement_name: string;
  store_write: number;
}

export default function CreateStock() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const createStock = useCreateStock();
  
  // Create mutations
  const createProduct = useCreateProduct();
  const createSupplier = useCreateSupplier();
  const createMeasurement = useCreateMeasurement();
  
  // State for create new modals
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false);
  const [createMeasurementOpen, setCreateMeasurementOpen] = useState(false);
  
  // Forms for creating new items
  const productForm = useForm<CreateProductForm>();
  const supplierForm = useForm<CreateSupplierForm>();
  const measurementForm = useForm<CreateMeasurementForm>();
  
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
  
  // Fetch products, stores, measurements, suppliers and categories for the select dropdowns
  const { data: productsData, isLoading: productsLoading } = useGetProducts({});
  const { data: storesData, isLoading: storesLoading } = useGetStores({});
  const { data: measurementsData, isLoading: measurementsLoading } = useGetMeasurements({});
  const { data: suppliersData, isLoading: suppliersLoading } = useGetSuppliers({});
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategories({});

  // Get the products, stores, measurements, suppliers and categories arrays
  const products = Array.isArray(productsData) ? productsData : productsData?.results || [];
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const measurements = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];
  const suppliers = Array.isArray(suppliersData) ? suppliersData : suppliersData?.results || [];
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || [];
  
  // Handlers for creating new items
  const handleCreateProduct = () => {
    setCreateProductOpen(true);
  };
  
  const handleCreateSupplier = () => {
    setCreateSupplierOpen(true);
  };
  
  const handleCreateMeasurement = () => {
    setCreateMeasurementOpen(true);
  };


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
        })),
        createNewLabel: t('common.create_new_product'),
        onCreateNew: handleCreateProduct,
        isLoading: productsLoading
      };
    }
    if (field.name === 'store_write') {
      return {
        ...field,
        options: stores.map(store => ({
          value: store.id,
          label: store.name
        })),
        isLoading: storesLoading
      };
    }
    if (field.name === 'measurement_write') {
      return {
        ...field,
        options: measurements.map(measurement => ({
          value: measurement.id,
          label: measurement.measurement_name
        })),
        createNewLabel: t('common.create_new_measurement'),
        onCreateNew: handleCreateMeasurement,
        isLoading: measurementsLoading
      };
    }
    if (field.name === 'supplier_write') {
      return {
        ...field,
        options: suppliers.map(supplier => ({
          value: supplier.id,
          label: supplier.name
        })),
        createNewLabel: t('common.create_new_supplier'),
        onCreateNew: handleCreateSupplier,
        isLoading: suppliersLoading
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

  const handleCreateMeasurementSubmit = async (data: CreateMeasurementForm) => {
    try {
      await createMeasurement.mutateAsync(data);
      toast.success(t('common.measurement_created'));
      setCreateMeasurementOpen(false);
      measurementForm.reset();
    } catch (error) {
      toast.error(t('common.error_creating_measurement'));
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<FormValues>
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={createStock.isPending}
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
                    <SelectItem key={category.id?.toString() || ''} value={(category.id || 0).toString()}>
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
                  {stores.map((store) => (
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

      {/* Create Measurement Modal */}
      <Dialog open={createMeasurementOpen} onOpenChange={setCreateMeasurementOpen}>
        <DialogContent>
          <DialogTitle>{t('common.create_new_measurement')}</DialogTitle>
          <form onSubmit={measurementForm.handleSubmit(handleCreateMeasurementSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="measurement_name">{t('common.measurement_name')}</Label>
              <Input
                id="measurement_name"
                {...measurementForm.register('measurement_name', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_write">{t('common.store')}</Label>
              <Select
                value={measurementForm.watch('store_write')?.toString()}
                onValueChange={(value) => measurementForm.setValue('store_write', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select_store')} />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id?.toString() || ''} value={(store.id || 0).toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={createMeasurement.isPending}>
              {t('common.create')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
