import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Recycling } from '../api/recycling';
import { useCreateRecycling } from '../api/recycling';
import { useGetStocks } from '../api/stock';
import { useGetProducts } from '../api/product';
import { useGetStores } from '../api/store';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

interface FormValues extends Partial<Recycling> {
  purchase_price_in_us: number;
  exchange_rate: number;
  purchase_price_in_uz: number;
}


const recyclingFields = (t:any)=> [
  {
    name: 'from_to',
    label: t('table.from_product'),
    type: 'select',
    placeholder: t('placeholders.select_product'),
    required: true,
    options: [], // Will be populated with stocks
  },
  {
    name: 'to_product',
    label: t('table.to_product'),
    type: 'select',
    placeholder: t('placeholders.select_product'),
    required: true,
    options: [], // Will be populated with products
  },
  {
    name: 'store',
    label: t('table.store'),
    type: 'select',
    placeholder: t('placeholders.select_store'),
    required: true,
    options: [], // Will be populated with stores
  },
  {
    name: 'spent_amount',
    label: t('table.spent_amount'),
    type: 'text',
    placeholder: t('placeholders.enter_quantity'),
    required: true,
  },
  {
    name: 'get_amount',
    label: t('table.get_amount'),
    type: 'text',
    placeholder: t('placeholders.enter_quantity'),
    required: true,
  },
  {
    name: 'date_of_recycle',
    label: t('table.date'),
    type: 'date',
    placeholder: t('placeholders.select_date'),
    required: true,
  },
  {
    name: 'purchase_price_in_us',
    label: t('forms.purchase_price_usd'),
    type: 'number',
    placeholder: t('placeholders.enter_price'),
    required: true,
  },
  {
    name: 'exchange_rate',
    label: t('forms.exchange_rate'),
    type: 'number',
    placeholder: t('placeholders.enter_exchange_rate'),
    required: true,
  },
  {
    name: 'purchase_price_in_uz',
    label: t('forms.purchase_price_uzs'),
    type: 'number',
    placeholder: t('table.purchase_price_uz'),
    readOnly: true,
  },
  {
    name: 'selling_price',
    label: t('forms.selling_price'),
    type: 'number',
    placeholder: t('placeholders.enter_price'),
    required: true,
  },
  {
    name: 'min_price',
    label: t('forms.min_price'),
    type: 'number',
    placeholder: t('placeholders.enter_price'),
    required: true,
  },
  {
    name: 'color',
    label: t('forms.color'),
    type: 'text',
    placeholder: t('placeholders.enter_color'),
    required: true,
  },
];

export default function CreateRecycling() {
  const navigate = useNavigate();
  const createRecycling = useCreateRecycling();
  const { t } = useTranslation();
  const form = useForm<FormValues>({
    defaultValues: {
      purchase_price_in_us: 0,
      exchange_rate: 0,
      purchase_price_in_uz: 0,
      date_of_recycle: new Date().toISOString().split('T')[0], // Today's date
    }
  });

  // Watch fields for USD price calculation
  const usdPrice = form.watch('purchase_price_in_us');
  const exchangeRate = form.watch('exchange_rate');

  // Fetch data for dropdowns
  const { data: stocksData } = useGetStocks();
  const { data: productsData } = useGetProducts();
  const { data: storesData } = useGetStores();

  // Get arrays from response data
  const stocks = Array.isArray(stocksData) ? stocksData : stocksData?.results || [];
  const products = Array.isArray(productsData) ? productsData : productsData?.results || [];
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];

  // Update UZS price when USD price or exchange rate changes
  useEffect(() => {
    if (usdPrice && exchangeRate) {
      const calculatedPrice = usdPrice * exchangeRate;
      form.setValue('purchase_price_in_uz', calculatedPrice);
    }
  }, [usdPrice, exchangeRate, form]);

  // Update fields with dynamic options
  const fields = recyclingFields(t).map(field => {
    if (field.name === 'from_to') {
      return {
        ...field,
        options: stocks.map(stock => ({
          value: stock.id,
          label: `${stock.product_read?.product_name} (${stock.quantity || 0})`
        })).filter(opt => opt.value)
      };
    }
    if (field.name === 'to_product') {
      return {
        ...field,
        options: products.map(product => ({
          value: product.id,
          label: product.product_name
        })).filter(opt => opt.value)
      };
    }
    if (field.name === 'store') {
      return {
        ...field,
        options: stores.map(store => ({
          value: store.id,
          label: store.name
        })).filter(opt => opt.value)
      };
    }
    return field;
  });

  const handleSubmit = async (data: FormValues) => {
    try {
      const formattedData: Recycling = {
        from_to: typeof data.from_to === 'string' ? parseInt(data.from_to, 10) : data.from_to!,
        to_product: typeof data.to_product === 'string' ? parseInt(data.to_product, 10) : data.to_product!,
        store: typeof data.store === 'string' ? parseInt(data.store, 10) : data.store!,
        purchase_price_in_us: data.purchase_price_in_us,
        purchase_price_in_uz: data.purchase_price_in_uz,
        exchange_rate: data.exchange_rate,
        selling_price: data.selling_price!,
        min_price: data.min_price!,
        spent_amount: data.spent_amount!,
        get_amount: data.get_amount!,
        date_of_recycle: data.date_of_recycle!,
        color: data.color!
      };

      await createRecycling.mutateAsync(formattedData);
      toast.success(t('messages.success.created', { item: t('navigation.recyclings') }));
      navigate('/recyclings');
    } catch (error) {
      toast.error(t('messages.error.create', { item: t('navigation.recyclings').toLowerCase() }));
      console.error('Failed to create recycling:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<FormValues>
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={createRecycling.isPending}
        title={t('common.create') + ' ' + t('navigation.recyclings')}
        form={form}
      />
    </div>
  );
}