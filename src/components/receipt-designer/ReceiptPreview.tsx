import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  ReceiptTemplate,
  ReceiptPreviewData,
  ReceiptComponent,
} from "../../types/receipt";
import { GripVertical, Eye, EyeOff, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";

interface ReceiptPreviewProps {
  template: ReceiptTemplate;
  previewData: ReceiptPreviewData;
  isPreviewMode?: boolean;
  onComponentToggle?: (componentId: string) => void;
  onUpdateComponent?: (
    componentId: string,
    updates: Partial<ReceiptComponent>,
  ) => void;
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
  const paymentsText = data.payments
    .map((p) => `${p.method}: ${p.amount} UZS`)
    .join("\n");
  return text
    .replace(/\{\{storeName\}\}/g, data.storeName)
    .replace(/\{\{storeAddress\}\}/g, data.storeAddress)
    .replace(/\{\{storePhone\}\}/g, data.storePhone)
    .replace(/\{\{cashierName\}\}/g, data.cashierName)
    .replace(/\{\{receiptNumber\}\}/g, data.receiptNumber)
    .replace(/\{\{date\}\}/g, data.date)
    .replace(/\{\{time\}\}/g, data.time)
    .replace(/\{\{change\}\}/g, data.change.toLocaleString("ru-RU"))
    .replace(/\{\{footerText\}\}/g, data.footerText)
    .replace(/\{\{payments\}\}/g, paymentsText)
    .replace(/\{\{total\}\}/g, data.total.toLocaleString("ru-RU"));
};

// Props for our new ResizableImage component
interface ResizableImageProps {
  component: ReceiptComponent;
  isPreviewMode: boolean;
  onUpdateComponent?: (
    componentId: string,
    updates: Partial<ReceiptComponent>,
  ) => void;
}

// NEW: Component to handle interactive image resizing
const ResizableImage: React.FC<ResizableImageProps> = ({
  component,
  isPreviewMode,
  onUpdateComponent,
}) => {
  const imageRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    type: "se" | "e" | "s",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!imageRef.current || !onUpdateComponent || !imgRef.current) return;

    const startWidth = imageRef.current.offsetWidth;
    const startHeight = imgRef.current.offsetHeight;
    const startX = e.clientX;
    const startY = e.clientY;
    const aspectRatio = startWidth / startHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (type === "se") {
        // Proportional resize from corner
        const newWidthFromX = Math.max(50, Math.min(400, startWidth + dx));
        const newHeightFromY = Math.max(30, Math.min(300, startHeight + dy));

        // Use the dimension that changed more to maintain aspect ratio
        if (Math.abs(dx) > Math.abs(dy)) {
          newWidth = newWidthFromX;
          newHeight = newWidth / aspectRatio;
        } else {
          newHeight = newHeightFromY;
          newWidth = newHeight * aspectRatio;
        }
      } else if (type === "e") {
        // Width only resize
        newWidth = Math.max(50, Math.min(400, startWidth + dx));
        newHeight =
          component.styles.height === "auto" || !component.styles.height
            ? newWidth / aspectRatio
            : parseInt(component.styles.height) || startHeight;
      } else if (type === "s") {
        // Height only resize
        newHeight = Math.max(30, Math.min(300, startHeight + dy));
        newWidth =
          component.styles.width && component.styles.width !== "auto"
            ? parseInt(component.styles.width) || startWidth
            : newHeight * aspectRatio;
      }

      if (imageRef.current) {
        imageRef.current.style.width = `${newWidth}px`;
        if (imgRef.current) {
          imgRef.current.style.height =
            component.styles.height === "auto" || !component.styles.height
              ? "auto"
              : `${newHeight}px`;
        }
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (imageRef.current && imgRef.current) {
        const finalWidth = imageRef.current.style.width;
        const finalHeight =
          component.styles.height === "auto" || !component.styles.height
            ? "auto"
            : imgRef.current.style.height;

        onUpdateComponent(component.id, {
          styles: {
            ...component.styles,
            width: finalWidth,
            height: finalHeight,
          },
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const currentWidth = component.styles.width || "150px";
  const currentHeight = component.styles.height || "auto";

  return (
    <div
      ref={imageRef}
      className="relative group"
      style={{
        width: currentWidth,
        display: "block",
        minWidth: "50px",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      <img
        ref={imgRef}
        src={component.data.url}
        alt="Logo"
        style={{
          width: "100%",
          height: currentHeight,
          display: "block",
          pointerEvents: "none",
          objectFit: currentHeight === "auto" ? "contain" : "cover",
        }}
        className="rounded border shadow-sm"
        onLoad={() => {
          // Ensure the component reflects the actual image dimensions
          if (imageRef.current && imgRef.current && onUpdateComponent) {
            const rect = imageRef.current.getBoundingClientRect();
            if (
              rect.width > 0 &&
              (!component.styles.width || component.styles.width === "auto")
            ) {
              onUpdateComponent(component.id, {
                styles: {
                  ...component.styles,
                  width: `${Math.min(rect.width, 150)}px`,
                },
              });
            }
          }
        }}
      />
      {/* Resizing Handles - only show in edit mode */}
      {!isPreviewMode && (
        <>
          {/* Corner resize handle (proportional) */}
          <div
            onMouseDown={(e) => handleMouseDown(e, "se")}
            className="absolute -right-1 -bottom-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-se-resize opacity-60 group-hover:opacity-100 transition-all duration-200 hover:scale-110 z-10"
            title="Drag to resize proportionally"
          />

          {/* Width resize handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, "e")}
            className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-6 bg-blue-400 border border-white rounded cursor-e-resize opacity-0 group-hover:opacity-80 transition-all duration-200 hover:opacity-100 z-10"
            title="Drag to resize width"
          />

          {/* Height resize handle (only if height is not auto) */}
          {currentHeight !== "auto" && (
            <div
              onMouseDown={(e) => handleMouseDown(e, "s")}
              className="absolute left-1/2 -bottom-1 transform -translate-x-1/2 w-6 h-3 bg-blue-400 border border-white rounded cursor-s-resize opacity-0 group-hover:opacity-80 transition-all duration-200 hover:opacity-100 z-10"
              title="Drag to resize height"
            />
          )}

          {/* Visual indicator for resize */}
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-300 transition-colors duration-200 rounded pointer-events-none" />

          {/* Size indicator */}
          <div className="absolute -bottom-8 left-0 right-0 text-center">
            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {currentWidth} × {currentHeight}
            </span>
          </div>

          {/* Instructions tooltip */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-90 transition-opacity whitespace-nowrap">
              Drag corners/edges to resize
            </span>
          </div>
        </>
      )}
    </div>
  );
};

// Component renderer for different receipt parts
const ComponentRenderer: React.FC<{
  component: ReceiptComponent;
  previewData: ReceiptPreviewData;
  isPreviewMode: boolean;
  onUpdateComponent?: (
    componentId: string,
    updates: Partial<ReceiptComponent>,
  ) => void;
}> = ({ component, previewData, isPreviewMode, onUpdateComponent }) => {
  if (!component.enabled) {
    return null;
  }

  const style: React.CSSProperties = {
    textAlign:
      component.type === "logo"
        ? component.styles.textAlign || "center"
        : component.styles.textAlign || "left",
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

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/gif,image/webp";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert("File size must be less than 5MB");
          return;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
          alert("Please select a valid image file");
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (onUpdateComponent) {
            onUpdateComponent(component.id, { data: { url: dataUrl } });
          }
        };
        reader.onerror = () => {
          alert("Error reading file. Please try again.");
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  switch (component.type) {
    case "logo":
      return (
        <div style={style} className="w-full flex justify-center">
          {component.data.url ? (
            <div className="relative">
              {!isPreviewMode && (
                <div className="absolute -top-4 left-0 right-0 text-center z-20">
                  {/* <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                    Click to change • Drag corner to resize
                  </span> */}
                </div>
              )}
              <ResizableImage
                component={component}
                isPreviewMode={isPreviewMode}
                onUpdateComponent={onUpdateComponent}
              />
              {/* Upload button - always visible in edit mode */}
              {!isPreviewMode && (
                <button
                  className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full shadow-lg transition-colors z-10"
                  onClick={handleImageUpload}
                  title="Change image"
                >
                  <Upload className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="relative inline-block">
              {!isPreviewMode && (
                <div className="absolute -top-4 left-0 right-0 text-center z-20">
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                    Upload your logo here
                  </span>
                </div>
              )}
              <div
                className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-blue-600 text-xs cursor-pointer hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 transition-all duration-200 rounded-lg shadow-sm"
                style={{
                  width: component.styles.width || "250px",
                  height: "80px",
                }}
                onClick={handleImageUpload}
              >
                <div className="bg-blue-500 p-2 rounded-full mb-2">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold">Click to Upload Logo</span>
                <span className="text-xs text-blue-500 mt-1">
                  JPG, PNG, GIF, WEBP (Max 5MB)
                </span>
              </div>
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
          <table className="w-full text-xs">
            <thead>
              <tr>
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

    case "totals":
      return (
        <div style={style}>
          <div className="space-y-1">
            {(previewData.discount ?? 0) > 0 && (
              <div
                className="flex justify-between"
                style={{ fontWeight: "bold" }}
              >
                <span style={{ fontWeight: "bold" }}>Discount:</span>
                <span style={{ fontWeight: "bold" }}>
                  -${(previewData.discount ?? 0).toFixed(2)}
                </span>
              </div>
            )}
            <div
              className="flex justify-between border-t pt-1"
              style={{ fontWeight: "bold" }}
            >
              <span style={{ fontWeight: "bold" }}>Total:</span>
              <span style={{ fontWeight: "bold" }}>
                ${previewData.total.toFixed(2)}
              </span>
            </div>
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
const SortableComponent: React.FC<
  SortableComponentProps & {
    onUpdateComponent?: (
      componentId: string,
      updates: Partial<ReceiptComponent>,
    ) => void;
  }
> = ({
  component,
  previewData,
  isPreviewMode,
  onToggle,
  onUpdateComponent,
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
      <ComponentRenderer
        component={component}
        previewData={previewData}
        isPreviewMode={isPreviewMode}
        onUpdateComponent={onUpdateComponent}
      />
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
        <ComponentRenderer
          component={component}
          previewData={previewData}
          isPreviewMode={isPreviewMode}
          onUpdateComponent={onUpdateComponent}
        />
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
  onUpdateComponent,
}) => {
  const { t } = useTranslation();
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
            <p className="text-sm">{t("receiptDesigner.noComponents")}</p>
            <p className="text-xs mt-1">
              {t("receiptDesigner.useControlsPanel")}
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
              onUpdateComponent={onUpdateComponent}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ReceiptPreview;
