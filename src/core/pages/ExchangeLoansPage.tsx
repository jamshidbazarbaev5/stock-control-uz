import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGetExchangeLoans, useDeleteExchangeLoan, type ExchangeLoan } from '../api/exchange-loan';
import { useGetStores } from '../api/store';
import { useGetCurrencies } from '../api/currency';
import { useCreateExchangeLoanPayment, type CreateExchangeLoanPaymentDTO } from '../api/exchange-loan-payment';
import { ResourceTable } from '../helpers/ResourseTable';
import { formatDate } from '../helpers/formatDate';

export default function ExchangeLoansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<ExchangeLoan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const pageSize = 10;

  const { data: exchangeLoansData, isLoading } = useGetExchangeLoans({
    params: {
      page: currentPage,
      ...(searchTerm && { search: searchTerm }),
      ...(selectedStore && selectedStore !== 'all' && { store: selectedStore }),
      ...(selectedCurrency && selectedCurrency !== 'all' && { currency: selectedCurrency }),
      ...(selectedStatus && selectedStatus !== 'all' && { is_paid: selectedStatus === 'paid' }),
      ...(dateFrom && { created_at_after: dateFrom }),
      ...(dateTo && { created_at_before: dateTo }),
    },
  });

  const deleteExchangeLoan = useDeleteExchangeLoan();
  const { data: storesData } = useGetStores({});
  const { data: currenciesData } = useGetCurrencies({});
  const createPayment = useCreateExchangeLoanPayment(selectedLoan?.id || 0);

  const stores = Array.isArray(storesData) ? storesData : (storesData?.results || []);
  const currencies = Array.isArray(currenciesData) ? currenciesData : (currenciesData?.results || []);

  // Handle both array and object response formats
  const results = Array.isArray(exchangeLoansData)
    ? exchangeLoansData
    : exchangeLoansData?.results || [];
  const totalCount = Array.isArray(exchangeLoansData)
    ? exchangeLoansData.length
    : exchangeLoansData?.count || 0;

  const exchangeLoans = results.map((loan, index) => ({
    ...loan,
    displayId: (currentPage - 1) * pageSize + index + 1,
  }));

  const columns = [
    {
      accessorKey: 'store',
      header: t('forms.store'),
      cell: (row: ExchangeLoan) => {
        const store = row.store;
        return store ? (
          <div>
            <div className="font-medium">{store.name}</div>
            <div className="text-sm text-muted-foreground">{store.address}</div>
          </div>
        ) : '-';
      },
    },
    {
      accessorKey: 'total_amount',
      header: t('forms.total_amount'),
      cell: (row: ExchangeLoan) => {
        const amount = row.total_amount;
        const currency = row.currency;
        return (
          <div>
            <div className="font-medium">
              {typeof amount === 'number' ? amount.toLocaleString() : amount}
            </div>
            {currency && (
              <div className="text-sm text-muted-foreground">
                {currency.short_name}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'remaining_balance',
      header: t('forms.remaining_balance'),
      cell: (row: ExchangeLoan) => {
        const balance = row.remaining_balance;
        const currency = row.currency;
        return (
          <div>
            <div className="font-medium">
              {balance ? (typeof balance === 'number' ? balance.toLocaleString() : balance) : '-'}
            </div>
            {currency && balance && (
              <div className="text-sm text-muted-foreground">
                {currency.short_name}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'currency_rate',
      header: t('forms.currency_rate'),
      cell: (row: ExchangeLoan) => {
        const rate = row.currency_rate;
        return (
          <div className="font-medium">
            {typeof rate === 'number' ? rate.toLocaleString() : rate}
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: t('forms.created_at'),
      cell: (row: ExchangeLoan) => {
        const date = row.created_at;
        return (
            <div className="text-sm text-muted-foreground">
              {date ? formatDate(date) : '-'}
            </div>
        );
      },
    },
   
    {
      accessorKey: 'due_date',
      header: t('forms.due_date'),
      cell: (row: ExchangeLoan) => {
        const date = row.due_date;
        return (
          <div className="font-medium">
            {date ? formatDate(date) : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'is_paid',
      header: t('forms.status'),
      cell: (row: ExchangeLoan) => {
        const isPaid = row.is_paid;
        return (
          <Badge variant={isPaid ? 'default' : 'secondary'}>
            {isPaid ? t('status.paid') : t('status.unpaid')}
          </Badge>
        );
      },
    },

    {
      id: 'actions',
      accessorKey: 'id',
      header: t('common.actions'),
      cell: (row: ExchangeLoan) => {
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/exchange-loans/${row.id}/edit`)}
            >
              {t('common.edit')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePaymentClick(row)}
            >
              {t('common.payment')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/exchange-loans/${row.id}/payments`)}
            >
              {t('common.view_payments')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(row.id!)}
            >
              {t('common.delete')}
            </Button>
          </div>
        );
      },
    },
  ];

  const handleDelete = async (id: number) => {
    if (window.confirm(t('messages.confirm.delete', { item: t('navigation.exchange_loans') }))) {
      try {
        await deleteExchangeLoan.mutateAsync(id);
        toast.success(t('messages.success.deleted', { item: t('navigation.exchange_loans') }));
      } catch (error) {
        toast.error(t('messages.error.delete', { item: t('navigation.exchange_loans') }));
        console.error('Failed to delete exchange loan:', error);
      }
    }
  };


  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStore('all');
    setSelectedCurrency('all');
    setSelectedStatus('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handlePaymentClick = (loan: ExchangeLoan) => {
    setSelectedLoan(loan);
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentModalOpen(true);
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLoan || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error(t('messages.error.amount_required'));
      return;
    }

    const paymentAmountNum = parseFloat(paymentAmount);
    const remaining = typeof selectedLoan.remaining_balance === 'string' 
      ? parseFloat(selectedLoan.remaining_balance) 
      : selectedLoan.remaining_balance || 0;
    
    if (paymentAmountNum > remaining) {
      toast.error(t('messages.error.payment_exceeds_remaining'));
      return;
    }

    // Check if payment exceeds store budget
    const storeBudget = typeof selectedLoan.store?.budget === 'string' 
      ? parseFloat(selectedLoan.store.budget) 
      : selectedLoan.store?.budget || 0;
    
    if (paymentAmountNum > storeBudget) {
      toast.error(t('messages.error.payment_exceeds_budget', { 
        budget: storeBudget.toLocaleString(),
        store: selectedLoan.store?.name || 'Unknown Store'
      }));
      return;
    }

    setIsSubmittingPayment(true);
    
    try {
      const paymentData: CreateExchangeLoanPaymentDTO = {
        amount: paymentAmountNum,
        notes: paymentNotes || undefined,
      };

      await createPayment.mutateAsync(paymentData);
      toast.success(t('messages.success.payment_created'));
      setPaymentAmount('');
      setPaymentNotes('');
      setPaymentModalOpen(false);
      setSelectedLoan(null);
    } catch (error) {
      toast.error(t('messages.error.payment_create'));
      console.error('Failed to create payment:', error);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleClosePaymentModal = () => {
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentModalOpen(false);
    setSelectedLoan(null);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('navigation.exchange_loans')}</h1>
          <p className="text-muted-foreground">
            {t('pages.exchange_loans.description')}
          </p>
        </div>
        <Button onClick={() => navigate('/exchange-loans/create')}>
          {t('common.create')} {t('navigation.exchange_loans')}
        </Button>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Input
            placeholder={t('placeholders.search_exchange_loans')}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
          />
          
          <Select value={selectedStore} onValueChange={(value) => { setSelectedStore(value); handleFilterChange(); }}>
            <SelectTrigger>
              <SelectValue placeholder={t('forms.store')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id?.toString() || ''}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCurrency} onValueChange={(value) => { setSelectedCurrency(value); handleFilterChange(); }}>
            <SelectTrigger>
              <SelectValue placeholder={t('forms.currency')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {currencies.map((currency) => (
                <SelectItem key={currency.id} value={currency.id?.toString() || ''}>
                  {currency.name} ({currency.short_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={(value) => { setSelectedStatus(value); handleFilterChange(); }}>
            <SelectTrigger>
              <SelectValue placeholder={t('forms.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="paid">{t('status.paid')}</SelectItem>
              <SelectItem value="unpaid">{t('status.unpaid')}</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            placeholder={t('forms.date_from')}
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); handleFilterChange(); }}
          />

          <Input
            type="date"
            placeholder={t('forms.date_to')}
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); handleFilterChange(); }}
          />
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <Button variant="outline" onClick={clearFilters}>
            {t('common.clear_filters')}
          </Button>
        </div>
      </div>

      <ResourceTable
        data={exchangeLoans}
        columns={columns}
        isLoading={isLoading}
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={handleClosePaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('common.create_payment')}</DialogTitle>
          </DialogHeader>
          
          {selectedLoan && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600 mb-2">{t('pages.exchange_loans.payment_dialog.loan_summary')}</div>
              <div className="text-sm space-y-1">
                <div>{t('forms.store')}: {selectedLoan.store?.name || '-'}</div>
                <div>{t('forms.total_amount')}: {typeof selectedLoan.total_amount === 'number' ? selectedLoan.total_amount.toLocaleString() : selectedLoan.total_amount}</div>
                <div>{t('forms.remaining_balance')}: {typeof selectedLoan.remaining_balance === 'number' ? selectedLoan.remaining_balance.toLocaleString() : selectedLoan.remaining_balance}</div>
                <div className="font-medium text-blue-600">
                  {t('forms.store_budget')}: {selectedLoan.store?.budget ? String(selectedLoan.store.budget).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0'}
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleCreatePayment} className="space-y-4">
            <div>
              <Label htmlFor="paymentAmount">{t('forms.amount')} *</Label>
              <Input
                id="paymentAmount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={t('placeholders.enter_amount')}
                min="0"
                max={selectedLoan ? (typeof selectedLoan.remaining_balance === 'number' ? selectedLoan.remaining_balance : parseFloat(selectedLoan.remaining_balance || '0')) : 0}
                step="0.01"
                required
              />
              {selectedLoan && (
                <p className="text-sm text-gray-500 mt-1">
                  {t('pages.exchange_loans.payment_dialog.max_amount')}: {typeof selectedLoan.remaining_balance === 'number' ? selectedLoan.remaining_balance.toLocaleString() : selectedLoan.remaining_balance}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="paymentNotes">{t('forms.notes')}</Label>
              <Textarea
                id="paymentNotes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder={t('placeholders.enter_notes')}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClosePaymentModal}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmittingPayment}>
                {isSubmittingPayment ? t('common.submitting') : t('common.create_payment')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
