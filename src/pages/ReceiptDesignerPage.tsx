import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ReceiptDesigner from "../components/receipt-designer/ReceiptDesigner";
import { DEFAULT_TEMPLATE, DEFAULT_RECEIPT_DATA } from "../types/receipt";
import type { ReceiptTemplate } from "../types/receipt";

const ReceiptDesignerPage: React.FC = () => {
  const { t } = useTranslation();
  const [, setSavedTemplates] = useState<ReceiptTemplate[]>([]);

  const handleSaveTemplate = (template: ReceiptTemplate) => {
    // In a real app, this would be handled by the backend
    setSavedTemplates((prev) => {
      const existingIndex = prev.findIndex((t) => t.id === template.id);
      if (existingIndex >= 0) {
        // Update existing template
        const updated = [...prev];
        updated[existingIndex] = template;
        return updated;
      } else {
        // Add new template
        return [...prev, { ...template, id: Date.now().toString() }];
      }
    });

    toast.success(t("receiptDesigner.templateSavedSuccessfully"));
    console.log("Template saved:", template);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ReceiptDesigner
        initialTemplate={DEFAULT_TEMPLATE}
        previewData={DEFAULT_RECEIPT_DATA}
        onSave={handleSaveTemplate}
      />
    </div>
  );
};

export default ReceiptDesignerPage;
