import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetExchangeLoanCustom } from '../api/exchange-loan';
import { useGetExchangeLoanPayments, useCreateExchangeLoanPayment, type CreateExchangeLoanPaymentDTO, type ExchangeLoanPayment } from '../api/exchange-loan-payment';
import { formatDate } from '../helpers/formatDate';

export default function ExchangeLoanPaymentsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: loan, isLoading: loanLoading } = useGetExchangeLoanCustom(Number(id));
  const { data: payments, isLoading: paymentsLoading, refetch } = useGetExchangeLoanPayments(Number(id));
  const createPayment = useCreateExchangeLoanPayment(Number(id));

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t('messages.error.amount_required'));
      return;
    }

    const paymentAmount = parseFloat(amount);
    const remaining = typeof loan?.remaining_balance === 'string' 
      ? parseFloat(loan.remaining_balance) 
      : loan?.remaining_balance || 0;
    
    if (paymentAmount > remaining) {
      toast.error(t('messages.error.payment_exceeds_remaining'));
      return;
    }

    // Check if payment exceeds store budget
    const storeBudget = typeof loan?.store?.budget === 'string' 
      ? parseFloat(loan.store.budget) 
      : loan?.store?.budget || 0;
    
    if (paymentAmount > storeBudget) {
      toast.error(t('messages.error.payment_exceeds_budget', { 
        budget: storeBudget.toLocaleString(),
        store: loan?.store?.name || 'Unknown Store'
      }));
      return;
    }

    setIsSubmitting(true);
    
    try {
      const paymentData: CreateExchangeLoanPaymentDTO = {
        amount: paymentAmount,
        notes: notes || undefined,
      };

      await createPayment.mutateAsync(paymentData);
      toast.success(t('messages.success.payment_created'));
      setAmount('');
      setNotes('');
      setIsCreateModalOpen(false);
      refetch();
    } catch (error) {
      toast.error(t('messages.error.payment_create'));
      console.error('Failed to create payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setAmount('');
    setNotes('');
    setIsCreateModalOpen(false);
  };

  if (loanLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Exchange loan not found</div>
      </div>
    );
  }

  const remaining = typeof loan.remaining_balance === 'string' 
    ? parseFloat(loan.remaining_balance) 
    : loan.remaining_balance || 0;
  const total = typeof loan.total_amount === 'string' 
    ? parseFloat(loan.total_amount) 
    : loan.total_amount || 0;

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('pages.exchange_loans.payment_dialog.title')}</h1>
          <p className="text-muted-foreground">
            {t('pages.exchange_loans.payment_dialog.loan_summary')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/exchange-loans')}>
            {t('common.back')}
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            {t('common.create_payment')}
          </Button>
        </div>
      </div>

      {/* Loan Summary */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('pages.exchange_loans.payment_dialog.loan_summary')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-sm text-gray-600">{t('forms.store')}</Label>
            <div className="font-medium">{loan.store?.name || '-'}</div>
          </div>
          <div>
            <Label className="text-sm text-gray-600">{t('forms.currency')}</Label>
            <div className="font-medium">
              {loan.currency ? `${loan.currency.name} (${loan.currency.short_name})` : '-'}
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-600">{t('forms.total_amount')}</Label>
            <div className="font-medium">{total.toLocaleString()}</div>
          </div>
          <div>
            <Label className="text-sm text-gray-600">{t('forms.remaining_balance')}</Label>
            <div className="font-medium">{remaining.toLocaleString()}</div>
          </div>
          <div>
            <Label className="text-sm text-gray-600">{t('forms.due_date')}</Label>
            <div className="font-medium">{loan.due_date ? formatDate(loan.due_date) : '-'}</div>
          </div>
          <div>
            <Label className="text-sm text-gray-600">{t('forms.status')}</Label>
            <div className="font-medium">
              <span className={`px-2 py-1 rounded text-sm ${
                loan.is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {loan.is_paid ? t('status.paid') : t('status.unpaid')}
              </span>
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-600">{t('forms.store_budget')}</Label>
            <div className="font-medium text-blue-600">
              {loan.store?.budget ? String(loan.store.budget).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('pages.exchange_loans.payment_dialog.payment_history')}</h2>
        
        {paymentsLoading ? (
          <div className="text-center py-8">Loading payments...</div>
        ) : payments && payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment: ExchangeLoanPayment) => (
              <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="text-lg font-semibold">
                        {typeof payment.amount === 'number' 
                          ? payment.amount.toLocaleString() 
                          : payment.amount}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.paid_at ? formatDate(payment.paid_at) : '-'}
                      </div>
                    </div>
                    {payment.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        {payment.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {t('messages.no_payments_found')}
          </div>
        )}
      </div>

      {/* Create Payment Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('common.create_payment')}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreatePayment} className="space-y-4">
            <div>
              <Label htmlFor="amount">{t('forms.amount')} *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('placeholders.enter_amount')}
                min="0"
                max={remaining}
                step="0.01"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {t('pages.exchange_loans.payment_dialog.max_amount')}: {remaining.toLocaleString()}
              </p>
            </div>

            <div>
              <Label htmlFor="notes">{t('forms.notes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('placeholders.enter_notes')}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common.submitting') : t('common.create_payment')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
