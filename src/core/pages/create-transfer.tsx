import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useGetStocks, type Stock } from '../api/stock';
import { useGetStores, type Store } from '../api/store';
import { useCreateTransfer, type Transfer } from '../api/transfer';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export default function CreateTransfer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [sourceStore, setSourceStore] = useState<number | null>(null);
  const { data: currentUser } = useCurrentUser();
  
  // Get URL parameters
  const searchParams = new URLSearchParams(location.search);
  const fromProductId = searchParams.get('fromProductId');
  const fromStockId = searchParams.get('fromStockId');
  
  const form = useForm<Transfer>({
    defaultValues: {
      from_stock: fromStockId ? Number(fromStockId) : undefined,
      to_stock: undefined,
      amount: '',
      comment: ''
    }
  });
  
  const createTransfer = useCreateTransfer();
  
  // Watch the form values to react to changes
  const fromStock = form.watch('from_stock');
  const toStock = form.watch('to_stock');
  
  const { data: stocksData, isLoading: stocksLoading } = useGetStocks();
  const { data: storesData, isLoading: storesLoading } = useGetStores();

  const stocks = Array.isArray(stocksData) ? stocksData : stocksData?.results;
  const stores = Array.isArray(storesData) ? storesData : storesData?.results;
  
  // Filter stocks based on selected source store and positive quantity
  const sourceStocks = stocks?.filter(
    (stock) => stock.store_read?.id === sourceStore && stock.quantity > 0
  );

  // Set administrator's store as source store
  useEffect(() => {
    if (currentUser?.role === 'Администратор' && currentUser?.store_read?.id) {
      setSourceStore(currentUser.store_read.id);
    }
  }, [currentUser]);
    
  // If we have a fromStockId from the URL, set the sourceStore and handle product selection
  useEffect(() => {
    // Only proceed if data is loaded and we have stocks data
    if (!stocksLoading && !storesLoading && stocks?.length) {
      // If we have a stockId, find that stock and set its store as the source store
      if (fromStockId) {
        const selectedStock = stocks.find((stock: Stock) => stock.id === Number(fromStockId));
        if (selectedStock?.store_read?.id) {
          // Set the source store only if user is not an administrator
          if (currentUser?.role !== 'Администратор') {
            const storeId = selectedStock.store_read.id;
            setSourceStore(storeId);
          }
          
          // Make sure the from_stock is set in the form
          form.setValue('from_stock', Number(fromStockId));
        }
      }
      // If we have a product ID but no specific stock, try to find a stock with that product
      else if (fromProductId) {
        const stockWithProduct = stocks.find(
          (stock: Stock) => stock.product_read?.id === Number(fromProductId) && stock.quantity > 0 &&
          (currentUser?.role === 'Администратор' ? stock.store_read?.id === currentUser?.store_read?.id : true)
        );
        if (stockWithProduct) {
          // Set the from_stock in the form
          form.setValue('from_stock', stockWithProduct.id);
          
          if (stockWithProduct.store_read?.id && currentUser?.role !== 'Администратор') {
            // Set the source store only if user is not an administrator
            setSourceStore(stockWithProduct.store_read.id);
          }
        }
      }
    }
  }, [fromStockId, fromProductId, stocks, form, stocksLoading, storesLoading, currentUser]);
  
  // Update source store when from_stock changes - only for non-administrators
  useEffect(() => {
    if (!stocksLoading && fromStock && stocks?.length && currentUser?.role !== 'Администратор') {
      const selectedStock = stocks.find((stock: Stock) => stock.id === fromStock);
      if (selectedStock?.store_read?.id) {
        setSourceStore(selectedStock.store_read.id);
      }
    }
  }, [fromStock, stocks, stocksLoading, currentUser]);

  const onSubmit = async (data: Transfer) => {
    try {
      const sourceStock = stocks?.find((stock: Stock) => stock.id === Number(data.from_stock));
      const destStock = stocks?.find((stock: Stock) => stock.id === Number(data.to_stock));
      
      const sourceStoreId = sourceStock?.product_read?.store_read?.id;
      const destStoreId = destStock?.product_read?.store_read?.id;
      
      if (sourceStoreId && destStoreId && sourceStoreId === destStoreId) {
        toast.error(t('messages.error.same_store_transfer'));
        form.setValue('to_stock', null as unknown as number);
        return;
      }

      await createTransfer.mutateAsync(data);
      toast.success(t('messages.success.created', { item: t('navigation.transfers') }));
      navigate('/transfers');
    } catch (error) {
      toast.error(t('messages.error.create', { item: t('navigation.transfers') }));
      console.error('Failed to create transfer:', error);
    }
  };

  const selectedFromStock = stocks?.find((stock: Stock) => stock.id === fromStock);
  const selectedToStore = stores?.find((store: Store) => store.id === toStock);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">{t('common.create')} {t('navigation.transfers')}</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Source Store Selection - Only shown for non-administrators */}
          {currentUser?.role !== 'Администратор' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('forms.from_store')}
              </label>
              <Select
                onValueChange={(value) => {
                  const storeId = Number(value);
                  setSourceStore(storeId);
                  
                  // Check if we have URL parameters and if there's a matching stock in the selected store
                  if ((fromProductId || fromStockId) && stocks?.length) {
                    let matchingStock;
                    
                    if (fromStockId) {
                      // Find the stock and check if it's in the selected store
                      matchingStock = stocks.find((stock: Stock) => 
                        stock.id === Number(fromStockId) && stock.store_read?.id === storeId
                      );
                    } else if (fromProductId) {
                      // Find a stock with the product in the selected store
                      matchingStock = stocks.find((stock: Stock) => 
                        stock.product_read?.id === Number(fromProductId) && 
                        stock.store_read?.id === storeId && 
                        stock.quantity > 0
                      );
                    }
                    
                    if (matchingStock) {
                      // If we found a matching stock in the new store, use it
                      form.setValue('from_stock', matchingStock.id);
                      return; // Don't reset the stock selection if we found a match
                    }
                  }
                  
                  // Reset selections if no match was found
                  form.setValue('from_stock', null as unknown as number); // Reset stock selection
                  form.setValue('to_stock', null as unknown as number); // Reset destination store
                }}
                value={sourceStore?.toString()}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('placeholders.select_store')} />
                </SelectTrigger>
                <SelectContent>
                  {stores?.map((store: Store) => store.id && (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* For administrators, show their assigned store */}
          {currentUser?.role === 'Администратор' && currentUser?.store_read && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('forms.from_store')}
              </label>
              <div className="p-2 border rounded-md bg-gray-50">
                {currentUser.store_read.name}
              </div>
            </div>
          )}

          {/* Destination Store Selection */}
          {sourceStore && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('forms.to_store')}
                {selectedToStore && (
                  <span className="ml-2 text-gray-500">
                    Selected: {selectedToStore.name}
                  </span>
                )}
              </label>
              <Select 
                onValueChange={(value) => form.setValue('to_stock', Number(value))}
                value={toStock?.toString()}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('placeholders.select_store')} />
                </SelectTrigger>
                <SelectContent>
                  {stores?.map((store: Store) => {
                    // Skip if this store is the same as source store
                    if (store.id === sourceStore) return null;
                    
                    return store.id && (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Source Stock Selection - Only shown when both stores are selected */}
          {sourceStore && toStock && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('forms.from_product')}
                {selectedFromStock && (
                  <span className="ml-2 text-gray-500">
                    Selected: {selectedFromStock.product_read?.product_name} - {selectedFromStock.quantity}
                  </span>
                )}
              </label>
              <Select
                onValueChange={(value) => form.setValue('from_stock', Number(value))}
                value={fromStock?.toString()}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('placeholders.select_product')} />
                </SelectTrigger>
                <SelectContent>
                  {sourceStocks?.map((stock: Stock) => stock.id && (
                    <SelectItem key={stock.id} value={stock.id.toString()}>
                      {stock.product_read?.product_name} - {stock.quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount and Comment fields - Only shown when stock is selected */}
          {fromStock && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">{t('forms.amount')}</label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register('amount')}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('forms.comment')}</label>
                <Textarea
                  {...form.register('comment')}
                  className="w-full"
                  rows={4}
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={createTransfer.isPending || !fromStock || !toStock || !form.watch('amount')}
          >
            {createTransfer.isPending ? t('common.submitting') : t('common.create')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
