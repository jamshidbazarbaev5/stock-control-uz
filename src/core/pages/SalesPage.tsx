import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourseTable';
import { type Sale, useGetSales, useDeleteSale } from '../api/sale';
import { useGetProducts } from '../api/product';
import { toast } from 'sonner';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
// import { ScrollArea } from '../../components/ui/scroll-area';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, AlertCircle,  CreditCard, Wallet, SmartphoneNfc,XCircle } from 'lucide-react';

export default function SalesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  // const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  // const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Set initial states
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [creditStatus, setCreditStatus] = useState<string>('all');
  
  const { data: salesData, isLoading } = useGetSales({ 
    params: { 
      page,
      product: selectedProduct !== 'all' ? selectedProduct : undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      on_credit: creditStatus !== 'all' ? creditStatus === 'true' : undefined
    }
  });

  const { data: productsData } = useGetProducts({});
  const products = Array.isArray(productsData) ? productsData : productsData?.results || [];

  const deleteSale = useDeleteSale();

  // Get sales array and total count
  const sales = Array.isArray(salesData) ? salesData : salesData?.results || [];
  const totalCount = Array.isArray(salesData) ? sales.length : salesData?.count || 0;

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('ru-RU').format(Number(amount));
  };

  // const formatDate = (dateString: string) => {
  //   try {
  //     const date = new Date(dateString);
  //     return date.toLocaleDateString('ru-RU', {
  //       year: 'numeric',
  //       month: '2-digit',
  //       day: '2-digit',
  //       hour: '2-digit',
  //       minute: '2-digit'
  //     });
  //   } catch (error) {
  //     return '-';
  //   }
  // };

  const handleDelete = async (id: number) => {
    try {
      await deleteSale.mutateAsync(id);
      toast.success(t('messages.success.deleted', { item: t('navigation.sales') }));
      // setIsDetailsModalOpen(false);
    } catch (error) {
      toast.error(t('messages.error.delete', { item: t('navigation.sales') }));
      console.error('Failed to delete sale:', error);
    }
  };

  const handleClearFilters = () => {
    setSelectedProduct('all');
    setStartDate('');
    setEndDate('');
    setCreditStatus('all');
    setPage(1);
  };

  const handleRowClick = (row: Sale) => {
    if (row.id === expandedRowId) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(row.id || null);
    }
  };

  const renderExpandedRow = (row: Sale) => {
    if (!row.sale_items?.length) return <div className="p-4 text-center text-gray-500">{t('messages.no_items_found')}</div>;
    
    return (
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          {t('common.sale_items')} 
          <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {row.sale_items.length}
          </span>
        </h3>
        <div className="space-y-3">
          {row.sale_items.map((item, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-all duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-500 block mb-1">{t('table.product')}</span>
                  <span className="font-medium line-clamp-2" title={item.stock_read?.product_read?.product_name || '-'}>
                    {item.stock_read?.product_read?.product_name || '-'}
                  </span>
                  {item.stock_read?.product_read?.category_read && (
                    <span className="text-xs text-gray-500">
                      {item.stock_read.product_read.category_read.category_name}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-sm text-gray-500 block mb-1">{t('table.quantity')}</span>
                  <span className="font-medium">
                    {item.quantity} {item.selling_method === 'Штук' ? t('table.pieces') : t('table.measurement')}
                  </span>
                </div>
                {/* <div>
                  <span className="text-sm text-gray-500 block mb-1">{t('table.price')}</span>
                  <span className="font-medium">
                    {formatCurrency(Number(item.subtotal) / Number(item.quantity))} 
                  </span>
                </div> */}
                <div>
                  <span className="text-sm text-gray-500 block mb-1">{t('forms.amount3')}</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(item.subtotal)} UZS</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const columns = [
    {
      header: t('table.store'),
      accessorKey: 'store_read',
      cell: (row: Sale) => row.store_read?.name || '-',
    },
    {
      header: t('table.payment_method'),
      accessorKey: 'sale_payments',
      cell: (row: any) => (
        <div className="flex flex-col items-center gap-1">
          {row.sale_payments.map((payment: any, index: number) => (
            <div key={index} className="flex items-center gap-1 text-xs justify-center">
              {payment.payment_method === 'Наличные' && <Wallet className="h-4 w-4 text-green-600" />}
              {payment.payment_method === 'Карта' && <CreditCard className="h-4 w-4 text-blue-600" />}
              {payment.payment_method === 'Click' && <SmartphoneNfc className="h-4 w-4 text-purple-600" />}
              <span className="whitespace-nowrap">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      header: t('table.items'),
      accessorKey: 'sale_items',
      cell: (row: Sale) => {
        if (!row.sale_items?.length) return '-';
        const itemsText = row.sale_items.map(item => {
          const product = item.stock_read?.product_read?.product_name || '-';
          const quantity = item.quantity;
          const method = item.selling_method;
          return `${quantity} ${method} ${product}`;
        }).join(' • ');
        return (
          <div className="max-w-[300px]">
            <p className="text-sm truncate" title={itemsText}>
              {itemsText}
            </p>
          </div>
        );
      },
    },
    {
      header: t('table.total_amount'),
      accessorKey: 'total_amount',
      cell: (row: Sale) => (
        <span className="font-medium text-emerald-600">
          {formatCurrency(row.total_amount)} 
        </span>
      ),
    },
    {
      header: t('table.status'),
      accessorKey: 'on_credit',
      cell: (row: Sale) => (
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${row.on_credit ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {row.on_credit ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
          {row.on_credit ? t('common.on_credit') : t('common.paid2')}
        </div>
      ),
    },
    // {
    //   header: t('common.actions'),
    //   accessorKey: 'actions',
    //   cell: (row: Sale) => (
    //     <div className="flex items-center gap-2">
    //       <Button
    //         variant="outline"
    //         size="sm"
    //         onClick={() => {
    //           setSelectedSale(row);
    //           setIsDetailsModalOpen(true);
    //         }}
    //       >
    //         {t('common.details')}
    //       </Button>
    //     </div>
    //   ),
    // }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.sales')}</h1>
        <Button onClick={() => navigate('/create-sale')} className="bg-primary hover:bg-primary/90">
          {t('common.create')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">{t('common.filters')}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
          >
            <XCircle className="h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('table.product')}</label>
            <Select
              value={selectedProduct}
              onValueChange={setSelectedProduct}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('placeholders.select_product')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={String(product.id || '')}>
                    {product.product_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('forms.start_date')}</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('forms.end_date')}</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('table.credit_status')}</label>
            <Select
              value={creditStatus}
              onValueChange={setCreditStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('placeholders.select_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="true">{t('common.on_credit')}</SelectItem>
                <SelectItem value="false">{t('common.paid2')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="mb-6">
        <ResourceTable
          data={sales}
          columns={columns}
          isLoading={isLoading}
          onDelete={handleDelete}
          onEdit={(row: Sale) => navigate(`/edit-sale/${row.id}`)}
          totalCount={totalCount}
          pageSize={20}
          currentPage={page}
          onPageChange={(newPage) => setPage(newPage)}
          expandedRowRenderer={(row: Sale) => renderExpandedRow(row)}
          onRowClick={(row: Sale) => handleRowClick(row)}
        />
      </Card>

      {/*<Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>*/}
      {/*  <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">*/}
      {/*    <DialogHeader className="border-b p-6">*/}
      {/*      <DialogTitle className="flex items-center gap-2 text-xl">*/}
      {/*        <span>{t('navigation.sales')} #{selectedSale?.id}</span>*/}
      {/*        {selectedSale?.on_credit && (*/}
      {/*          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">*/}
      {/*            <AlertCircle className="h-3 w-3" />*/}
      {/*            {t('common.on_credit')}*/}
      {/*          </span>*/}
      {/*        )}*/}
      {/*      </DialogTitle>*/}
      {/*    </DialogHeader>*/}
      {/*    */}
      {/*    <ScrollArea className="flex-1 p-6">*/}
      {/*      {selectedSale && (*/}
      {/*        <div className="space-y-6">*/}
      {/*          /!* Header Information *!/*/}
      {/*          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-gray-50 p-4 rounded-lg">*/}
      {/*            <div className="flex items-start gap-2">*/}
      {/*              <Store className="h-5 w-5 text-gray-400 mt-0.5" />*/}
      {/*              <div>*/}
      {/*                <h3 className="font-medium text-gray-500 text-sm">{t('table.store')}</h3>*/}
      {/*                <p className="text-gray-900 font-medium">{selectedSale.store_read?.name || '-'}</p>*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*            <div className="flex items-start gap-2">*/}
      {/*              <div className="flex-shrink-0">*/}
      {/*                {selectedSale?.sale_payments?.[0]?.payment_method === 'Наличные' && <Wallet className="h-5 w-5 text-green-500 mt-0.5" />}*/}
      {/*                {selectedSale?.sale_payments?.[0]?.payment_method === 'Карта' && <CreditCard className="h-5 w-5 text-blue-500 mt-0.5" />}*/}
      {/*                {selectedSale?.sale_payments?.[0]?.payment_method === 'Click' && <SmartphoneNfc className="h-5 w-5 text-purple-500 mt-0.5" />}*/}
      {/*              </div>*/}
      {/*              <div>*/}
      {/*                <h3 className="font-medium text-gray-500 text-sm">{t('table.payment_method')}</h3>*/}
      {/*                <div className="space-y-1">*/}
      {/*                  {selectedSale?.sale_payments?.map((payment, index) => (*/}
      {/*                    <div key={index} className="flex items-center gap-2">*/}
      {/*                      {payment.payment_method === 'Наличные' && <span className="text-green-600 font-medium">Наличные</span>}*/}
      {/*                      {payment.payment_method === 'Карта' && <span className="text-blue-600 font-medium">Карта</span>}*/}
      {/*                      {payment.payment_method === 'Click' && <span className="text-purple-600 font-medium">Click</span>}*/}
      {/*                      <span className="text-sm text-gray-600">({formatCurrency(payment.amount)} UZS)</span>*/}
      {/*                    </div>*/}
      {/*                  ))}*/}
      {/*                </div>*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*            <div className="flex items-start gap-2">*/}
      {/*              <Tag className="h-5 w-5 text-emerald-500 mt-0.5" />*/}
      {/*              <div>*/}
      {/*                <h3 className="font-medium text-gray-500 text-sm">{t('forms.total_amount')}</h3>*/}
      {/*                <p className="font-medium text-emerald-600">{formatCurrency(selectedSale.total_amount)} UZS</p>*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*            <div className="flex items-start gap-2">*/}
      {/*              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />*/}
      {/*              <div>*/}
      {/*                <h3 className="font-medium text-gray-500 text-sm">{t('forms.payment_date')}</h3>*/}
      {/*                <p className="text-gray-900">{selectedSale.created_at ? formatDate(selectedSale.created_at) : '-'}</p>*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*          </div>*/}

      {/*          /!* Sale Items *!/*/}
      {/*          <div className="bg-white rounded-lg">*/}
      {/*            <h3 className="font-semibold text-gray-800 mb-3 text-lg flex items-center gap-2">*/}
      {/*              {t('common.sale_items')} */}
      {/*              <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">*/}
      {/*                {selectedSale.sale_items?.length || 0}*/}
      {/*              </span>*/}
      {/*            </h3>*/}
      {/*            <div className="space-y-3">*/}
      {/*              {selectedSale.sale_items?.map((item, index) => (*/}
      {/*                <div key={index} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-all duration-200">*/}
      {/*                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">*/}
      {/*                    <div>*/}
      {/*                      <span className="text-sm text-gray-500 block mb-1">{t('table.product')}</span>*/}
      {/*                      <span className="font-medium line-clamp-2" title={item.stock_read?.product_read?.product_name || '-'}>*/}
      {/*                        {item.stock_read?.product_read?.product_name || '-'}*/}
      {/*                      </span>*/}
      {/*                    </div>*/}
      {/*                    <div>*/}
      {/*                      <span className="text-sm text-gray-500 block mb-1">{t('table.quantity')}</span>*/}
      {/*                      <span className="font-medium">*/}
      {/*                        {item.quantity} {item.selling_method === 'Штук' ? t('table.pieces') : t('table.measurement')}*/}
      {/*                      </span>*/}
      {/*                    </div>*/}
      {/*                    <div>*/}
      {/*                      <span className="text-sm text-gray-500 block mb-1">{t('table.price')}</span>*/}
      {/*                      <span className="font-medium">*/}
      {/*                        {formatCurrency(Number(item.subtotal) / Number(item.quantity))} */}
      {/*                      </span>*/}
      {/*                    </div>*/}
      {/*                    <div>*/}
      {/*                      <span className="text-sm text-gray-500 block mb-1">{t('forms.amount3')}</span>*/}
      {/*                      <span className="font-medium text-emerald-600">{formatCurrency(item.subtotal)}</span>*/}
      {/*                    </div>*/}
      {/*                  </div>*/}
      {/*                </div>*/}
      {/*              ))}*/}
      {/*            </div>*/}
      {/*          </div>*/}

      {/*          /!* Credit Information *!/*/}
      {/*          {selectedSale.on_credit && selectedSale.sale_debt && (*/}
      {/*            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">*/}
      {/*              <h3 className="font-semibold text-gray-800 mb-3 text-lg flex items-center gap-2">*/}
      {/*                {t('table.credit_info')}*/}
      {/*                <span className="text-xs bg-amber-200 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">*/}
      {/*                  <AlertCircle className="h-3 w-3" />*/}
      {/*                  {t('common.on_credit')}*/}
      {/*                </span>*/}
      {/*              </h3>*/}
      {/*              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">*/}
      {/*                <div>*/}
      {/*                  <span className="text-sm text-gray-500 block mb-1">{t('table.client')}</span>*/}
      {/*                  <div className="font-medium flex flex-col">*/}
      {/*                    <span>{selectedSale.sale_debt.client_read?.name || '-'}</span>*/}
      {/*                    {selectedSale.sale_debt.client_read?.phone_number && (*/}
      {/*                      <span className="text-sm text-amber-600">*/}
      {/*                        {selectedSale.sale_debt.client_read.phone_number}*/}
      {/*                      </span>*/}
      {/*                    )}*/}
      {/*                  </div>*/}
      {/*                </div>*/}
      {/*                <div>*/}
      {/*                  <span className="text-sm text-gray-500 block mb-1">{t('forms.due_date')}</span>*/}
      {/*                  <span className="font-medium">*/}
      {/*                    {selectedSale.sale_debt.due_date ? formatDate(selectedSale.sale_debt.due_date) : '-'}*/}
      {/*                  </span>*/}
      {/*                </div>*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*          )}*/}
      {/*        </div>*/}
      {/*      )}*/}
      {/*    </ScrollArea>*/}

      {/*    <div className="border-t p-6 mt-auto flex justify-between items-center">*/}
      {/*      <Button */}
      {/*        variant="destructive"*/}
      {/*        size="sm"*/}
      {/*        onClick={() => handleDelete(selectedSale?.id || 0)}*/}
      {/*      >*/}
      {/*        {t('common.delete')}*/}
      {/*      </Button>*/}
      {/*      <div className="flex gap-2">*/}
      {/*        <Button */}
      {/*          variant="outline" */}
      {/*          onClick={() => setIsDetailsModalOpen(false)}*/}
      {/*        >*/}
      {/*          {t('common.close')}*/}
      {/*        </Button>*/}
      {/*        <Button */}
      {/*          variant="default"*/}
      {/*          onClick={() => navigate(`/edit-sale/${selectedSale?.id}`)}*/}
      {/*        >*/}
      {/*          {t('common.edit')}*/}
      {/*        </Button>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </DialogContent>*/}
      {/*</Dialog>*/}
    </div>
  );
}