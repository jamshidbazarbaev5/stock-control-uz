import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import type { Attribute } from "@/types/attribute";
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
  // const { data: categoriesData } = useGetCategories();
  const form = useForm<AttributeFormData>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      // category: initialData?.category || 1,
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
              <FormLabel>{t("forms.name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/*<FormField*/}
        {/*  control={form.control}*/}
        {/*  name="category"*/}
        {/*  render={({ field }) => (*/}
        {/*    <FormItem>*/}
        {/*      <FormLabel>{t("forms.category")}</FormLabel>*/}
        {/*      <Select*/}
        {/*        onValueChange={(value) => field.onChange(Number(value))}*/}
        {/*        value={field.value?.toString()}*/}
        {/*      >*/}
        {/*        <FormControl>*/}
        {/*          <SelectTrigger>*/}
        {/*            <SelectValue placeholder={t("placeholders.select_category")} />*/}
        {/*          </SelectTrigger>*/}
        {/*        </FormControl>*/}
        {/*        <SelectContent>*/}
        {/*          {(Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || []).map((category: Category) => (*/}
        {/*            <SelectItem*/}
        {/*              key={category.id}*/}
        {/*              value={category.id!.toString()}*/}
        {/*            >*/}
        {/*              {category.category_name}*/}
        {/*            </SelectItem>*/}
        {/*          ))}*/}
        {/*        </SelectContent>*/}
        {/*      </Select>*/}
        {/*      <FormMessage />*/}
        {/*    </FormItem>*/}
        {/*  )}*/}
        {/*/>*/}

        <FormField
          control={form.control}
          name="field_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("forms.field_type")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("placeholders.select_field_type")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="string">{t("forms.field_types.string")}</SelectItem>
                  <SelectItem value="number">{t("forms.field_types.number")}</SelectItem>
                  <SelectItem value="date">{t("forms.field_types.date")}</SelectItem>
                  <SelectItem value="boolean">{t("forms.field_types.boolean")}</SelectItem>
                  <SelectItem value="choice">{t("forms.field_types.choice")}</SelectItem>
                  <SelectItem value="many2many">{t("forms.field_types.many_to_many")}</SelectItem>
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
                <FormLabel>{t("forms.formula")}</FormLabel>
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
                <FormLabel>{t("forms.choices")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value?.join(", ") || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value.split(",").map((choice) => choice.trim())
                      )
                    }
                    placeholder={t("placeholders.enter_choices_separated_by_commas")}
                  />
                </FormControl>
                <p className="text-sm text-muted-foreground">
                  {t("forms.choices_help_text")}
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
                <FormLabel>{t("forms.related_model")}</FormLabel>
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
              <FormLabel>{t("forms.russian_translation")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("common.saving") : t("common.save")}
        </Button>
      </form>
    </Form>
  );
}