import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetStock } from '../api/stock';
import { formatDate } from '../helpers/formatDate';

export default function StockPriceHistoryPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch stock data
  const { data: stock, isLoading } = useGetStock(id ? parseInt(id) : 0);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">{t('common.loading')}</div>
      </div>
    );
  }

  if (!stock || !stock.history_of_prices) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">{t('common.no_history')}</div>
      </div>
    );
  }

  const renderValueCard = (title: string, currentValue: string, historyValue: string, colorClass: string = '') => (
    <Card className="bg-white shadow-lg">
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
        <div className="flex justify-between items-baseline">
          <p className={`text-2xl font-semibold ${colorClass}`}>{currentValue}</p>
          <div className="flex flex-col items-end">
            <span className="text-sm text-gray-500">{t('table.history_value')}</span>
            <span className="text-lg font-medium">{historyValue}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('stock.price_history')}</h1>
          <p className="text-gray-600">
            {stock.product_read?.product_name} - {stock.store_read?.name}
          </p>
        </div>
        <div>
            {formatDate(stock.history_of_prices.date_of_arrived)}
        </div>
        <Button variant="outline" onClick={() => navigate('/stocks')}>
          {t('common.back')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium opacity-75 mb-2">{t('table.product')}</h3>
            <p className="text-2xl font-bold">{stock.product_read?.product_name}</p>
            <div className="mt-4">
              <p className="text-sm opacity-75">{t('table.store')}</p>
              <p className="text-lg font-medium">{stock.store_read?.name}</p>
            </div>
            {stock.supplier_read?.name && (
              <div className="mt-4">
                <p className="text-sm opacity-75">{t('table.supplier')}</p>
                <p className="text-lg font-medium">{stock.supplier_read.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {renderValueCard(
          t('table.quantity'),
          stock.quantity.toString(),
          stock.quantity_for_history?.toString() || '0',
        )}
       

        {renderValueCard(
          t('table.exchange_rate'),
          typeof stock.exchange_rate === 'number' && stock.exchange_rate !== 0 ? Number(stock.exchange_rate).toLocaleString() + ' UZS' : '',
          typeof stock.history_of_prices.exchange_rate === 'number' && stock.history_of_prices.exchange_rate !== 0 ? Number(stock.history_of_prices.exchange_rate).toLocaleString() + ' UZS' : '',
          'text-blue-600'
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderValueCard(
          t('table.selling_price'),
          `${stock.selling_price?.toLocaleString()} UZS`,
          `${stock.history_of_prices.selling_price?.toLocaleString()} UZS`,
          'text-green-600'
        )}

        {renderValueCard(
          t('table.min_price'),
          `${stock.min_price?.toLocaleString()} UZS`,
          `${stock.history_of_prices.min_price?.toLocaleString()} UZS`,
          'text-yellow-600'
        )}

        {renderValueCard(
          t('table.purchase_price_us'),
          typeof stock.purchase_price_in_us === 'number' && stock.purchase_price_in_us !== 0 ? `$${Number(stock.purchase_price_in_us).toLocaleString()}` : '',
          typeof stock.history_of_prices.purchase_price_in_us === 'number' && stock.history_of_prices.purchase_price_in_us !== 0 ? `$${Number(stock.history_of_prices.purchase_price_in_us).toLocaleString()}` : '',
          'text-indigo-600'
        )}

        {renderValueCard(
          t('table.purchase_price_uz'),
          `${stock.purchase_price_in_uz?.toLocaleString()} UZS`,
          `${stock.history_of_prices.purchase_price_in_uz?.toLocaleString()} UZS`,
          'text-purple-600'
        )}
      </div>
    </div>
  );
}