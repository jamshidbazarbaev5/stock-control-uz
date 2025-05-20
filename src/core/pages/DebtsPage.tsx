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

interface PaymentFormData {
  amount: number;
}

export default function DebtsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { data: debtsData, isLoading } = useGetDebts({});
  const createPayment = useCreateDebtPayment();

  const debts = Array.isArray(debtsData) ? debtsData : debtsData?.results || [];

  const columns = [
    {
      accessorKey: 'total_amount',
      header: t('forms.amount'),
    },
    {
      accessorKey: 'deposit',
      header: t('forms.deposit'),
    },
    {
      accessorKey: 'remainder',
      header: t('forms.remainder'),
    },
    {
      accessorKey: 'due_date',
      header: t('forms.due_date'),
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
        <button
          onClick={() => handlePayClick(debt)}
          disabled={debt.is_paid || debt.remainder === 0}
          className={`px-3 py-1 rounded ${
            debt.is_paid || debt.remainder === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {t('forms.payment_method')}
        </button>
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
    },
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