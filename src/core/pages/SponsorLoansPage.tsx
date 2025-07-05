import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchLoans, type Loan } from '../api/loan';
import { createLoanPayment } from '../api/loanpaymentCreate';
import { ResourceTable } from '../helpers/ResourseTable';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';

export default function SponsorLoansPage() {
  const { t } = useTranslation();
  const { id, currency } = useParams<{ id: string; currency: string }>();
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [payModalLoan, setPayModalLoan] = useState<Loan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !currency) return;
    setIsLoading(true);
    fetchLoans(Number(id), currency)
      .then(setLoans)
      .catch(() => toast.error(t('Failed to fetch loans')))
      .finally(() => setIsLoading(false));
  }, [id, currency, t]);

  const handlePayLoan = async (data: any) => {
    if (!id || !payModalLoan) return;
    setIsSubmitting(true);
    try {
      await createLoanPayment(Number(id), payModalLoan.id, { ...data, loan: payModalLoan.id });
      toast.success(t('Платеж успешно добавлен'));
      setPayModalLoan(null);
      // Optionally, refresh loans or payments here
    } catch {
      toast.error(t('Ошибка при добавлении платежа'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const loanColumns = [
    { header: t('forms.amount'), accessorKey: 'total_amount' },
    { header: t('forms.currency'), accessorKey: 'currency' },
    { header: t('forms.due_date'), accessorKey: 'due_date' },
    { header: t('forms.status'), accessorKey: (row: Loan) => row.is_paid ? t('common.paid') : t('common.unpaid') },
  ];

  return (
    <div className="container py-8 px-4">
      <h3 className="text-lg font-bold mb-2">
        {t('Займы')} ({currency})
      </h3>
      <ResourceTable<Loan>
        data={loans}
        columns={loanColumns}
        isLoading={isLoading}
        totalCount={loans.length}
        actions={(loan) => (
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => setPayModalLoan(loan)}
            >
              {t('Оплатить')}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/sponsors/${id}/loans/${loan.id}/payments`)}
            >
              {t('Платежи')}
            </button>
          </div>
        )}
      />
      {payModalLoan && (
        <div className="fixed inset-0 flex items-center justify-center bg-muted bg-opacity-70 z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[350px]">
            <h4 className="font-bold mb-4">{t('Оплатить займ')}</h4>
            <ResourceForm
              fields={[
                { name: 'amount', label: t('forms.amount'), type: 'number', required: true },
                { name: 'payment_method', label: t('forms.payment_method'), type: 'select', required: true, options: [
                  { value: 'Click', label: 'Click' },
                  { value: 'Карта', label: t('forms.card') },
                  { value: 'Наличные', label: t('forms.cash') },
                  { value: 'Перечисление', label: t('payment.per') },
                ] },
                { name: 'notes', label: t('forms.notes'), type: 'textarea' },
              ]}
              onSubmit={handlePayLoan}
              isSubmitting={isSubmitting}
              hideSubmitButton={false}
            />
            <button className="mt-4 btn btn-outline w-full" onClick={() => setPayModalLoan(null)}>
              {t('Закрыть')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
