import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import type { Expense } from '../api/expense';
import { useCreateExpense } from '../api/expense';
import { useGetStores } from '../api/store';
import { useGetExpenseNames } from '../api/expense-name';

const expenseFields = (t: (key: string) => string, storeBudget: number, onStoreChange: (storeId: number) => void) => [
  {
    name: 'store',
    label: t('forms.store'),
    type: 'select',
    placeholder: t('placeholders.select_store'),
    required: true,
    options: [], // Will be populated with stores,
    onChange: (value: string) => onStoreChange(parseInt(value, 10))
  },
  {
    name: 'expense_name',
    label: t('forms.expense_name'),
    type: 'select',
    placeholder: t('placeholders.select_expense_name'),
    required: true,
    options: [], // Will be populated with expense names
  },
  {
    name: 'amount',
    label: `${t('forms.amount3')} (${t('table.budget')}: ${storeBudget.toLocaleString()} UZS)`,
    type: 'text',
    placeholder: t('placeholders.enter_amount'),
    required: true,
    validation: {
      max: {
        value: storeBudget,
        message: t('validation.amount_exceeds_budget')
      }
    }
  },
  {
    name: 'comment',
    label: t('forms.comment'),
    type: 'text',
    placeholder: t('placeholders.enter_comment'),
    required: false,
  },
];

export default function CreateExpense() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createExpense = useCreateExpense();
  const [storeBudget, setStoreBudget] = useState(0);

  // Fetch stores and expense names for select inputs
  const { data: storesData } = useGetStores({});
  const { data: expenseNamesData } = useGetExpenseNames({});

  // Prepare options for select inputs
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const expenseNames = Array.isArray(expenseNamesData) ? expenseNamesData : expenseNamesData?.results || [];

  const handleStoreChange = (storeId: number) => {
    const selectedStore = stores.find(store => store.id === storeId);
    setStoreBudget(selectedStore?.budget ? parseFloat(selectedStore.budget) : 0);
  };

  // Update fields with dynamic data
  const fields = expenseFields(t, storeBudget, handleStoreChange).map(field => {
    if (field.name === 'store') {
      return {
        ...field,
        options: stores.map(store => ({
          value: store.id,
          label: store.name,
        })).filter(opt => opt.value), // Filter out any undefined IDs
      };
    }
    if (field.name === 'expense_name') {
      return {
        ...field,
        options: expenseNames.map(expenseName => ({
          value: expenseName.id,
          label: expenseName.name,
        })).filter(opt => opt.value), // Filter out any undefined IDs
      };
    }
    return field;
  });

  const handleSubmit = async (data: Expense) => {
    try {
      // Convert amount to number for comparison
      const expenseAmount = parseFloat(data.amount);
      
      if (expenseAmount > storeBudget) {
        toast.error(t('validation.amount_exceeds_budget'));
        return;
      }

      await createExpense.mutateAsync({
        ...data,
        amount: data.amount.toString()
      });
      toast.success(t('messages.success.expense_created'));
      navigate('/expense'); // navigate to expenses list page
    } catch (error) {
      toast.error(t('messages.error.expense_create'));
      console.error('Failed to create expense:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <ResourceForm
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={createExpense.isPending}
        title={t('pages.create_expense')}
      />
    </div>
  );
}