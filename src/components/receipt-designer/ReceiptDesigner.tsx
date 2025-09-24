import React, { useState, useCallback } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { arrayMove } from "@dnd-kit/sortable";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import ReceiptPreview from "./ReceiptPreview";
import DesignerControls from "./DesignerControls";
import PrintDialog from "./PrintDialog";
import { DEFAULT_TEMPLATE, DEFAULT_RECEIPT_DATA } from "../../types/receipt";
import type { ReceiptTemplate, ReceiptPreviewData } from "../../types/receipt";
import { Save, Download, Eye, Settings, Printer } from "lucide-react";
import api from "@/core/api/api";

interface ReceiptDesignerProps {
  initialTemplate?: ReceiptTemplate;
  previewData?: ReceiptPreviewData;
  onSave?: (template: ReceiptTemplate) => void;
}

const ReceiptDesigner: React.FC<ReceiptDesignerProps> = ({
  initialTemplate,
  previewData = DEFAULT_RECEIPT_DATA,
  onSave,
}) => {
  const [template, setTemplate] = useState<ReceiptTemplate>(
    initialTemplate || DEFAULT_TEMPLATE,
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const token = localStorage.getItem('access_token')
  // Handle component reordering via drag and drop
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setTemplate((prev) => {
      const components = [...prev.style.components];
      const oldIndex = components.findIndex((item) => item.id === active.id);
      const newIndex = components.findIndex((item) => item.id === over.id);

      const reorderedComponents = arrayMove(components, oldIndex, newIndex);

      // Update order property
      reorderedComponents.forEach((component, index) => {
        component.order = index;
      });

      return {
        ...prev,
        style: {
          ...prev.style,
          components: reorderedComponents,
        },
      };
    });
  }, []);

  // Save template to backend
  const handleSaveTemplate = async () => {
    setIsSaving(true);

    try {
     const response = await api.post('/receipt/template/',template)

      

      const result = await response.data
      toast.success("Template saved successfully!");

      if (onSave) {
        onSave(result);
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Export template as JSON
  const handleExportTemplate = () => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${template.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_template.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast.success("Template exported successfully!");
  };

  // Update template name
  const handleNameChange = (name: string) => {
    setTemplate((prev) => ({ ...prev, name }));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Receipt Designer
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Design and customize your receipt template
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>{isPreviewMode ? "Edit Mode" : "Preview Mode"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrintDialog(true)}
              className="flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportTemplate}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>

            <Button
              onClick={handleSaveTemplate}
              disabled={isSaving}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Template"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Preview */}
        <div className="w-2/5 bg-gray-100 p-6 overflow-y-auto">
          <Card className="w-full max-w-sm mx-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
                <Settings className="w-5 h-5 text-gray-500" />
              </div>

              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={template.style.components.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ReceiptPreview
                      template={template}
                      previewData={previewData}
                      isPreviewMode={isPreviewMode}
                    />
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </Card>
        </div>

        {/* Separator */}
        <Separator orientation="vertical" className="bg-gray-300" />

        {/* Right Panel - Controls */}
        <div className="w-3/5 bg-white overflow-y-auto">
          <DesignerControls
            template={template}
            setTemplate={setTemplate}
            onNameChange={handleNameChange}
            disabled={isPreviewMode}
          />
        </div>
      </div>

      {/* Print Dialog */}
      <PrintDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        template={template}
        previewData={previewData}
      />
    </div>
  );
};

export default ReceiptDesigner;
