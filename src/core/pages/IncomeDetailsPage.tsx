import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useGetIncome } from '../api/income';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Wallet,
  CreditCard,
  SmartphoneNfc,
  Package,
  Store,
  User2,
} from 'lucide-react';

export default function IncomeDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: income, isLoading } = useGetIncome(Number(id));

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!income || income.source !== 'Продажа') return null;

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('ru-RU').format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'Наличные':
        return <Wallet className="h-4 w-4 text-green-600" />;
      case 'Карта':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'Click':
        return <SmartphoneNfc className="h-4 w-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const payments = income.description.Payments || [];
  const items = income.description.Items || [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        {t('navigation.income')} #{income.id}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-500" />
              {t('forms.store_info')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-500">{t('forms.store')}</h3>
                <p className="font-medium">{income.store_read?.name || '-'}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">{t('forms.worker')}</h3>
                {/* <p className="font-medium">{income.worker_read?.name || income.description.Worker || '-'}</p> */}
              </div>
              <div>
                <h3 className="text-sm text-gray-500">{t('forms.date')}</h3>
                <p className="font-medium">
                  {formatDate(income.description['Sold Date'] || income.description['Timestamp'] || income.timestamp)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User2 className="w-5 h-5 text-emerald-500" />
              {t('forms.payment_info')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-500">{t('forms.client')}</h3>
                <p className="font-medium">{income.description.Client || '-'}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">{t('forms.total_amount')}</h3>
                <p className="font-medium text-emerald-600">{formatCurrency(income.description.Amount)} UZS</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">{t('forms.payment_method')}</h3>
                <div className="space-y-1">
                  {payments.map((payment: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      {getPaymentIcon(payment.Method)}
                      <span>{payment.Method}: {formatCurrency(payment.Amount)} UZS</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-500" />
            {t('forms.items')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">{t('forms.product')}</th>
                  <th className="text-right py-2">{t('forms.quantity')}</th>
                  <th className="text-right py-2">{t('forms.selling_method')}</th>
                  <th className="text-right py-2">{t('forms.subtotal')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">
                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-gray-500 mt-1" />
                        <div>
                          <div className="font-medium">{item.Product}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-2">{item.Quantity}</td>
                    <td className="text-right py-2">{item['Selling Method']}</td>
                    <td className="text-right py-2">{formatCurrency(item.Subtotal)} UZS</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td colSpan={3} className="text-right py-2">{t('forms.total_amount')}</td>
                  <td className="text-right py-2">{formatCurrency(income.description.Amount)} UZS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
