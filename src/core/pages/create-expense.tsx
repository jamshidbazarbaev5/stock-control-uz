import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import type { Expense } from '../api/expense';
import { useCreateExpense } from '../api/expense';
import { useGetStores } from '../api/store';
import { useGetExpenseNames } from '../api/expense-name';

const expenseFields = (t: (key: string) => string) => [
  {
    name: 'store',
    label: t('forms.store'),
    type: 'select',
    placeholder: t('placeholders.select_store'),
    required: true,
    options: [], // Will be populated with stores
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
    label: t('forms.amount'),
    type: 'text',
    placeholder: t('placeholders.enter_amount'),
    required: true,
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

  // Fetch stores and expense names for select inputs
  const { data: storesData } = useGetStores({});
  const { data: expenseNamesData } = useGetExpenseNames({});

  // Prepare options for select inputs
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const expenseNames = Array.isArray(expenseNamesData) ? expenseNamesData : expenseNamesData?.results || [];

  // Update fields with dynamic data
  const fields = expenseFields(t).map(field => {
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
      await createExpense.mutateAsync({
        ...data,
        // Ensure amount is in string format
        amount: data.amount.toString()
      });
      toast.success(t('messages.success.expense_created'));
      navigate('/expenses'); // navigate to expenses list page
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