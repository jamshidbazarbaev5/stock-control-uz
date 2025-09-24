import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  ReceiptTemplate,
  ReceiptPreviewData,
  ReceiptComponent,
} from "../../types/receipt";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";

interface ReceiptPreviewProps {
  template: ReceiptTemplate;
  previewData: ReceiptPreviewData;
  isPreviewMode?: boolean;
  onComponentToggle?: (componentId: string) => void;
}

interface SortableComponentProps {
  component: ReceiptComponent;
  previewData: ReceiptPreviewData;
  isPreviewMode: boolean;
  onToggle?: (componentId: string) => void;
}

// Helper function to replace template variables with actual data
const replaceTemplateVars = (
  text: string,
  data: ReceiptPreviewData,
): string => {
  return text
    .replace(/\{\{storeName\}\}/g, data.storeName)
    .replace(/\{\{storeAddress\}\}/g, data.storeAddress)
    .replace(/\{\{storePhone\}\}/g, data.storePhone)
    .replace(/\{\{cashierName\}\}/g, data.cashierName)
    .replace(/\{\{receiptNumber\}\}/g, data.receiptNumber)
    .replace(/\{\{date\}\}/g, data.date)
    .replace(/\{\{time\}\}/g, data.time)
    .replace(/\{\{paymentMethod\}\}/g, data.paymentMethod)
    .replace(/\{\{change\}\}/g, data.change.toFixed(2))
    .replace(/\{\{qrCodeData\}\}/g, data.qrCodeData)
    .replace(/\{\{footerText\}\}/g, data.footerText);
};

// Component renderer for different receipt parts
const ComponentRenderer: React.FC<{
  component: ReceiptComponent;
  previewData: ReceiptPreviewData;
}> = ({ component, previewData }) => {
  if (!component.enabled) {
    return null;
  }

  const style: React.CSSProperties = {
    textAlign: component.styles.textAlign || "left",
    fontSize: component.styles.fontSize,
    fontFamily: component.styles.fontFamily,
    fontWeight: component.styles.fontWeight || "bold",
    fontStyle: component.styles.fontStyle || "normal",
    margin: component.styles.margin || "0",
    padding: component.styles.padding || "0",
    color: component.styles.color,
    backgroundColor: component.styles.backgroundColor,
    width: component.styles.width,
    height: component.styles.height,
    borderTop: component.styles.borderTop ? "1px solid #000" : "none",
    borderBottom: component.styles.borderBottom ? "1px solid #000" : "none",
  };

  switch (component.type) {
    case "logo":
      return (
        <div style={style} className="flex justify-center items-center">
          {component.data.url ? (
            <img
              src={component.data.url}
              alt="Logo"
              style={{
                width: component.styles.width || "150px",
                height: "auto",
                maxWidth: "100%",
              }}
              className="object-contain"
            />
          ) : (
            <div
              className="bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 text-xs"
              style={{
                width: component.styles.width || "150px",
                height: "50px",
              }}
            >
              LOGO
            </div>
          )}
        </div>
      );

    case "header":
      return (
        <h1 style={style}>
          {replaceTemplateVars(component.data.text || "", previewData)}
        </h1>
      );

    case "text":
      return (
        <div style={{ ...style, whiteSpace: "pre-wrap" }}>
          {replaceTemplateVars(component.data.text || "", previewData)}
        </div>
      );

   case "itemList":
  return (
    <div style={style}>
      {/* Remove [&_*]:!font-bold from here */}
      <table className="w-full text-xs">
        <thead>
          <tr>
            {/* Add inline style to each header */}
            <th className="text-left" style={{ fontWeight: "bold" }}>
              Item
            </th>
            <th className="text-center" style={{ fontWeight: "bold" }}>
              Qty
            </th>
            <th className="text-right" style={{ fontWeight: "bold" }}>
              Price
            </th>
            <th className="text-right" style={{ fontWeight: "bold" }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {previewData.items.map((item, index) => (
            <tr key={index}>
              {/* Add inline style to each cell */}
              <td className="text-left" style={{ fontWeight: "bold" }}>
                {item.name}
              </td>
              <td className="text-center" style={{ fontWeight: "bold" }}>
                {item.quantity}
              </td>
              <td className="text-right" style={{ fontWeight: "bold" }}>
                {item.price.toFixed(2)}
              </td>
              <td className="text-right" style={{ fontWeight: "bold" }}>
                {item.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
      return (
        <div style={style}>
          <table className="w-full text-xs print:!font-bold [&_*]:!font-bold" style={{ fontWeight: 700 }}>
            <thead>
              <tr>
                <th className="text-left print:!font-bold" style={{ fontWeight: 700 }}>
                  Item
                </th>
                <th className="text-center print:!font-bold" style={{ fontWeight: 700 }}>
                  Qty
                </th>
                <th className="text-right print:!font-bold" style={{ fontWeight: 700 }}>
                  Price
                </th>
                <th className="text-right print:!font-bold" style={{ fontWeight: 700 }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {previewData.items.map((item, index) => (
                <tr key={index}>
                  <td className="text-left print:!font-bold" style={{ fontWeight: 700 }}>
                    {item.name}
                  </td>
                  <td className="text-center print:!font-bold" style={{ fontWeight: 700 }}>
                    {item.quantity}
                  </td>
                  <td className="text-right print:!font-bold" style={{ fontWeight: 700 }}>
                    {item.price.toFixed(2)}
                  </td>
                  <td className="text-right print:!font-bold" style={{ fontWeight: 700 }}>
                    {item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "totals":
      return (
        <div style={style}>
          <div className="space-y-1 print:!font-bold [&_*]:!font-bold">
            <div
              className="flex justify-between print:!font-bold"
              style={{ fontWeight: 700 }}
            >
              <span style={{ fontWeight: 700 }}>Под итог:</span>
              <span style={{ fontWeight: 700 }}>${previewData.subtotal.toFixed(2)}</span>
            </div>
            {previewData.discount > 0 && (
              <div
                className="flex justify-between print:!font-bold"
                style={{ fontWeight: 700 }}
              >
                <span style={{ fontWeight: 700 }}>Скидка:</span>
                <span style={{ fontWeight: 700 }}>-{previewData.discount.toFixed(2)}</span>
              </div>
            )}
            <div
              className="flex justify-between print:!font-bold"
              style={{ fontWeight: 700 }}
            >
              <span style={{ fontWeight: 700 }}>Tax:</span>
              <span style={{ fontWeight: 700 }}>{previewData.tax.toFixed(2)}</span>
            </div>
            <div
              className="flex justify-between border-t pt-1 print:!font-bold"
              style={{ fontWeight: 700 }}
            >
              <span style={{ fontWeight: 700 }}>Итого:</span>
              <span style={{ fontWeight: 700 }}>{previewData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      );

    case "qrCode":
      return (
        <div style={style} className="flex justify-center">
          <div
            className="bg-gray-200 border border-gray-400 flex items-center justify-center text-gray-500 text-xs"
            style={{
              width: component.styles.width || "100px",
              height: component.styles.width || "100px",
            }}
          >
            QR CODE
          </div>
        </div>
      );

    case "footer":
      return (
        <div style={{ ...style, whiteSpace: "pre-wrap" }}>
          {replaceTemplateVars(component.data.text || "", previewData)}
        </div>
      );

    case "divider":
      return (
        <div style={style}>
          <hr className="border-t border-black" />
        </div>
      );

    case "spacer":
      return (
        <div
          style={{
            ...style,
            height:
              component.styles.height || component.styles.spacing || "20px",
          }}
        />
      );

    default:
      return null;
  }
};

// Sortable wrapper component for design mode
const SortableComponent: React.FC<SortableComponentProps> = ({
  component,
  previewData,
  isPreviewMode,
  onToggle,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: component.id,
    disabled: isPreviewMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isPreviewMode) {
    return (
      <ComponentRenderer component={component} previewData={previewData} />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${!component.enabled ? "opacity-50" : ""}`}
    >
      {/* Design mode controls */}
      <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1">
        <button
          {...attributes}
          {...listeners}
          className="p-1 bg-white border border-gray-300 rounded shadow-sm cursor-grab hover:bg-gray-50"
        >
          <GripVertical className="w-3 h-3 text-gray-500" />
        </button>
        {onToggle && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggle(component.id)}
            className="p-1 w-6 h-6"
          >
            {component.enabled ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>

      {/* Component content */}
      <div className={`${!component.enabled ? "opacity-50" : ""}`}>
        <ComponentRenderer component={component} previewData={previewData} />
      </div>

      {/* Component label overlay in design mode */}
      {!isPreviewMode && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl">
            {component.type}
          </div>
        </div>
      )}
    </div>
  );
};

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  template,
  previewData,
  isPreviewMode = false,
  onComponentToggle,
}) => {
  // Sort components by order
  const sortedComponents = [...template.style.components].sort(
    (a, b) => a.order - b.order,
  );

  const receiptStyle: React.CSSProperties = {
    fontFamily: template.style.styles.fontFamily,
    fontSize: template.style.styles.fontSize,
    backgroundColor: template.style.styles.backgroundColor,
    color: template.style.styles.textColor,
    width: template.style.styles.width,
    margin: template.style.styles.margin,
    padding: template.style.styles.padding,
    minHeight: "400px",
  };

  return (
    <div className="receipt-preview">
      <div
        className={`receipt-content border ${!isPreviewMode ? "border-dashed border-gray-300" : "border-gray-200"} bg-white p-4 mx-auto`}
        style={receiptStyle}
      >
        {sortedComponents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No components added yet</p>
            <p className="text-xs mt-1">
              Use the controls panel to add components
            </p>
          </div>
        ) : (
          sortedComponents.map((component) => (
            <SortableComponent
              key={component.id}
              component={component}
              previewData={previewData}
              isPreviewMode={isPreviewMode}
              onToggle={onComponentToggle}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ReceiptPreview;
