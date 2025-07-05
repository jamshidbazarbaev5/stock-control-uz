import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetLoanPaymentsByLoan } from '../api/loanpaymentByLoan';
import { ResourceTable } from '../helpers/ResourseTable';

export default function LoanPaymentsPage() {
  const { id: sponsorId, loanId } = useParams<{ id: string; loanId: string }>();
  const { t } = useTranslation();
  const { data: payments = [], isLoading } = useGetLoanPaymentsByLoan(sponsorId, loanId);

  return (
    <div className="container py-8 px-4">
      <h3 className="text-lg font-bold mb-2">{t('Платежи по займу')} #{loanId}</h3>
      <ResourceTable
        data={payments}
        columns={[
          { header: t('forms.amount'), accessorKey: 'amount' },
          { header: t('forms.payment_method'), accessorKey: 'payment_method' },
          { header: t('forms.notes'), accessorKey: 'notes' },
          { header: t('forms.paid_at'), accessorKey: (row) => new Date(row.paid_at).toLocaleString() },
        ]}
        isLoading={isLoading}
        totalCount={payments.length}
      />
    </div>
  );
}
