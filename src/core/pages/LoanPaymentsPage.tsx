import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetLoanPaymentsByLoan } from '../api/loanpaymentByLoan';
import { ResourceTable } from '../helpers/ResourseTable';

export default function LoanPaymentsPage() {
  const { loanId } = useParams<{ loanId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: payments = [], isLoading } = useGetLoanPaymentsByLoan(loanId);

  // Define columns for ResourceTable
  const columns = [
    
    {
      header: t('forms.amount'),
      accessorKey: 'amount',
    },
    {
      header: t('forms.payment_method'),
      accessorKey: 'payment_method',
    },
    {
      header: t('forms.notes'),
      accessorKey: 'notes',
    },
    {
      header: t('forms.paid_at'),
      cell: (row: any) => new Date(row.paid_at).toLocaleString(),
      accessorKey: 'paid_at',
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <button className="mb-4 px-4 py-2 bg-gray-200 rounded" onClick={() => navigate(-1)}>
        {t('common.back')}
      </button>
      <h1 className="text-2xl font-bold mb-4">{t('navigation.payments')}</h1>
      <ResourceTable
        data={payments}
        columns={columns}
        isLoading={isLoading}
        pageSize={30}
        totalCount={payments.length}
      />
    </div>
  );
}
