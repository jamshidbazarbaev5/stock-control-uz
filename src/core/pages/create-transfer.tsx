import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
import { useGetStocks } from '../api/stock';
import { useGetStores, type Store } from '../api/store';
import { useCreateTransfer, type Transfer } from '../api/transfer';
import { toast } from 'sonner';

export default function CreateTransfer() {
  const navigate = useNavigate();
  const form = useForm<Transfer>();
  const createTransfer = useCreateTransfer();
  
  const { data: stocksData } = useGetStocks();
  const { data: storesData } = useGetStores();

  const stocks = Array.isArray(stocksData) ? stocksData : stocksData?.results;
  const stores = Array.isArray(storesData) ? storesData : storesData?.results;

  const onSubmit = async (data: Transfer) => {
    try {
      // Find the source and destination stocks to get their store information
      const sourceStock = stocks?.find((stock) => stock.id === Number(data.from_stock));
      const destStock = stocks?.find((stock) => stock.id === Number(data.to_stock));
      
      const sourceStoreId = sourceStock?.product_read?.store_read?.id;
      const destStoreId = destStock?.product_read?.store_read?.id;
      
      // Validate that source and destination stores are different
      if (sourceStoreId && destStoreId && sourceStoreId === destStoreId) {
        toast.error('Cannot transfer between stocks in the same store');
        return;
      }

      await createTransfer.mutateAsync(data);
      toast.success('Transfer created successfully');
      navigate('/transfers');
    } catch (error) {
      toast.error('Failed to create transfer');
      console.error('Failed to create transfer:', error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Create Transfer</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">From Stock</label>
            <Select
              onValueChange={(value) => form.setValue('from_stock', Number(value))}
              value={form.getValues('from_stock')?.toString()}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select stock" />
              </SelectTrigger>
              <SelectContent>
                {stocks?.map((stock) => stock.id && (
                  <SelectItem key={stock.id} value={stock.id.toString()}>
                    {stock.product_read?.product_name} - {stock.quantity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">To Store</label>
            <Select 
              onValueChange={(value) => form.setValue('to_stock', Number(value))}
              value={form.getValues('to_stock')?.toString()}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select store" />
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

          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <Input
              type="number"
              step="0.01"
              {...form.register('amount')}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Comment</label>
            <Textarea
              {...form.register('comment')}
              className="w-full"
              rows={4}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createTransfer.isPending}
          >
            {createTransfer.isPending ? 'Creating...' : 'Create Transfer'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
