import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ResourceTable } from '../helpers/ResourseTable';
import { toast } from 'sonner';
import type { Expense } from '../api/expense';
import { useGetExpenses, useDeleteExpense } from '../api/expense';
import { useNavigate } from 'react-router-dom';
// import type { Column } from '../helpers/ResourseTable';

export default function ExpensesPage() {
  const { t } = useTranslation();
  const { data: expensesData, isLoading } = useGetExpenses({});
  const deleteExpense = useDeleteExpense();
  const navigation = useNavigate();
  const expenses = Array.isArray(expensesData) ? expensesData : expensesData?.results || [];

  const handleEdit = (expense: Expense) => {
    navigation(`/edit-expense/${expense.id}`);
  };

  const columns = [
    {
      header: t('forms.store'),
      accessorKey: 'store_read.name',
      cell: (row: Expense) => row.store_read?.name || '-',
    },
    {
      header: t('forms.expense_name'),
      accessorKey: 'expense_name_read.name',
      cell: (row: Expense) => row.expense_name_read?.name || '-',
    },
    {
      header: t('forms.amount'),
      accessorKey: 'amount',
      cell: (row: Expense) => (
        <div className="text-right font-medium">
          {Number(row.amount).toLocaleString()} UZS
        </div>
      ),
    },
    {
      header: t('forms.comment'),
      accessorKey: 'comment',
      cell: (row: Expense) => row.comment || '-',
    },
   
  ];

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense.mutateAsync(id);
      toast.success(t('messages.success.expense_deleted'));
    } catch (error) {
      toast.error(t('messages.error.expense_delete'));
      console.error('Failed to delete expense:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.expenses')}</h1>
        <Button onClick={() => navigation('/create-expense')}>{t('common.create')}</Button>
      </div>

      <ResourceTable
        columns={columns}
        data={expenses}
        onDelete={handleDelete}
        onEdit={handleEdit}
        isLoading={isLoading}
      />
    </div>
  );
}