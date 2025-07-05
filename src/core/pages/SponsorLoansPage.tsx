import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchLoans, type Loan } from '../api/loan';
import { createLoanPayment } from '../api/loanpaymentCreate';
import { ResourceTable } from '../helpers/ResourseTable';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { FaTimes, FaRegMoneyBillAlt, FaRegListAlt } from 'react-icons/fa';

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
              className="btn btn-primary flex items-center justify-center"
              title={t('Оплатить')}
              onClick={() => setPayModalLoan(loan)}
              disabled={loan.is_paid}
            >
              <FaRegMoneyBillAlt className="w-5 h-5 mr-2" />
              {t('Оплатить')}
            </button>
            <button
              className="btn btn-secondary flex items-center justify-center"
              title={t('Платежи')}
              onClick={() => navigate(`/sponsors/${id}/loans/${loan.id}/payments`)}
            >
              <FaRegListAlt className="w-5 h-5 mr-2" />
              {t('Платежи')}
            </button>
          </div>
        )}
      />
      {payModalLoan && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[350px]">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <FaRegMoneyBillAlt className="w-5 h-5 text-gray-700" />
              {t('Оплатить займ')}
            </h4>
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
            <button
              className="mt-4 btn btn-outline w-full flex items-center justify-center"
              onClick={() => setPayModalLoan(null)}
              title={t('Закрыть')}
            >
              <FaTimes className="w-4 h-4 mr-2" />
              {t('Закрыть')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
