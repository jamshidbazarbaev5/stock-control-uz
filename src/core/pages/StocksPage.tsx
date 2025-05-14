import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import type { Stock } from '../api/stock';
import { useGetStocks, useDeleteStock, useUpdateStock } from '../api/stock';
import { useGetProducts } from '../api/product';
import { useGetStores } from '../api/store';
import { useGetMeasurements } from '../api/measurement';
import { ResourceTable } from '../helpers/ResourseTable';

const columns = [
  {
    header: 'ID',
    accessorKey: 'id',
  },
  {
    header: 'Product',
    accessorKey: 'product_read',
    cell: (row: Stock) => row.product_read?.product_name || '-',
  },
  {
    header: 'Store',
    accessorKey: 'product_read',
    cell: (row: Stock) => row.product_read?.store_read?.name || '-',
  },
  {
    header: 'Purchase Price',
    accessorKey: 'purchase_price',
  },
  {
    header: 'Selling Price',
    accessorKey: 'selling_price',
  },
  {
    header: 'Min Price',
    accessorKey: 'min_price',
  },
  {
    header: 'Quantity',
    accessorKey: 'quantity',
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
    name: 'purchase_price',
    label: 'Purchase Price',
    type: 'text',
    placeholder: 'Enter purchase price',
    required: true,
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
    name: 'measurement_write',
    label: 'Measurement',
    type: 'select',
    placeholder: 'Select measurement',
    required: true,
    options: [], // Will be populated with measurements
  },
];

export default function StocksPage() {
  const navigate = useNavigate();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Get stocks without pagination
  const {
    data: stocksData,
    isLoading,
  } = useGetStocks({});

  // Get the stocks array, defaulting to empty array if undefined
  const stocks = Array.isArray(stocksData) ? stocksData : [];

  // Fetch products, stores and measurements for the select dropdowns
  const { data: productsData } = useGetProducts({});
  const { data: storesData } = useGetStores({});
  const { data: measurementsData } = useGetMeasurements({});

  // Get the products, stores and measurements arrays
  const products = Array.isArray(productsData) ? productsData : productsData?.results || [];
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const measurements = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];

  // Mutations
  const updateStock = useUpdateStock();
  const deleteStock = useDeleteStock();

  // Update fields with product, store and measurement options
  const fields = stockFields.map(field => {
    if (field.name === 'product_write') {
      return {
        ...field,
        options: products.map(product => ({
          value: product.id,
          label: product.product_name
        }))
      };
    }
    if (field.name === 'store_write') {
      return {
        ...field,
        options: stores.map(store => ({
          value: store.id,
          label: store.name
        }))
      };
    }
    if (field.name === 'measurement_write') {
      return {
        ...field,
        options: measurements.map(measurement => ({
          value: measurement.id,
          label: measurement.measurement_name
        }))
      };
    }
    return field;
  });

  // Handlers
  const handleEdit = (stock: Stock) => {
    // Get the initial measurement ID from measurement_read
    const initialMeasurementId = stock.measurement_read?.[0]?.measurement_write;

    // Create a modified stock object with the correct initial values
    const stockWithInitialValues: Stock = {
      ...stock,
      // Set store_write from product's store_read
      store_write: stock.product_read?.store_read?.id ?? stock.store_write,
      // Set product_write from product_read
      product_write: stock.product_read?.id ?? stock.product_write,
      // Set measurement_write as a simple number for the select field
      measurement_write: initialMeasurementId ? [{ measurement_write: initialMeasurementId, number: stock.quantity }] : []
    };
    
    setSelectedStock(stockWithInitialValues);
  };

  const handleUpdate = async (data: Partial<Stock>) => {
    if (!selectedStock?.id) return;

    try {
      const quantity = typeof data.quantity === 'string' ? parseInt(data.quantity, 10) : data.quantity!;
      const measurement = typeof data.measurement_write === 'string' ? parseInt(data.measurement_write, 10) : data.measurement_write!;
      
      // Format the measurement_write data
      const formattedData = {
        id: selectedStock.id,
        store_write: typeof data.store_write === 'string' ? parseInt(data.store_write, 10) : data.store_write!,
        product_write: typeof data.product_write === 'string' ? parseInt(data.product_write, 10) : data.product_write!,
        purchase_price: data.purchase_price!,
        selling_price: data.selling_price!,
        min_price: data.min_price!,
        quantity: quantity,
        measurement_write: [{
          measurement_write: typeof measurement === 'number' ? measurement : measurement[0].measurement_write,
          number: quantity
        }]
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
      toast.success('Stock deleted successfully');
    } catch (error) {
      toast.error('Failed to delete stock');
      console.error('Failed to delete stock:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stocks</h1>
        <Button onClick={() => navigate('/create-stock')}>Add New Stock</Button>
      </div>

      <ResourceTable
        data={stocks}
        columns={columns}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        pageSize={pageSize}
        totalCount={stocks.length}
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
              title="Edit Stock"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
