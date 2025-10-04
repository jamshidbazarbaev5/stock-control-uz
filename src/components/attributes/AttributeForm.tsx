import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import type { Attribute } from "@/types/attribute";
import { useGetCategories, type Category } from "@/core/api/category";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const attributeFormSchema = z.object({
  name: z.string().min(1),
  category: z.number(),
  field_type: z.enum(["number", "string", "date", "boolean", "choice", "many2many"]),
  formula: z.string().optional(),
  choices: z.array(z.string()).optional(),
  related_model: z.string().optional(),
  translations: z.object({
    ru: z.string(),
  }),
});

type AttributeFormData = z.infer<typeof attributeFormSchema>;

interface AttributeFormProps {
  initialData?: Attribute;
  onSubmit: (data: AttributeFormData) => void;
  isLoading?: boolean;
}

export function AttributeForm({ initialData, onSubmit, isLoading }: AttributeFormProps) {
  const { t } = useTranslation();
  const { data: categoriesData } = useGetCategories();
  const form = useForm<AttributeFormData>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      category: initialData?.category || 1,
      field_type: initialData?.field_type || "string",
      formula: initialData?.formula || "",
      choices: initialData?.choices || [],
      related_model: initialData?.related_model || "",
      translations: {
        ru: initialData?.translations?.ru || ""
      },
    },
  });

  const fieldType = form.watch("field_type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Category")}</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select category")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || []).map((category: Category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id!.toString()}
                    >
                      {category.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="field_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Field Type")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select field type")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="string">{t("String")}</SelectItem>
                  <SelectItem value="number">{t("Number")}</SelectItem>
                  <SelectItem value="date">{t("Date")}</SelectItem>
                  <SelectItem value="boolean">{t("Boolean")}</SelectItem>
                  <SelectItem value="choice">{t("Choice")}</SelectItem>
                  <SelectItem value="many2many">{t("Many to Many")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {fieldType === "number" && (
          <FormField
            control={form.control}
            name="formula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Formula")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {fieldType === "choice" && (
          <FormField
            control={form.control}
            name="choices"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Choices")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value?.join(", ") || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value.split(",").map((choice) => choice.trim())
                      )
                    }
                    placeholder={t("Enter choices separated by commas")}
                  />
                </FormControl>
                <p className="text-sm text-muted-foreground">
                  {t("Enter each choice separated by commas (e.g., Red, Blue, Green)")}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {fieldType === "many2many" && (
          <FormField
            control={form.control}
            name="related_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Related Model")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="translations.ru"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Russian Translation")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("Saving...") : t("Save")}
        </Button>
      </form>
    </Form>
  );
}