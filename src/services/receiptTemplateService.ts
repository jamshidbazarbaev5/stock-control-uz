import type {
  ReceiptTemplate,
  ReceiptComponentData,
  ReceiptComponentStyles,
} from "../types/receipt";
import api from "../core/api/api";

export interface ApiReceiptTemplate {
  id: number;
  name: string;
  style: {
    style?: {
      styles: {
        width: string;
        margin: string;
        padding: string;
        fontSize: string;
        textColor: string;
        fontFamily: string;
        backgroundColor: string;
      };
    };
    styles?: {
      width: string;
      margin: string;
      padding: string;
      fontSize: string;
      textColor: string;
      fontFamily: string;
      backgroundColor: string;
    };
    components: Array<{
      id: string;
      data: ReceiptComponentData;
      type:
        | "logo"
        | "header"
        | "text"
        | "itemList"
        | "totals"
        | "footer"
        | "divider"
        | "spacer"
        | "qrCode";
      order: number;
      styles: ReceiptComponentStyles;
      enabled: boolean;
    }>;
  };
  created: string;
  is_used: boolean;
  store: number | null;
}

class ReceiptTemplateService {
  async getTemplates(): Promise<ApiReceiptTemplate[]> {
    try {
      const response = await api.get<ApiReceiptTemplate[]>("receipt/template/");
      console.log("API Response:", response.data);
      console.log("First template structure:", response.data[0]);
      return response.data;
    } catch (error) {
      console.error("Error fetching receipt templates:", error);
      throw error;
    }
  }

  async updateTemplateStatus(
    templateId: number,
    isUsed: boolean,
  ): Promise<void> {
    try {
      await api.patch(`receipt/template/${templateId}/`, {
        is_used: isUsed,
      });
    } catch (error) {
      console.error("Error updating template status:", error);
      throw error;
    }
  }

  async saveTemplate(
    template: Partial<ApiReceiptTemplate>,
  ): Promise<ApiReceiptTemplate> {
    try {
      const response = await api.post<ApiReceiptTemplate>(
        "receipt/template/",
        template,
      );
      return response.data;
    } catch (error) {
      console.error("Error saving template:", error);
      throw error;
    }
  }

  async updateTemplate(
    templateId: number,
    template: Partial<ApiReceiptTemplate>,
  ): Promise<ApiReceiptTemplate> {
    try {
      const response = await api.put<ApiReceiptTemplate>(
        `receipt/template/${templateId}/`,
        template,
      );
      return response.data;
    } catch (error) {
      console.error("Error updating template:", error);
      throw error;
    }
  }

  async deleteTemplate(templateId: number): Promise<void> {
    try {
      await api.delete(`receipt/template/${templateId}/`);
    } catch (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  }

  // Convert API format to internal format
  convertApiTemplateToInternal(
    apiTemplate: ApiReceiptTemplate,
  ): ReceiptTemplate {
    console.log("Converting API template:", apiTemplate);
    console.log("API template style:", apiTemplate.style);
    console.log("API template components:", apiTemplate.style?.components);

    // Handle the nested style structure from API
    const styles = apiTemplate.style?.style?.styles ||
      apiTemplate.style?.styles || {
        fontSize: "12px",
        fontFamily: "monospace",
        width: "300px",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        margin: "0",
        padding: "20px",
      };

    const components = Array.isArray(apiTemplate.style?.components)
      ? apiTemplate.style.components
      : [];

    console.log("Processed styles:", styles);
    console.log("Processed components:", components);

    return {
      id: apiTemplate.id.toString(),
      name: apiTemplate.name,
      style: {
        styles,
        components,
      },
      is_used: apiTemplate.is_used,
      created_at: apiTemplate.created,
    };
  }

  // Convert internal format to API format
  convertInternalTemplateToApi(
    template: ReceiptTemplate,
  ): Partial<ApiReceiptTemplate> {
    return {
      name: template.name,
      style: {
        styles: template.style.styles,
        components: template.style.components,
      },
      is_used: template.is_used,
    };
  }
}

export const receiptTemplateService = new ReceiptTemplateService();
