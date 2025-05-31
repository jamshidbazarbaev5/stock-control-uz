// import { useState } from 'react';
// import { useTranslation } from 'react-i18next';
// import { useGetIncomes } from '../api/income';
// import { useGetUsers } from '../api/user';
// import { ResourceTable } from '../helpers/ResourseTable';
// import { Card } from '@/components/ui/card';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { useGetStores } from '../api/store';
// import type { Store } from '../api/store';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
// import { format } from 'date-fns';
// import { Button } from "@/components/ui/button";
// import { useNavigate } from "react-router-dom";
// import { Wallet } from 'lucide-react';

// interface SaleItem {
//   Product: string;
//   Quantity: string;
//   Subtotal: string;
//   'Selling Method': string;
// }

// export default function SalesDetailsPage() {
//   const { t } = useTranslation();
//   const navigate = useNavigate();
//   const [page, setPage] = useState(1);
//   const [selectedStore, setSelectedStore] = useState('all');
//   const [selectedWorker, setSelectedWorker] = useState('all');
//   const [startDate, setStartDate] = useState<Date | null>(null);
//   const [endDate, setEndDate] = useState<Date | null>(null);
//   const [expanded, setExpanded] = useState<Record<string, boolean>>({});

//   const { data: storesData } = useGetStores();
//   const { data: usersData } = useGetUsers();
//   const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
//   const users = Array.isArray(usersData) ? usersData : usersData?.results || [];
  
//   const { data: salesData, isLoading } = useGetIncomes({
//     params: {
//       ...(selectedStore !== 'all' && { store: selectedStore }),
//       source: 'Продажа',
//       ...(selectedWorker !== 'all' && { worker: selectedWorker }),
//       ...(startDate && { start_date: format(startDate, 'yyyy-MM-dd') }),
//       ...(endDate && { end_date: format(endDate, 'yyyy-MM-dd') })
//     }
//   });
  
//   const sales = Array.isArray(salesData) ? salesData : salesData?.results || [];
//   const totalCount = Array.isArray(salesData) ? sales.length : salesData?.count || 0;

//   const formatCurrency = (amount: string | number) => {
//     return new Intl.NumberFormat('ru-RU').format(Number(amount));
//   };

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('ru-RU', {
//         year: 'numeric',
//         month: '2-digit',
//         day: '2-digit',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch (error) {
//       return '-';
//     }
//   };

//   const getPaymentMethods = (row: any) => {
//     if (row.description.Payments?.length > 0) {
//       return row.description.Payments.map((p: any) => `${formatCurrency(p.Amount)} UZS (${p.Method})`).join(', ');
//     }
//     return '-';
//   };

//   const getPaymentIcon = (method: string) => {
//     switch (method) {
//       case 'Наличные':
//         return <Wallet className="h-4 w-4 text-green-600" />;
//       case 'Карта':
//         return <CreditCard className="h-4 w-4 text-blue-600" />;
//       case 'Click':
//         return <SmartphoneNfc className="h-4 w-4 text-purple-600" />;
//       default:
//         return null;
//     }
//   };

//   const expandedRowRenderer = (row: any) => {
//     if (!row.description.Items?.length) return null;

//     const items = row.description.Items;
//     const totalAmount = parseFloat(row.description.Amount || '0');
//     const payments = row.description.Payments || [];
//     const clientName = row.description.Client || '-';

//     return (
//       <div className="p-4 bg-gray-50">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//           <div className="bg-white p-3 rounded-lg shadow-sm">
//             <h3 className="text-sm text-gray-500 mb-1">{t('table.client')}</h3>
//             <p className="font-medium">{clientName}</p>
//           </div>
//           <div className="bg-white p-3 rounded-lg shadow-sm">
//             <h3 className="text-sm text-gray-500 mb-1">{t('forms.total_amount')}</h3>
//             <p className="font-medium text-emerald-600">{formatCurrency(totalAmount)} UZS</p>
//           </div>
//           <div className="bg-white p-3 rounded-lg shadow-sm">
//             <h3 className="text-sm text-gray-500 mb-1">{t('forms.payment_method')}</h3>
//             <div className="space-y-1">
//               {payments.map((payment: any, index: number) => (
//                 <div key={index} className="flex items-center gap-2">
//                   {getPaymentIcon(payment.Method)}
//                   <span className="text-sm">{payment.Method}: {formatCurrency(payment.Amount)} UZS</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
        
//         <div className="bg-white rounded-lg shadow-sm overflow-hidden">
//           <h3 className="font-semibold p-3 border-b bg-gray-50">{t('table.items')}</h3>
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">{t('forms.product')}</th>
//                   <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">{t('forms.quantity')}</th>
//                   <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">{t('forms.selling_method')}</th>
//                   <th className="px-3 py-2 text-right text-sm font-medium text-gray-500">{t('forms.subtotal')}</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {items.map((item: SaleItem, index: number) => (
//                   <tr key={index} className="hover:bg-gray-50">
//                     <td className="px-3 py-2.5 text-sm text-gray-900">{item.Product}</td>
//                     <td className="px-3 py-2.5 text-sm text-gray-900">{item.Quantity}</td>
//                     <td className="px-3 py-2.5 text-sm text-gray-900">{item['Selling Method']}</td>
//                     <td className="px-3 py-2.5 text-sm text-right font-medium text-emerald-600">{formatCurrency(item.Subtotal)} UZS</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const columns = [
//     {
//       header: t('forms.store'),
//       accessorKey: 'store_read.name',
//       cell: (row: any) => row.store_read?.name || '-',
//     },
//     {
//       header: t('forms.amount'),
//       accessorKey: 'description.Amount',
//       cell: (row: any) => (
//         <span className="font-medium text-emerald-600">
//           {formatCurrency(row.description.Amount)} UZS
//         </span>
//       ),
//     },
//     {
//       header: t('forms.payment_details'),
//       accessorKey: 'description.Payments',
//       cell: (row: any) => getPaymentMethods(row),
//     },
//     {
//       header: t('forms.worker'),
//       accessorKey: 'worker_read.name',
//       cell: (row: any) => row.description.Worker || row.worker_read?.name || '-',
//     },
//     {
//       header: t('forms.date'),
//       accessorKey: 'timestamp',
//       cell: (row: any) => formatDate(row.description['Sold Date'] || row.timestamp),
//     },
//   ];

//   return (
//     <div className="container mx-auto py-8 px-4">
//       <div className="flex justify-between items-center mb-6"></div>
//       <div className="flex gap-4 mb-6">
//         <Select value={selectedStore} onValueChange={setSelectedStore}>
//           <SelectTrigger className="w-[200px]">
//             <SelectValue placeholder={t('forms.select_store')} />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">{t('forms.all_stores')}</SelectItem>
//             {stores.map((store: Store) => (
//               <SelectItem key={store.id} value={String(store.id)}>
//                 {store.name}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>

//         <Select value={selectedWorker} onValueChange={setSelectedWorker}>
//           <SelectTrigger className="w-[200px]">
//             <SelectValue placeholder={t('forms.select_worker')} />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">{t('forms.all_workers')}</SelectItem>
//             {users.map((user) => (
//               <SelectItem key={user.id} value={String(user.id)}>
//                 {user.name}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>

//         <div className="flex gap-4">
//           <DatePicker
//             selected={startDate}
//             onChange={(date: Date | null) => setStartDate(date)}
//             selectsStart
//             startDate={startDate}
//             endDate={endDate}
//             dateFormat="dd/MM/yyyy"
//             placeholderText={t('forms.start_date')}
//             className="w-[200px] flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
//           />
//           <DatePicker
//             selected={endDate}
//             onChange={(date: Date | null) => setEndDate(date)}
//             selectsEnd
//             startDate={startDate}
//             endDate={endDate}
//             minDate={startDate || undefined}
//             dateFormat="dd/MM/yyyy"
//             placeholderText={t('forms.end_date')}
//             className="w-[200px] flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
//           />
//         </div>
//       </div>

//       <Card>
//         <ResourceTable
//           data={sales}
//           columns={columns}
//           isLoading={isLoading}
//           totalCount={totalCount}
//           pageSize={10}
//           currentPage={page}
//           onPageChange={(newPage) => setPage(newPage)}
//           expandedRowRenderer={expandedRowRenderer}
//         />
//       </Card>
//     </div>
//   );
// }
