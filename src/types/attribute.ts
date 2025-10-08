export type AttributeFieldType = 'number' | 'string' | 'date' | 'boolean' | 'choice' | 'many2many';

export interface AttributeTranslations {
  ru: string;
  [key: string]: string;
}

export interface Attribute {
  id?: number;
  name: string;
  field_type: AttributeFieldType;
  choices?: string[];
  formula?: string;
  translations: AttributeTranslations;
  related_model?: string;
  related_objects?: any;
}

export interface CreateAttributeDto extends Omit<Attribute, 'id'> {}
export interface UpdateAttributeDto extends Partial<CreateAttributeDto> {}