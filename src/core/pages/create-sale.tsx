import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { fetchAllStocks } from '../api/fetchAllStocks';
import { useGetRecyclings } from '@/core/api/recycling';
import { findRecyclingForStock, calculateRecyclingProfit } from '@/core/helpers/recyclingProfitUtils';

interface ExtendedUser extends User {
  store_read?: {
    id: number;
    name: string;
    address: string;
    phone_number: string;
    budget: string;
    created_at: string;
    is_main: boolean;
    parent_store: number | null;
    owner: number;
  };
}
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useGetStores } from '../api/store';
import { useGetClients } from '../api/client';
import { useGetUsers } from '../api/user';
import { useCreateSale, type Sale } from '@/core/api/sale';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { addDays } from 'date-fns';
import React from 'react';
import { type User } from '../api/user';

interface ExtendedUser extends User {
  store_read?: {
    id: number;
    name: string;
    address: string;
    phone_number: string;
    budget: string;
    created_at: string;
    is_main: boolean;
    parent_store: number | null;
    owner: number;
  };
}

interface FormSaleItem {
  stock_write: number;
  selling_method: 'Штук' | 'Ед.измерения';
  quantity: number;
  subtotal: string;
}



interface FormSalePayment {
  payment_method: string;
  amount: number;
}

interface SaleFormData {
  store_write: number;
  sale_items: FormSaleItem[];
  on_credit: boolean;
  total_amount: string;
  sale_payments: FormSalePayment[];
  sold_by?: number;
  sale_debt?: {
    client: number;
    due_date: string;
    deposit?: number;
  };
}

export default function CreateSale() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const { data: usersData } = useGetUsers({});

  // Get URL parameters
  const searchParams = new URLSearchParams(location.search);
  const productId = searchParams.get('productId');
  const stockId = searchParams.get('stockId');

  const users = Array.isArray(usersData) ? usersData : usersData?.results || [];

  // Initialize selectedStore and check user roles
  const isAdmin = currentUser?.role === 'Администратор';
  const isSuperUser = currentUser?.is_superuser === true;
  const [selectedStore, setSelectedStore] = useState<number | null>(
    currentUser?.store_read?.id || null
  );
  const [selectedStocks, setSelectedStocks] = useState<Record<number, number>>({});
  const [selectedPrices, setSelectedPrices] = useState<Record<number, { 
    min: number; 
    selling: number;
    purchasePrice: number; // Add purchase price
    profit: number;        // Add profit tracking
  }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [, forceRender] = useState({});

  // Effect for enforcing seller's store
  useEffect(() => {
    if (!isAdmin && currentUser?.store_read?.id) {
      setSelectedStore(currentUser.store_read.id);
      form.setValue('store_write', currentUser.store_read.id);
    }
  }, [isAdmin, currentUser?.store_read?.id]);

  const form = useForm<SaleFormData>({
    defaultValues: {
      sale_items: [{ stock_write: stockId ? Number(stockId) : 0, selling_method: 'Штук', quantity: 1, subtotal: '0' }],
      sale_payments: [{ payment_method: 'Наличные', amount: 0 }],
      on_credit: false,
      total_amount: '0',
      store_write: currentUser?.store_read?.id || 0,
      sold_by: (!isSuperUser && !isAdmin) ? currentUser?.id : undefined,
      sale_debt: { client: 0, due_date: addDays(new Date(), 30).toISOString().split('T')[0] }
    },
    mode: 'onChange'
  });

  // Effect for handling store selection
  useEffect(() => {
    if (currentUser?.store_read?.id) {
      setSelectedStore(currentUser.store_read.id);
      form.setValue('store_write', currentUser.store_read.id);
    }
    if (!isSuperUser && !isAdmin && currentUser?.id) {
      form.setValue('sold_by', currentUser.id);
    }
  }, [currentUser?.store_read?.id, currentUser?.id, isAdmin, isSuperUser]);

  // For non-admin (seller), we don't show the store selection as it's automatic
  useEffect(() => {
    if (!isAdmin && currentUser?.store_read?.id) {
      form.setValue('store_write', currentUser.store_read.id);
      form.setValue('sold_by', currentUser.id);
    }
  }, [isAdmin, currentUser?.store_read?.id, currentUser?.id]);
  
  // Fetch data with search term for stocks
  const { data: storesData, isLoading: storesLoading } = useGetStores({});
  const { data: clientsData } = useGetClients({ 
    params: form.watch('on_credit') ? { name: searchTerm } : undefined 
  });
  const createSale = useCreateSale();
  // Remove the filter to show all clients
  const clients = Array.isArray(clientsData) ? clientsData : clientsData?.results || [];


  // Prepare data arrays
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const [allStocks, setAllStocks] = useState<any[]>([]);
  const [_loadingAllStocks, setLoadingAllStocks] = useState(false);

  useEffect(() => {
    setLoadingAllStocks(true);
    fetchAllStocks({ product_name: productSearchTerm.length > 0 ? productSearchTerm : undefined })
      .then((data) => setAllStocks(data))
      .finally(() => setLoadingAllStocks(false));
  }, [productSearchTerm]);

  // Replace stocks with allStocks
  const stocks = allStocks;

  // Filter stocks by selected store
  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => stock.store_read?.id === selectedStore);
  }, [stocks, selectedStore]);

  // When the component mounts, initialize the form with default values
  useEffect(() => {
    const defaultValues: SaleFormData = {
      store_write: 0,
      sale_items: [{
        stock_write: 0,
        quantity: 1,
        selling_method: 'Штук',
        subtotal: '0'
      }],
      sale_payments: [{
        payment_method: 'Наличные',
        amount: 0
      }],
      on_credit: false,
      total_amount: '0'
    };

    // If we have URL parameters, don't overwrite them with defaults
    if (!stockId && !productId) {
      form.reset(defaultValues);
    } else {
      // Only set defaults for fields that haven't been set yet
      const currentValues = form.getValues();
      if (!currentValues.store_write) {
        form.setValue('store_write', defaultValues.store_write);
      }
      if (!currentValues.sale_payments || currentValues.sale_payments.length === 0) {
        form.setValue('sale_payments', defaultValues.sale_payments);
      }
      if (!currentValues.total_amount) {
        form.setValue('total_amount', defaultValues.total_amount);
      }
    }
  }, [form, stockId, productId]);

  // Set initial store and stock if we have parameters from URL
  useEffect(() => {
    // Only proceed if data is loaded and we have stocks data
    if (!storesLoading && stocks.length > 0) {
      console.log('Setting initial values from URL params:', { stockId, productId });

      const currentSaleItems = form.getValues('sale_items');
      if (!currentSaleItems || currentSaleItems.length === 0) {
        form.setValue('sale_items', [{ 
          stock_write: 0, 
          quantity: 1, 
          selling_method: 'Штук' as 'Штук', 
          subtotal: '0' 
        }]);
      }

      const handleStock = (stockItem: any) => {
        if (stockItem?.store_read?.id) {
          const storeId = stockItem.store_read.id;

          // First set the store
          setSelectedStore(storeId);
          form.setValue('store_write', storeId);
          console.log('Setting store:', storeId);

          // Force a re-render to ensure the filtered stocks are updated
          forceRender({});
          
          // Need to directly manipulate the DOM select element to force selection
          setTimeout(() => {
            // Set the stock in the form
            console.log('Setting stock:', stockItem.id);
            form.setValue('sale_items.0.stock_write', stockItem.id);
            setSelectedStocks(prev => ({ ...prev, 0: stockItem.quantity || 0 }));

            // Set the price for the selected stock
            if (stockItem.selling_price) {
              setSelectedPrices(prev => ({
                ...prev,
                [0]: {
                  min: parseFloat(stockItem.min_price || '0'),
                  selling: parseFloat(stockItem.selling_price),
                  purchasePrice: parseFloat(stockItem.purchase_price || '0'),
                  profit: 0
                }
              }));
              form.setValue('sale_items.0.subtotal', stockItem.selling_price);
              form.setValue('sale_items.0.quantity', 1);
              form.setValue('sale_items.0.selling_method', 'Штук' as 'Штук');
              updateTotalAmount();
            }

            // Try to force UI to update by adding a class
            document.querySelectorAll('select').forEach(select => {
              select.classList.add('force-update');
              setTimeout(() => select.classList.remove('force-update'), 100);
            });
          }, 300);
        }
      };

      // Use a timeout to ensure the component is fully mounted
      setTimeout(() => {
        if (stockId) {
          // If we have a specific stock ID, use it directly
          const stockItem = stocks.find(stock => stock.id === Number(stockId));
          if (stockItem) {
            handleStock(stockItem);
          }
        } else if (productId) {
          // Find stocks with this product that have quantity > 0
          const stocksWithProduct = stocks.filter(stock => 
            stock.product_read?.id === Number(productId) && stock.quantity > 0
          );

          if (stocksWithProduct.length > 0) {
            // Use the first available stock with this product
            handleStock(stocksWithProduct[0]);
          }
        }
      }, 200);
    }
  }, [stockId, productId, stocks, form, storesLoading]);

  const updateTotalAmount = () => {
    const items = form.getValues('sale_items');
    const total = items.reduce((sum, item) => {
      // Calculate actual total using quantity * subtotal
      const quantity = item.quantity || 0;
      const subtotal = parseFloat(item.subtotal) || 0;
      const actualTotal = quantity * subtotal;
      return sum + actualTotal;
    }, 0);
    form.setValue('total_amount', total.toString());

    // Update payment amount with total
    const payments = form.getValues('sale_payments');
    if (payments.length > 0) {
      form.setValue('sale_payments.0.amount', total);
    }
  };

  
  const handleStockSelection = (value: string, index: any) => {
    const stockId = parseInt(value, 10);
    const selectedStock = stocks.find(stock => stock.id === stockId);
    
    console.log('Stock selected:', stockId, selectedStock?.product_read?.product_name);

    if (!selectedStock) return;
    
    if (selectedStock.store_read?.id && selectedStock.store_read.id !== selectedStore) {
      console.log('Updating store from stock selection:', selectedStock.store_read.id);
      setSelectedStore(selectedStock.store_read.id);
      form.setValue('store_write', selectedStock.store_read.id);
      forceRender({});
    }

    setSelectedStocks(prev => ({
      ...prev,
      [index]: selectedStock.quantity || 0
    }));

    // Calculate purchase price per unit using quantity_for_history if available
    const totalPurchasePrice = parseFloat(selectedStock.purchase_price_in_uz || '0');
    const stockQuantity = selectedStock.quantity_for_history || selectedStock.quantity || 1;
    const purchasePricePerUnit = totalPurchasePrice / stockQuantity;

    // Debug log for has_kub: false
    if (!selectedStock.product_read?.has_kub) {
      console.log('DEBUG has_kub:false', {
        purchase_price_in_uz: selectedStock.purchase_price_in_uz,
        quantity_for_history: selectedStock.quantity_for_history,
        totalPurchasePrice,
        stockQuantity,
        purchasePricePerUnit,
        sellingPrice: selectedStock.selling_price
      });
    }

    // --- PROFIT_FAKE logic for has_kub ---
    // const subtotal = parseFloat(form.getValues(`sale_items.${index}.subtotal`)) || 0;
    let profit = 0;
    let minPrice = parseFloat(selectedStock.min_price || '0');
    let sellingPrice = parseFloat(selectedStock.selling_price || '0');
    const recyclingRecord = getRecyclingRecord(selectedStock.product_read.id);
    if (recyclingRecord) {
      // Use recycling profit logic for recycled products
      profit = calculateRecyclingProfit(recyclingRecord, 1); // default 1 unit
    } else if (selectedStock.product_read?.has_kub && (selectedStock.product_read?.category_read?.id === 2 || selectedStock.product_read?.category_read?.id === 8)) {
      // PROFIT_FAKE logic for specific categories
      const measurements = selectedStock.product_read.measurement || [];
      const getNumber = (name: string) => {
        const m = measurements.find((m: any) => m.measurement_read.measurement_name === name);
        return m ? parseFloat(m.number) : 1;
      };
      const length = getNumber('длина');
      const thickness = getNumber('Толщина');
      const meter = getNumber('Метр');
      const exchangeRate = parseFloat(selectedStock.exchange_rate_read?.currency_rate || '1');
      const purchasePriceInUss = parseFloat(selectedStock.purchase_price_in_us || '0');
      const purchasePriceInUs  = purchasePriceInUss / 10;
      const PROFIT_FAKE = length * meter * thickness * exchangeRate * purchasePriceInUs;
      profit = sellingPrice - PROFIT_FAKE;
    } else {
      // Standard profit calculation
      const totalPurchasePrice = parseFloat(selectedStock.purchase_price_in_uz || '0');
      const stockQuantity = selectedStock.quantity_for_history || selectedStock.quantity || 1;
      const purchasePricePerUnit = totalPurchasePrice / stockQuantity;
      profit = (sellingPrice - purchasePricePerUnit);
    }
    // --- END PROFIT_FAKE logic ---

    setSelectedPrices(prev => ({
      ...prev,
      [index]: {
        min: minPrice,
        selling: sellingPrice,
        purchasePrice: 0, // not used for recycling
        profit: profit
      }
    }));
    form.setValue(`sale_items.${index}.stock_write`, stockId);
    form.setValue(`sale_items.${index}.subtotal`, sellingPrice.toString());
    form.setValue(`sale_items.${index}.selling_method`, 'Штук' as 'Штук');
    updateTotalAmount();
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = parseInt(e.target.value, 10);
    const maxQuantity = selectedStocks[index] || 0;
    const subtotal = parseFloat(form.getValues(`sale_items.${index}.subtotal`)) || 0;
    const stockId = form.getValues(`sale_items.${index}.stock_write`);
    const selectedStock = stocks.find(stock => stock.id === stockId);

    if (value > maxQuantity) {
      toast.error(t('messages.error.insufficient_quantity'));
      form.setValue(`sale_items.${index}.quantity`, maxQuantity);
    } else {
      form.setValue(`sale_items.${index}.quantity`, value);
      // Recalculate profit with new quantity using quantity_for_history if available
      if (selectedPrices[index] && selectedStock) {
        let profit = 0;
        const recyclingRecord = getRecyclingRecord(selectedStock.product_read.id);
        if (recyclingRecord) {
          profit = calculateRecyclingProfit(recyclingRecord, value);
        } else if (selectedStock.product_read?.has_kub && (selectedStock.product_read?.category_read?.id === 2 || selectedStock.product_read?.category_read?.id === 8)) {
          // PROFIT_FAKE logic
          const measurements = selectedStock.product_read.measurement || [];
          const getNumber = (name: string) => {
            const m = measurements.find((m: any) => m.measurement_read.measurement_name === name);
            return m ? parseFloat(m.number) : 1;
          };
          const length = getNumber('длина');
          const thickness = getNumber('Толщина');
          const meter = getNumber('Метр');
          const exchangeRate = parseFloat(selectedStock.exchange_rate_read?.currency_rate || '1');
          const purchasePriceInUss = parseFloat(selectedStock.purchase_price_in_us || '0');
          const purchasePriceInUs  = purchasePriceInUss / 10;
          const PROFIT_FAKE = length * meter * thickness * exchangeRate * purchasePriceInUs;
          const sellingPrice = parseFloat(selectedStock.selling_price || '0');
          profit = (sellingPrice - PROFIT_FAKE) * value;
        } else {
          // Standard profit calculation
          const totalPurchasePrice = parseFloat(selectedStock.purchase_price_in_uz || '0');
          const stockQuantity = selectedStock.quantity_for_history || selectedStock.quantity || 1;
          const purchasePricePerUnit = totalPurchasePrice / stockQuantity;
          profit = (subtotal - purchasePricePerUnit) * value;
        }
        setSelectedPrices(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            profit: profit
          }
        }));
      }
    }
    updateTotalAmount();
  };

  const handleSubtotalChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value.replace(/[^0-9]/g, '');
    const quantity = form.getValues(`sale_items.${index}.quantity`) || 1;
    const subtotal = parseFloat(newValue) || 0;
    const stockId = form.getValues(`sale_items.${index}.stock_write`);
    const selectedStock = stocks.find(stock => stock.id === stockId);

    // Calculate profit if we have price information
    if (selectedPrices[index] && selectedStock) {
      let profit = 0;
      const recyclingRecord = getRecyclingRecord(selectedStock.product_read.id);
      if (recyclingRecord) {
        profit = calculateRecyclingProfit(recyclingRecord, quantity);
      } else if (selectedStock.product_read?.has_kub && (selectedStock.product_read?.category_read?.id === 2 || selectedStock.product_read?.category_read?.id === 8)) {
        // PROFIT_FAKE logic
        const measurements = selectedStock.product_read.measurement || [];
        const getNumber = (name: string) => {
          const m = measurements.find((m: any) => m.measurement_read.measurement_name === name);
          return m ? parseFloat(m.number) : 1;
        };
        const length = getNumber('длина');
        const thickness = getNumber('Толщина');
        const meter = getNumber('Метр');
        const exchangeRate = parseFloat(selectedStock.exchange_rate_read?.currency_rate || '1');
        const purchasePriceInUss = parseFloat(selectedStock.purchase_price_in_us || '0');
        const purchasePriceInUs  = purchasePriceInUss / 10;
        const PROFIT_FAKE = length * meter * thickness * exchangeRate * purchasePriceInUs;
        const sellingPrice = subtotal; // Use new subtotal as selling price
        profit = (sellingPrice - PROFIT_FAKE) * quantity;
      } else {
        // Standard profit calculation
        const { purchasePrice } = selectedPrices[index];
        profit = (subtotal - purchasePrice) * quantity;
      }
      setSelectedPrices(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          profit: profit
        }
      }));
    }

    form.setValue(`sale_items.${index}.subtotal`, newValue);
    updateTotalAmount();
  };

  const handleSubmit = async (data: SaleFormData) => {
    try {
      // Set store_write based on user role
      if (!isAdmin && !isSuperUser && currentUser?.store_read?.id) {
        // Seller: use their own store
        data.store_write = currentUser.store_read.id;
      } else if ((isAdmin || isSuperUser) && selectedStore) {
        // Admin/Superuser: use selected store (from selected user)
        data.store_write = selectedStore;
      }

      // Prevent submission if store_write is 0 or invalid
      if (!data.store_write || data.store_write === 0) {
        toast.error(t('validation.required', { field: t('table.store') }));
        return;
      }

      // Validate all items meet minimum price requirements
      const hasInvalidPrices = data.sale_items.some((item, index) => {
        if (selectedPrices[index]) {
          const subtotal = parseFloat(item.subtotal);
          const minPrice = selectedPrices[index].min;
          return subtotal < minPrice; // Compare price per unit with minimum price per unit
        }
        return false;
      });

      if (hasInvalidPrices) {
        toast.error(t('messages.error.invalid_price'));
        return;
      }

      // Calculate totalProfit (pure revenue)
      const saleItems = data.sale_items;
      const totalPayments = data.sale_payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const totalAmount = parseFloat(data.total_amount) || 0;
      let totalProfit = 0;
      saleItems.forEach((item, index) => {
        if (selectedPrices[index]) {
          const quantity = item.quantity || 1;
          const subtotal = parseFloat(item.subtotal) || 0;
          const itemTotal = subtotal * quantity;
          const stockId = item.stock_write;
          const selectedStock = stocks.find(stock => stock.id === stockId);
          let profitPerUnit = 0;
          // --- Recycling profit logic ---
          let recyclingProfitUsed = false;
          if (selectedStock && recyclingData) {
            const recyclingRecord = getRecyclingRecord(selectedStock.product_read.id);
            if (recyclingRecord) {
              // Use recycling profit calculation
              profitPerUnit = calculateRecyclingProfit(recyclingRecord, quantity) / quantity;
              recyclingProfitUsed = true;
            }
          }
          if (!recyclingProfitUsed) {
            if (selectedStock?.product_read?.has_kub && (selectedStock.product_read?.category_read?.id === 2 || selectedStock.product_read?.category_read?.id === 8)) {
              const measurements = selectedStock.product_read.measurement || [];
              const getNumber = (name: string) => {
                const m = measurements.find((m: any) => m.measurement_read.measurement_name === name);
                return m ? parseFloat(m.number) : 1;
              };
              const length = getNumber('длина');
              const thickness = getNumber('Толщина');
              const meter = getNumber('Метр');
              const exchangeRate = parseFloat(selectedStock.exchange_rate_read?.currency_rate || '1');
              const purchasePriceInUss = parseFloat(selectedStock.purchase_price_in_us || '0');
              const purchasePriceInUs = purchasePriceInUss / 10;
              const PROFIT_FAKE = length * meter * thickness * exchangeRate * purchasePriceInUs;
              profitPerUnit = subtotal - PROFIT_FAKE;
            } else {
              const totalPurchasePrice = parseFloat(selectedStock?.purchase_price_in_uz || '0');
              const stockQuantity = selectedStock?.quantity_for_history || selectedStock?.quantity || 1;
              const purchasePricePerUnit = totalPurchasePrice / stockQuantity;
              profitPerUnit = subtotal - purchasePricePerUnit;
            }
          }
          const paidShare = totalAmount > 0 ? (itemTotal / totalAmount) * totalPayments : itemTotal;
          const itemCost = (itemTotal - (profitPerUnit * quantity));
          totalProfit += paidShare - itemCost;
        }
      });

      // Get primary payment method from sale_payments
      const primaryPayment = data.sale_payments[0];

      const formattedData: Sale = {
        store: data.store_write,
        ...(isAdmin ? { sold_by: data.sold_by } : {}),
        payment_method: primaryPayment?.payment_method || 'Наличные',
        sale_items: data.sale_items.map(item => ({
          stock_write: item.stock_write,
          selling_method: item.selling_method,
          quantity: item.quantity.toString(),
          subtotal: item.subtotal.toString()
        })),
        sale_payments: data.sale_payments.map(payment => ({
          payment_method: payment.payment_method,
          amount: payment.amount.toString()
        })),
        on_credit: data.on_credit,
        total_amount: data.total_amount.toString(),
        total_pure_revenue: totalProfit.toFixed(1),
        // If client is selected but on credit, send client directly
        ...(data.sale_debt?.client && !data.on_credit ? { client: data.sale_debt.client } : {}),
        // If on credit and client selected, include in sale_debt
        ...(data.on_credit && data.sale_debt?.client ? {
          sale_debt: {
            client: data.sale_debt.client,
            due_date: data.sale_debt.due_date,
            ...(data.sale_debt.deposit ? { deposit: data.sale_debt.deposit.toString() } : {})
          }
        } : {})
      };

      await createSale.mutateAsync(formattedData);
      toast.success(t('messages.created_successfully'));
      navigate('/sales');
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error(t('messages.error_creating'));
    }
  };

  const addSaleItem = () => {
    const currentItems = form.getValues('sale_items') || [];
    form.setValue('sale_items', [
      ...currentItems,
      {
        stock_write: 0,
        quantity: 1,
        selling_method: 'Штук' as 'Штук',
        subtotal: '0'
      }
    ]);
  };

  const removeSaleItem = (index: number) => {
    const items = form.getValues('sale_items');
    form.setValue('sale_items', items.filter((_, i) => i !== index));
    setSelectedPrices(prev => {
      const newPrices = { ...prev };
      delete newPrices[index];
      // Re-index the keys to match the new sale_items array
      const filtered = Object.entries(newPrices)
        .filter(([k, _]) => Number(k) !== index)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([, v], i) => [i, v]);
      return Object.fromEntries(filtered);
    });
    updateTotalAmount();
  };

  // Fetch recycling data
  const { data: recyclingData } = useGetRecyclings({});

  // Helper to get recycling record for a stock
  const getRecyclingRecord = (productId: number) => {
    if (!recyclingData) return undefined;
    return findRecyclingForStock(recyclingData.results, productId);
  };

  return (
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        {t('common.create')} {t('navigation.sale')}
      </h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
          {/* Store Selection - Only shown for superuser */}
          {isSuperUser && (
            <div className="w-full sm:w-2/3 lg:w-1/2">
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
                        const storeId = parseInt(value, 10);
                        field.onChange(storeId);
                        setSelectedStore(storeId);
                        // Reset sold_by when store changes
                        form.setValue('sold_by', undefined);
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
            </div>
          )}

          {/* Seller Selection - Only shown for superuser or admin */}
          {(isSuperUser || isAdmin) && (
            <div className="w-full sm:w-2/3 lg:w-1/2">
              <FormField
                control={form.control}
                name="sold_by"
                rules={{ required: t('validation.required') }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('table.seller')}</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => {
                        field.onChange(parseInt(value, 10));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('placeholders.select_seller')} />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter(user => {
                            const selectedStore = form.watch('store_write');
                            // Cast user to ExtendedUser to access store_read
                            const extendedUser = user as ExtendedUser;
                            return user.role === 'Продавец' && 
                              (!selectedStore || extendedUser.store_read?.id === selectedStore);
                          })
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id?.toString() || ''}>
                              {user.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          )}
          
          {/* Sale Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-semibold">{t('common.sale_items')}</h2>
              <Button type="button" onClick={addSaleItem}>
                {t('common.add_item')}
              </Button>
            </div>

            {form.watch('sale_items').map((_, index: number) => (
              <div key={index} className="flex flex-col sm:flex-row flex-wrap items-start gap-2 sm:gap-4 p-3 sm:p-4 border rounded-lg bg-white shadow-sm">
                <div className="w-full sm:w-[250px]">
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
                            <div className="p-2 sticky top-0 bg-white z-10 border-b select-content-wrapper">
                              <Input
                                type="text"
                                placeholder={t('placeholders.search_products')}
                                value={productSearchTerm}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setProductSearchTerm(e.target.value);
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                className="flex-1"
                                autoFocus
                              />
                            </div>
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
                              {(isAdmin || currentUser?.is_superuser) && (
                                <>
                                 <span className="text-gray-600">{t('table.min_price')}:</span>
                              <span className="font-medium text-red-600">{selectedPrices[index].min}</span>
                                </>
                              )}
                             
                            </div>
                            {(isAdmin || currentUser?.is_superuser) && (
                              <div className="flex items-center justify-between px-2 py-1 bg-green-50 rounded">
                                <span className="text-gray-600">{t('table.profit')}:</span>
                                <span className="font-medium text-green-600">
                                  {selectedPrices[index].profit.toFixed(1).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full sm:w-[250px]">
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

                <div className="w-full sm:w-[120px]">
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

                <div className="w-full sm:w-[150px]">
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
                            onChange={(e) => handleSubtotalChange(e, index)}
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
                    className="mt-2 sm:mt-8"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">{t('table.payment_methods')}</h3>
            {form.watch('sale_payments').map((_, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-end">
                <FormField
                  control={form.control}
                  name={`sale_payments.${index}.payment_method`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t('table.payment_method')}</FormLabel>
                      <Select
                        value={typeof field.value === 'string' ? field.value : ''}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Наличные">{t('payment.cash')}</SelectItem>
                          <SelectItem value="Click">{t('payment.click')}</SelectItem>
                          <SelectItem value="Карта">{t('payment.card')}</SelectItem>
                           <SelectItem value="Перечисление">{t('payment.per')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`sale_payments.${index}.amount`}
                  render={({ field: { onChange, value } }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t('table.amount')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={value?.toString() || ''}
                          onChange={(e) => {
                            const newAmount = parseFloat(e.target.value) || 0;
                            const totalAmount = parseFloat(form.watch('total_amount'));
                            const otherPaymentsTotal = form.watch('sale_payments')
                              .filter((_, i) => i !== index)
                              .reduce((sum, p) => sum + (p.amount || 0), 0);
                            
                            // Debug logs
                            console.log('--- Payment Change Debug ---');
                            console.log('newAmount:', newAmount);
                            console.log('otherPaymentsTotal:', otherPaymentsTotal);
                            console.log('totalAmount:', totalAmount);
                            
                            // Update payment amount
                            if (newAmount + otherPaymentsTotal > totalAmount) {
                              onChange(totalAmount - otherPaymentsTotal);
                            } else {
                              onChange(newAmount);
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {index > 0 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      const payments = form.getValues('sale_payments');
                      payments.splice(index, 1);
                      const totalAmount = parseFloat(form.watch('total_amount'));
                      const remainingAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                      if (remainingAmount < totalAmount) {
                        payments[payments.length - 1].amount = totalAmount - remainingAmount;
                        form.setValue('sale_payments', payments);
                      } else {
                        form.setValue('sale_payments', payments);
                      }
                    }}
                    className="mt-0 sm:mt-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const payments = form.getValues('sale_payments');
                const totalAmount = parseFloat(form.watch('total_amount'));
                const currentTotal = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                const remaining = totalAmount - currentTotal;
                
                if (remaining > 0) {
                  payments.push({ payment_method: 'Наличные', amount: remaining });
                  form.setValue('sale_payments', payments);
                }
              }}
              className="w-full sm:w-auto"
            >
              {t('common.add_payment_method')}
            </Button>
          </div>

          {/* On Credit */}
          <div className="w-full sm:w-2/3 lg:w-1/2">
            <FormField
              control={form.control}
              name="on_credit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('table.on_credit')}</FormLabel>
                  <Select
                    value={field.value ? 'true' : 'false'}
                    onValueChange={(value) => {
                      const isCredit = value === 'true';
                      field.onChange(isCredit);
                      if (!isCredit) {
                        form.setValue('sale_debt', undefined);
                      }
                    }}
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
          </div>

          {/* Client Selection */}
          <div className="w-full sm:w-2/3 lg:w-1/2">
            <FormField
              control={form.control}
              name="sale_debt.client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('table.client')}</FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => {
                      field.onChange(parseInt(value, 10));
                      // If client is selected but on_credit is not enabled, set on_credit to false
                      if (value && !form.getValues('on_credit')) {
                        form.setValue('on_credit', false);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('placeholders.select_client')} />
                    </SelectTrigger>
                    <SelectContent onPointerDownOutside={(e) => {
                      // Prevent dropdown from closing when clicking inside it
                      const target = e.target as Node;
                      const selectContent = document.querySelector('.select-content-wrapper');
                      if (selectContent && selectContent.contains(target)) {
                        e.preventDefault();
                      }
                    }}>
                      <div className="p-2 sticky top-0 bg-white z-10 border-b select-content-wrapper">
                        <Input
                          type="text"
                          placeholder={`Search clients...`}
                          value={searchTerm}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSearchTerm(e.target.value);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="flex-1"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {clients && clients.length > 0 ? (
                          clients
                            .filter(client => form.watch('on_credit') ? true : client.type === 'Юр.лицо')
                            .map((client) => (
                              <SelectItem key={client.id} value={client.id?.toString() || ''}>
                                {client.name} {client.type !== 'Юр.лицо' && `(${client.type})`}
                              </SelectItem>
                            ))
                        ) : (
                          <div className="p-2 text-center text-gray-500 text-sm">
                            No clients found
                          </div>
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          {/* Credit Details */}
          {form.watch('on_credit') && (
            <div className="space-y-4 p-3 sm:p-4 border rounded-lg bg-amber-50 border-amber-200">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                  {t('common.on_credit')}
                </span>
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="sale_debt.deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('table.deposit')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Total Amount and Profit Display */}
          <div className="mt-6 sm:mt-8 p-4 sm:p-6 border rounded-lg bg-gray-50">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-700">
                  {t('table.total_amount')}
                </h3>
                <p className="text-xl sm:text-3xl font-bold text-green-600">
                  {form.watch('sale_payments').reduce((sum, payment) => sum + (payment.amount || 0), 0).toLocaleString()}
                </p>
              </div>
              {(isAdmin || currentUser?.is_superuser) && (
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-700">
                    {t('table.profit')}
                  </h3>
                  <p className="text-xl sm:text-3xl font-bold text-green-600">
                    {(() => {
                      const saleItems = form.watch('sale_items');
                      const totalPayments = form.watch('sale_payments').reduce((sum, payment) => sum + (payment.amount || 0), 0);
                      const totalAmount = parseFloat(form.watch('total_amount')) || 0;
                      let totalProfit = 0;
                      saleItems.forEach((item, index) => {
                        if (selectedPrices[index]) {
                          const quantity = item.quantity || 1;
                          const subtotal = parseFloat(item.subtotal) || 0;
                          const itemTotal = subtotal * quantity;
                          const stockId = item.stock_write;
                          const selectedStock = stocks.find(stock => stock.id === stockId);
                          let profitPerUnit = 0;
                          // --- Recycling profit logic ---
                          let recyclingProfitUsed = false;
                          if (selectedStock && recyclingData) {
                            const recyclingRecord = getRecyclingRecord(selectedStock.product_read.id);
                            if (recyclingRecord) {
                              // Use recycling profit calculation
                              profitPerUnit = calculateRecyclingProfit(recyclingRecord, quantity) / quantity;
                              recyclingProfitUsed = true;
                            }
                          }
                          if (!recyclingProfitUsed) {
                            if (selectedStock?.product_read?.has_kub && (selectedStock.product_read?.category_read?.id === 2 || selectedStock.product_read?.category_read?.id === 8)) {
                              const measurements = selectedStock.product_read.measurement || [];
                              const getNumber = (name: string) => {
                                const m = measurements.find((m: any) => m.measurement_read.measurement_name === name);
                                return m ? parseFloat(m.number) : 1;
                              };
                              const length = getNumber('длина');
                              const thickness = getNumber('Толщина');
                              const meter = getNumber('Метр');
                              const exchangeRate = parseFloat(selectedStock.exchange_rate_read?.currency_rate || '1');
                              const purchasePriceInUss = parseFloat(selectedStock.purchase_price_in_us || '0');
                              const purchasePriceInUs = purchasePriceInUss / 10;
                              const PROFIT_FAKE = length * meter * thickness * exchangeRate * purchasePriceInUs;
                              profitPerUnit = subtotal - PROFIT_FAKE;
                            } else {
                              const totalPurchasePrice = parseFloat(selectedStock?.purchase_price_in_uz || '0');
                              const stockQuantity = selectedStock?.quantity_for_history || selectedStock?.quantity || 1;
                              const purchasePricePerUnit = totalPurchasePrice / stockQuantity;
                              profitPerUnit = subtotal - purchasePricePerUnit;
                            }
                          }
                          const paidShare = totalAmount > 0 ? (itemTotal / totalAmount) * totalPayments : itemTotal;
                          const itemCost = (itemTotal - (profitPerUnit * quantity));
                          totalProfit += paidShare - itemCost;
                        }
                      });
                      return totalProfit.toFixed(1).toLocaleString();
                    })()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full mt-4 sm:mt-6 h-10 sm:h-12 text-base sm:text-lg font-medium" 
            disabled={createSale.isPending}
          >
            {createSale.isPending ? t('common.creating') : t('common.create')}
          </Button>
        </form>
      </Form>
    </div>
  );
}