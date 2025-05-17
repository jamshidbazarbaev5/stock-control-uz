import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { type Category, useGetCategories, useUpdateCategory, useDeleteCategory } from '../api/category';
import { t } from 'i18next';

const categoryFields = [
  {
    name: 'category_name',
    label: 'forms.category_name',
    type: 'text',
    placeholder: 'placeholders.enter_name',
    required: true,
  },
];

const columns = [
  // {
  //   header: 'table.number',
  //   accessorKey: 'displayId',
  // },
  {
    header: t('forms.category_name'),
    accessorKey: 'category_name',
  },
];

type CategoryResponse = {
  results: Category[];
  count: number;
  total_pages: number;
  current_page: number;
}

export default function CategoriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categoriesData, isLoading } = useGetCategories({});
  const fields = categoryFields;

  // Get the categories array from the paginated response
  const categories = (categoriesData as CategoryResponse)?.results || [];

  // Enhance categories with display ID
  const enhancedCategories = categories.map((category: Category, index: number) => ({
    ...category,
    displayId: index + 1
  }));

  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();
  const { mutate: deleteCategory } = useDeleteCategory();

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<Category>) => {
    if (!editingCategory?.id) return;

    updateCategory(
      { ...data, id: editingCategory.id } as Category,
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.categories') }));
          setIsFormOpen(false);
          setEditingCategory(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.categories') })),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm(t('messages.confirmation.delete'))) {
      deleteCategory(id, {
        onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.categories') })),
        onError: () => toast.error(t('messages.error.delete', { item: t('navigation.categories') })),
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <ResourceTable
        data={enhancedCategories}
        columns={columns}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-category')}
        totalCount={enhancedCategories.length}
        pageSize={10}
        currentPage={1}
        onPageChange={() => {}}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields.map(field => ({
              ...field,
              label: t(field.label),
              placeholder: t(field.placeholder)
            }))}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingCategory || {}}
            isSubmitting={isUpdating}
            title={t('messages.edit', { item: t('navigation.categories') })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
