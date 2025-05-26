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
import { Wallet, CreditCard, SmartphoneNfc, AlertCircle } from 'lucide-react';

interface SaleItem {
  id?: number;
  stock: number;
  stock_write?: number;
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
  store_write?: number;
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
    if (!sale || !stocks.length) return;

    const formData = {
      store: sale.store_read?.id || 0,
      store_write: sale.store_read?.id || 0,
      payment_method: sale.payment_method,
      sale_items: sale.sale_items.map(item => {
        const stock = stocks.find(s => s.id === item.stock_read?.id);
        return {
          id: item.id,
          stock: item.stock_read?.id || 0,
          stock_write: item.stock_read?.id || 0,
          stock_read: stock || item.stock_read,  // Use the fresh stock data if available
          selling_method: item.selling_method,
          quantity: item.quantity || "1",
          subtotal: item.subtotal || "0"
        };
      }),
      on_credit: sale.on_credit || false,
      sale_debt: sale.on_credit ? {
        client: sale.sale_debt?.client || 0,
        due_date: sale.sale_debt?.due_date || ""
      } : undefined,
      total_amount: sale.total_amount || "0"
    };

    // First set the store
    setSelectedStore(sale.store_read?.id || null);
    
    // Then set the stocks quantities in one update
    const stocksMap = sale.sale_items.reduce<{[key: number]: number}>((acc, item, index) => {
      if (item.stock_read?.id) {
        const stockQuantity = stocks.find(s => s.id === item.stock_read?.id)?.quantity;
        if (stockQuantity) {
          acc[index] = stockQuantity;
        }
      }
      return acc;
    }, {});
    
    // Batch the state updates
    const batchUpdates = () => {
      setSelectedStocks(stocksMap);
      form.reset(formData);
    };
    
    batchUpdates();
  }, [sale?.id, stocks.length]); // Only depend on sale.id and stocks.length

  // Filter stocks by selected store
  const filteredStocks = stocks.filter(stock => stock.store_read?.id === selectedStore);

  const calculateSubtotal = (stockId: number, quantity: string) => {
    const stock = filteredStocks.find(s => s.id === stockId);
    if (stock?.selling_price) {
      const subtotal = (Number(quantity) * stock.selling_price).toFixed(2);
      return subtotal;
    }
    return "0.00";
  };

  const calculateTotal = (items: SaleItem[]) => {
    return items.reduce((sum, item) => {
      return sum + Number(item.subtotal);
    }, 0).toString();
  };

  const handleStockSelection = (value: string, index: number) => {
    const stockId = parseInt(value, 10);
    const selectedStock = filteredStocks.find(stock => stock.id === stockId);
    const currentQuantity = form.getValues(`sale_items.${index}.quantity`);
    
    // Set form values individually
    form.setValue(`sale_items.${index}.stock` as const, stockId, { shouldDirty: true });
    form.setValue(`sale_items.${index}.stock_read` as const, selectedStock, { shouldDirty: true });
    form.setValue(`sale_items.${index}.subtotal` as const, calculateSubtotal(stockId, currentQuantity), { shouldDirty: true });

    setSelectedStocks(prev => ({
      ...prev,
      [index]: selectedStock?.quantity || 0
    }));
    
    // Calculate and update total amount
    const items = form.getValues('sale_items');
    const total = calculateTotal(items);
    form.setValue('total_amount', total, { shouldDirty: true });
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const quantity = e.target.value;
    const stockId = form.getValues(`sale_items.${index}.stock`);
    const maxQuantity = selectedStocks[index] || 0;
    
    let finalQuantity = quantity;
    if (Number(quantity) > maxQuantity) {
      toast.error(t('messages.error.insufficient_quantity'));
      finalQuantity = maxQuantity.toString();
    }

    // Set form values individually
    form.setValue(`sale_items.${index}.quantity` as const, finalQuantity, { shouldDirty: true });
    form.setValue(`sale_items.${index}.subtotal` as const, calculateSubtotal(stockId, finalQuantity), { shouldDirty: true });

    // Calculate and update total amount
    const items = form.getValues('sale_items');
    const total = calculateTotal(items);
    form.setValue('total_amount', total, { shouldDirty: true });
  };

  const handleSubmit = async (data: SaleFormData) => {
    if (!id) return;
    
    try {
      // Transform the data to match API requirements
      const transformedData = {
        ...data,
        store_write: data.store,
        sale_items: data.sale_items.map(item => ({
          ...item,
          stock_write: item.stock
        }))
      };
      await updateSale.mutateAsync({ id: Number(id), ...transformedData });
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('common.edit_sale')}</h1>
          <div className="flex items-center gap-2">
            {sale.on_credit && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {t('common.on_credit')}
              </span>
            )}
          </div>
        </div>
        
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
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                        field.value === 'Наличные'
                          ? 'border-green-500 bg-green-50 text-green-600'
                          : 'border-gray-200 hover:border-green-500 hover:bg-green-50'
                      }`}
                      onClick={() => field.onChange('Наличные')}
                    >
                      <Wallet className={`h-5 w-5 ${field.value === 'Наличные' ? 'text-green-500' : 'text-gray-400'}`} />
                      <span>{t('payment_types.cash')}</span>
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                        field.value === 'Карта'
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                      onClick={() => field.onChange('Карта')}
                    >
                      <CreditCard className={`h-5 w-5 ${field.value === 'Карта' ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span>{t('payment_types.card')}</span>
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                        field.value === 'Click'
                          ? 'border-purple-500 bg-purple-50 text-purple-600'
                          : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                      }`}
                      onClick={() => field.onChange('Click')}
                    >
                      <SmartphoneNfc className={`h-5 w-5 ${field.value === 'Click' ? 'text-purple-500' : 'text-gray-400'}`} />
                      <span>{t('payment_types.click')}</span>
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                        field.value === 'Сложная оплата'
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-gray-200 hover:border-orange-500 hover:bg-orange-50'
                      }`}
                      onClick={() => field.onChange('Сложная оплата')}
                    >
                      <CreditCard className={`h-5 w-5 ${field.value === 'Сложная оплата' ? 'text-orange-500' : 'text-gray-400'}`} />
                      <span>{t('payment_types.complex')}</span>
                    </button>
                  </div>
                </FormItem>
              )}
            />

            {/* Sale Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">{t('common.sale_items')}</h2>
                <Button type="button" onClick={addSaleItem} variant="outline" size="sm">
                  {t('common.add_item')}
                </Button>
              </div>

              {form.watch('sale_items')?.map((item: SaleItem, index: number) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
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
                                  {stock.product_read?.product_name} ({stock.quantity} {stock.product_read?.measurement_read?.name}) - {stock.selling_price.toLocaleString('ru-RU')} UZS
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
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max={selectedStocks[index] || 1}
                              placeholder={t('placeholders.enter_quantity')}
                              {...field}
                              onChange={(e) => handleQuantityChange(e, index)}
                              className="flex-1"
                            />
                          </FormControl>
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => removeSaleItem(index)}
                            >
                              ×
                            </Button>
                          )}
                        </div>
                        <div className="mt-2 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{t('table.price')}:</span>
                            <span className="text-sm font-medium">
                              {item.stock_read?.selling_price?.toLocaleString('ru-RU')} UZS
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{t('table.subtotal')}:</span>
                            <span className="text-sm font-semibold text-emerald-600">
                              {Number(item.subtotal).toLocaleString('ru-RU')} UZS
                            </span>
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
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
                  <div className="text-2xl font-bold text-emerald-600">
                    {Number(field.value).toLocaleString('ru-RU')} UZS
                  </div>
                  
                </FormItem>
              )}
            />

            {/* On Credit Switch */}
            <FormField
              control={form.control}
              name="on_credit"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                       onClick={() => field.onChange(!field.value)}>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <FormLabel className="font-medium text-gray-900">{t('table.on_credit')}</FormLabel>
                      {/* <p className="text-sm text-gray-500">{t('common.credit_description')}</p> */}
                    </div>
                  </div>
                </FormItem>
              )}
            />

            {/* Credit Details */}
            {isOnCredit && (
              <div className="space-y-4 p-4 border rounded-lg bg-amber-50 border-amber-200">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  {/* {t('common.credit_details')} */}
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {t('common.on_credit')}
                  </span>
                </h3>

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
            <div className="flex justify-end space-x-4 pt-4 mt-6 border-t">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/sales')}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={updateSale.isPending}
              >
                {updateSale.isPending ? t('common.updating') : t('common.save')}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
