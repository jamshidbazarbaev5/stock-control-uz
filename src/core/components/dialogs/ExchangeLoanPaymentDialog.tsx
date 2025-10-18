import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateExchangeLoanPayment, useGetExchangeLoanPayments, type CreateExchangeLoanPaymentDTO } from '../../api/exchange-loan-payment';
import { formatDate } from '../../helpers/formatDate';

interface ExchangeLoanPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: number;
  loanTotalAmount: string | number;
  remainingBalance: string | number;
}

export function ExchangeLoanPaymentDialog({
  isOpen,
  onClose,
  loanId,
  loanTotalAmount,
  remainingBalance,
}: ExchangeLoanPaymentDialogProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: payments, refetch } = useGetExchangeLoanPayments(loanId);
  const createPayment = useCreateExchangeLoanPayment(loanId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t('messages.error.amount_required'));
      return;
    }

    const paymentAmount = parseFloat(amount);
    const remaining = typeof remainingBalance === 'string' ? parseFloat(remainingBalance) : remainingBalance;
    
    if (paymentAmount > remaining) {
      toast.error(t('messages.error.payment_exceeds_remaining'));
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
      refetch();
    } catch (error) {
      toast.error(t('messages.error.payment_create'));
      console.error('Failed to create payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setNotes('');
    onClose();
  };

  const remaining = typeof remainingBalance === 'string' ? parseFloat(remainingBalance) : remainingBalance;
  const total = typeof loanTotalAmount === 'string' ? parseFloat(loanTotalAmount) : loanTotalAmount;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('pages.exchange_loans.payment_dialog.title')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Loan Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">{t('pages.exchange_loans.payment_dialog.loan_summary')}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{t('forms.total_amount')}:</span>
                <span className="ml-2 font-medium">{total.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('forms.remaining_balance')}:</span>
                <span className="ml-2 font-medium">{remaining.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="button" variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common.submitting') : t('common.create_payment')}
              </Button>
            </div>
          </form>

          {/* Payment History */}
          {payments && payments.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">{t('pages.exchange_loans.payment_dialog.payment_history')}</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">
                        {typeof payment.amount === 'number' 
                          ? payment.amount.toLocaleString() 
                          : payment.amount}
                      </div>
                      {payment.notes && (
                        <div className="text-sm text-gray-600">{payment.notes}</div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.paid_at ? formatDate(payment.paid_at) : '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
