import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ResourceForm } from '@/core/helpers/ResourceForm';
import { useTranslation } from 'react-i18next';

interface SelectCurrencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (currency: string) => void;
}

const CURRENCIES = [
  { value: 'Доллар', label: 'Доллар' },
  { value: 'Сум', label: 'Сум' },
  { value: 'Евро', label: 'Евро' },
];

export function SelectCurrencyModal({ open, onOpenChange, onSelect }: SelectCurrencyModalProps) {
  const { t } = useTranslation();
  const [currency, setCurrency] = useState('Доллар');

  const handleSubmit = (data: { currency: string }) => {
    onSelect(data.currency);
    onOpenChange(false);
  };

  const fields = [
    {
      name: 'currency',
      label: t('forms.currency'),
      type: 'select',
      options: CURRENCIES,
      required: true,
      defaultValue: currency,
      onChange: setCurrency,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Выберите валюту')}</DialogTitle>
        </DialogHeader>
        <ResourceForm
          fields={fields}
          onSubmit={handleSubmit}
          defaultValues={{ currency }}
          hideSubmitButton={false}
        >
          
        </ResourceForm>
      </DialogContent>
    </Dialog>
  );
}
