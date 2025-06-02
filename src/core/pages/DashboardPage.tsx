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
import { ArrowUpRight, DollarSign, ShoppingCart, TrendingUp, Package, BarChart2, Users, Store, User } from 'lucide-react';
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
  const [productProfitability, setProductProfitability] = useState<ProductProfitabilityResponse[]>([]);
  const [topSellers, setTopSellers] = useState<TopSellersResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [topProductsLimit, setTopProductsLimit] = useState<number>(5);

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
          getTopSellers(period)
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
  }, [period, topProductsLimit]);

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
    <div className="container mx-auto p-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.top_products')}</CardTitle>
              <CardDescription>{t('dashboard.best_performing_products')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">{t('dashboard.show')}:</span>
              <Select 
                value={topProductsLimit.toString()} 
                onValueChange={(value) => setTopProductsLimit(parseInt(value))}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">{t('dashboard.product')}</th>
                        <th className="pb-2 text-right">{t('dashboard.quantity')}</th>
                        <th className="pb-2 text-right">{t('dashboard.revenue')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((product, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>{product.product_name}</span>
                          </td>
                          <td className="py-3 text-right">{product.total_quantity}</td>
                          <td className="py-3 text-right">
                            {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                              .format(Number(product.total_revenue))
                              .replace('UZS', '')
                              .trim()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {t('dashboard.no_product_data_available')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stock by Category */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>{t('dashboard.stock_by_category')}</CardTitle>
            <CardDescription>{t('dashboard.current_inventory_by_category')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stockByCategory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">{t('dashboard.category')}</th>
                        <th className="pb-2 text-right">{t('dashboard.total_stock')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockByCategory.map((category, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 flex items-center gap-2">
                            <BarChart2 className="h-4 w-4 text-muted-foreground" />
                            <span>{category.category}</span>
                          </td>
                          <td className="py-3 text-right">{category.total_stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {t('dashboard.no_category_data_available')}
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

        {/* Client Debts */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>{t('dashboard.client_debts')}</CardTitle>
            <CardDescription>{t('dashboard.outstanding_client_debts')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientDebts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">{t('dashboard.client')}</th>
                        <th className="pb-2 text-right">{t('dashboard.total_debt')}</th>
                        <th className="pb-2 text-right">{t('dashboard.total_paid')}</th>
                        <th className="pb-2 text-right">{t('dashboard.remaining_debt')}</th>
                        <th className="pb-2 text-right">{t('dashboard.deposit')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientDebts.map((client, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{client.client_name}</span>
                          </td>
                          <td className="py-3 text-right">
                            {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                              .format(Number(client.total_debt))
                              .replace('UZS', '')
                              .trim()}
                          </td>
                          <td className="py-3 text-right text-green-600">
                            {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                              .format(Number(client.total_paid))
                              .replace('UZS', '')
                              .trim()}
                          </td>
                          <td className="py-3 text-right text-destructive">
                            {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                              .format(Number(client.remaining_debt))
                              .replace('UZS', '')
                              .trim()}
                          </td>
                          <td className="py-3 text-right text-blue-600">
                            {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                              .format(Number(client.deposit))
                              .replace('UZS', '')
                              .trim()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {t('dashboard.no_client_debt_data_available')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Unsold Products */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>{t('dashboard.unsold_products') || 'Unsold Products'}</CardTitle>
            <CardDescription>{t('dashboard.products_with_no_sales') || 'Products that have not been sold'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unsoldProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">{t('dashboard.product') || 'Product'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unsoldProducts.map((product, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>{product.product_name}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {t('dashboard.no_unsold_products') || 'No unsold products'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Sellers */}
      <Card className="bg-white shadow-md hover:shadow-lg transition-shadow mb-8">
        <CardHeader>
          <CardTitle>{t('dashboard.top_sellers') || 'Top Sellers'}</CardTitle>
          <CardDescription>{t('dashboard.top_performing_stores') || 'Top performing stores and sellers'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topSellers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-2">{t('dashboard.store') || 'Store'}</th>
                      <th className="pb-2">{t('dashboard.seller') || 'Seller'}</th>
                      <th className="pb-2">{t('dashboard.seller_phone') || 'Phone'}</th>
                      <th className="pb-2 text-right">{t('dashboard.total_sales') || 'Total Sales'}</th>
                      <th className="pb-2 text-right">{t('dashboard.total_revenue') || 'Total Revenue'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellers.map((seller, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-3 flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span>{seller.store_name}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{seller.seller_name || t('dashboard.not_specified') || 'Not specified'}</span>
                          </div>
                        </td>
                        <td className="py-3">{seller.seller_phone || '-'}</td>
                        <td className="py-3 text-right">{seller.total_sales}</td>
                        <td className="py-3 text-right">
                          {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                            .format(seller.total_revenue)
                            .replace('UZS', '')
                            .trim()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                {t('dashboard.no_sellers_data_available') || 'No sellers data available'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Profitability - Full Width Section */}
      <div className="mb-8">
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            {productProfitability.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Full-screen Line Chart */}
                <div className="h-[480px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={productProfitability} 
                      margin={{ top: 10, right: 30, left: 10, bottom: 40 }}
                    >
                      <defs>
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis 
                        dataKey="product_name" 
                        tick={{ fontSize: 11 }}
                        angle={-35}
                        textAnchor="end"
                        height={60}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11 }}
                        tickCount={5}
                        tickFormatter={(value) => 
                          new Intl.NumberFormat('uz-UZ', { notation: 'compact', compactDisplay: 'short' })
                            .format(value)
                        }
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none', fontSize: '12px' }}
                        formatter={(value, name) => {
                          if (name === 'profit') {
                            return [
                              new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' })
                                .format(Number(value))
                                .replace('UZS', '')
                                .trim(),
                              ''
                            ];
                          }
                          return [value, ''];
                        }}
                        labelFormatter={() => ''}
                        cursor={{ stroke: '#718096', strokeWidth: 1, strokeDasharray: '5 5' }}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="profit" 
                        name=""
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ r: 5, strokeWidth: 2, fill: 'white', stroke: '#10b981' }}
                        activeDot={{ r: 7, strokeWidth: 0, fill: '#10b981' }}
                        fill="url(#profitGradient)"
                        fillOpacity={1}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Area Chart for Margins */}
                <div className="h-[480px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={productProfitability} 
                      margin={{ top: 10, right: 30, left: 10, bottom: 40 }}
                    >
                      <defs>
                        <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis 
                        dataKey="product_name" 
                        tick={{ fontSize: 11 }}
                        angle={-35}
                        textAnchor="end"
                        height={60}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11 }}
                        tickCount={5}
                        tickFormatter={(value) => `${value}%`}
                        domain={[0, 'dataMax + 10']}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none', fontSize: '12px' }}
                        formatter={(value) => [`${value}%`, '']}
                        labelFormatter={() => ''}
                        cursor={{ stroke: '#718096', strokeWidth: 1, strokeDasharray: '5 5' }}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="margin" 
                        name=""
                        stroke="#6366f1" 
                        strokeWidth={3}
                        dot={{ r: 5, strokeWidth: 2, fill: 'white', stroke: '#6366f1' }}
                        activeDot={{ r: 7, strokeWidth: 0, fill: '#6366f1' }}
                        fill="url(#colorMargin)"
                        fillOpacity={1}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-80"></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
