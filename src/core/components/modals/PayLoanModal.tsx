import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { payLoan } from '@/core/api/payLoan';
import { useTranslation } from 'react-i18next';

interface PayLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: number | null;
  onSuccess: () => void;
}

export function PayLoanModal({ open, onOpenChange, loanId, onSuccess }: PayLoanModalProps) {
  const { t } = useTranslation('common');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PAYMENT_METHODS = [
    { value: 'Наличные', label: t('forms.cash') },
    { value: 'Карта', label: t('forms.card') },
    { value: 'Click', label: t('forms.click') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanId) return;
    setIsSubmitting(true);
    try {
      await payLoan(loanId, {
        amount: parseFloat(amount),
        loan: loanId,
        notes,
        payment_method: paymentMethod,
      });
      toast.success(t('messages.success.payment'));
      onSuccess();
      onOpenChange(false);
      setAmount('');
      setNotes('');
      setPaymentMethod('');
    } catch (err) {
      toast.error(t('messages.error.payment'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-bold mb-2">{t('forms.pay_loan')}</h2>
          <div>
            <label className="block mb-1">{t('forms.amount')}</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block mb-1">{t('forms.notes')}</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block mb-1">{t('forms.payment_method')}</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              required
              className="w-full p-2 border rounded"
            >
              <option value="" disabled>{t('placeholders.select_payment_method')}</option>
              {PAYMENT_METHODS.map(method => (
                <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={isSubmitting}>
            {isSubmitting ? t('forms.paying') : t('forms.pay')}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
