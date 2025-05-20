import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useGetStores } from '../api/store';
import { useGetStocks } from '../api/stock';
import { useGetClients } from '../api/client';
import { useGetSale, useUpdateSale } from '../api/sale';

interface SaleItem {
  stock: number;
  selling_method: 'Штук' | 'Ед.измерения';
  quantity: number;
}

interface SaleFormData {
  store: number;
  payment_method: string;
  sale_items: SaleItem[];
  on_credit: boolean;
  sale_debt?: {
    client: number;
    due_date: string;
  };
}

export default function EditSale() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const form = useForm<SaleFormData>();

  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  
  // Fetch data
  const { data: sale, isLoading: saleLoading } = useGetSale(Number(id));
  const { data: storesData } = useGetStores({});
  const { data: stocksData } = useGetStocks({});
  const { data: clientsData } = useGetClients({});
  const updateSale = useUpdateSale();

  // Prepare data arrays
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const stocks = Array.isArray(stocksData) ? stocksData : stocksData?.results || [];
  const clients = Array.isArray(clientsData) ? clientsData : clientsData?.results || [];

  // Filter stocks by selected store
  const filteredStocks = stocks.filter(stock => stock.store_read?.id === selectedStore);

  // Set form default values when sale data is loaded
  useEffect(() => {
    if (sale) {
      form.reset({
        store: sale.store,
        payment_method: sale.payment_method,
        sale_items: sale.sale_items,
        on_credit: sale.on_credit,
        sale_debt: sale.sale_debt
      });
      setSelectedStore(sale.store);
    }
  }, [sale, form]);

  const handleSubmit = async (data: SaleFormData) => {
    if (!id) return;
    
    try {
      await updateSale.mutateAsync({ id: Number(id), ...data });
      toast.success(t('messages.success.updated', { item: t('navigation.sale') }));
      navigate('/sales');
    } catch (error) {
      toast.error(t('messages.error.update', { item: t('navigation.sale') }));
      console.error('Failed to update sale:', error);
    }
  };

  const addSaleItem = () => {
    const currentItems = form.getValues('sale_items') || [];
    form.setValue('sale_items', [
      ...currentItems,
      { stock: 0, selling_method: 'Штук', quantity: 1 }
    ]);
  };

  const removeSaleItem = (index: number) => {
    const currentItems = form.getValues('sale_items') || [];
    form.setValue('sale_items', currentItems.filter((_: SaleItem, i: number) => i !== index));
  };

  const isOnCredit = form.watch('on_credit');

  if (saleLoading) {
    return <div className="container mx-auto py-8 px-4">{t('common.loading')}</div>;
  }

  if (!sale) {
    return <div className="container mx-auto py-8 px-4">{t('messages.error.not_found')}</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">
        {t('common.edit')} {t('navigation.sale')}
      </h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Store Selection */}
          <FormField
            control={form.control}
            name="store"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('table.store')}</FormLabel>
                <Select
                  value={field.value?.toString()}
                  onValueChange={(value) => {
                    field.onChange(parseInt(value, 10));
                    setSelectedStore(parseInt(value, 10));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholders.select_store')} />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id?.toString() || ''}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Payment Method */}
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('table.payment_method')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('placeholders.enter_payment_method')} {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Sale Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{t('common.sale_items')}</h2>
              <Button type="button" onClick={addSaleItem}>
                {t('common.add_item')}
              </Button>
            </div>

            {form.watch('sale_items')?.map((_: SaleItem, index: number) => (
              <div key={index} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                <FormField
                  control={form.control}
                  name={`sale_items.${index}.stock`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('table.product')}</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('placeholders.select_product')} />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredStocks.map((stock) => (
                            <SelectItem key={stock.id} value={stock.id?.toString() || ''}>
                              {stock.product_read?.product_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`sale_items.${index}.selling_method`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.selling_method')}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Штук">{t('table.pieces')}</SelectItem>
                          <SelectItem value="Ед.измерения">{t('table.measurement')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`sale_items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('table.quantity')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder={t('placeholders.enter_quantity')}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {index > 0 && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => removeSaleItem(index)}
                    className="mt-8"
                  >
                    {t('common.remove')}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* On Credit */}
          <FormField
            control={form.control}
            name="on_credit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('table.on_credit')}</FormLabel>
                <Select
                  value={field.value ? 'true' : 'false'}
                  onValueChange={(value) => field.onChange(value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t('common.yes')}</SelectItem>
                    <SelectItem value="false">{t('common.no')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Sale Debt (only shown when on_credit is true) */}
          {isOnCredit && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="sale_debt.client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('table.client')}</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value, 10))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('placeholders.select_client')} />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id?.toString() || ''}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sale_debt.due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('table.due_date')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={updateSale.isPending}>
            {updateSale.isPending ? t('common.updating') : t('common.update')}
          </Button>
        </form>
      </Form>
    </div>
  );
}