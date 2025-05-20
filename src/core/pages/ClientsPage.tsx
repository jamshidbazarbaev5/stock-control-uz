import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourseTable';
import { type Client, useGetClients, useDeleteClient } from '../api/client';
import { toast } from 'sonner';

export default function ClientsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: clientsData, isLoading } = useGetClients();
  const deleteClient = useDeleteClient();

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
      header: t('forms.balance'),
      accessorKey: (row: Client) => 'balance' in row ? row.balance : '-',
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      await deleteClient.mutateAsync(id);
      toast.success(t('messages.success.deleted', { item: t('navigation.clients') }));
    } catch (error) {
      toast.error(t('messages.error.delete', { item: t('navigation.clients') }));
      console.error('Failed to delete client:', error);
    }
  };

  return (
    <div className="container py-8 px-4">
      <ResourceTable<Client>
        data={clients}
        columns={columns}
        isLoading={isLoading}
        onAdd={() => navigate('/create-client')}
        onEdit={(client) => navigate(`/edit-client/${client.id}`)}
        onDelete={handleDelete}
        totalCount={totalCount}
      />
    </div>
  );
}