import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetTransfers, useUpdateTransfer, useDeleteTransfer, type Transfer } from '../api/transfer';
import { useGetStocks, type Stock } from '../api/stock';
import { useGetStores, type Store } from '../api/store';

export default function TransfersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);

  const { data: transfersData, isLoading } = useGetTransfers({
    params: {
      page: page,
      page_size: 10,
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
    // {
    //   header: '№',
    //   accessorKey: 'displayId',
    // },
    {
      header: 'From Stock',
      accessorKey: 'from_stock',
      cell: (row: Transfer) => getStockName(row.from_stock),
    },
    {
      header: 'To Store',
      accessorKey: 'to_stock',
      cell: (row: Transfer) => getStoreName(row.to_stock),
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
    },
    {
      header: 'Comment',
      accessorKey: 'comment',
    },
  ];

  const handleEdit = (transfer: Transfer) => {
    setEditingTransfer(transfer);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Transfer) => {
    if (!editingTransfer?.id) return;

    updateTransfer(
      { ...data, id: editingTransfer.id },
      {
        onSuccess: () => {
          toast.success('Transfer updated successfully');
          setIsFormOpen(false);
          setEditingTransfer(null);
        },
        onError: () => toast.error('Failed to update transfer'),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this transfer?')) {
      deleteTransfer(id, {
        onSuccess: () => toast.success('Transfer deleted successfully'),
        onError: () => toast.error('Failed to delete transfer'),
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <ResourceTable
        data={transfers}
        columns={columns}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-transfer')}
        totalCount={totalCount}
        pageSize={10}
        currentPage={page}
        onPageChange={(newPage) => setPage(newPage)}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={[
              {
                name: 'from_stock',
                label: 'From Stock',
                type: 'select',
                options: stocks?.map((stock: Stock) => ({
                  value: stock.id,
                  label: `${stock.product_read?.product_name} - ${stock.quantity}`
                })) || []
              },
              {
                name: 'to_stock',
                label: 'To Store',
                type: 'select',
                options: stores?.map((store: Store) => ({
                  value: store.id,
                  label: store.name
                })) || []
              },
              {
                name: 'amount',
                label: 'Amount',
                type: 'number',
                step: '0.01'
              },
              {
                name: 'comment',
                label: 'Comment',
                type: 'textarea'
              }
            ]}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingTransfer || undefined}
            isSubmitting={isUpdating}
            title="Edit Transfer"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
