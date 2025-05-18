import { useState,  } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { type Category, useGetCategories, useUpdateCategory, useDeleteCategory } from '../api/category';

const categoryFields = (t: any) => [
  {
    name: 'category_name',
    label: t('forms.category_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

const columns = (t:any) => [
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
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  const { data: categoriesData, isLoading } = useGetCategories({
    params: {
      category_name: searchTerm
    }
  });

  const fields = categoryFields(t);

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
    deleteCategory(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.categories') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.categories') })),
    });
  };

  return (
    <div className="container mx-auto py-6">
       <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.categories')}</h1>
        {/* <Button onClick={() => navigate('/create-recycling')}>
          {t('common.create')} {t('navigation.recyclings')}
        </Button> */}
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('placeholders.search_category')}
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <ResourceTable
        data={enhancedCategories}
        columns={columns(t)}
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
              // label: t(field.label),
              // placeholder: t(field.placeholder)
            }))}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingCategory || {}}
            isSubmitting={isUpdating}
            title={t('messages.edit',)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
