import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateDebtPayment } from '../api/debt';
import { useGetDebtsByClients, type DebtByClient } from '../api/debts-by-clients';
import { ResourceTable } from '../helpers/ResourseTable';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ResourceForm } from '../helpers/ResourceForm';

interface PaymentFormData {
  amount: number;
  payment_method: string;
}

export default function DebtsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDebtClient, setSelectedDebtClient] = useState<DebtByClient | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Filter states
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchName, setSearchName] = useState<string>('');

  const { data: debtsByClients = [], isLoading } = useGetDebtsByClients({
    ...(searchName && { name: searchName }),
    ...(selectedType !== 'all' && { type: selectedType }),
  });

  const createPayment = useCreateDebtPayment();

  const handlePayClick = (client: DebtByClient) => {
    setSelectedDebtClient(client);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    if (!selectedDebtClient) return;

    if (data.amount > Number(selectedDebtClient.balance)) {
      toast.error(t('validation.amount_exceeds_remainder'));
      return;
    }

    try {
      await createPayment.mutateAsync({
        debt: selectedDebtClient.id,
        amount: data.amount,
        payment_method: data.payment_method,
      });
      toast.success(t('messages.success.payment_created'));
      // Invalidate and refetch debts
      await queryClient.invalidateQueries({ queryKey: ['debtsByClients'] });
      setIsPaymentModalOpen(false);
      setSelectedDebtClient(null);
    } catch (error) {
      toast.error(t('messages.error.payment_create'));
      console.error('Failed to create payment:', error);
    }
  };

  const paymentFields = [
    {
      name: 'amount',
      label: t('forms.amount'),
      type: 'number',
      placeholder: t('placeholders.enter_amount'),
      required: true,
      validation: {
        min: {
          value: 0.01,
          message: t('validation.amount_must_be_positive'),
        },
        max: {
          value: selectedDebtClient?.balance || 0,
          message: t('validation.amount_exceeds_remainder'),
        },
      },
    },
    {
      name: 'payment_method',
      label: t('forms.payment_method'),
      type: 'select',
      placeholder: t('placeholders.select_payment_method'),
      required: true,
      options: [
        { value: 'Наличные', label: t('forms.cash') },
        { value: 'Карта', label: t('forms.card') },
        { value: 'Click', label: t('forms.click') },
      ],
    },
  ];

  const columns = [
    {
      accessorKey: 'name',
      header: t('forms.client_name'),
      cell: (client: DebtByClient) => (
        <div>
          <div>
            <button
              onClick={() => navigate(`/debts/${client.id}`)}
              className="text-blue-600 hover:underline hover:text-blue-800"
            >
              {client.name}{' '}
              <span className="text-gray-500">({t(`${client.type}`)})</span>
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {client.phone_number}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: t('forms.total_amount'),
      cell: (client: DebtByClient) => client.total_amount?.toLocaleString(),
    },
    {
      accessorKey: 'total_deposit',
      header: t('forms.deposit'),
      cell: (client: DebtByClient) => client.total_deposit?.toLocaleString(),
    },
    {
      accessorKey: 'balance',
      header: t('forms.balance'),
      cell: (client: DebtByClient) => (
        <span className={Number(client.balance) < 0 ? 'text-red-600' : 'text-green-600'}>
          {client.balance?.toLocaleString() || '0'}
        </span>
      ),
    },
    {
      accessorKey: 'actions',
      header: t('forms.actions'),
      cell: (client: DebtByClient) => (
        <div className="space-x-2">
          <button
            onClick={() => handlePayClick(client)}
            disabled={Number(client.balance) <= 0}
            className={`px-3 py-1 rounded ${
              Number(client.balance) <= 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {t('forms.payment_method')}
          </button>
          <button
            onClick={() => navigate(`/clients/${client.id}/history`)}
            className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white"
          >
            {t('forms.history')}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8">
      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder={t('forms.select_client_type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('forms.all_clients')}</SelectItem>
              <SelectItem value="Физ.лицо">{t('forms.individual')}</SelectItem>
              <SelectItem value="Юр.лицо">{t('forms.legal_entity')}</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder={t('forms.search_by_name')}
          />
        </div>
      </Card>

      <ResourceTable
        columns={columns}
        data={debtsByClients}
        isLoading={isLoading}
      />

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('forms.payment_method')}</DialogTitle>
          </DialogHeader>
          <ResourceForm
            fields={paymentFields}
            onSubmit={handlePaymentSubmit}
            isSubmitting={createPayment.isPending}
            title={t('forms.payment_method')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}