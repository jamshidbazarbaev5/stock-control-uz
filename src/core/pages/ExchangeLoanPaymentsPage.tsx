import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Wallet, Calendar, TrendingUp, Building2, DollarSign, CheckCircle2, Clock, Sparkles } from 'lucide-react';
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
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground">Loading loan details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <div className="text-muted-foreground">Exchange loan not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const remaining = typeof loan.remaining_balance === 'string' 
    ? parseFloat(loan.remaining_balance) 
    : loan.remaining_balance || 0;
  const total = typeof loan.total_amount === 'string' 
    ? parseFloat(loan.total_amount) 
    : loan.total_amount || 0;

  const paidAmount = total - remaining;
  const progressPercent = total > 0 ? (paidAmount / total) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Building2 className="h-4 w-4" />
                <span>{loan.store?.name || '-'}</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-blue-600" />
                {t('pages.exchange_loans.payment_dialog.title')}
              </h1>
              <p className="text-muted-foreground text-lg">
                {t('pages.exchange_loans.payment_dialog.loan_summary')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/exchange-loans')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('common.back')}
              </Button>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30"
                disabled={loan.is_paid}
              >
                <Plus className="h-4 w-4" />
                {t('common.create_payment')}
              </Button>
            </div>
          </div>
        </div>

        {/* Loan Summary - Enhanced Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Amount Card */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-8 w-8 opacity-80" />
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  {loan.currency?.short_name || 'USD'}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm opacity-90">{t('forms.total_amount')}</p>
                <p className="text-3xl font-bold">{total.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Remaining Balance Card */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="h-8 w-8 opacity-80" />
                <Badge 
                  variant="secondary" 
                  className={`border-none ${
                    loan.is_paid 
                      ? 'bg-green-500/80 text-white' 
                      : 'bg-white/20 text-white'
                  }`}
                >
                  {loan.is_paid ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm opacity-90">{t('forms.remaining_balance')}</p>
                <p className="text-3xl font-bold">{remaining.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Due Date Card */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-8 w-8 opacity-80" />
              </div>
              <div className="space-y-1">
                <p className="text-sm opacity-90">{t('forms.due_date')}</p>
                <p className="text-2xl font-bold">{loan.due_date ? formatDate(loan.due_date) : '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Store Budget Card */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-8 w-8 opacity-80" />
              </div>
              <div className="space-y-1">
                <p className="text-sm opacity-90">{t('forms.store_budget')}</p>
                <p className="text-2xl font-bold">
                  {loan.store?.budget ? String(loan.store.budget).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Card */}
        <Card className="mb-8 border-none shadow-lg bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Оплата
              </span>
              <Badge variant={loan.is_paid ? "default" : "secondary"} className="gap-1">
                {loan.is_paid ? (
                  <><CheckCircle2 className="h-3 w-3" /> {t('status.paid')}</>
                ) : (
                  <><Clock className="h-3 w-3" /> {t('status.unpaid')}</>
                )}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Оплачено: {paidAmount.toLocaleString()} {loan.currency?.short_name}</span>
                <span className="font-semibold">{progressPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 shadow-lg"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              {t('pages.exchange_loans.payment_dialog.payment_history')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-muted-foreground">Loading payments...</p>
                </div>
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment: ExchangeLoanPayment, index: number) => (
                  <div 
                    key={payment.id} 
                    className="group relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50/50 p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full" />
                    <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                          #{payments.length - index}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                              {typeof payment.amount === 'number' 
                                ? payment.amount.toLocaleString() 
                                : payment.amount}
                            </span>
                            <Badge variant="outline" className="gap-1">
                              {loan.currency?.short_name || 'USD'}
                            </Badge>
                          </div>
                          {payment.notes && (
                            <p className="text-sm text-muted-foreground mt-2 flex items-start gap-2">
                              <span className="text-blue-600">💬</span>
                              <span>{payment.notes}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground sm:text-right">
                        <Calendar className="h-4 w-4" />
                        <span>{payment.paid_at ? formatDate(payment.paid_at) : '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <Wallet className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-muted-foreground">{t('messages.no_payments_found')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Payment Modal - Enhanced */}
        <Dialog open={isCreateModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Plus className="h-6 w-6 text-blue-600" />
              {t('common.create_payment')}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreatePayment} className="space-y-5">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base font-semibold">
                {t('forms.amount')} *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                <span className="text-sm text-blue-900 font-medium">
                  {t('pages.exchange_loans.payment_dialog.max_amount')}:
                </span>
                <span className="text-sm font-bold text-blue-700">
                  {remaining.toLocaleString()} {loan.currency?.short_name}
                </span>
              </div>
            </div>

            {/* Notes Input */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-semibold">
                {t('forms.notes')}
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('placeholders.enter_notes')}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseModal}
                className="flex-1 h-11"
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('common.submitting')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t('common.create_payment')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
