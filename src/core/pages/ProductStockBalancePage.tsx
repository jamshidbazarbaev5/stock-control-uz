import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourseTable';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';

interface ProductStockBalance {
  product__product_name: string;
  store__name: string;
  total_quantity: number;
}

interface StockBalanceResponse {
  total_product: number;
  info_products: ProductStockBalance[];
}

export default function ProductStockBalancePage() {
  const { t } = useTranslation();
  
  const { data, isLoading } = useQuery<StockBalanceResponse>({
    queryKey: ['stockBalance'],
    queryFn: async () => {
      const response = await api.get('/dashboard/item_dashboard/');
      return response.data;
    }
  });

  const columns = [
    {
      header: t('table.product'),
      accessorKey: 'product__product_name',
    },
    {
      header: t('table.store'),
      accessorKey: 'store__name',
    },
    {
      header: t('table.quantity'),
      accessorKey: 'total_quantity',
      cell: (row: any) => row.total_quantity.toLocaleString(),
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.stock_balance')}</h1>
      </div>
      
      <Card>
        <ResourceTable
          data={data?.info_products || []}
          columns={columns}
          isLoading={isLoading}
          pageSize={10}
          totalCount={data?.info_products?.length || 0}
          currentPage={1}
          onPageChange={() => {}}
        />
      </Card>
    </div>
  );
}
