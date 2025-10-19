import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetStockEntries, useGetStocks } from '../api/stock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

  // Fetch stock entries for this supplier
  const { data: stockEntriesData, isLoading: isLoadingEntries } = useGetStockEntries({
    params: { supplier: id },
  });

  const stockEntries = stockEntriesData?.results || [];

  // Fetch stock details for an expanded entry

  const toggleEntry = (entryId: number) => {
    if (expandedEntry === entryId) {
      setExpandedEntry(null);
    } else {
      setExpandedEntry(entryId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (value: string | number) => {
    return Number(value).toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (isLoadingEntries) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {stockEntries[0]?.supplier.name || t('navigation.suppliers')} - {t('common.stock_entries')}
        </h1>
      </div>

      {stockEntries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('common.no_data')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {stockEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="cursor-pointer" onClick={() => toggleEntry(entry.id)}>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {t('common.date')}: {formatDate(entry.date_of_arrived)}
                    </CardTitle>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('table.store')}:</span>{' '}
                        <span className="font-medium">{entry.store.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('common.total_amount')}:</span>{' '}
                        <span className="font-medium">{formatNumber(entry.total_amount)} {t('common.uzs')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('common.stock_count')}:</span>{' '}
                        <span className="font-medium">{entry.stock_count}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('common.debt_status')}:</span>{' '}
                        <span className={`font-medium ${entry.is_debt ? 'text-red-500' : 'text-green-500'}`}>
                          {entry.is_debt ? t('common.debt') : t('common.paid')}
                        </span>
                      </div>
                    </div>
                    {entry.is_debt && (entry.amount_of_debt || entry.advance_of_debt) && (
                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                        {entry.amount_of_debt && (
                          <div>
                            <span className="text-muted-foreground">{t('common.amount_of_debt')}:</span>{' '}
                            <span className="font-medium text-red-500">{formatNumber(entry.amount_of_debt)} {t('common.uzs')}</span>
                          </div>
                        )}
                        {entry.advance_of_debt && (
                          <div>
                            <span className="text-muted-foreground">{t('common.advance_payment')}:</span>{' '}
                            <span className="font-medium text-green-500">{formatNumber(entry.advance_of_debt)} {t('common.uzs')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon">
                    {expandedEntry === entry.id ? <ChevronUp /> : <ChevronDown />}
                  </Button>
                </div>
              </CardHeader>
              
              {expandedEntry === entry.id && (
                <CardContent>
                  <StockDetailsAccordion stockEntryId={entry.id} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Separate component for stock details to use hooks properly
function StockDetailsAccordion({ stockEntryId }: { stockEntryId: number }) {
  const { t } = useTranslation();
  const { data: stocksData, isLoading } = useGetStocks({
    params: { stock_entry: stockEntryId },
  });

  const stocks = stocksData?.results || [];

  const formatNumber = (value: string | number) => {
    return Number(value).toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        {t('common.no_stock_items')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg mb-3">{t('common.stock_items')}</h3>
      {stocks.map((stock) => (
        <Card key={stock.id} className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="col-span-full">
                <h4 className="font-semibold text-base">
                  {stock.product.product_name}
                  {stock.is_recycled && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {t('common.recycled')}
                    </span>
                  )}
                </h4>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">{t('common.quantity')}:</span>
                <p className="font-medium">{formatNumber(stock.quantity)} {stock.purchase_unit.short_name}</p>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">{t('common.purchase_unit_quantity')}:</span>
                <p className="font-medium">{formatNumber(stock.purchase_unit_quantity)}</p>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">{t('common.currency')}:</span>
                <p className="font-medium">{stock.currency.name} ({stock.currency.short_name})</p>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">{t('common.price_per_unit')} ({stock.currency.short_name}):</span>
                <p className="font-medium">{formatNumber(stock.price_per_unit_currency)}</p>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">{t('common.total_price')} ({stock.currency.short_name}):</span>
                <p className="font-medium">{formatNumber(stock.total_price_in_currency)}</p>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">{t('common.price_per_unit')} (UZS):</span>
                <p className="font-medium">{formatNumber(stock.price_per_unit_uz)} {t('common.uzs')}</p>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">{t('common.total_price')} (UZS):</span>
                <p className="font-medium text-lg text-primary">{formatNumber(stock.total_price_in_uz)} {t('common.uzs')}</p>
              </div>
              
              {stock.base_unit_in_currency && (
                <div>
                  <span className="text-sm text-muted-foreground">{t('common.base_unit_price')} ({stock.currency.short_name}):</span>
                  <p className="font-medium">{formatNumber(stock.base_unit_in_currency)}</p>
                </div>
              )}
              
              {stock.base_unit_in_uzs && (
                <div>
                  <span className="text-sm text-muted-foreground">{t('common.base_unit_price')} (UZS):</span>
                  <p className="font-medium">{formatNumber(stock.base_unit_in_uzs)} {t('common.uzs')}</p>
                </div>
              )}

              {/* Display attribute values if available */}
              {stock.product.attribute_values && stock.product.attribute_values.length > 0 && (
                <div className="col-span-full mt-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">{t('common.attributes')}:</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                    {stock.product.attribute_values.map((attr: any) => (
                      <div key={attr.id} className="text-sm">
                        <span className="font-medium">
                          {attr.attribute.translations?.ru || attr.attribute.name}:
                        </span>{' '}
                        {typeof attr.value === 'boolean' 
                          ? (attr.value ? t('common.yes') : t('common.no'))
                          : Array.isArray(attr.value)
                          ? attr.attribute.related_objects
                              ?.filter((obj: any) => attr.value.includes(obj.id))
                              .map((obj: any) => obj.name)
                              .join(', ')
                          : attr.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
