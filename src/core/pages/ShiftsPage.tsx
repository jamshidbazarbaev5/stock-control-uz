import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResourceTable } from '../helpers/ResourseTable';
import { shiftsApi } from '../api/shift';
import type { Shift } from '../api/shift';
import { formatDate } from '../helpers/formatDate';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function ShiftsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery({
    queryKey: ['shifts', page, searchTerm],
    queryFn: () => shiftsApi.getAll(),
  });

  const columns = [
    {
      header: t('table.id'),
      accessorKey: 'id',
    },
    {
      header: t('table.store'),
      accessorKey: 'store',
    },
    {
      header: t('table.register'),
      accessorKey: 'register.name',
    },
    {
      header: t('table.cashier'),
      accessorKey: 'cashier',
    },
    {
      header: t('table.opened_at'),
      accessorKey: 'opened_at',
      cell: (row: Shift) => formatDate(row.opened_at),
    },
    {
      header: t('table.closed_at'),
      accessorKey: 'closed_at',
      cell: (row: Shift) => row.closed_at ? formatDate(row.closed_at) : '-',
    },
    {
      header: t('table.opening_cash'),
      accessorKey: 'opening_cash',
    },
    {
      header: t('table.closing_cash'),
      accessorKey: 'closing_cash',
      cell: (row: Shift) => row.closing_cash || '-',
    },
    {
      header: t('table.status'),
      accessorKey: 'is_active',
      cell: (row: Shift) => row.is_active ? t('common.active') : t('common.closed'),
    },
    {
      header: t('table.comment'),
      accessorKey: 'comment',
    },
  ];

  const handleEdit = (shift: Shift) => {
    navigate(`/shifts/${shift.id}/edit`);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.shifts')}</h1>
        <Button onClick={() => navigate('/shifts/new')}>{t('common.create')}</Button>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder={t('placeholders.search_shifts')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ResourceTable<Shift>
        data={response?.data || []}
        columns={columns}
        isLoading={isLoading}
        onEdit={currentUser?.is_superuser ? handleEdit : undefined}
        totalCount={response?.data.length || 0}
        currentPage={page}
        onPageChange={setPage}
        pageSize={30}
      />
    </div>
  );
}