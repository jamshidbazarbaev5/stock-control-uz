import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ResourceForm } from '@/core/helpers/ResourceForm';
import { useTranslation } from 'react-i18next';

interface CreateLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsorId: number | null;
  onCreate: (data: { total_amount: number; currency: string; due_date: string; sponsor_write: number }) => Promise<void>;
}

export function CreateLoanModal({ open, onOpenChange, sponsorId, onCreate }: CreateLoanModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const fields = [
    {
      name: 'total_amount',
      label: t('forms.amount'),
      type: 'number',
      required: true,
      placeholder: t('forms.amount'),
    },
    {
      name: 'currency',
      label: t('forms.currency'),
      type: 'select',
      required: true,
      options: [
        { value: 'Доллар', label: 'Доллар' },
        { value: 'Сум', label: 'Сум' },
        { value: 'Рубль', label: 'Рубль' },
          { value: 'Тенге', label: 'Тенге' },
      ],
      placeholder: t('forms.currency'),
      defaultValue: 'Доллар',
    },
    {
      name: 'due_date',
      label: t('forms.due_date'),
      type: 'date',
      required: true,
      placeholder: t('forms.due_date'),
      inputMode: 'date',
    },
  ];

  const handleSubmit = async (data: any) => {
    if (!sponsorId) return;
    setLoading(true);
    try {
      await onCreate({ ...data, sponsor_write: sponsorId });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Создать займ')}</DialogTitle>
        </DialogHeader>
        <ResourceForm
          fields={fields}
          onSubmit={handleSubmit}
          isSubmitting={loading}
          hideSubmitButton={false}
        >
         
        </ResourceForm>
      </DialogContent>
    </Dialog>
  );
}
