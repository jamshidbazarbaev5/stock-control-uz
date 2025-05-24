import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../@/components/ui/dialog';
import { useGetDebts, useCreateDebtPayment, type Debt } from '../api/debt';
import { ResourceForm } from '../helpers/ResourceForm';
import { ResourceTable } from '../helpers/ResourseTable';
import { useNavigate } from 'react-router-dom';

interface PaymentFormData {
  amount: number;
  payment_method: string;
}

export default function DebtsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { data: debtsData, isLoading } = useGetDebts({});
  const createPayment = useCreateDebtPayment();

  const debts = Array.isArray(debtsData) ? debtsData : debtsData?.results || [];

  const columns = [
    {
      accessorKey: 'client_read.name',
      header: t('forms.client_name'),
      cell: (debt: Debt) => (
        <div>
          <div>
            <button
              onClick={() => navigate(`/debts/${debt.id}`)}
              className="text-blue-600 hover:underline hover:text-blue-800"
            >
              {debt.client_read.name}{' '}
              <span className="text-gray-500">({t(`${debt.client_read.type}`)})</span>
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {debt.client_read.phone_number}
          </div>
        </div>
      ),
    },

    {
      accessorKey: 'total_amount',
      header: t('forms.total_amount'),
      cell: (debt: Debt) => debt.total_amount?.toLocaleString(),
    },
    {
      accessorKey: 'deposit',
      header: t('forms.deposit'),
      cell: (debt: Debt) => debt.deposit?.toLocaleString(),
    },
    {
      accessorKey: 'remainder',
      header: t('forms.remainder'),
      cell: (debt: Debt) => (
        <span className={debt.remainder < 0 ? 'text-green-600' : 'text-red-600'}>
          {debt.remainder?.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: t('forms.created_date'),
      cell: (debt: Debt) => new Date(debt.created_at).toLocaleDateString(),
    },
    {
      accessorKey: 'due_date',
      header: t('forms.due_date'),
      cell: (debt: Debt) => new Date(debt.due_date).toLocaleDateString(),
    },
    {
      accessorKey: 'is_paid',
      header: t('forms.status'),
      cell: (debt: Debt) => (
        <span className={debt.is_paid ? 'text-green-600' : 'text-red-600'}>
          {debt.is_paid ? t('common.paid') : t('common.unpaid')}
        </span>
      ),
    },
    {
      accessorKey: 'actions',
      header: t('forms.actions'),
      cell: (debt: Debt) => (
        <div className="space-x-2">
          <button
            onClick={() => handlePayClick(debt)}
            disabled={debt.is_paid || debt.remainder <= 0}
            className={`px-3 py-1 rounded ${
              debt.is_paid || debt.remainder <= 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {t('forms.payment_method')}
          </button>
          <button
            onClick={() => navigate(`/debts/${debt.id}/history`)}
            className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white"
          >
            {t('forms.history')}
          </button>
          
        </div>
      ),
    },
  ];

  const handlePayClick = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    if (!selectedDebt) return;

    try {
      await createPayment.mutateAsync({
        debt: selectedDebt.id!,
        amount: data.amount,
        payment_method: data.payment_method,
      });
      toast.success(t('messages.success.payment_created'));
      // Invalidate and refetch debts
      await queryClient.invalidateQueries({ queryKey: ['debts'] });
      setIsPaymentModalOpen(false);
      setSelectedDebt(null);
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
          message: t('validation.amount_must_be_positive')
        },
        max: {
          value: selectedDebt?.remainder || 0,
          message: t('validation.amount_exceeds_remainder')
        },
      },
    },
    {
      name:"payment_method",
      label: t('forms.payment_method'),
      type: 'select',
      placeholder: t('placeholders.select_payment_method'),
      required: true,
      options: [
        { value: 'Наличные', label: t('forms.cash') },
        { value: 'Карта', label: t('forms.card') },
        { value: 'Click', label: t('forms.click') },
        { value: 'Сложная оплата', label: t('forms.complex_payment') },
      ],
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <ResourceTable
        columns={columns}
        data={debts}
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