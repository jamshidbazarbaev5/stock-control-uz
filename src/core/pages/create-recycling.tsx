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
interface FormValues extends Partial<Recycling> {}


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
    type: 'number',
    placeholder: t('placeholders.enter_quantity'),
    required: true,
  },
  {
    name: 'get_amount',
    label: t('table.get_amount'),
    type: 'number',
    placeholder: t('placeholders.enter_quantity'),
    required: true,
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
    name: 'date_of_recycle',
    label: t('table.date'),
    type: 'date',
    placeholder: t('placeholders.select_date'),
    required: true,
  },
];

export default function CreateRecycling() {
  const navigate = useNavigate();
  const createRecycling = useCreateRecycling();
  const { t } = useTranslation();
  const form = useForm<FormValues>({
    defaultValues: {
      date_of_recycle: new Date().toISOString().split('T')[0], // Today's date
    }
  });

  // Fetch data for dropdowns
  const { data: stocksData } = useGetStocks();
  const { data: productsData } = useGetProducts();
  const { data: storesData } = useGetStores();

  // Get arrays from response data
  const stocks = Array.isArray(stocksData) ? stocksData : stocksData?.results || [];
  const products = Array.isArray(productsData) ? productsData : productsData?.results || [];
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];

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
      const formattedData:any = {
        from_to: Number(data.from_to),
        to_product: Number(data.to_product),
        store: Number(data.store),
        selling_price: Number(data.selling_price),
        min_price: Number(data.min_price),
        spent_amount: String(data.spent_amount || ''),
        get_amount: String(data.get_amount || ''),
        date_of_recycle: data.date_of_recycle || '',
       
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