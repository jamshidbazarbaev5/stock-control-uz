import { useEffect, useState } from 'react';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { 
  getReportsSalesSummary, 
  getTopProducts, 
  getStockByCategory, 
  getProductIntake,
  getClientDebts,
  getUnsoldProducts,
  getProductProfitability,
  getTopSellers,
  type SalesSummaryResponse,
  type TopProductsResponse,
  type StockByCategoryResponse,
  type ProductIntakeResponse,
  type ClientDebtResponse,
  type UnsoldProductsResponse,
  type ProductProfitabilityResponse,
  type TopSellersResponse
} from '../api/reports';
import { ArrowUpRight, DollarSign, ShoppingCart, TrendingUp, Package, BarChart2, Users,  } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line } from 'recharts';
import { format, parseISO } from 'date-fns';

const DashboardPage = () => {
  const { t } = useTranslation();
  const [salesData, setSalesData] = useState<SalesSummaryResponse | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductsResponse[]>([]);
  const [stockByCategory, setStockByCategory] = useState<StockByCategoryResponse[]>([]);
  const [productIntake, setProductIntake] = useState<ProductIntakeResponse | null>(null);
  const [clientDebts, setClientDebts] = useState<ClientDebtResponse[]>([]);
  const [unsoldProducts, setUnsoldProducts] = useState<UnsoldProductsResponse[]>([]);
  const [_productProfitability, setProductProfitability] = useState<ProductProfitabilityResponse[]>([]);
  const [topSellers, setTopSellers] = useState<TopSellersResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [topProductsLimit, setTopProductsLimit] = useState<number>(5);
  const [topSellersLimit, _setTopSellersLimit] = useState<number>(5);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [salesSummary, topProductsData, stockByCategoryData, productIntakeData, clientDebtsData, unsoldProductsData, profitabilityData, topSellersData] = await Promise.all([
          getReportsSalesSummary(period),
          getTopProducts(period, topProductsLimit),
          getStockByCategory(),
          getProductIntake(period),
          getClientDebts(),
          getUnsoldProducts(),
          getProductProfitability(),
          getTopSellers(period, )
        ]);
        
        setSalesData(salesSummary);
        setTopProducts(topProductsData);
        setStockByCategory(stockByCategoryData);
        setProductIntake(productIntakeData);
        setClientDebts(clientDebtsData);
        setUnsoldProducts(unsoldProductsData);
        setProductProfitability(profitabilityData);
        setTopSellers(topSellersData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [period, topProductsLimit, topSellersLimit]);

  // Format the trend data for the charts
  const formattedData = salesData?.trend.map(item => ({
    date: format(parseISO(item.day), 'MMM dd'),
    sales: item.total
  })) || [];

  // Format product intake data for chart
  const formattedIntakeData = productIntake?.data.map(item => ({
    date: format(parseISO(item.day), 'MMM dd'),
    quantity: item.total_quantity,
    price: item.total_price
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full max-w-none">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('dashboard.period')}:</span>
            <Select value={period} onValueChange={(value) => setPeriod(value as 'day' | 'week' | 'month')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('dashboard.select_period')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">{t('dashboard.day')}</SelectItem>
                <SelectItem value="week">{t('dashboard.week')}</SelectItem>
                <SelectItem value="month">{t('dashboard.month')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.total_sales')}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData?.total_sales}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('dashboard.transactions')}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.total_revenue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                .format(salesData?.total_revenue || 0)
                .replace('UZS', '')
                .trim()}
            </div>
            <div className="text-xs text-green-500 flex items-center mt-1">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>{t('dashboard.since_last_month')}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.average_sale')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesData && salesData.total_sales > 0 
                ? new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                    .format(salesData.total_revenue / salesData.total_sales)
                    .replace('UZS', '')
                    .trim()
                : '0 UZS'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('dashboard.per_transaction')}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.current_day')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                .format(salesData?.trend[salesData.trend.length - 1]?.total || 0)
                .replace('UZS', '')
                .trim()} 
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {salesData?.trend[salesData.trend.length - 1]?.day || ''}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Line Chart */}
      <Card className="bg-white shadow-md hover:shadow-lg transition-shadow mb-8">
        <CardHeader>
          <CardTitle>{t('dashboard.revenue_analysis')}</CardTitle>
          <CardDescription>{t('dashboard.detailed_view_of_sales_performance')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 60,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  width={70}
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('uz-UZ', { 
                      notation: 'compact',
                      compactDisplay: 'short' 
                    }).format(value)
                  }
                />
                <Tooltip 
                  formatter={(value) => 
                    [new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                      .format(Number(value))
                      .replace('', '')
                      .trim(), 'Revenue']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#ff7300" 
                  activeDot={{ r: 8 }} 
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Top Products and Stock by Category */}
      <div className="w-full mb-8 space-y-8">
        {/* Top Products - Full Width */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-xl font-bold text-blue-700">{t('dashboard.top_products')}</CardTitle>
              <CardDescription>{t('dashboard.best_performing_products')}</CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
              <span className="text-sm font-medium text-blue-700">{t('dashboard.show')}:</span>
              <Select 
                value={topProductsLimit.toString()} 
                onValueChange={(value) => setTopProductsLimit(parseInt(value))}
              >
                <SelectTrigger className="w-16 border-blue-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div>
              {topProducts.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full border-collapse bg-white text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left">
                        <th className="px-4 py-3 font-medium text-gray-900">{t('dashboard.product')}</th>
                        <th className="px-4 py-3 font-medium text-gray-900 text-center">{t('dashboard.quantity')}</th>
                        <th className="px-4 py-3 font-medium text-gray-900 text-right">{t('dashboard.revenue')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {topProducts.map((product, index) => {
                        // Calculate a performance score (for visualization purposes)
                       
                        return (
                          <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-3">
                              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${index < 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                <Package className="h-4 w-4" />
                              </div>
                              <span className="font-medium">{product.product_name}</span>
                            </td>
                            <td className="px-4 py-3 text-center font-medium">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {product.total_quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                                .format(Number(product.total_revenue))
                                .replace('UZS', '')
                                .trim()}
                            </td>
                            
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">{t('dashboard.no_product_data_available')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stock by Category - Full Width */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-t-4 border-t-purple-500">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-xl font-bold text-purple-700">{t('dashboard.stock_by_category')}</CardTitle>
            <CardDescription>{t('dashboard.current_inventory_by_category')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div>
              {stockByCategory.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full border-collapse bg-white text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left">
                          <th className="px-4 py-3 font-medium text-gray-900">{t('dashboard.category')}</th>
                          <th className="px-4 py-3 font-medium text-gray-900 text-right">{t('dashboard.total_stock')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stockByCategory.map((category, index) => (
                          <tr key={index} className="hover:bg-purple-50/30 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-3">
                              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                                <BarChart2 className="h-4 w-4" />
                              </div>
                              <span className="font-medium">{category.category}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                {category.total_stock}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Add visual chart representation */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">{t('dashboard.category_distribution')}</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stockByCategory.map(cat => ({
                            name: cat.category,
                            value: cat.total_stock
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [value, t('dashboard.total_stock')]}
                          />
                          <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <BarChart2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">{t('dashboard.no_category_data_available')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Product Intake Chart */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-2">  
          <CardHeader>
            <CardTitle>{t('dashboard.product_intake')}</CardTitle>
            <CardDescription>{t('dashboard.products_coming_into_storage')}</CardDescription>
          </CardHeader>
          <CardContent>
            {productIntake && productIntake.data.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">{t('dashboard.total_positions')}</div>
                    <div className="text-2xl font-bold">{productIntake.total_positions}</div>
                  </div>
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">{t('dashboard.total_sum')}</div>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                        .format(productIntake.total_sum)
                        .replace('UZS', '')
                        .trim()}
                    </div>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedIntakeData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" orientation="left" stroke="#82ca9d" />
                      <YAxis yAxisId="right" orientation="right" stroke="#8884d8" />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'price') {
                            return [
                              `${new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                                .format(Number(value))
                                .replace('UZS', '')
                                .trim()}`, 
                              t('dashboard.total_price')
                            ];
                          }
                          return [value, name === 'quantity' ? t('dashboard.quantity') : name];
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="quantity" name={t('dashboard.quantity')} fill="#82ca9d" />
                      <Bar yAxisId="right" dataKey="price" name={t('dashboard.total_price')} fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                {t('dashboard.no_product_intake_data_available')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Debts - Full Width */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-2 mb-8">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('dashboard.client_debts') || 'Client Debts'}</CardTitle>
                <CardDescription>{t('dashboard.outstanding_client_debts') || 'Outstanding client debts'}</CardDescription>
              </div>
              <div className="bg-amber-100 px-3 py-1 rounded-full text-amber-800 text-sm font-medium">
                {clientDebts.length > 0 ? clientDebts.length : 0} {t('dashboard.clients') || 'clients'}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {clientDebts.length > 0 ? (
              <div>
                {/* Summary metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">{t('dashboard.total_debt') || 'Total Debt'}</span>
                    <span className="text-xl font-bold">
                      {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                        .format(clientDebts.reduce((sum, client) => sum + Number(client.total_debt), 0))
                        .replace('UZS', '')
                        .trim()}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">{t('dashboard.total_paid') || 'Total Paid'}</span>
                    <span className="text-xl font-bold text-green-600">
                      {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                        .format(clientDebts.reduce((sum, client) => sum + Number(client.total_paid), 0))
                        .replace('UZS', '')
                        .trim()}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">{t('dashboard.remaining_debt') || 'Remaining Debt'}</span>
                    <span className="text-xl font-bold text-destructive">
                      {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                        .format(clientDebts.reduce((sum, client) => sum + Number(client.remaining_debt), 0))
                        .replace('', '')
                        .trim()}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">{t('dashboard.deposit') || 'Deposit'}</span>
                    <span className="text-xl font-bold text-blue-600">
                      {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                        .format(clientDebts.reduce((sum, client) => sum + Number(client.deposit), 0))
                        .replace('', '')
                        .trim()}
                    </span>
                  </div>
                </div>

                {/* Enhanced Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full border-collapse bg-white text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left">
                        <th className="px-4 py-3 font-medium text-gray-900">{t('dashboard.client') || 'Client'}</th>
                        <th className="px-4 py-3 font-medium text-gray-900 text-right">{t('dashboard.total_debt') || 'Total Debt'}</th>
                        <th className="px-4 py-3 font-medium text-gray-900 text-right">{t('dashboard.total_paid') || 'Total Paid'}</th>
                        <th className="px-4 py-3 font-medium text-gray-900 text-right">{t('dashboard.remaining_debt') || 'Remaining'}</th>
                        <th className="px-4 py-3 font-medium text-gray-900 text-right">{t('dashboard.deposit') || 'Deposit'}</th>
                        {/* <th className="px-4 py-3 font-medium text-gray-900 text-right">{t('dashboard.payment_status') || 'Status'}</th> */}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clientDebts.map((client, index) => {
                        // Calculate payment percentage
                        // const totalDebt = Number(client.total_debt) || 0;
                        // const totalPaid = Number(client.total_paid) || 0;
                        // const paymentPercentage = totalDebt > 0 ? (totalPaid / totalDebt) * 100 : 0;
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 flex items-center gap-2">
                              <div className="flex items-center gap-3">
                                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                                  <Users className="h-4 w-4" />
                                </div>
                                <div className="font-medium text-gray-900">{client.client_name}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                                .format(Number(client.total_debt))
                                .replace('UZS', '')
                                .trim()}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-green-600">
                              {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                                .format(Number(client.total_paid))
                                .replace('UZS', '')
                                .trim()}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-destructive">
                              {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                                .format(Number(client.remaining_debt))
                                .replace('UZS', '')
                                .trim()}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-blue-600">
                              {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                                .format(Number(client.deposit))
                                .replace('UZS', '')
                                .trim()}
                            </td>
                           
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">{t('dashboard.no_client_debt_data_available') || 'No client debt data available'}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Unsold Products */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-2">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('dashboard.unsold_products') || 'Unsold Products'}</CardTitle>
                <CardDescription>{t('dashboard.products_with_no_sales') || 'Products that have not been sold'}</CardDescription>
              </div>
              {unsoldProducts.length > 0 && (
                <div className="bg-red-100 px-3 py-1 rounded-full text-red-800 text-sm font-medium">
                  {unsoldProducts.length} {t('dashboard.items') || 'items'}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {unsoldProducts.length > 0 ? (
              <div>
                {/* Grid layout for unsold products */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {unsoldProducts.map((product, index) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-3">
                        <div className="bg-red-50 p-2 rounded-full">
                          <Package className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1 truncate">{product.product_name}</h4>
                         
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <h3 className="text-green-800 text-lg font-medium mb-2">{t('dashboard.no_unsold_products') || 'No unsold products'}</h3>
                <p className="text-green-700">{t('dashboard.all_products_sold') || 'All products have been sold at least once!'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Sellers */}
      <Card className="bg-white shadow-md hover:shadow-lg transition-shadow mb-8 border-t-4 border-t-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-xl font-bold text-emerald-700">{t('dashboard.top_sellers') || 'Top Sellers'}</CardTitle>
            <CardDescription>{t('dashboard.top_performing_stores') || 'Top performing stores and sellers'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div>
            {topSellers.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full border-collapse bg-white text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium text-gray-900">{t('dashboard.rank') || 'Rank'}</th>
                      <th className="px-4 py-3 font-medium text-gray-900">{t('dashboard.store') || 'Store'}</th>
                      <th className="px-4 py-3 font-medium text-gray-900">{t('dashboard.seller') || 'Seller'}</th>
                      <th className="px-4 py-3 font-medium text-gray-900 text-right">{t('dashboard.revenue') || 'Revenue'}</th>
                      <th className="px-4 py-3 font-medium text-gray-900 text-right">{t('dashboard.total_sales') || 'Total Sales'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topSellers.map((seller, index) => {
                      // Get medal colors for top 3 performers
                      const rankColors = [
                        'bg-amber-100 text-amber-800',
                        'bg-gray-100 text-gray-800',
                        'bg-amber-50 text-amber-700',
                      ];
                      
                      return (
                        <tr key={index} className="hover:bg-emerald-50/30">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${index < 3 ? rankColors[index] : 'bg-gray-50 text-gray-600'}`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900">{seller.store_name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900">{seller.seller_name || '-'}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                              .format(seller.total_revenue)
                              .replace('UZS', '')
                              .trim()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs">
                              {seller.total_sales}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">{t('dashboard.no_seller_data')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Profitability - Full Width Section */}
      
    </div>
  );
};

export default DashboardPage;
