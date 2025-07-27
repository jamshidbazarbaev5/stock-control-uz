import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourseTable';
import { toast } from 'sonner';
import { useGetRecyclings, useDeleteRecycling } from '../api/recycling';
import { format } from 'date-fns';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Input } from '@/components/ui/input';

const columns = (t: any) => [
  {
    header: t('table.from_stock'),
    accessorKey: 'from_to_read',
    cell: (row: any) => {
      const fromStore = row.from_to_read?.store_read?.name;
      const fromProduct = row.from_to_read?.product_read?.product_name;
      return fromStore && fromProduct ? `${fromProduct} (${fromStore})` : '-';
    },
  },
  {
    header: t('table.to_product'),
    accessorKey: 'to_product_read',
    cell: (row: any) => row.to_product_read?.product_name || '-',
  },
  {
    header: t('table.to_stock'),
    accessorKey: 'to_stock_read',
    cell: (row: any) => row.to_stock_read?.store_read?.name || '-',
  },
  {
    header: t('table.date'),
    accessorKey: 'date_of_recycle',
    cell: (row: any) => {
      const date = row.date_of_recycle;
      return date ? format(new Date(date), 'dd/MM/yyyy') : '-';
    },
  },
  {
    header: t('table.spent_amount'),
    accessorKey: 'spent_amount',
  },
  {
    header: t('table.get_amount'),
    accessorKey: 'get_amount',
  },
];

export default function RecyclingsPage() {
  const [page, setPage] = useState(1);
  const { t } = useTranslation();
  const [id,setId] = useState<string>('');

  // Fetch recyclings with pagination
  const { data: recyclingsData, isLoading } = useGetRecyclings({
    params: {
      page,
      stock_id:id
    },
  });

  const recyclings = recyclingsData?.results || [];
  const totalCount = recyclingsData?.count || 0;

  const { mutate: deleteRecycling } = useDeleteRecycling();
  const {data:currentUser} = useCurrentUser();
  const handleDelete = (id: number) => {
    deleteRecycling(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.recyclings') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.recyclings') }))
    });
  };

  return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('navigation.recyclings')}</h1>
        </div>
        <Input value={id} onChange={(e) => setId(String(e.target.value))} placeholder={t('table.id')} />

        <ResourceTable
            data={recyclings}
            columns={columns(t)}
            isLoading={isLoading}
            onDelete={currentUser?.is_superuser ? handleDelete : undefined}
            pageSize={30}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
        />
      </div>
  );
}