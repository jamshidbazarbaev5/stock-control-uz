import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetTransfers, useUpdateTransfer, useDeleteTransfer, type Transfer } from '../api/transfer';
import { useGetStocks, type Stock } from '../api/stock';
import { useGetStores, type Store } from '../api/store';

export default function TransfersPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
  const [selectedFromStock, setSelectedFromStock] = useState<number | null>(null);

  const { data: transfersData, isLoading } = useGetTransfers({
    params: {
      page: page,
      page_size: 30,
      ordering: '-created_at',
    },
  });
  const { data: stocksData } = useGetStocks();
  const { data: storesData } = useGetStores();

  // Handle both array and object response formats
  const results = Array.isArray(transfersData) ? transfersData : transfersData?.results || [];
  const totalCount = Array.isArray(transfersData) ? transfersData.length : transfersData?.count || 0;
  const stocks = Array.isArray(stocksData) ? stocksData : stocksData?.results || [];
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];

  const transfers = results.map((transfer, index) => ({
    ...transfer,
    displayId: (page - 1) * 10 + index + 1,
  }));

  const { mutate: updateTransfer, isPending: isUpdating } = useUpdateTransfer();
  const { mutate: deleteTransfer } = useDeleteTransfer();

  const getStockName = (stockId: number) => {
    const stock = stocks.find((s: Stock) => s.id === stockId);
    return stock?.product_read?.product_name || 'Unknown Stock';
  };

  const getStoreName = (storeId: number) => {
    const store = stores.find((s: Store) => s.id === storeId);
    return store?.name || 'Unknown Store';
  };

  const columns = [
    {
      header: t('table.from_stock'),
      accessorKey: 'from_stock',
      cell: (row: Transfer) => getStockName(row.from_stock),
    },
    {
      header: t('table.store'),
      accessorKey: 'to_stock',
      cell: (row: Transfer) => getStoreName(row.to_stock),
    },
    {
      header: t('forms.amount'),
      accessorKey: 'amount',
    },
    {
      header: t('forms.comment'),
      accessorKey: 'comment',
    },
  ];

  const handleEdit = (transfer: Transfer) => {
    setEditingTransfer(transfer);
    setSelectedFromStock(Number(transfer.from_stock));
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Transfer) => {
    if (!editingTransfer?.id) return;

    // Find the source stock and destination store to check if they're the same
    const sourceStock = stocks.find((s: Stock) => s.id === Number(data.from_stock));
    const destStore = stores.find((s: Store) => s.id === Number(data.to_stock));
    
    const sourceStoreId = sourceStock?.store_read?.id;
    const destStoreId = destStore?.id;
    
    // Prevent transfers between the same store
    if (sourceStoreId && destStoreId && sourceStoreId === destStoreId) {
      toast.error(t('messages.error.same_store_transfer') || 'Cannot transfer to the same store');
      return;
    }

    updateTransfer(
      { ...data, id: editingTransfer.id },
      {
        onSuccess: () => {
          toast.success('Transfer created successfully');
          setIsFormOpen(false);
          setEditingTransfer(null);
        },
        onError: (error: any) => {
          if (error?.response?.data?.non_field_errors?.includes('Cannot transfer to the same store.')) {
            toast.error('Cannot transfer to the same store');
          } else {
            toast.error('Failed to update transfer');
          }
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteTransfer(id, {
      onSuccess: () => toast.success(t('messages.success.deleted')),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.transfers') })),
    });
  };

  return (
    <div className="container mx-auto py-6">
       <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.transfers')}</h1>
        {/* <Button onClick={() => navigate('/create-recycling')}>
          {t('common.create')} {t('navigation.recyclings')}
        </Button> */}
      </div>
      <ResourceTable
        data={transfers}
        columns={columns}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-transfer')}
        totalCount={totalCount}
        pageSize={30}
        currentPage={page}
        onPageChange={(newPage) => setPage(newPage)}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={[
              {
                name: 'from_stock',
                label: t('forms.from_stock'),
                type: 'select',
                options: stocks?.map((stock: Stock) => ({
                  value: stock.id,
                  label: `${stock.product_read?.product_name} - ${stock.quantity}`
                })) || [],
                defaultValue: selectedFromStock,
                onChange: (value: number) => {
                  setSelectedFromStock(Number(value));
                }
              },
              {
                name: 'to_stock',
                label: t('forms.to_store'),
                type: 'select',
                options: stores?.map((store: Store) => {
                  // Get the source stock ID based on the currently selected from_stock
                  const sourceStock = stocks.find((s: Stock) => s.id === selectedFromStock);
                  const sourceStoreId = sourceStock?.store_read?.id;
                  
                  // Skip if this store is the same as source store
                  if (sourceStoreId && store.id === sourceStoreId) return null;
                  
                  return {
                    value: store.id,
                    label: store.name
                  };
                }).filter(Boolean) || []
              },
              {
                name: 'amount',
                label: t('forms.amount'),
                type: 'number',
                step: '0.01'
              },
              {
                name: 'comment',
                label: t('forms.comment'),
                type: 'textarea'
              }
            ]}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingTransfer || undefined}
            isSubmitting={isUpdating}
            title={t('messages.edit', { item: t('navigation.transfers') })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
