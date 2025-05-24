import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useCreateSale } from '../api/sale';

interface SaleItem {
  stock_write: number;
  selling_method: 'Штук' | 'Ед.измерения';
  quantity: number;
  subtotal: string;
}

interface SaleFormData {
  store_write: number;
  payment_method: string;
  sale_items: SaleItem[];
  on_credit: boolean;
  total_amount: string;
  sale_debt?: {
    client: number;
    due_date: string;
  };
}

export default function CreateSale() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const form = useForm<SaleFormData>({
    defaultValues: {
      payment_method: 'Наличные',
      sale_items: [{ stock_write: 0, selling_method: 'Штук', quantity: 1, subtotal: '0' }],
      on_credit: false,
      total_amount: '0'
    },
    mode: 'onChange'
  });

  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [selectedStocks, setSelectedStocks] = useState<{[key: number]: number}>({});
  const [selectedPrices, setSelectedPrices] = useState<{[key: number]: { min: number; selling: number }}>({});
  
  // Fetch data
  const { data: storesData } = useGetStores({});
  const { data: stocksData } = useGetStocks({});
  const { data: clientsData } = useGetClients({});
  const createSale = useCreateSale();

  // Prepare data arrays
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const stocks = Array.isArray(stocksData) ? stocksData : stocksData?.results || [];
  const clients = Array.isArray(clientsData) ? clientsData : clientsData?.results || [];

  // Filter stocks by selected store
  const filteredStocks = stocks.filter(stock => stock.store_read?.id === selectedStore);

  const calculateSubtotal = (quantity: number, price: number) => {
    return (quantity * price).toString();
  };

  const updateTotalAmount = () => {
    const items = form.getValues('sale_items');
    const total = items.reduce((sum, item) => {
      const subtotalValue = item.subtotal ? parseFloat(item.subtotal.replace(/[^0-9]/g, '')) : 0;
      return sum + (isNaN(subtotalValue) ? 0 : subtotalValue);
    }, 0);
    form.setValue('total_amount', total.toString());
  };

  const handleStockSelection = (value: string, index: number) => {
    const stockId = parseInt(value, 10);
    const selectedStock = filteredStocks.find(stock => stock.id === stockId);
    
    setSelectedStocks(prev => ({
      ...prev,
      [index]: selectedStock?.quantity || 0
    }));
    
    if (selectedStock) {
      const sellingPrice = parseFloat(selectedStock.selling_price || '0');
      const minPrice = parseFloat(selectedStock.min_price || '0');
      
      setSelectedPrices(prev => ({
        ...prev,
        [index]: {
          min: minPrice,
          selling: sellingPrice
        }
      }));
      
      // Set default subtotal based on current quantity and selling price
      const currentQuantity = form.getValues(`sale_items.${index}.quantity`);
      const subtotal = sellingPrice * currentQuantity;
      form.setValue(`sale_items.${index}.subtotal`, subtotal.toString());
      updateTotalAmount();
    }
    
    form.setValue(`sale_items.${index}.stock_write`, stockId);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = parseInt(e.target.value, 10);
    const maxQuantity = selectedStocks[index] || 0;
    
    if (value > maxQuantity) {
      toast.error(t('messages.error.insufficient_quantity'));
      form.setValue(`sale_items.${index}.quantity`, maxQuantity);
      // Update subtotal with max quantity
      if (selectedPrices[index]) {
        const subtotal = calculateSubtotal(maxQuantity, selectedPrices[index].selling);
        form.setValue(`sale_items.${index}.subtotal`, subtotal);
      }
    } else {
      form.setValue(`sale_items.${index}.quantity`, value);
      // Update subtotal with new quantity
      if (selectedPrices[index]) {
        const subtotal = calculateSubtotal(value, selectedPrices[index].selling);
        form.setValue(`sale_items.${index}.subtotal`, subtotal);
      }
    }
    updateTotalAmount();
  };

  const handleSubmit = async (data: SaleFormData) => {
    try {
      // Validate all items meet minimum price requirements
      const hasInvalidPrices = data.sale_items.some((item, index) => {
        if (selectedPrices[index]) {
          const quantity = parseInt(item.quantity.toString(), 10);
          const subtotal = parseFloat(item.subtotal);
          const minTotal = selectedPrices[index].min * quantity;
          return subtotal < minTotal;
        }
        return false;
      });

      if (hasInvalidPrices) {
        toast.error(t('messages.error.below_min_price'));
        return;
      }

      const saleData = {
        ...data,
        // total_amount: data.total_amount,
        sale_items: data.sale_items.map(item => ({
          ...item,
          quantity: item.quantity.toString()
        }))
      };

      await createSale.mutateAsync(saleData as any); // Type assertion as any to bypass type check temporarily
      toast.success(t('messages.success.created', { item: t('navigation.sale') }));
      navigate('/sales');
    } catch (error) {
      toast.error(t('messages.error.create', { item: t('navigation.sale') }));
      console.error('Failed to create sale:', error);
    }
  };

  const addSaleItem = () => {
    const currentItems = form.getValues('sale_items');
    form.setValue('sale_items', [
      ...currentItems,
      { stock_write: 0, selling_method: 'Штук', quantity: 1, subtotal: '0' }
    ]);
  };

  const removeSaleItem = (index: number) => {
    const currentItems = form.getValues('sale_items');
    form.setValue('sale_items', currentItems.filter((_: SaleItem, i: number) => i !== index));
  };

  const isOnCredit = form.watch('on_credit');

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">
        {t('common.create')} {t('navigation.sale')}
      </h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Store Selection */}
          <FormField
            control={form.control}
            name="store_write"
            rules={{ required: t('validation.required') }}
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
                  <SelectTrigger className={form.formState.errors.store_write ? "border-red-500" : ""}>
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
                {form.formState.errors.store_write && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.store_write.message}</p>
                )}
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
                    <SelectValue placeholder={t('placeholders.select_payment_method')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Наличные">{t('payment_types.cash')}</SelectItem>
                    <SelectItem value="Карта">{t('payment_types.card')}</SelectItem>
                    <SelectItem value="Click">{t('payment_types.click')}</SelectItem>
                    <SelectItem value="Сложная оплата">{t('payment_types.complex')}</SelectItem>
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

            {form.watch('sale_items').map((_: SaleItem, index: number) => (
              <div key={index} className="flex flex-wrap items-start gap-4 p-4 border rounded-lg bg-white shadow-sm">
                <div className="w-[250px]">
                  <FormField
                    control={form.control}
                    name={`sale_items.${index}.stock_write`}
                    rules={{ required: t('validation.required') }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t('table.product')}</FormLabel>
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(value) => handleStockSelection(value, index)}
                        >
                          <SelectTrigger className={form.formState.errors.sale_items?.[index]?.stock_write ? "border-red-500" : ""}>
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
                        {selectedPrices[index] && (
                          <div className="mt-2 space-y-1 text-xs">
                            <div className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded">
                              <span className="text-gray-600">{t('table.min_price')}:</span>
                              <span className="font-medium text-red-600">{selectedPrices[index].min}</span>
                            </div>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-[150px]">
                  <FormField
                    control={form.control}
                    name={`sale_items.${index}.selling_method`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t('common.selling_method')}</FormLabel>
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
                </div>

                <div className="w-[120px]">
                  <FormField
                    control={form.control}
                    name={`sale_items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t('table.quantity')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max={selectedStocks[index] || 1}
                            placeholder={t('placeholders.enter_quantity')}
                            className="text-right"
                            {...field}
                            onChange={(e) => handleQuantityChange(e, index)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-[150px]">
                  <FormField
                    control={form.control}
                    name={`sale_items.${index}.subtotal`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t('table.total_amount')}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            className="text-right font-medium"
                            {...field}
                            onChange={(e) => {
                              const newValue = e.target.value.replace(/[^0-9]/g, '');
                              field.onChange(newValue);
                              updateTotalAmount();
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {index > 0 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeSaleItem(index)}
                    className="mt-8"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
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

          {/* Total Amount Display */}
          <div className="mt-8 p-6 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-700">{t('table.total_amount')}</h3>
              <p className="text-3xl font-bold text-green-600">
                {parseFloat(form.watch('total_amount') || '0').toLocaleString()}
              </p>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full mt-6 h-12 text-lg font-medium" 
            disabled={createSale.isPending}
          >
            {createSale.isPending ? t('common.creating') : t('common.create')}
          </Button>
        </form>
      </Form>
    </div>
  );
}