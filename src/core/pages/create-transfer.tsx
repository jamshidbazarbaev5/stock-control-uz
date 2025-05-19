import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
import { toast } from 'sonner';
import { useState } from 'react';

export default function CreateTransfer() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sourceStore, setSourceStore] = useState<number | null>(null);
  
  const form = useForm<Transfer>({
    defaultValues: {
      from_stock: undefined,
      to_stock: undefined,
      amount: '',
      comment: ''
    }
  });
  
  const createTransfer = useCreateTransfer();
  
  // Watch the form values to react to changes
  const fromStock = form.watch('from_stock');
  const toStock = form.watch('to_stock');
  
  const { data: stocksData } = useGetStocks();
  const { data: storesData } = useGetStores();

  const stocks = Array.isArray(stocksData) ? stocksData : stocksData?.results;
  const stores = Array.isArray(storesData) ? storesData : storesData?.results;

  console.log('Selected source store:', sourceStore);
  console.log('All stocks:', stocks);
  
  // Filter stocks based on selected source store
  const sourceStocks = stocks?.filter(
    (stock) => stock.store_read?.id === sourceStore
  );
  
  console.log('Filtered source stocks:', sourceStocks);

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
          {/* Source Store Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('forms.from_store')}
            </label>
            <Select
              onValueChange={(value) => {
                setSourceStore(Number(value));
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

          {/* Source Stock Selection - Only shown when store is selected */}
          {sourceStore && (
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

          {/* Destination Store Selection - Only shown when source stock is selected */}
          {fromStock && (
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

          {/* Amount and Comment fields - Only shown when destination store is selected */}
          {toStock && (
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
