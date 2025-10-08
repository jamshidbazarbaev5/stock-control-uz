import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { type Category, useGetCategories, useUpdateCategory } from '../api/category';
import { useGetAttributes } from '../api/attribute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';


const columns = (t: any) => [
  {
    header: t('forms.category_name'),
    accessorKey: 'category_name',
  },
  {
    header: t('forms.attributes'),
    accessorKey: 'attributes_read',
    cell: (row: any) => {
      const category = row;
      const attributesRead = category?.attributes_read || [];
      
      // Debug logging
      console.log('Category:', category?.category_name, 'Attributes:', attributesRead);
      
      if (!attributesRead || attributesRead.length === 0) {
        return <span className="text-gray-400">-</span>;
      }
      
      return (
        <div className="space-y-1">
          {attributesRead.map((attr: any, index: number) => (
            <div key={attr.id || index} className="text-sm">
              <span className="font-medium">
                {attr.translations?.ru || attr.name || 'Unknown'}
              </span>
              <span className="text-gray-500 ml-1">
                ({attr.field_type || 'unknown'})
              </span>
              {attr.field_type === 'choice' && attr.choices && attr.choices.length > 0 && (
                <div className="text-xs text-gray-400 ml-2">
                  [{attr.choices.join(', ')}]
                </div>
              )}
            </div>
          ))}
        </div>
      );
    },
  },
];

// Removed CategoryResponse type as we handle response dynamically

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editSelectedAttributes, setEditSelectedAttributes] = useState<number[]>([]);
  
  const { t } = useTranslation();
  const { data: categoriesData, isLoading } = useGetCategories({
    params: {
      category_name: searchTerm
    }
  });
  const { data: attributes = [], isLoading: attributesLoading } = useGetAttributes();

    // Debug the raw API response
  console.log('Raw categoriesData:', categoriesData);

  // Get the categories array from the paginated response
  // Handle both direct array and paginated response formats
  let categories: Category[] = [];
  if (categoriesData) {
    if (Array.isArray(categoriesData)) {
      categories = categoriesData;
    } else if ((categoriesData as any).results) {
      categories = (categoriesData as any).results;
    } else {
      categories = [];
    }
  }
  
  // Debug the extracted categories
  console.log('Extracted categories:', categories);

  // Enhance categories with display ID
  const enhancedCategories = categories.map((category: Category, index: number) => ({
    ...category,
    displayId: index + 1
  }));

  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();
  // const { mutate: deleteCategory } = useDeleteCategory();

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryName(category.category_name);
    // Extract attribute IDs from attributes_read for editing
    const attributeIds = category.attributes_read?.map(attr => attr.id!).filter(id => id !== undefined) || [];
    setEditSelectedAttributes(attributeIds);
    setIsFormOpen(true);
  };

  const handleAttributeChange = (attributeId: number, checked: boolean) => {
    if (checked) {
      setEditSelectedAttributes(prev => [...prev, attributeId]);
    } else {
      setEditSelectedAttributes(prev => prev.filter(id => id !== attributeId));
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.id) return;

    const updateData: Category = {
      ...editingCategory,
      category_name: editCategoryName,
      attributes: editSelectedAttributes.length > 0 ? editSelectedAttributes : undefined,
    };

    updateCategory(updateData, {
      onSuccess: () => {
        toast.success(t('messages.success.updated', { item: t('navigation.categories') }));
        setIsFormOpen(false);
        setEditingCategory(null);
        setEditCategoryName('');
        setEditSelectedAttributes([]);
      },
      onError: () => toast.error(t('messages.error.update', { item: t('navigation.categories') })),
    });
  };

  // const handleDelete = (id: number) => {
  //   deleteCategory(id, {
  //     onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.categories') })),
  //     onError: () => toast.error(t('messages.error.delete', { item: t('navigation.categories') })),
  //   });
  // };

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
        // onDelete={handleDelete}
        onAdd={() => navigate('/create-category')}
        totalCount={enhancedCategories.length}
        pageSize={30}
        currentPage={1}
        onPageChange={() => {}}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">{t('messages.edit')} {t('navigation.categories')}</h2>
            
            <form onSubmit={handleUpdateSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit_category_name">{t('forms.category_name')} *</Label>
                <Input
                  id="edit_category_name"
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder={t('placeholders.enter_name')}
                  required
                />
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">{t('forms.attributes')}</Label>
                {attributesLoading ? (
                  <div className="text-sm text-gray-500">{t('common.loading')}...</div>
                ) : attributes && attributes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {attributes.map((attribute) => (
                      <div key={attribute.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-attribute-${attribute.id}`}
                          checked={editSelectedAttributes.includes(attribute.id!)}
                          onCheckedChange={(checked) => 
                            handleAttributeChange(attribute.id!, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`edit-attribute-${attribute.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {attribute.translations?.ru || attribute.name} 
                          <span className="text-gray-500 ml-1">({attribute.field_type})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">{t('messages.no_data')}</div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? t('common.updating') : t('common.update')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingCategory(null);
                    setEditCategoryName('');
                    setEditSelectedAttributes([]);
                  }}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
