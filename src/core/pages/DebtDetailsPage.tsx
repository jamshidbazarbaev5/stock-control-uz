import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useGetDebt } from '../api/debt';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  User2,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Store,
  Package,
  Tag,
  ShoppingCart,
} from 'lucide-react';

export default function DebtDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: debt, isLoading } = useGetDebt(Number(id));

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!debt) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | string) => {
    return Number(amount).toLocaleString();
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <DollarSign className="w-8 h-8 text-emerald-500" />
        {t('pages.debt_details')} - {debt.client_read.name}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User2 className="w-5 h-5 text-emerald-500" />
              {t('forms.client_info')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex items-start gap-2">
                <User2 className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-sm text-gray-500">{t('forms.client_name')}</dt>
                  <dd className="font-medium">
                    {debt.client_read.name}{' '}
                    <span className="text-gray-500">({t(debt.client_read.type)})</span>
                  </dd>
                </div>
              </div>
              {debt.client_read.ceo_name && (
                <div className="flex items-start gap-2">
                  <User2 className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <dt className="text-sm text-gray-500">{t('forms.ceo_name')}</dt>
                    <dd className="font-medium">{debt.client_read.ceo_name}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-sm text-gray-500">{t('forms.phone')}</dt>
                  <dd className="font-medium">{debt.client_read.phone_number}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-sm text-gray-500">{t('forms.address')}</dt>
                  <dd className="font-medium">{debt.client_read.address}</dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              {t('forms.debt_info')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-sm text-gray-500">{t('forms.total_amount')}</dt>
                  <dd className="font-medium">{formatCurrency(debt.total_amount)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-sm text-gray-500">{t('forms.deposit')}</dt>
                  <dd className="font-medium">{formatCurrency(debt.deposit)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-sm text-gray-500">{t('forms.remainder')}</dt>
                  <dd className={`font-medium ${debt.remainder < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(debt.remainder)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-sm text-gray-500">{t('forms.created_date')}</dt>
                  <dd className="font-medium">{formatDate(debt.created_at)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-sm text-gray-500">{t('forms.due_date')}</dt>
                  <dd className="font-medium">{formatDate(debt.due_date)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-sm text-gray-500">{t('forms.status')}</dt>
                  <dd className={`font-medium ${debt.is_paid ? 'text-green-600' : 'text-red-600'}`}>
                    {debt.is_paid ? t('common.paid') : t('common.unpaid')}
                  </dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-500" />
            {t('forms.store_info')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="flex items-start gap-2">
              <Store className="w-4 h-4 text-gray-500 mt-1" />
              <div>
                <dt className="text-sm text-gray-500">{t('forms.store_name')}</dt>
                <dd className="font-medium">{debt.sale_read.store_read.name}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-1" />
              <div>
                <dt className="text-sm text-gray-500">{t('forms.address')}</dt>
                <dd className="font-medium">{debt.sale_read.store_read.address}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-gray-500 mt-1" />
              <div>
                <dt className="text-sm text-gray-500">{t('forms.phone')}</dt>
                <dd className="font-medium">{debt.sale_read.store_read.phone_number}</dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-500" />
            {t('forms.sale_items')}
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
                {debt.sale_read.sale_items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">
                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-gray-500 mt-1" />
                        <div>
                          <div className="font-medium">
                            {item.stock_read.product_read.product_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.stock_read.product_read.category_read.category_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">{item.selling_method}</td>
                    <td className="text-right py-2">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td colSpan={3} className="text-right py-2">{t('forms.total_amount')}</td>
                  <td className="text-right py-2">{formatCurrency(debt.sale_read.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
