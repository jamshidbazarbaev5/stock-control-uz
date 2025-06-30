import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { type LoanSponsor, useGetLoanSponsors, useUpdateLoanSponsor, useDeleteLoanSponsor } from '../api/loansponsor';
import { useGetSponsors } from '../api/sponsors';
import { PayLoanModal } from '../components/modals/PayLoanModal';

const loanSponsorFields = (t: any, sponsors: any[]) => [
  {
    name: 'sponsor_write',
    label: t('forms.sponsor'),
    type: 'select',
    required: true,
    options: sponsors.map((s: any) => ({ value: s.id, label: s.name })),
    placeholder: t('placeholders.select_sponsor'),
  },
  {
    name: 'total_amount',
    label: t('forms.total_amount'),
    type: 'number',
    required: true,
    placeholder: t('placeholders.enter_amount'),
  },
  {
    name: 'currency',
    label: t('forms.currency'),
    type: 'text',
    required: true,
    placeholder: t('placeholders.enter_currency'),
  },
  {
    name: 'due_date',
    label: t('forms.due_date'),
    type: 'text',
    required: true,
    placeholder: t('placeholders.enter_due_date'),
  },
];

const columns = (t: any) => [
  {
    header: t('forms.sponsor'),
    accessorKey: (row: LoanSponsor) => row.sponsor_read?.name || '',
  },
  {
    header: t('forms.total_amount'),
    accessorKey: 'total_amount',
  },
  {
    header: t('forms.currency'),
    accessorKey: 'currency',
  },
  {
    header: t('forms.due_date'),
    accessorKey: 'due_date',
  },
  {
    header: t('forms.is_paid'),
    accessorKey: (row: LoanSponsor) => row.is_paid ? t('common.yes') : t('common.no'),
  },
  {
    header: t('forms.created_at'),
    accessorKey: (row: LoanSponsor) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '',
  },
  {
    header: t('forms.remainder'),
    accessorKey: 'remainder',
  },
];

type LoanSponsorResponse = {
  results: LoanSponsor[];
  count: number;
  total_pages: number;
  current_page: number;
};

export default function LoanSponsorsPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLoanSponsor, setEditingLoanSponsor] = useState<LoanSponsor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const { t } = useTranslation();
  const { data: sponsorsData } = useGetSponsors({});
  const sponsors = Array.isArray(sponsorsData) ? sponsorsData : (sponsorsData ? [sponsorsData] : []);
  const { data: loanSponsorsData, isLoading } = useGetLoanSponsors({
    params: {
      // Optionally add search params
    },
  });

  const fields = loanSponsorFields(t, sponsors);
  const loanSponsors = (loanSponsorsData as LoanSponsorResponse)?.results || [];
  const enhancedLoanSponsors = loanSponsors.map((item: LoanSponsor, index: number) => ({
    ...item,
    displayId: index + 1,
  }));

  const { mutate: updateLoanSponsor, isPending: isUpdating } = useUpdateLoanSponsor();
  const { mutate: deleteLoanSponsor } = useDeleteLoanSponsor();

  const handleEdit = (item: LoanSponsor) => {
    setEditingLoanSponsor(item);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<LoanSponsor>) => {
    if (!editingLoanSponsor?.id) return;
    updateLoanSponsor(
      { ...data, id: editingLoanSponsor.id } as LoanSponsor,
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.loansponsors') }));
          setIsFormOpen(false);
          setEditingLoanSponsor(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.loansponsors') })),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteLoanSponsor(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.loansponsors') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.loansponsors') })),
    });
  };

  const handlePay = (loanId: number) => {
    setSelectedLoanId(loanId);
    setIsPayModalOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.loan')}</h1>
        {/* <Button onClick={() => navigate('/create-loansponsor')}>{t('common.create')} {t('navigation.loansponsors')}</Button> */}
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('placeholders.search_loansponsor')}
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ResourceTable
        data={enhancedLoanSponsors}
        columns={columns(t)}
        isLoading={isLoading}
        // onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate("/loans/create")}
        totalCount={enhancedLoanSponsors.length}
        pageSize={30}
        currentPage={1}
        onPageChange={() => {}}
        actions={(row: LoanSponsor) => (
          <>
            <button
              className="bg-green-600 text-white px-3 py-1 rounded ml-2"
              onClick={() => handlePay(row.id!)}
            >
              {t('common.pay')}
            </button>
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded ml-2"
              onClick={() => navigate(`/loans/${row.id}/payments`)}
            >
              {t('common.view_payments')}
            </button>
          </>
        )}
      />
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingLoanSponsor || {}}
            isSubmitting={isUpdating}
            title={t('messages.edit')}
          />
        </DialogContent>
      </Dialog>
      <PayLoanModal
        open={isPayModalOpen}
        onOpenChange={setIsPayModalOpen}
        loanId={selectedLoanId}
        onSuccess={() => {}}
      />
    </div>
  );
}
