export type AttributeFieldType = 'number' | 'string' | 'date' | 'boolean' | 'choice' | 'many2many';

export interface AttributeTranslations {
  ru: string;
  [key: string]: string;
}

export interface Attribute {
  id?: number;
  name: string;
  category: number;
  field_type: AttributeFieldType;
  formula?: string;
  choices?: string[];
  related_model?: string;
  translations: AttributeTranslations;
}

export interface CreateAttributeDto extends Omit<Attribute, 'id'> {}
export interface UpdateAttributeDto extends Partial<CreateAttributeDto> {}