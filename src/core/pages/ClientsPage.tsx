import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourseTable';
import { type Client, useGetClients, useDeleteClient } from '../api/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';



// function BalanceIncrementDialog({ clientId, isOpen, onClose }: BalanceIncrementDialogProps) {
//   const { t } = useTranslation();
//   const incrementBalance = useIncrementBalance();
//   const form = useForm<FormData>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       amount: 0,
//     },
//   });

//   const onSubmit = async (data: FormData) => {
//     try {
//       await incrementBalance.mutateAsync({ id: clientId, amount: data.amount });
//       toast.success(t('messages.success.balance_incremented'));
//       form.reset();
//       onClose();
//     } catch (error) {
//       toast.error(t('messages.error.balance_increment'));
//       console.error('Failed to increment balance:', error);
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>{t('forms.increment_balance')}</DialogTitle>
//         </DialogHeader>
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//             <FormField
//               control={form.control}
//               name="amount"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>{t('forms.amount')}</FormLabel>
//                   <FormControl>
//                     <Input
//                       type="number"
//                       step="0.01"
//                       {...field}
//                       onChange={e => field.onChange(parseFloat(e.target.value))}
//                     />
//                   </FormControl>
//                 </FormItem>
//               )}
//             />
//             <div className="flex justify-end space-x-2">
//               <Button type="button" variant="outline" onClick={onClose}>
//                 {t('common.cancel')}
//               </Button>
//               <Button type="submit" disabled={incrementBalance.isPending}>
//                 {t('common.save')}
//               </Button>
//             </div>
//           </form>
//         </Form>
//       </DialogContent>
//     </Dialog>
//   );
// }

export default function ClientsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<string>('all');
  // const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const { data: clientsData, isLoading } = useGetClients({ params: selectedType === 'all' ? {} : { type: selectedType } });
  const deleteClient = useDeleteClient();
  const {data:currentUser}  = useCurrentUser()
  const clients = Array.isArray(clientsData) ? clientsData : clientsData?.results || [];
  const totalCount = Array.isArray(clientsData) ? clients.length : clientsData?.count || 0;

  const columns = [
    {
      header: t('forms.client_type'),
      accessorKey: 'type',
    },
    {
      header: t('forms.name'),
      accessorKey: (row: Client) => row.type === 'Юр.лицо' ? row.name + ' (' + row.ceo_name + ')' : row.name,
    },
    {
      header: t('forms.phone'),
      accessorKey: 'phone_number',
    },
    {
      header: t('forms.address'),
      accessorKey: 'address',
    },
   
    {
      header: '',
      id: 'actions',
      accessorKey: 'id',
      cell: (row: Client) => 
        row.type === 'Юр.лицо' ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/clients/${row.id}/history`)}
            >
              {t('common.history')}
            </Button>
           
           
          </div>
        ) : null,
    },
  ];


  const handleDelete = async (id: number) => {

    try {
      if (currentUser?.is_superuser) {
        await deleteClient.mutateAsync(id);
        toast.success(t('messages.success.deleted', { item: t('navigation.clients') }));
      }
    } catch (error) {
      toast.error(t('messages.error.delete', { item: t('navigation.clients') }));
      console.error('Failed to delete client:', error);
    }
  };

  return (
    <div className="container py-8 px-4">
      <div className="mb-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger>
            <SelectValue placeholder={t('forms.select_client_type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="Физ.лицо">{t('forms.individual')}</SelectItem>
            <SelectItem value="Юр.лицо">{t('forms.legal_entity')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ResourceTable<Client>
        data={clients}
        columns={columns}
        isLoading={isLoading}
        onAdd={() => navigate('/create-client')}
        onEdit={currentUser?.is_superuser ? (client) => navigate(`/edit-client/${client.id}`) : undefined}
        onDelete={currentUser?.is_superuser ? handleDelete : undefined}
        totalCount={totalCount}
      />
     
    </div>
  );
}