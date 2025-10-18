import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useGetExchangeLoan, useUpdateExchangeLoan, type CreateExchangeLoanDTO } from '../api/exchange-loan';
import { useGetStores as useGetStoresHook } from '../api/store';
import { useGetCurrencies as useGetCurrenciesHook } from '../api/currency';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Store } from '../api/store';
import type { Currency } from '../api/currency';

const exchangeLoanFields = (t: any, stores: Store[], currencies: Currency[]) => [
  {
    name: 'store',
    label: t('forms.store'),
    type: 'select',
    required: true,
    options: stores.map(store => ({
      value: store.id,
      label: store.name,
    })),
  },
  {
    name: 'currency',
    label: t('forms.currency'),
    type: 'select',
    required: true,
    options: currencies.map(currency => ({
      value: currency.id,
      label: `${currency.name} (${currency.short_name})`,
    })),
  },
  {
    name: 'total_amount',
    label: t('forms.total_amount'),
    type: 'number',
    placeholder: t('placeholders.enter_total_amount'),
    required: true,
  },
  {
    name: 'currency_rate',
    label: t('forms.currency_rate'),
    type: 'number',
    placeholder: t('placeholders.enter_currency_rate'),
    required: true,
  },
  {
    name: 'deposit_amount',
    label: t('forms.deposit_amount'),
    type: 'number',
    placeholder: t('placeholders.enter_deposit_amount'),
    required: true,
  },
  {
    name: 'due_date',
    label: t('forms.due_date'),
    type: 'date',
    required: true,
  },
  {
    name: 'notes',
    label: t('forms.notes'),
    type: 'textarea',
    placeholder: t('placeholders.enter_notes'),
    required: false,
  },
];

export default function EditExchangeLoanPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { mutate: updateExchangeLoan, isPending: isUpdating } = useUpdateExchangeLoan();
  const { data: exchangeLoan, isLoading } = useGetExchangeLoan(Number(id));
  const { data: storesData } = useGetStoresHook({});
  const { data: currenciesData } = useGetCurrenciesHook({});

  const stores = Array.isArray(storesData) ? storesData : (storesData?.results || []);
  const currencies = Array.isArray(currenciesData) ? currenciesData : (currenciesData?.results || []);
  const fields = exchangeLoanFields(t, stores as Store[], currencies as Currency[]);

  const handleSubmit = (data: Partial<CreateExchangeLoanDTO>) => {
    if (!id) return;
    
    const formData = {
      ...data,
      store: typeof data.store === 'string' ? parseInt(data.store, 10) : data.store,
      currency: typeof data.currency === 'string' ? parseInt(data.currency, 10) : data.currency,
      total_amount: typeof data.total_amount === 'string' ? parseFloat(data.total_amount) : data.total_amount,
      currency_rate: typeof data.currency_rate === 'string' ? parseFloat(data.currency_rate) : data.currency_rate,
      deposit_amount: typeof data.deposit_amount === 'string' ? parseFloat(data.deposit_amount) : data.deposit_amount,
    };
    
    updateExchangeLoan({ ...formData, id: Number(id) } as any & { id: number }, {
      onSuccess: () => {
        toast.success(t('messages.success.updated', { item: t('navigation.exchange_loans') }));
        navigate('/exchange-loans');
      },
      onError: () => toast.error(t('messages.error.update', { item: t('navigation.exchange_loans') })),
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!exchangeLoan) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Exchange loan not found</div>
      </div>
    );
  }

  const defaultValues = {
    store: exchangeLoan.store?.id,
    currency: exchangeLoan.currency?.id,
    total_amount: typeof exchangeLoan.total_amount === 'string' 
      ? parseFloat(exchangeLoan.total_amount) 
      : exchangeLoan.total_amount,
    currency_rate: typeof exchangeLoan.currency_rate === 'string' 
      ? parseFloat(exchangeLoan.currency_rate) 
      : exchangeLoan.currency_rate,
    deposit_amount: typeof exchangeLoan.deposit_amount === 'string' 
      ? parseFloat(exchangeLoan.deposit_amount) 
      : exchangeLoan.deposit_amount,
    due_date: exchangeLoan.due_date,
    notes: exchangeLoan.notes || '',
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('common.edit')} {t('navigation.exchange_loans')}</h1>
        <p className="text-muted-foreground">
          {t('pages.exchange_loans.edit_description')}
        </p>
      </div>

      <div>
        <ResourceForm
          fields={fields}
          onSubmit={handleSubmit}
          defaultValues={defaultValues}
          isSubmitting={isUpdating}
          title={t('common.edit')}
        />
      </div>
    </div>
  );
}
