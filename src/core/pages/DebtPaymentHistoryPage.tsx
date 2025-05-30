import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useGetDebtPayments } from '../api/debt';
import { ResourceTable } from '../helpers/ResourseTable';

export default function DebtPaymentHistoryPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  
  const { data: payments = [], isLoading } = useGetDebtPayments(id!);

  const columns = [
    {
      accessorKey: 'amount',
      header: t('forms.amount2'),
      cell: (payment: any) => payment.amount.toLocaleString(),
    },
    {
      accessorKey: 'paid_at',
      header: t('forms.payment_date'),
      cell: (payment: any) => new Date(payment.paid_at).toLocaleDateString(),
    },
    {
      accessorKey: 'payment_method',
      header:t('forms.payment_method2'),

    }
  ];

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">{t('pages.payment_history')}</h2>
      <ResourceTable
        columns={columns}
        data={payments}
        isLoading={isLoading}
      />
    </div>
  );
}