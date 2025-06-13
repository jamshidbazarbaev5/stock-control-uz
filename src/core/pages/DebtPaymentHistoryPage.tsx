// import { useState } from 'react';
// import { useTranslation } from 'react-i18next';
// import { useParams } from 'react-router-dom';
// import { useGetDebtPayments, type DebtPayment } from '../api/debt';
// import { ResourceTable } from '../helpers/ResourseTable';
// import { Input } from '@/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { useGetUsers } from '../api/user';
// import { Card } from '@/components/ui/card';
// import { Skeleton } from '@/components/ui/skeleton';

// export default function DebtPaymentHistoryPage() {
//   const { t } = useTranslation();
//   const { id } = useParams();
  
//   // Filter states
//   const [dateFrom, setDateFrom] = useState('');
//   const [dateTo, setDateTo] = useState('');
//   const [amountMin, setAmountMin] = useState('');
//   const [amountMax, setAmountMax] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('');
//   const [selectedWorker, setSelectedWorker] = useState('');

//   // Fetch workers data
//   const { data: workersData } = useGetUsers();
//   const workers = Array.isArray(workersData) ? workersData : workersData?.results || [];
  
//   // Fetch payments with filters
//   const { data: payments = [], isLoading } = useGetDebtPayments(id!, {
//     paid_at_after: dateFrom || undefined,
//     paid_at_before: dateTo || undefined,
//     amount_min: amountMin || undefined,
//     amount_max: amountMax || undefined,
//     payment_method: paymentMethod === 'all' ? undefined : paymentMethod,
//     worker: selectedWorker === 'all' ? undefined : selectedWorker,
//   });

//   const columns = [ 
//     {
//       accessorKey: 'amount',
//       header: t('forms.amount2'),
//       cell: (payment: DebtPayment) => payment.amount.toLocaleString(),
//     },
//     {
//       accessorKey: 'paid_at',
//       header: t('forms.payment_date'),
//       cell: (payment: DebtPayment) => new Date(payment.paid_at || '').toLocaleDateString(),
//     },
//     {
//       accessorKey: 'payment_method',
//       header: t('forms.payment_method2'),
//       cell: (payment: DebtPayment) => {
//         switch (payment.payment_method?.toLowerCase()) {
//           case 'cash':
//             return t('payment_methods.cash');
//           case 'card':
//             return t('payment_methods.card');
//           case 'transfer':
//             return t('payment_methods.transfer');
//           default:
//             return payment.payment_method;
//         }
//       },
//     },
//     {
//       accessorKey: 'worker_read',
//       header: t('forms.worker'),
//       cell: (payment: DebtPayment) => payment.worker_read?.name || '-',
//     }
//   ];

//   return (
//     <div className="container mx-auto py-8">
//       <h2 className="text-2xl font-bold mb-6">{t('pages.payment_history')}</h2>
      
//       {/* Filters */}
//       <Card className="p-4 mb-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           <div className="space-y-2">
//             <label className="text-sm font-medium">{t('forms.date_from')}</label>
//             <Input
//               type="date"
//               value={dateFrom}
//               onChange={(e) => setDateFrom(e.target.value)}
//             />
//           </div>
          
//           <div className="space-y-2">
//             <label className="text-sm font-medium">{t('forms.date_to')}</label>
//             <Input
//               type="date"
//               value={dateTo}
//               onChange={(e) => setDateTo(e.target.value)}
//             />
//           </div>

//           <div className="space-y-2">
//             <label className="text-sm font-medium">{t('forms.amount_min')}</label>
//             <Input
//               type="number"
//               value={amountMin}
//               onChange={(e) => setAmountMin(e.target.value)}
//               placeholder={t('placeholders.enter_amount')}
//             />
//           </div>

//           <div className="space-y-2">
//             <label className="text-sm font-medium">{t('forms.amount_max')}</label>
//             <Input
//               type="number"
//               value={amountMax}
//               onChange={(e) => setAmountMax(e.target.value)}
//               placeholder={t('placeholders.enter_amount')}
//             />
//           </div>

//           <div className="space-y-2">
//             <label className="text-sm font-medium">{t('forms.payment_method')}</label>
//             <Select value={paymentMethod} onValueChange={setPaymentMethod}>
//               <SelectTrigger>
//                 <SelectValue placeholder={t('placeholders.select_payment_method')} />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">
//                   {t('common.all')}
//                 </SelectItem>
//                 <SelectItem value="Наличные">
//                   {t('payment_methods.cash')}
//                 </SelectItem>
//                 <SelectItem value="Карта">
//                   {t('payment_methods.card')}
//                 </SelectItem>
//                 <SelectItem value="Click">
//                   {t('payment_methods.click')}
//                 </SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="space-y-2">
//             <label className="text-sm font-medium">{t('forms.worker')}</label>
//             <Select value={selectedWorker} onValueChange={setSelectedWorker}>
//               <SelectTrigger>
//                 <SelectValue placeholder={t('placeholders.select_worker')} />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">
//                   {t('common.all')}
//                 </SelectItem>
//                 {workers.map((worker) => (
//                   <SelectItem key={worker.id} value={worker.id?.toString() || ''}>
//                     {worker.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         </div>
//       </Card>

//       {isLoading ? (
//         <Card className="p-4">
//           <div className="space-y-3">
//             {[1, 2, 3].map((i) => (
//               <div key={i} className="flex gap-4">
//                 <Skeleton className="h-4 w-24" />
//                 <Skeleton className="h-4 w-32" />
//                 <Skeleton className="h-4 w-24" />
//                 <Skeleton className="h-4 w-32" />
//               </div>
//             ))}
//           </div>
//         </Card>
//       ) : payments.length === 0 ? (
//         <Card className="p-6">
//           <div className="text-center text-gray-500">
//             {t('messages.no_data_to_display')}
//           </div>
//         </Card>
//       ) : (
//         <ResourceTable<DebtPayment>
//           columns={columns}
//           data={payments}
//           isLoading={isLoading}
//         />
//       )}
//     </div>
//   );
// }