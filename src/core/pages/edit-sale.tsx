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
import { Card } from '@/components/ui/card';
import { useGetStores } from '../api/store';
import { useGetStocks } from '../api/stock';
import { useGetClients } from '../api/client';
import { useGetSale, useUpdateSale } from '../api/sale';

interface SaleItem {
  id?: number;
  stock: number;
  stock_read?: {
    id: number;
    product_read?: {
      id: number;
      product_name: string;
      measurement_read?: {
        name: string;
      };
    };
    selling_price: number;
    quantity: number;
  };
  selling_method: 'Штук' | 'Ед.измерения';
  quantity: string;
  subtotal: string;
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
  total_amount: string;
}

export default function EditSale() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const form = useForm<SaleFormData>({
    defaultValues: {
      store: 0,
      payment_method: 'Наличные',
      sale_items: [{ stock: 0, selling_method: 'Штук', quantity: "1", subtotal: "0" }],
      on_credit: false,
      total_amount: "0"
    }
  });

  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [selectedStocks, setSelectedStocks] = useState<{[key: number]: number}>({});
  
  // Fetch data
  const { data: sale, isLoading: saleLoading, error: saleError } = useGetSale(id ? Number(id) : 0);
  const { data: storesData } = useGetStores({});
  const { data: stocksData } = useGetStocks({});
  const { data: clientsData } = useGetClients({});

  const updateSale = useUpdateSale();

  // Prepare data arrays
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const stocks = Array.isArray(stocksData) ? stocksData : stocksData?.results || [];
  const clients = Array.isArray(clientsData) ? clientsData : clientsData?.results || [];

  // Handle sale not found
  useEffect(() => {
    if (saleError) {
      toast.error(t('messages.error.not_found', { item: t('navigation.sale') }));
      navigate('/sales');
      return;
    }
  }, [saleError, navigate, t]);

  // Initialize form with sale data
  useEffect(() => {
    if (!sale) return;

    console.log('Sale data received:', sale);

    const formData = {
      store: sale.store_read?.id || 0,
      payment_method: sale.payment_method,
      sale_items: sale.sale_items.map(item => ({
        id: item.id,
        stock: item.stock_read?.id || 0,
        stock_read: item.stock_read,
        selling_method: item.selling_method,
        quantity: item.quantity || "1",
        subtotal: item.subtotal || "0"
      })),
      on_credit: sale.on_credit || false,
      sale_debt: sale.on_credit ? {
        client: sale.sale_debt?.client || 0,
        due_date: sale.sale_debt?.due_date || ""
      } : undefined,
      total_amount: sale.total_amount || "0"
    };

    console.log('Setting form data:', formData);

    // First set the store and stocks
    setSelectedStore(sale.store_read?.id || null);
    
    // Then set the stocks quantities
    const stocksMap = sale.sale_items.reduce<{[key: number]: number}>((acc, item, index) => {
      if (item.stock_read?.id) {
        const stockQuantity = stocks.find(s => s.id === item.stock_read?.id)?.quantity;
        if (stockQuantity) {
          acc[index] = stockQuantity;
        }
      }
      return acc;
    }, {});
    setSelectedStocks(stocksMap);

    // Finally reset the form
    form.reset(formData);

    console.log('Form values after reset:', form.getValues());
  }, [sale, stocks]);

  // Filter stocks by selected store
  const filteredStocks = stocks.filter(stock => stock.store_read?.id === selectedStore);

  const calculateSubtotal = (stockId: number, quantity: string) => {
    const stock = filteredStocks.find(s => s.id === stockId);
    if (stock?.selling_price) {
      return (Number(quantity) * stock.selling_price).toString();
    }
    return "0";
  };

  const calculateTotal = (items: SaleItem[]) => {
    return items.reduce((sum, item) => {
      return sum + Number(item.subtotal);
    }, 0).toString();
  };

  const handleStockSelection = (value: string, index: number) => {
    const stockId = parseInt(value, 10);
    const selectedStock = filteredStocks.find(stock => stock.id === stockId);
    
    setSelectedStocks(prev => ({
      ...prev,
      [index]: selectedStock?.quantity || 0
    }));
    
    form.setValue(`sale_items.${index}.stock`, stockId);
    form.setValue(`sale_items.${index}.stock_read`, selectedStock);
    const quantity = form.getValues(`sale_items.${index}.quantity`);
    const subtotal = calculateSubtotal(stockId, quantity);
    form.setValue(`sale_items.${index}.subtotal`, subtotal);
    
    // Update total amount
    const items = form.getValues('sale_items');
    form.setValue('total_amount', calculateTotal(items));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const quantity = e.target.value;
    const stockId = form.getValues(`sale_items.${index}.stock`);
    const maxQuantity = selectedStocks[index];
    
    if (Number(quantity) > maxQuantity) {
      toast.error(t('messages.error.insufficient_quantity'));
      form.setValue(`sale_items.${index}.quantity`, maxQuantity.toString());
      const subtotal = calculateSubtotal(stockId, maxQuantity.toString());
      form.setValue(`sale_items.${index}.subtotal`, subtotal);
    } else {
      form.setValue(`sale_items.${index}.quantity`, quantity);
      const subtotal = calculateSubtotal(stockId, quantity);
      form.setValue(`sale_items.${index}.subtotal`, subtotal);
    }
    
    // Update total amount
    const items = form.getValues('sale_items');
    form.setValue('total_amount', calculateTotal(items));
  };

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
      { 
        stock: 0, 
        selling_method: 'Штук', 
        quantity: "1",
        subtotal: "0" 
      }
    ]);
  };

  const removeSaleItem = (index: number) => {
    const currentItems = form.getValues('sale_items') || [];
    const newItems = currentItems.filter((_: SaleItem, i: number) => i !== index);
    form.setValue('sale_items', newItems);
    
    // Update selected stocks
    const { [index]: removed, ...rest } = selectedStocks;
    setSelectedStocks(rest);
    
    // Update total amount
    form.setValue('total_amount', calculateTotal(newItems));
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
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">{t('common.edit_sale')}</h1>
        
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
                      field.onChange(Number(value));
                      setSelectedStore(Number(value));
                      // Reset sale items when store changes
                      form.setValue('sale_items', [{ stock: 0, selling_method: 'Штук', quantity: "1", subtotal: "0" }]);
                      setSelectedStocks({});
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
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Наличные">{t('common.cash')}</SelectItem>
                      <SelectItem value="Карта">{t('common.card')}</SelectItem>
                      <SelectItem value="Перечисление">{t('common.bank_transfer')}</SelectItem>
                    </SelectContent>
                  </Select>
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

              {form.watch('sale_items')?.map((item: SaleItem, index: number) => (
                <div key={index} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`sale_items.${index}.stock`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('table.product')}</FormLabel>
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(value) => handleStockSelection(value, index)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('placeholders.select_product')} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredStocks
                              .filter(stock => stock.quantity > 0)
                              .map((stock) => (
                                <SelectItem key={stock.id} value={stock.id?.toString() || ''}>
                                  {stock.product_read?.product_name} ({stock.quantity} {stock.product_read?.measurement_read?.name})
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
                    defaultValue={item.quantity}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('table.quantity')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max={selectedStocks[index] || 1}
                            placeholder={t('placeholders.enter_quantity')}
                            {...field}
                            onChange={(e) => handleQuantityChange(e, index)}
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

            {/* Total Amount */}
            <FormField
              control={form.control}
              name="total_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('table.total_amount')}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      readOnly
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* On Credit Switch */}
            <FormField
              control={form.control}
              name="on_credit"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                    <FormLabel>{t('table.on_credit')}</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Credit Details */}
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
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('placeholders.select_client')} />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client: any) => (
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
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/sales')}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
