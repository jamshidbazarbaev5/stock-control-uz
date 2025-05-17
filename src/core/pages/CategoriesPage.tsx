import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { type Category, useGetCategories, useUpdateCategory, useDeleteCategory } from '../api/category';

const categoryFields = [
  {
    name: 'category_name',
    label: 'Название категории',
    type: 'text',
    placeholder: 'Введите название категории',
    required: true,
  },
];

const columns = [
  // {
  //   header: '№',
  //   accessorKey: 'displayId',
  // },
  {
    header: 'Название категории',
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
          toast.success('Категория успешно обновлена');
          setIsFormOpen(false);
          setEditingCategory(null);
        },
        onError: () => toast.error('Не удалось обновить категорию'),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm('Вы уверены, что хотите удалить эту категорию?')) {
      deleteCategory(id, {
        onSuccess: () => toast.success('Категория успешно удалена'),
        onError: () => toast.error('Не удалось удалить категорию'),
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
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingCategory || {}}
            isSubmitting={isUpdating}
            title="Редактировать категорию"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
