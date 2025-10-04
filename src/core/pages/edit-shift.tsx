import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ResourceForm } from '../helpers/ResourceForm';
import { useGetStores } from '../api/store';
import { shiftsApi, type ShiftUpdateData } from '../api/shift';

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
      name: 'opened_at',
      label: t('table.opened_at'),
      type: 'datetime-local',
      required: true,
    },
    {
      name: 'opening_cash',
      label: t('table.opening_cash'),
      type: 'number',
      required: true,
    },
    {
      name: 'closed_at',
      label: t('table.closed_at'),
      type: 'datetime-local',
    },
    {
      name: 'closing_cash',
      label: t('table.closing_cash'),
      type: 'number',
    },
    {
      name: 'comment',
      label: t('table.comment'),
      type: 'textarea',
    },
    {
      name: 'is_active',
      label: t('table.status'),
      type: 'select',
      options: [
        { value: true, label: t('common.active') },
        { value: false, label: t('common.closed') },
      ],
    },
  ];

  const handleSubmit = async (data: ShiftUpdateData) => {
    updateShift.mutate(data);
  };

  if (isLoading) {
    return <div className="container mx-auto py-8 px-4">{t('common.loading')}</div>;
  }

  if (!shift) {
    return <div className="container mx-auto py-8 px-4">{t('messages.error.not_found')}</div>;
  }

  const defaultValues: ShiftUpdateData = {
    store: shift.store,
    register: shift.register.id,
    opened_at: shift.opened_at,
    opening_cash: shift.opening_cash,
    closed_at: shift.closed_at || undefined,
    closing_cash: shift.closing_cash || undefined,
    comment: shift.comment,
    is_active: shift.is_active,
  };

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
    </div>
  );
}