import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourseTable';
import { type Sale, useGetSales, useDeleteSale } from '../api/sale';
import { toast } from 'sonner';

export default function SalesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  
  const { data: salesData, isLoading } = useGetSales({ 
    params: { 
      page,
        
    }
  });

  const deleteSale = useDeleteSale();

  // Get sales array and total count
  const sales = Array.isArray(salesData) ? salesData : salesData?.results || [];
  const totalCount = Array.isArray(salesData) ? sales.length : salesData?.count || 0;

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('ru-RU').format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    try {
      // Parse the ISO date string
      const date = new Date(dateString);
      // Format the date
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (error) {
      return '-';
    }
  };

  const columns = [
    {
      header: t('table.store'),
      accessorKey: 'store_read',
      cell: (row: Sale) => row.store_read?.name || '-',
    },
    {
      header: t('table.payment_method'),
      accessorKey: 'payment_method',
    },
    {
      header: t('table.items'),
      accessorKey: 'sale_items',
      cell: (row: Sale) => {
        if (!row.sale_items?.length) return '0';
        const itemsText = row.sale_items.map(item => {
          const product = item.stock_read?.product_read?.product_name || '-';
          const quantity = item.quantity;
          const method = item.selling_method;
          return `${quantity} ${method} ${product}`;
        }).join(' • ');
        return (
          <div className="whitespace-pre-wrap text-sm">
            {itemsText}
          </div>
        );
      },
    },
    {
      header: t('table.total_amount'),
      accessorKey: 'total_amount',
      cell: (row: Sale) => formatCurrency(row.total_amount) + ' UZS',
    },
    {
      header: t('table.on_credit'),
      accessorKey: 'on_credit',
      cell: (row: Sale) => row.on_credit ? t('common.yes') : t('common.no'),
    },
    {
      header: t('table.client'),
      accessorKey: 'sale_debt',
      cell: (row: Sale) => row.sale_debt?.client_read?.name || '-',
    },
    {
      header: t('table.due_date'),
      accessorKey: 'sale_debt',
      cell: (row: Sale) => row.sale_debt?.due_date ? formatDate(row.sale_debt.due_date) : '-',
    },
    {
      header: t('table.date'),
      accessorKey: 'created_at',
      cell: (row: Sale) => row.created_at ? formatDate(row.created_at) : '-',
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      await deleteSale.mutateAsync(id);
      toast.success(t('messages.success.deleted', { item: t('navigation.sales') }));
    } catch (error) {
      toast.error(t('messages.error.delete', { item: t('navigation.sales') }));
      console.error('Failed to delete sale:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.sales')}</h1>
      </div>

      <ResourceTable
        data={sales}
        columns={columns}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={(row: Sale) => navigate(`/edit-sale/${row.id}`)}
        onAdd={() => navigate('/create-sale')}
        pageSize={10}
        totalCount={totalCount}
        currentPage={page}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
}