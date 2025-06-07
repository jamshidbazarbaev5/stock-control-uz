import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {  useGetDebtsHistory } from '../api/debt';
import {
  Card,
} from '@/components/ui/card';
import {
  User2,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Store,
  Package,
  ShoppingCart,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

interface DebtListItem {
  id: number;
  isExpanded: boolean;
}

export default function DebtDetailsPage() {
  const { t } = useTranslation();
  const { id: clientId } = useParams();
  const [expandedDebts, setExpandedDebts] = useState<DebtListItem[]>([]);

  const { data: debts = [], isLoading } = useGetDebtsHistory(Number(clientId));

  // Function to handle debt expansion
  const handleDebtClick = (debtId: number) => {
    setExpandedDebts(prev => {
      const index = prev.findIndex(d => d.id === debtId);
      if (index === -1) {
        return [...prev, { id: debtId, isExpanded: true }];
      }
      return prev.map(d => d.id === debtId ? { ...d, isExpanded: !d.isExpanded } : d);
    });
  };

  // Check if a debt is expanded
  const isDebtExpanded = (debtId: number) => {
    return expandedDebts.find(d => d.id === debtId)?.isExpanded || false;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-200 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 bg-gray-200 rounded-lg shadow-sm"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!Array.isArray(debts) || debts.length === 0) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-600">{t('common.no_data')}</h2>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | string) => {
    return Number(amount).toLocaleString();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl animate-in fade-in duration-500">
      <div className="mb-8 animate-in slide-in-from-left duration-500">
        <h1 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
          <DollarSign className="w-10 h-10 text-emerald-500" />
          {t('pages.debt_details')} - {debts[0].client_read.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {debts.map((debt, index) => (
          <div
            key={debt.id}
            className="animate-in fade-in slide-in-from-bottom duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
              <div
                className="flex items-center justify-between p-6 cursor-pointer transition-colors duration-200 hover:bg-gray-50/80"
                onClick={() => handleDebtClick(debt.id!)}
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <span className="text-emerald-600">{formatCurrency(debt.total_amount)}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{formatDate(debt.created_at)}</span>
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('forms.due_date')}: {formatDate(debt.due_date)}
                    <span className="text-gray-400">|</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      debt.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {debt.is_paid ? t('common.paid') : t('common.unpaid')}
                    </span>
                  </p>
                </div>
                <div className={`transform transition-transform duration-200 ${
                  isDebtExpanded(debt.id!) ? 'rotate-180' : ''
                }`}>
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                </div>
              </div>

              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isDebtExpanded(debt.id!) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    <div className="bg-gray-50/50 rounded-lg p-6 hover:bg-gray-50 transition-colors duration-200">
                      <h4 className="text-lg font-semibold flex items-center gap-2 mb-4 text-emerald-700">
                        <User2 className="w-5 h-5 text-emerald-500" />
                        {t('forms.client_info')}
                      </h4>
                      <dl className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Phone className="w-4 h-4 text-emerald-500 mt-1" />
                          <div>
                            <dt className="text-sm text-gray-500">{t('forms.phone')}</dt>
                            <dd className="font-medium text-gray-900">{debt.client_read.phone_number}</dd>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-emerald-500 mt-1" />
                          <div>
                            <dt className="text-sm text-gray-500">{t('forms.address')}</dt>
                            <dd className="font-medium text-gray-900">{debt.client_read.address}</dd>
                          </div>
                        </div>
                      </dl>
                    </div>

                    <div className="bg-gray-50/50 rounded-lg p-6 hover:bg-gray-50 transition-colors duration-200">
                      <h4 className="text-lg font-semibold flex items-center gap-2 mb-4 text-emerald-700">
                        <Store className="w-5 h-5 text-emerald-500" />
                        {t('forms.store_info')}
                      </h4>
                      <dl className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Store className="w-4 h-4 text-emerald-500 mt-1" />
                          <div>
                            <dt className="text-sm text-gray-500">{t('forms.store_name')}</dt>
                            <dd className="font-medium text-gray-900">{debt.sale_read.store_read.name}</dd>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="w-4 h-4 text-emerald-500 mt-1" />
                          <div>
                            <dt className="text-sm text-gray-500">{t('forms.phone')}</dt>
                            <dd className="font-medium text-gray-900">{debt.sale_read.store_read.phone_number}</dd>
                          </div>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="border-t p-6 bg-white">
                    <h4 className="text-lg font-semibold flex items-center gap-2 mb-6 text-emerald-700">
                      <ShoppingCart className="w-5 h-5 text-emerald-500" />
                      {t('forms.sale_items')}
                    </h4>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-semibold text-gray-600">{t('forms.product')}</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-600">{t('forms.quantity')}</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-600">{t('forms.selling_method')}</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-600">{t('forms.subtotal')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debt.sale_read.sale_items.map((item) => (
                            <tr key={item.id} className="border-b hover:bg-gray-50/50 transition-colors duration-150">
                              <td className="py-3 px-4">
                                <div className="flex items-start gap-3">
                                  <Package className="w-4 h-4 text-emerald-500 mt-1" />
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {item.stock_read.product_read.product_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {item.stock_read.product_read.category_read.category_name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="text-right py-3 px-4 text-gray-900">{item.quantity}</td>
                              <td className="text-right py-3 px-4 text-gray-900">{item.selling_method}</td>
                              <td className="text-right py-3 px-4 font-medium text-gray-900">{formatCurrency(item.subtotal)}</td>
                            </tr>
                          ))}
                          <tr className="font-bold bg-gray-50">
                            <td colSpan={3} className="text-right py-4 px-4">{t('forms.total_amount')}</td>
                            <td className="text-right py-4 px-4 text-emerald-600">{formatCurrency(debt.total_amount)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border-t p-6 bg-gray-50/30">
                    <h4 className="text-lg font-semibold flex items-center gap-2 mb-6 text-emerald-700">
                      <DollarSign className="w-5 h-5 text-emerald-500" />
                      {t('forms.payment_info')}
                    </h4>
                    <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-start gap-3">
                          <DollarSign className="w-5 h-5 text-emerald-500 mt-1" />
                          <div>
                            <dt className="text-sm text-gray-500">{t('forms.total_amount')}</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{formatCurrency(debt.total_amount)}</dd>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-start gap-3">
                          <DollarSign className="w-5 h-5 text-emerald-500 mt-1" />
                          <div>
                            <dt className="text-sm text-gray-500">{t('forms.deposit')}</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{formatCurrency(debt.deposit)}</dd>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-start gap-3">
                          <DollarSign className="w-5 h-5 text-emerald-500 mt-1" />
                          <div>
                            <dt className="text-sm text-gray-500">{t('forms.remainder')}</dt>
                            <dd className={`text-2xl font-semibold ${debt.remainder < 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(debt.remainder)}
                            </dd>
                          </div>
                        </div>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
