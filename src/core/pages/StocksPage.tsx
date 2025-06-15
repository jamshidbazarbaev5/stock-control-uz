import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import type { Stock } from '../api/stock';
import type { Product } from '../api/product';
import type { Store } from '../api/store';
import type { Measurement } from '../api/measurement';
import type { Supplier } from '../api/supplier';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useGetStocks, useDeleteStock, useUpdateStock } from '../api/stock';
import { useGetProducts } from '../api/product';
import { useGetStores } from '../api/store';
import { useGetMeasurements } from '../api/measurement';
import { useGetSuppliers } from '../api/supplier';
import { ResourceTable } from '../helpers/ResourseTable';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {formatDate} from "@/core/helpers/formatDate.ts";

type PaginatedData<T> = { results: T[]; count: number } | T[];

export default function StocksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const pageSize = 30;

  // Columns definition
  const columns = [
    {
      header: t('table.product'),
      accessorKey: 'product_read',
      cell: (row: Stock) => row.product_read?.product_name || '-',
    },
    {
      header: t('table.store'),
      accessorKey: 'product_read',
      cell: (row: any) => row.store_read?.name || '-',
    },
    {
      header: t('table.purchase_price'),
      accessorKey: 'purchase_price_in_uz',
    },
    {
      header: t('table.selling_price'),
      accessorKey: 'selling_price',
    },
    {
      header: t('table.date_of_arrived'),
      accessorKey:'date',
      cell:(row:any)=>(
          <p>
            {formatDate(row.history_of_prices.date_of_arrived)}
          </p>
      )
    },
    {
      header: t('table.quantity'),
      accessorKey: 'quantity',
    },
    {
      header: t('table.actions'),
      accessorKey: 'actions',
      cell: (row: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/stocks/${row.id}/history`)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v5h5" />
              <path d="M3 3l6.1 6.1" />
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => navigate(`/create-sale?productId=${row.product_read?.id}&stockId=${row.id}`)}
              >
                {t('common.create')} {t('navigation.sale')}
              </DropdownMenuItem>
              {currentUser?.role?.toLowerCase() !== 'продавец' && (
                <>
                  <DropdownMenuItem 
                    onClick={() => navigate(`/create-transfer?fromProductId=${row.product_read?.id}&fromStockId=${row.id}`)}
                  >
                    {t('common.create')} {t('navigation.transfer')}
                  </DropdownMenuItem>
                  {row.product_read?.has_recycling && (
                    <DropdownMenuItem 
                      onClick={() => navigate(`/create-recycling?fromProductId=${row.product_read?.id}&fromStockId=${row.id}`)}
                    >
                      {t('common.create')} {t('navigation.recycling')}
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const stockFields = [
    {
      name: 'store_write',
      label: 'Store',
      type: 'select',
      placeholder: 'Select store',
      required: true,
      options: [], // Will be populated with stores
    },
    {
      name: 'product_write',
      label: 'Product',
      type: 'select',
      placeholder: 'Select product',
      required: true,
      options: [], // Will be populated with products
    },
    {
      name: 'purchase_price_in_us',
      label: 'Purchase Price (USD)',
      type: 'text',
      placeholder: 'Enter purchase price in USD',
      required: true,
    },
    {
      name: 'exchange_rate',
      label: 'Exchange Rate',
      type: 'text',
      placeholder: 'Enter exchange rate',
      required: true,
    },
    {
      name: 'purchase_price_in_uz',
      label: 'Purchase Price (UZS)',
      type: 'text',
      placeholder: 'Calculated purchase price in UZS',
      readOnly: true,
    },
    {
      name: 'selling_price',
      label: 'Selling Price',
      type: 'text',
      placeholder: 'Enter selling price',
      required: true,
    },
    {
      name: 'min_price',
      label: 'Minimum Price',
      type: 'text',
      placeholder: 'Enter minimum price',
      required: true,
    },
    {
      name: 'quantity',
      label: 'Quantity',
      type: 'text',
      placeholder: 'Enter quantity',
      required: true,
    },
    {
      name: 'supplier_write',
      label: 'Supplier',
      type: 'select',
      placeholder: 'Select supplier',
      required: true,
      options: [], // Will be populated with suppliers
    },
    {
      name: 'color',
      label: 'Color',
      type: 'text',
      placeholder: 'Enter color',
      required: true,
    },
    {
      name: 'measurement_write',
      label: 'Measurement',
      type: 'select',
      placeholder: 'Select measurement',
      required: true,
      options: [], // Will be populated with measurements
    },
  ];

  const { data: stocksData, isLoading } = useGetStocks({
    params: {
      product: selectedProduct === 'all' ? undefined : selectedProduct,
      store: selectedStore === 'all' ? undefined : selectedStore,
      supplier: selectedSupplier === 'all' ? undefined : selectedSupplier,
      date_of_arrived_gte: dateFrom || undefined,
      date_of_arrived_lte: dateTo || undefined
    }
  });

  // Get the stocks array from the paginated response
  const stocks = stocksData?.results || [];

  // Fetch products, stores, measurements and suppliers for the select dropdowns
  const { data: productsData } = useGetProducts({});
  const { data: storesData } = useGetStores({});
  const { data: measurementsData } = useGetMeasurements({});
  const { data: suppliersData } = useGetSuppliers({});

  // Extract data from paginated responses
  const getPaginatedData = <T extends { id?: number }>(data: PaginatedData<T> | undefined): T[] => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.results;
  };

  const products = getPaginatedData<Product>(productsData);
  const stores = getPaginatedData<Store>(storesData);
  const measurements = getPaginatedData<Measurement>(measurementsData);
  const suppliers = getPaginatedData<Supplier>(suppliersData);

  // Mutations
  const updateStock = useUpdateStock();
  const deleteStock = useDeleteStock();

  // Update fields with product, store, measurement and supplier options
  const fields = stockFields.map(field => {
    if (field.name === 'product_write') {
      return {
        ...field,
        options: products.map((product: Product) => ({
          value: product.id,
          label: product.product_name
        }))
      };
    }
    if (field.name === 'store_write') {
      return {
        ...field,
        options: stores.map((store: Store) => ({
          value: store.id,
          label: store.name
        }))
      };
    }
    if (field.name === 'measurement_write') {
      return {
        ...field,
        options: measurements.map((measurement: Measurement) => ({
          value: measurement.id,
          label: measurement.measurement_name
        }))
      };
    }
    if (field.name === 'supplier_write') {
      return {
        ...field,
        options: suppliers.map((supplier: Supplier) => ({
          value: supplier.id,
          label: supplier.name
        }))
      };
    }
    return field;
  });

  // Handlers
  const handleEdit = (stock: Stock) => {
    navigate(`/edit-stock/${stock.id}`);
  };

  const handleUpdate = async (data: Partial<Stock>) => {
    if (!selectedStock?.id) return;

    try {
      const quantity = typeof data.quantity === 'string' ? parseInt(data.quantity, 10) : data.quantity!;
      const measurement = typeof data.measurement_write === 'string' ? parseInt(data.measurement_write, 10) : data.measurement_write!;
      
      // Calculate the UZS price from USD and exchange rate
      const priceInUSD = parseFloat(data.purchase_price_in_us || '0');
      const exchangeRate = parseFloat(data.exchange_rate || '0');
      const priceInUZS = (priceInUSD * exchangeRate).toString();

      // Format the data for the API
      const formattedData: Stock = {
        id: selectedStock.id,
        store_write: typeof data.store_write === 'string' ? parseInt(data.store_write, 10) : data.store_write!,
        product_write: typeof data.product_write === 'string' ? parseInt(data.product_write, 10) : data.product_write!,
        purchase_price: priceInUZS,
        selling_price: data.selling_price!,
        min_price: data.min_price!,
        quantity: quantity,
        supplier_write: typeof data.supplier_write === 'string' ? parseInt(data.supplier_write, 10) : data.supplier_write!,
        color: data.color!,
        measurement_write: [{
          measurement_write: typeof measurement === 'number' ? measurement : measurement[0].measurement_write,
          number: quantity
        }],
        purchase_price_in_us: data.purchase_price_in_us || '0',
        exchange_rate: data.exchange_rate || '0',
        purchase_price_in_uz: priceInUZS
      };

      await updateStock.mutateAsync(formattedData);
      toast.success('Stock updated successfully');
      setSelectedStock(null);
    } catch (error) {
      toast.error('Failed to update stock');
      console.error('Failed to update stock:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteStock.mutateAsync(id);
      toast.success(t('messages.success.deleted', { item: t('table.product') }));
    } catch (error) {
      toast.error(t('messages.error.delete', { item: t('table.product') }));
      console.error('Failed to delete stock:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.stocks')}</h1>
        <Button onClick={() => navigate('/create-stock')}>{t('common.create')} </Button>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5" >
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder={t('forms.select_product')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('forms.all_products')}</SelectItem>
                {products?.map((product: Product) => product.id ? (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.product_name}
                  </SelectItem>
                ) : null) || null}
              </SelectContent>
            </Select>

            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger>
                <SelectValue placeholder={t('forms.select_store')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('forms.all_stores')}</SelectItem>
                {stores?.map((store: Store) => store.id ? (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ) : null) || null}
              </SelectContent>
            </Select>

            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder={t('forms.select_supplier')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('forms.all_suppliers')}</SelectItem>
                {suppliers?.map((supplier: Supplier) => supplier.id ? (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ) : null) || null}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder={t('forms.from_date')}
            />

            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder={t('forms.to_date')}
            />
          </div>

      <ResourceTable
        data={stocks}
        columns={columns}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={currentUser?.role?.toLowerCase() !== 'продавец' ? handleDelete : undefined}
        pageSize={pageSize}
        totalCount={stocksData?.count || 0}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      <Dialog open={!!selectedStock} onOpenChange={() => setSelectedStock(null)}>
        <DialogContent>
          {selectedStock && (
            <ResourceForm<Stock>
              fields={fields}
              onSubmit={handleUpdate}
              defaultValues={selectedStock}
              isSubmitting={updateStock.isPending}
              title={t('common.edit') + ' ' + t('table.product')}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
