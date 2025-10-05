import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ResourceForm } from '../helpers/ResourceForm';
import { useGetStores } from '../api/store';
import { shiftsApi, type ShiftUpdateData, type Payment } from '../api/shift';

export default function EditShiftPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Fetch shift data
  const { data: response, isLoading } = useQuery({
    queryKey: ['shifts', id],
    queryFn: () => shiftsApi.getById(Number(id)),
    enabled: !!id,
  });

  const shift = response?.data;

  // Fetch stores
  const { data: storesResponse } = useGetStores();
  const stores = Array.isArray(storesResponse) ? storesResponse : storesResponse?.results;

  // Update mutation
  const updateShift = useMutation({
    mutationFn: (data: ShiftUpdateData) => shiftsApi.update(Number(id), data),
    onSuccess: () => {
      toast.success(t('messages.success.updated', { item: t('navigation.shifts') }));
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      navigate('/shifts');
    },
    onError: () => {
      toast.error(t('messages.error.update', { item: t('navigation.shifts') }));
    },
  });

  const fields = [
    {
      name: 'store',
      label: t('table.store'),
      type: 'select',
      placeholder: t('placeholders.select_store'),
      required: true,
      options: stores?.map(store => ({
        value: store.id,
        label: store.name,
      })) || [],
    },
    {
      name: 'register',
      label: t('table.register'),
      type: 'select',
      placeholder: t('placeholders.select_register'),
      required: true,
      options: shift?.register ? [
        {
          value: shift.register.id,
          label: shift.register.name,
        },
      ] : [],
    },
    {
      name: 'cashier',
      label: t('table.cashier'),
      type: 'text',
      disabled: true,
      displayValue: shift?.cashier?.name,
    },
    {
      name: 'opened_at',
      label: t('table.opened_at'),
      type: 'datetime-local',
      required: true,
    },
    {
      name: 'closed_at',
      label: t('table.closed_at'),
      type: 'datetime-local',
    },
    {
      name: 'opening_cash',
      label: t('table.opening_cash'),
      type: 'number',
      required: true,
    },
    {
      name: 'closing_cash',
      label: t('table.closing_cash'),
      type: 'number',
    },
    {
      name: 'total_expected',
      label: t('table.total_expected'),
      type: 'number',
      disabled: true,
    },
    {
      name: 'total_actual',
      label: t('table.total_actual'),
      type: 'number',
      disabled: true,
    },
    {
      name: 'opening_comment',
      label: t('table.opening_comment'),
      type: 'textarea',
    },
    {
      name: 'closing_comment',
      label: t('table.closing_comment'),
      type: 'textarea',
    },
    {
      name: 'approval_comment',
      label: t('table.approval_comment'),
      type: 'textarea',
    },
    {
      name: 'is_active',
      label: t('table.status'),
      type: 'select',
      options: [
        { value: 'true', label: t('common.active') },
        { value: 'false', label: t('common.closed') },
      ],
    },
    {
      name: 'is_awaiting_approval',
      label: t('table.awaiting_approval'),
      type: 'select',
      options: [
        { value: 'true', label: t('common.yes') },
        { value: 'false', label: t('common.no') },
      ],
    },
    {
      name: 'is_approved',
      label: t('table.approved'),
      type: 'select',
      options: [
        { value: 'true', label: t('common.yes') },
        { value: 'false', label: t('common.no') },
      ],
    },
  ];

  const handleSubmit = async (data: any) => {
    // Remove cashier from data since it's disabled and shouldn't be updated
    const { cashier, ...submitData } = data;
    
    // Convert string boolean values to actual booleans
    const processedData: ShiftUpdateData = {
      ...submitData,
      is_active: submitData.is_active === 'true',
      is_awaiting_approval: submitData.is_awaiting_approval === 'true',
      is_approved: submitData.is_approved === 'true',
    };
    
    updateShift.mutate(processedData);
  };

  if (isLoading) {
    return <div className="container mx-auto py-8 px-4">{t('common.loading')}</div>;
  }

  if (!shift) {
    return <div className="container mx-auto py-8 px-4">{t('messages.error.not_found')}</div>;
  }

  // Helper function to format datetime for input
  const formatDateTimeForInput = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const defaultValues: any = {
    store: shift.store.id,
    register: shift.register.id,
    cashier: shift.cashier.name, // Display name for disabled field
    opened_at: formatDateTimeForInput(shift.opened_at),
    closed_at: formatDateTimeForInput(shift.closed_at),
    opening_cash: shift.opening_cash,
    closing_cash: shift.closing_cash || '',
    total_expected: shift.total_expected,
    total_actual: shift.total_actual,
    opening_comment: shift.opening_comment || '',
    closing_comment: shift.closing_comment || '',
    approval_comment: shift.approval_comment || '',
    is_active: shift.is_active.toString(),
    is_awaiting_approval: shift.is_awaiting_approval.toString(),
    is_approved: shift.is_approved.toString(),
  };

  const PaymentsTable = ({ payments }: { payments: Payment[] }) => (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">{t('table.payments')}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.payment_method')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.income')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.expense')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.expected')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.actual')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {payment.payment_method}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {payment.income}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {payment.expense}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {payment.expected}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {payment.actual}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('common.edit')} {t('navigation.shift')}</h1>
      </div>
      
      <ResourceForm
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={updateShift.isPending}
        defaultValues={defaultValues}
      />
      
      {shift.payments && shift.payments.length > 0 && (
        <PaymentsTable payments={shift.payments} />
      )}
    </div>
  );
}