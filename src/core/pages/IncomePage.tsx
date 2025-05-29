import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetIncomes } from '../api/income';
import { ResourceTable } from '../helpers/ResourseTable';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetStores } from '../api/store';
import type { Store } from '../api/store';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

export default function IncomePage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const { data: storesData } = useGetStores();
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  
  const { data: incomesData, isLoading } = useGetIncomes({
    params: {
      ...(selectedStore !== 'all' && { store: selectedStore }),
      ...(selectedSource !== 'all' && { source: selectedSource }),
      ...(startDate && { start_date: format(startDate, 'yyyy-MM-dd') }),
      ...(endDate && { end_date: format(endDate, 'yyyy-MM-dd') })
    }
  });
  
  const incomes = Array.isArray(incomesData) ? incomesData : incomesData?.results || [];
  const totalCount = Array.isArray(incomesData) ? incomes.length : incomesData?.count || 0;

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('ru-RU').format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  const columns = [
    {
      header: t('forms.store'),
      accessorKey: 'store_read.name',
      cell: (row: any) => row.store_read?.name || '-',
    },
    {
      header: t('table.source'),
      accessorKey: 'source',
      cell: (row: any) => row.source || '-',
    },
    {
      header: t('forms.amount'),
      accessorKey: 'description.Amount',
      cell: (row: any) => (
        <span className="font-medium text-emerald-600">
          {formatCurrency(row.description.Amount)} UZS
        </span>
      ),
    },
    {
      header: t('forms.worker'),
      accessorKey: 'description.Worker',
      cell: (row: any) => row.description.Worker || '-',
    },
    {
      header: t('forms.date'),
      accessorKey: 'timestamp',
      cell: (row: any) => formatDate(row.timestamp),
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.incomes')}</h1>
      </div>

      <div className="flex gap-4 mb-6">
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('forms.select_store')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('forms.all_stores')}</SelectItem>
            {stores.map((store: Store) => (
              <SelectItem key={store.id} value={String(store.id)}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSource} onValueChange={setSelectedSource}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('forms.select_source')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('forms.all_sources')}</SelectItem>
            <SelectItem value="Погашение долга">Погашение долга</SelectItem>
            <SelectItem value="Продажа">Продажа</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-4">
          <DatePicker
            selected={startDate}
            onChange={(date: Date | null) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            dateFormat="dd/MM/yyyy"
            placeholderText={t('forms.start_date')}
            className="w-[200px] flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <DatePicker
            selected={endDate}
            onChange={(date: Date | null) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate || undefined}
            dateFormat="dd/MM/yyyy"
            placeholderText={t('forms.end_date')}
            className="w-[200px] flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <Card>
        <ResourceTable
          data={incomes}
          columns={columns}
          isLoading={isLoading}
          totalCount={totalCount}
          pageSize={10}
          currentPage={page}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </Card>
    </div>
  );
}
