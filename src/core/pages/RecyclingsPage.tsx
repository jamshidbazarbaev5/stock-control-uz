import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourseTable';

import { toast } from 'sonner';
import { useGetRecyclings, useDeleteRecycling } from '../api/recycling';
import { format } from 'date-fns';

const columns = (t: any) => [
  {
    header: t('table.from_stock'),
    accessorKey: 'from_to',
  },
  {
    header: t('table.to_product'),
    accessorKey: 'to_product',
  },
  {
    header: t('table.to_stock'),
    accessorKey: 'to_stock',
  },
  
  {
    header: t('table.date'),
    accessorKey: 'date_of_recycle',
    cell: (row: any) => {
      const date = row.date_of_recycle;
      return date ? format(new Date(date), 'dd/MM/yyyy') : '-';
    },
  },
    
];

export default function RecyclingsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { t } = useTranslation();

  // Fetch recyclings with pagination
  const { data: recyclingsData, isLoading } = useGetRecyclings({
    params: {
      page,
      page_size: 10,
      ordering: '-date_of_recycle',
    },
  });

  // Handle both array and object response formats
  const recyclings = Array.isArray(recyclingsData) 
    ? recyclingsData 
    : recyclingsData?.results || [];
  const totalCount = Array.isArray(recyclingsData) 
    ? recyclingsData.length 
    : recyclingsData?.count || 0;

  const { mutate: deleteRecycling } = useDeleteRecycling();

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
        {/* <Button onClick={() => navigate('/create-recycling')}>
          {t('common.create')} {t('navigation.recyclings')}
        </Button> */}
      </div>

      <ResourceTable
        data={recyclings}
        columns={columns(t)}
        isLoading={isLoading}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-recycling')}
        pageSize={10}
        totalCount={totalCount}
        currentPage={page}
        onPageChange={setPage}
      />
    </div>
  );
}