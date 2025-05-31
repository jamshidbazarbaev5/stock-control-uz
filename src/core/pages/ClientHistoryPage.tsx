import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetClient, useGetClientHistory } from '../api/client';
import { format } from 'date-fns';
import { ResourceTable } from '../helpers/ResourseTable';
import { CalendarIcon, CoinsIcon, PiggyBankIcon, WalletIcon } from 'lucide-react';
import type { ClientHistoryEntry } from '../api/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export default function ClientHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<string>('all');
  const { data: client, isLoading: isClientLoading } = useGetClient(Number(id));
  const { data: history, isLoading: isHistoryLoading } = useGetClientHistory(Number(id), { 
    type: selectedType === 'all' ? undefined : selectedType 
  });

  if (isClientLoading || isHistoryLoading) {
    return <div className="container py-8 px-4">Loading...</div>;
  }

  if (!client || client.type !== 'Юр.лицо') {
    return <div className="container py-8 px-4">{t('messages.error.not_found')}</div>;
  }

  const columns = [
    {
      header: t('forms.date'),
      accessorKey: 'timestamp',
      cell: (row: ClientHistoryEntry) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-500" />
          {format(new Date(row.timestamp), 'dd.MM.yyyy HH:mm')}
        </div>
      ),
    },
    {
      header: t('forms.amount_deducted'),
      accessorKey: 'amount_deducted',
      cell: (row: ClientHistoryEntry) => (
        <div className="flex items-center gap-2">
          <CoinsIcon className="h-4 w-4 text-gray-500" />
          {row.amount_deducted}
        </div>
      ),
    },
    {
      header: t('forms.previous_balance'),
      accessorKey: 'previous_balance',
      cell: (row: ClientHistoryEntry) => (
        <div className="flex items-center gap-2">
          <WalletIcon className="h-4 w-4 text-gray-500" />
          {row.previous_balance}
        </div>
      ),
    },
    {
      header: t('forms.new_balance'),
      accessorKey: 'new_balance',
      cell: (row: ClientHistoryEntry) => (
        <div className="flex items-center gap-2">
          <PiggyBankIcon className="h-4 w-4 text-gray-500" />
          {row.new_balance}
        </div>
      ),
    },
   
  ];

  return (
    <div className="container py-8 px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{client.name}</h2>
        <p className="text-gray-600">{t('forms.ceo_name')}: {client.ceo_name}</p>
        <p className="text-gray-600">{t('forms.current_balance')}: {client.balance}</p>
      </div>

      <div className="mb-4 w-[200px]">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger>
            <SelectValue placeholder={t('forms.select_type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="Расход">Расход</SelectItem>
            <SelectItem value="Пополнение">Пополнение</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ResourceTable<any>
        data={history || []}
        columns={columns}
        isLoading={isHistoryLoading}
        
      />
    </div>
  );
}
