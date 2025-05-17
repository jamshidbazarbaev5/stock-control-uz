import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

// Update the FormField interface to be more specific about the field types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'file' | 'multiple-files';
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  required?: boolean;
  // validation?: (schema: z.ZodTypeAny) => z.ZodTypeAny;
  readOnly?: boolean;
  imageUrl?: string;
  preview?: string;
  existingImage?: string ;  // Add this new field
  onDeleteImage?: (imageId?: number) => void; // Function to handle image deletion
  existingImages?: Array<{ id?: number; url: string }>;
}

// Update the ResourceFormProps interface to be more specific about generic type T
interface ResourceFormProps<T extends Record<string, any>> {
  fields: any[]; // Revert back to using FormField[]
  onSubmit: (data: T) => void;
  defaultValues?: Partial<T>;
  isSubmitting?: boolean;
  title: string;
  hideSubmitButton?: boolean;
  children?: React.ReactNode;
  form?: ReturnType<typeof useForm<T>>;
}

export function ResourceForm<T extends Record<string, any>>({
  fields,
  onSubmit,
  defaultValues = {},
  isSubmitting = false,
  title,
  hideSubmitButton = false,
  children,
  form: providedForm,
}: ResourceFormProps<T>) {
  // Transform defaultValues to handle nested fields
  const transformedDefaultValues = fields.reduce((acc, field) => {
    if (field.name.includes('.')) {
      const [parent, child] = field.name.split('.');
      if (!acc[parent]) {
        acc[parent] = {};
      }
      acc[parent][child] = defaultValues[parent]?.[child] || '';
    } else {
      acc[field.name] = defaultValues[field.name] || '';
    }
    return acc;
  }, {} as Record<string, any>);

  const form = providedForm || useForm<T>({
    defaultValues: transformedDefaultValues,
  });

  const handleSubmit = (data: any) => {
    // Transform form data back to the expected structure
    const transformedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (typeof value === 'object' && value !== null && !(value instanceof File)) {
        acc[key] = value;
      } else {
        const keys = key.split('.');
        if (keys.length > 1) {
          const [parent, child] = keys;
          if (!acc[parent]) {
            acc[parent] = {};
          }
          acc[parent][child] = value;
        } else {
          acc[key] = value;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    onSubmit(transformedData as T);
  };

  const { setValue } = form;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{title}</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {fields.map((field) => (
            <FormField
              key={field.name}
              control={form.control}
              name={field.name}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>{field.label}</FormLabel>
                  <FormControl>
                    {field.type === 'textarea' ? (
                      <Textarea
                        placeholder={field.placeholder}
                        {...formField}
                        readOnly={field.readOnly}
                        className={field.readOnly ? 'bg-gray-100' : ''}
                      />
                    ) : field.type === 'select' ? (
                      <Select
                        onValueChange={formField.onChange}
                        defaultValue={String(formField.value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto bg-white rounded-md border shadow-md">
                          <div className="max-h-[200px] overflow-y-auto py-1">
                            {field.options?.map((option:any) => (
                              <SelectItem
                                key={option.value}
                                value={String(option.value)}
                                className="cursor-pointer hover:bg-gray-100 py-2 px-3"
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
                    ) : field.type === 'file' ? (
                      <div className="space-y-2">
                        {(field.preview || field.existingImage) && (
                          <div className="mb-2">
                            <img 
                              src={field.preview || field.existingImage} 
                              alt={field.label} 
                              className="h-20 w-20 object-cover rounded-md"
                            />
                          </div>
                        )}
                        <Input
                          type="file"
                          onChange={(e:any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setValue(field.name, file);
                            }
                          }}
                          required={field.required && !field.existingImage}
                          accept="image/*"
                        />
                      </div>
                    ) : field.type === 'multiple-files' ? (
                      <div className="space-y-2">
                        {/* Show existing images */}
                        {field.existingImages && field.existingImages.length > 0 && (
                          <div className="flex flex-wrap gap-4 mb-4">
                            {field.existingImages.map((img:any, idx:any) => (
                              <div key={img.id || idx} className="relative">
                                <img 
                                  src={img.url} 
                                  alt={`Image ${idx + 1}`} 
                                  className="h-20 w-20 object-cover rounded-md"
                                />
                                {field.onDeleteImage && (
                                  <button
                                    type="button"
                                    onClick={() => field.onDeleteImage(img.id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                                    aria-label="Delete image"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Multiple file input */}
                        <Input
                          type="file"
                          onChange={(e:any) => {
                            const files = Array.from(e.target.files || []);
                            const currentValues = form.getValues(field.name) || [];
                            form.setValue(field.name, [...currentValues, ...files] as any);
                          }}
                          multiple
                          accept="image/*"
                        />
                        
                        
                      </div>
                    ) : (
                      <Input
                        type={field.type}
                        placeholder={field.placeholder}
                        {...formField}
                        readOnly={field.readOnly}
                        className={field.readOnly ? 'bg-gray-100' : ''}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          
          {children}
          
          {!hideSubmitButton && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Отправка...' : 'Отправить'}
            </Button>
          )}
        </form>
      </Form>
    </div>
  );
}