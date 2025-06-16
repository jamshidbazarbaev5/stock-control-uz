import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Recycling } from '../api/recycling';
import type { Product } from '../api/product';
import { useCreateRecycling } from '../api/recycling';
import { useGetStocks } from '../api/stock';
import { useGetStores } from '../api/store';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import api from '../api/api';


interface FormValues extends Partial<Recycling> {}

const recyclingFields = (t:any, productSearchTerm: string)=> [
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
    type: 'searchable-select',
    placeholder: t('placeholders.select_product'),
    required: true,
    options: [], // Will be populated with products
    searchTerm: productSearchTerm,
    onSearch: productSearchTerm
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
    type: 'string',
    placeholder: t('placeholders.enter_quantity'),
    required: true,
  },
  {
    name: 'get_amount',
    label: t('table.get_amount'),
    type: 'string',
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
  const location = useLocation();
  const createRecycling = useCreateRecycling();
  const { t } = useTranslation();
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [allowedCategories, setAllowedCategories] = useState<number[] | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  // Get URL parameters
  const searchParams = new URLSearchParams(location.search);
  const fromProductId = searchParams.get('fromProductId');
  const fromStockId = searchParams.get('fromStockId');
  
  const form = useForm<FormValues>({
    defaultValues: {
      from_to: fromStockId ? Number(fromStockId) : undefined,
      date_of_recycle: new Date().toISOString().split('T')[0], // Today's date
    }
  });

  // Fetch data for dropdowns
  const { data: stocksData } = useGetStocks();
  const { data: storesData } = useGetStores();

  // Function to fetch all pages of products
  const fetchAllProducts = async (searchTerm: string) => {
    try {
      setIsLoadingProducts(true);
      let allResults: Product[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await api.get('items/product/', {
          params: {
            page: currentPage,
            product_name: searchTerm || undefined
          }
        });
        const data = response.data;
        
        allResults = [...allResults, ...(data.results || [])];
        
        if (!data.links?.next) {
          hasMore = false;
        }
        currentPage++;
      }

      setAllProducts(allResults);
    } catch (error) {
      console.error('Error fetching all products:', error);
      toast.error(t('messages.error.load', { item: t('navigation.products') }));
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Effect to fetch all products when search term changes
  useEffect(() => {
    const debouncedFetch = setTimeout(() => {
      fetchAllProducts(productSearchTerm);
    }, 300);

    return () => clearTimeout(debouncedFetch);
  }, [productSearchTerm]);

  // Get arrays from response data 
  const stocks = Array.isArray(stocksData) ? stocksData : stocksData?.results || [];
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  
  // Watch for changes in the from_to field to update allowed categories
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'from_to' && value.from_to) {
        const selectedStock = stocks.find(stock => stock.id === Number(value.from_to));
        if (selectedStock?.product_read?.has_recycling) {
          setAllowedCategories(selectedStock.product_read.categories_for_recycling || null);
          // Clear the to_product selection when changing from_to
          form.setValue('to_product', undefined);
        } else {
          setAllowedCategories(null);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, stocks]);

  // Set initial values based on URL parameters
  useEffect(() => {
    if (stocks.length > 0 && allProducts.length > 0) {
      if (fromStockId) {
        form.setValue('from_to', Number(fromStockId));
        
        const stockItem = stocks.find(stock => stock.id === Number(fromStockId));
        if (stockItem?.product_read?.id) {
          form.setValue('to_product', stockItem.product_read.id);
        }
      } 
      else if (fromProductId) {
        const stockWithProduct = stocks.find(
          stock => stock.product_read?.id === Number(fromProductId) && stock.quantity > 0
        );
        
        if (stockWithProduct) {
          form.setValue('from_to', stockWithProduct.id);
          form.setValue('to_product', Number(fromProductId));
        }
      }
    }
  }, [fromStockId, fromProductId, stocks, allProducts, form]);

  // Update fields with dynamic options
  const fields = recyclingFields(t, productSearchTerm).map(field => {
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
        options: allProducts
          .filter(product => {
            // If no categories are specified or the product has no category, show all products
            if (!allowedCategories || !product.category_read) return true;
            // Otherwise only show products in allowed categories
            return allowedCategories.includes(product.category_read.id);
          })
          .map(product => ({
            value: product.id,
            label: product.product_name
          }))
          .filter(opt => opt.value),
        onSearch: setProductSearchTerm,
        isLoading: isLoadingProducts
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