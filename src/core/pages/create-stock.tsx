import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Stock, CreateStockDTO } from '../api/stock';
import { useCreateStock } from '../api/stock';
import {  useCreateProduct } from '../api/product';
import { useGetStores } from '../api/store';

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
import axios from 'axios';
import { getAccessToken } from '../api/auth';


interface FormValues extends Partial<Stock> {
  purchase_price_in_us: string;
  exchange_rate: string;
  purchase_price_in_uz: string;
  income_weight:string;
  date_of_arrived: string;
  selling_price_us?: string; // new: user enters selling price in USD
  calculated_selling_price?: string; // new: calculated selling price in UZS
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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [_perUnitPrice, setPerUnitPrice] = useState<number | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [currency, setCurrency] = useState<{ id: number; currency_rate: string } | null>(null);
  const [currencyLoading, setCurrencyLoading] = useState(true);
  const [_calculatedSellingPrice, setCalculatedSellingPrice] = useState<string>('');
  
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
      type: 'searchable-select',
      placeholder: t('common.product'),
      required: true,
      options: [], // Will be populated with products
      searchTerm: productSearchTerm,
      onSearch: (value: string) => setProductSearchTerm(value),
    },
     {
      name: 'quantity',
      label: t('common.quantity'),
      type: 'text',
      placeholder: t('common.enter_quantity'),
      required: true,
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
      // helperText: perUnitPrice ? `${t('common.per_unit_cost')}: ${perUnitPrice.toFixed(2)} UZS` : '',
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
      name: 'supplier_write',
      label: t('common.supplier'),
      type: 'select',
      placeholder: t('common.select_supplier'),
      required: true,
      options: [], // Will be populated with suppliers
    },
   
  
  ];
  const createStock = useCreateStock();
  
  // Create mutations
  const createProduct = useCreateProduct();
  const createSupplier = useCreateSupplier();
  
  // State for create new modals
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false);
  
  // Forms for creating new items
  const productForm = useForm<CreateProductForm>();
  const supplierForm = useForm<CreateSupplierForm>();
  
  const form = useForm<FormValues>({
    defaultValues: {
      purchase_price_in_us: '',
      exchange_rate: '',
      purchase_price_in_uz: '',
      date_of_arrived: (() => {
        const date = new Date();
        date.setHours(date.getHours() + 5); // Subtract 5 hours
        return date.toISOString().slice(0, 16);
      })()
    }
  });

  // Watch specific fields for changes
  const usdPrice = form.watch('purchase_price_in_us');
  // const exchangeRate = form.watch('exchange_rate');
  const exchangeRateValue = currency?.currency_rate || '';
  
  // Fetch products, stores, measurements, suppliers and categories for the select dropdowns
  // const { data: productsData } = useGetProducts({
  //   params: {
  //     product_name: productSearchTerm || undefined,
  //   }
  // });
  const { data: storesData, isLoading: storesLoading } = useGetStores({});

  const { data: suppliersData, isLoading: suppliersLoading } = useGetSuppliers({});
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategories({});

  // Get the products, stores, measurements, suppliers and categories arrays
  // const products = Array.isArray(productsData) ? productsData : productsData?.results || [];
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];

  const suppliers = Array.isArray(suppliersData) ? suppliersData : suppliersData?.results || [];
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || [];
  
  // Fetch all products from all API pages using axios
  useEffect(() => {
    const fetchAllProducts = async () => {
      let page = 1;
      let products: any[] = [];
      let totalPages = 1;
      const token = getAccessToken();
      try {
        do {
          const url = `https://stock-control.uz/api/v1/items/product/?page=${page}` + (productSearchTerm ? `&product_name=${encodeURIComponent(productSearchTerm)}` : '');
          const res = await axios.get(url, {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          });
          products = products.concat(res.data.results);
          totalPages = res.data.total_pages;
          page++;
        } while (page <= totalPages);
        setAllProducts(products);
      } catch (error) {
        // Optionally handle error
      }
    };
    fetchAllProducts();
  }, [productSearchTerm]);

  const handleCreateSupplier = () => {
    setCreateSupplierOpen(true);
  };
  


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

  // Effect to update purchase_price_in_uz and per unit price when dependencies change
  useEffect(() => {
    if (usdPrice && exchangeRateValue) {
      const priceInUSD = parseFloat(usdPrice);
      const rate = parseFloat(exchangeRateValue);
      const quantityString = form.watch('quantity')?.toString() || '0';
      const quantity = parseFloat(quantityString);
      
      if (!isNaN(priceInUSD) && !isNaN(rate)) {
        const calculatedPrice = priceInUSD * rate;
        form.setValue('purchase_price_in_uz', calculatedPrice.toString(), {
          shouldValidate: false,
          shouldDirty: true
        });

        // Calculate per unit price
        if (!isNaN(quantity) && quantity > 0) {
          const perUnit = calculatedPrice / quantity;
          setPerUnitPrice(perUnit);
        } else {
          setPerUnitPrice(null);
        }
      }
    }
  }, [usdPrice, exchangeRateValue, form, form.watch('quantity')]);

  // Effect to update calculated selling price and min price for has_kub products
  useEffect(() => {
    // Only calculate for category 2 or 8
    const allowedCategories = [2, 8];
    const categoryId = selectedProduct?.category_read?.id;
    if (selectedProduct?.has_kub && allowedCategories.includes(categoryId)) {
      // Get all measurement numbers and multiply them
      const measurements = selectedProduct.measurement || [];
      const baseValue = measurements.reduce((acc: number, m: any) => {
        const num = parseFloat(m.number);
        return !isNaN(num) ? acc * num : acc;
      }, 1);
      const exchangeRatee= parseFloat(form.watch('exchange_rate')?.toString() || currency?.currency_rate || '0');
      const exchangeRate = exchangeRatee / 10
      const sellingPriceUs = parseFloat(form.watch('selling_price_us')?.toString() || '0');
      const purchasePriceUs = parseFloat(form.watch('purchase_price_in_us')?.toString() || '0');
      if (!isNaN(baseValue) && !isNaN(exchangeRate) && !isNaN(sellingPriceUs) && !isNaN(purchasePriceUs)) {
        // Calculate selling price and min price, round to nearest integer
        const calculatedSelling = Math.round(baseValue * exchangeRate * sellingPriceUs);
        const calculatedMin = Math.round(baseValue * exchangeRate * purchasePriceUs);
        setCalculatedSellingPrice(calculatedSelling.toString());
        form.setValue('calculated_selling_price', calculatedSelling.toString(), { shouldValidate: false, shouldDirty: true });
        form.setValue('selling_price', calculatedSelling.toString(), { shouldValidate: false, shouldDirty: true });
        form.setValue('min_price', calculatedMin.toString(), { shouldValidate: false, shouldDirty: true });
      } else {
        setCalculatedSellingPrice('');
        form.setValue('calculated_selling_price', '', { shouldValidate: false, shouldDirty: true });
        form.setValue('selling_price', '', { shouldValidate: false, shouldDirty: true });
        form.setValue('min_price', '', { shouldValidate: false, shouldDirty: true });
      }
    } else {
      setCalculatedSellingPrice('');
      form.setValue('calculated_selling_price', '', { shouldValidate: false, shouldDirty: true });
      form.setValue('selling_price', '', { shouldValidate: false, shouldDirty: true });
      form.setValue('min_price', '', { shouldValidate: false, shouldDirty: true });
    }
  }, [selectedProduct, form.watch('exchange_rate'), form.watch('selling_price_us'), form.watch('purchase_price_in_us')]);

  // Update fields with product, store, measurement and supplier options
  let hideUsdFields = selectedProduct?.has_metr || selectedProduct?.has_shtuk;
  const fields = stockFields.map(field => {
    // Hide USD and exchange rate fields if has_metr or has_shtuk
    if (hideUsdFields && [
      'exchange_rate',
      'purchase_price_in_us',
      'selling_price_us',
    ].includes(field.name)) {
      return { ...field, hidden: true };
    }
    // Make purchase_price_in_uz editable if has_metr or has_shtuk
    if (field.name === 'purchase_price_in_uz') {
      return {
        ...field,
        readOnly: !(hideUsdFields),
        required: true,
        placeholder: t('common.enter_purchase_price_uzs') || 'Enter purchase price in UZS',
      };
    }
    if (field.name === 'product_write') {
      return {
        ...field,
        options: allProducts.map(product => ({
          value: product.id,
          label: product.product_name
        })),
        onChange: (value: string) => {
          const product = allProducts.find(p => p.id === parseInt(value));
          setSelectedProduct(product);
        }
      };
    }
    if (field.name === 'store_write') {
      return {
        ...field,
        options: stores
          .filter(store => store.is_main) // Only show non-main stores
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
        createNewLabel: t('common.create_new_supplier'),
        onCreateNew: handleCreateSupplier,
        isLoading: suppliersLoading
      };
    }
    if (field.name === 'exchange_rate') {
      return {
        ...field,
        value: currency?.currency_rate ? String(Math.trunc(Number(currency.currency_rate))) : '',
        readOnly: true,
        disabled: true,
        loading: currencyLoading,
      };
    }
    if (field.name === 'color') {
      return {
        ...field,
        hidden: !selectedProduct?.has_color
      };
    }
    // Update quantity placeholder based on has_shtuk or has_metr
    if (field.name === 'quantity') {
      let placeholder = field.placeholder;
      let label = field.label
      if (selectedProduct?.has_shtuk) {
        label =  t('common.enter_quantity') || 'Введите штук';
        placeholder = t('common.enter_quantity') || 'Введите штук';
      } else if (selectedProduct?.has_metr) {
        label =  t('common.enter_quantity') || 'Введите метр';
        placeholder = 'Введите метр';
      }
      return {
        ...field,
        placeholder,
      };
    }
    return field;
  });

  // Add dynamic fields for is_list products
  if (selectedProduct?.is_list) {
    // Insert income_weight field before quantity
    const quantityIndex = fields.findIndex(f => f.name === 'quantity');
    if (quantityIndex !== -1) {
      fields.splice(quantityIndex, 0, {
        name: 'income_weight',
        label: t('common.income_weight') || 'Income Weight',
        type: 'number',
        placeholder: t('common.enter_income_weight') || 'Enter income weight',
        required: true,
        onChange: (value: string) => {
          const weight = parseFloat(value);
          const staticWeight = selectedProduct.static_weight || 0;
          if (!isNaN(weight) && staticWeight) {
            form.setValue('quantity', weight * staticWeight as any); // Pass as number
          } else {
            form.setValue('quantity', '' as any);
          }
        },
      });
      // Make quantity readOnly
      const quantityField = fields.find(f => f.name === 'quantity');
      if (quantityField) {
        quantityField.readOnly = true;
        // Remove helperText property to fix TS error
        // quantityField.helperText = t('common.calculated_quantity') || 'Calculated automatically';
      }
    }
  }

  // Watch income_weight and update quantity for is_list products
  // Use 'as any' for dynamic field names not in FormValues
  const incomeWeight = form.watch('income_weight' as any) as string | number | undefined;
  useEffect(() => {
    if (selectedProduct?.is_list) {
      const weight = typeof incomeWeight === 'string' ? parseFloat(incomeWeight) : Number(incomeWeight);
      const staticWeight = selectedProduct.static_weight || 0;
      if (!isNaN(weight) && staticWeight) {
        form.setValue('quantity', weight * staticWeight as any); // Pass as number
      } else {
        form.setValue('quantity', '' as any);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomeWeight, selectedProduct]);

  const handleSubmit = async (data: FormValues) => {
    try {
      // Always parse numbers for numeric fields
      const quantity = typeof data.quantity === 'string' ? parseFloat(data.quantity) : data.quantity!;
      // Build payload only with typed fields
      const formattedData: any = {
        store_write: typeof data.store_write === 'string' ? parseInt(data.store_write, 10) : data.store_write!,
        product_write: typeof data.product_write === 'string' ? parseInt(data.product_write, 10) : data.product_write!,
        purchase_price: data.purchase_price_in_uz !== '' ? String(data.purchase_price_in_uz) : undefined,
        purchase_price_in_uz: data.purchase_price_in_uz !== '' ? String(data.purchase_price_in_uz) : undefined,
        selling_price: data.selling_price !== '' ? String(data.selling_price) : undefined,
        min_price: data.min_price !== '' ? String(data.min_price) : undefined,
        quantity: quantity,
        supplier_write: typeof data.supplier_write === 'string' ? parseInt(data.supplier_write, 10) : data.supplier_write!,
        date_of_arrived: data.date_of_arrived,
        income_weight: data.income_weight,
        measurement_write: []
      };
      if (data.purchase_price_in_us && data.purchase_price_in_us !== '') {
        formattedData.purchase_price_in_us = String(data.purchase_price_in_us);
      }
      if (data.exchange_rate && data.exchange_rate !== '') {
        formattedData.exchange_rate = currency ? currency.id.toString() : '';
      }
      if (data.selling_price_us && data.selling_price_us !== '') {
        formattedData.selling_price_in_us = String(data.selling_price_us);
      }
      // Remove undefined fields
      Object.keys(formattedData).forEach(key => formattedData[key] === undefined && delete formattedData[key]);
      await createStock.mutateAsync(formattedData);
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
