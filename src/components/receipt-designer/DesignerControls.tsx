import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import type { ReceiptTemplate, ReceiptComponent } from "../../types/receipt";
import {
  Type,
  Image,
  List,
  Calculator,
  QrCode,
  MessageSquare,
  Minus,
  Space,
  Plus,
  Trash2,
} from "lucide-react";

interface DesignerControlsProps {
  template: ReceiptTemplate;
  setTemplate: React.Dispatch<React.SetStateAction<ReceiptTemplate>>;
  onNameChange: (name: string) => void;
  disabled?: boolean;
}

const componentIcons = {
  logo: Image,
  header: Type,
  text: MessageSquare,
  itemList: List,
  totals: Calculator,
  qrCode: QrCode,
  footer: MessageSquare,
  divider: Minus,
  spacer: Space,
};

const DesignerControls: React.FC<DesignerControlsProps> = ({
  template,
  setTemplate,
  onNameChange,
  disabled = false,
}) => {
  // Toggle component visibility
  const handleToggleComponent = (componentId: string) => {
    if (disabled) return;

    setTemplate((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        components: prev.style.components.map((comp) =>
          comp.id === componentId ? { ...comp, enabled: !comp.enabled } : comp,
        ),
      },
    }));
  };

  // Update component data
  const handleUpdateComponent = (
    componentId: string,
    updates: Partial<ReceiptComponent>,
  ) => {
    if (disabled) return;

    setTemplate((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        components: prev.style.components.map((comp) =>
          comp.id === componentId ? { ...comp, ...updates } : comp,
        ),
      },
    }));
  };

  // Update global styles
  const handleUpdateGlobalStyles = (
    updates: Partial<typeof template.style.styles>,
  ) => {
    if (disabled) return;

    setTemplate((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        styles: {
          ...prev.style.styles,
          ...updates,
        },
      },
    }));
  };

  // Add new component
  const handleAddComponent = (type: ReceiptComponent["type"]) => {
    if (disabled) return;

    const newComponent: ReceiptComponent = {
      id: `${type}_${Date.now()}`,
      type,
      data: getDefaultData(type),
      styles: getDefaultStyles(type),
      enabled: true,
      order: template.style.components.length,
    };

    setTemplate((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        components: [...prev.style.components, newComponent],
      },
    }));
  };

  // Remove component
  const handleRemoveComponent = (componentId: string) => {
    if (disabled) return;

    setTemplate((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        components: prev.style.components.filter(
          (comp) => comp.id !== componentId,
        ),
      },
    }));
  };

  // Get default data for component type
  const getDefaultData = (type: ReceiptComponent["type"]) => {
    const defaults = {
      logo: { url: "", text: "{{storeName}}" },
      header: { text: "{{storeName}}" },
      text: { text: "Custom text here..." },
      itemList: {},
      totals: {},
      qrCode: { qrData: "{{qrCodeData}}" },
      footer: { text: "Thank you for your business!" },
      divider: {},
      spacer: {},
    };
    return defaults[type] || {};
  };

  // Get default styles for component type
  const getDefaultStyles = (type: ReceiptComponent["type"]) => {
    const defaults = {
      logo: {
        textAlign: "center" as const,
        margin: "0 0 10px 0",
        width: "150px",
      },
      header: {
        fontSize: "16px",
        fontWeight: "bold" as const,
        textAlign: "center" as const,
        margin: "0 0 10px 0",
      },
      text: { fontSize: "11px", margin: "5px 0", fontWeight: "bold" as const, },
      itemList: { fontSize: "10px", margin: "10px 0", fontWeight: "bold" as const, },
      totals: { fontSize: "11px", margin: "10px 0" , fontWeight: "bold" as const,},
      qrCode: {
        textAlign: "center" as const,
        margin: "10px 0",
        width: "100px",
      },
      footer: {
        fontSize: "10px",
        textAlign: "center" as const,
        margin: "10px 0 0 0",
      },
      divider: { margin: "10px 0" },
      spacer: { height: "20px" },
    };
    return defaults[type] || {};
  };

  const sortedComponents = [...template.style.components].sort(
    (a, b) => a.order - b.order,
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Template Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Template Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={template.name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Enter template name"
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Global Styles */}
        <Card>
          <CardHeader>
            <CardTitle>Global Styles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fontSize">Font Size</Label>
                <Select
                  value={template.style.styles.fontSize}
                  onValueChange={(value) =>
                    handleUpdateGlobalStyles({ fontSize: value })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10px">10px</SelectItem>
                    <SelectItem value="11px">11px</SelectItem>
                    <SelectItem value="12px">12px</SelectItem>
                    <SelectItem value="14px">14px</SelectItem>
                    <SelectItem value="16px">16px</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={template.style.styles.fontFamily}
                  onValueChange={(value) =>
                    handleUpdateGlobalStyles({ fontFamily: value })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monospace">Monospace</SelectItem>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Times, serif">Times</SelectItem>
                    <SelectItem value="Courier New, monospace">
                      Courier New
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="receiptWidth">Receipt Width</Label>
              <Select
                value={template.style.styles.width}
                onValueChange={(value) =>
                  handleUpdateGlobalStyles({ width: value })
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="250px">Small (250px)</SelectItem>
                  <SelectItem value="300px">Medium (300px)</SelectItem>
                  <SelectItem value="350px">Large (350px)</SelectItem>
                  <SelectItem value="400px">Extra Large (400px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Components */}
        <Card>
          <CardHeader>
            <CardTitle>Receipt Components</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="components" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="components">Components</TabsTrigger>
                <TabsTrigger value="add-new">Add New</TabsTrigger>
              </TabsList>

              <TabsContent value="components" className="space-y-4">
                {sortedComponents.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">No components added yet</p>
                  </div>
                ) : (
                  sortedComponents.map((component) => {
                    const IconComponent = componentIcons[component.type];
                    return (
                      <Card
                        key={component.id}
                        className={`${!component.enabled ? "opacity-60" : ""}`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <IconComponent className="w-4 h-4" />
                              <span className="font-medium capitalize">
                                {component.type}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={component.enabled}
                                onCheckedChange={() =>
                                  handleToggleComponent(component.id)
                                }
                                disabled={disabled}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleRemoveComponent(component.id)
                                }
                                disabled={disabled}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          {/* Component-specific controls */}
                          {(component.type === "header" ||
                            component.type === "text" ||
                            component.type === "footer") && (
                            <div>
                              <Label>Text Content</Label>
                              <Textarea
                                value={component.data.text || ""}
                                onChange={(e) =>
                                  handleUpdateComponent(component.id, {
                                    data: {
                                      ...component.data,
                                      text: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Enter text content"
                                rows={3}
                                disabled={disabled || !component.enabled}
                              />
                            </div>
                          )}

                          {component.type === "logo" && (
                            <div>
                              <Label>Logo URL</Label>
                              <Input
                                value={component.data.url || ""}
                                onChange={(e) =>
                                  handleUpdateComponent(component.id, {
                                    data: {
                                      ...component.data,
                                      url: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Enter logo image URL"
                                disabled={disabled || !component.enabled}
                              />
                            </div>
                          )}

                          {/* Style controls */}
                          <div className="grid grid-cols-2 gap-3">
                            {component.type !== "divider" &&
                              component.type !== "spacer" && (
                                <>
                                  <div>
                                    <Label>Text Align</Label>
                                    <Select
                                      value={
                                        component.styles.textAlign || "left"
                                      }
                                      onValueChange={(value) =>
                                        handleUpdateComponent(component.id, {
                                          styles: {
                                            ...component.styles,
                                            textAlign: value as
                                              | "left"
                                              | "center"
                                              | "right",
                                          },
                                        })
                                      }
                                      disabled={disabled || !component.enabled}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="left">
                                          Left
                                        </SelectItem>
                                        <SelectItem value="center">
                                          Center
                                        </SelectItem>
                                        <SelectItem value="right">
                                          Right
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label>Font Size</Label>
                                    <Select
                                      value={
                                        component.styles.fontSize ||
                                        template.style.styles.fontSize
                                      }
                                      onValueChange={(value) =>
                                        handleUpdateComponent(component.id, {
                                          styles: {
                                            ...component.styles,
                                            fontSize: value,
                                          },
                                        })
                                      }
                                      disabled={disabled || !component.enabled}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="8px">8px</SelectItem>
                                        <SelectItem value="9px">9px</SelectItem>
                                        <SelectItem value="10px">
                                          10px
                                        </SelectItem>
                                        <SelectItem value="11px">
                                          11px
                                        </SelectItem>
                                        <SelectItem value="12px">
                                          12px
                                        </SelectItem>
                                        <SelectItem value="14px">
                                          14px
                                        </SelectItem>
                                        <SelectItem value="16px">
                                          16px
                                        </SelectItem>
                                        <SelectItem value="18px">
                                          18px
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </>
                              )}
                          </div>

                          {component.type !== "divider" && (
                            <div>
                              <Label>Margin</Label>
                              <Input
                                value={component.styles.margin || "0"}
                                onChange={(e) =>
                                  handleUpdateComponent(component.id, {
                                    styles: {
                                      ...component.styles,
                                      margin: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g., 10px 0"
                                disabled={disabled || !component.enabled}
                              />
                            </div>
                          )}

                          {(component.type === "logo" ||
                            component.type === "qrCode") && (
                            <div>
                              <Label>Width</Label>
                              <Input
                                value={component.styles.width || ""}
                                onChange={(e) =>
                                  handleUpdateComponent(component.id, {
                                    styles: {
                                      ...component.styles,
                                      width: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g., 150px"
                                disabled={disabled || !component.enabled}
                              />
                            </div>
                          )}

                          {component.type === "spacer" && (
                            <div>
                              <Label>Height</Label>
                              <Input
                                value={
                                  component.styles.height ||
                                  component.styles.spacing ||
                                  "20px"
                                }
                                onChange={(e) =>
                                  handleUpdateComponent(component.id, {
                                    styles: {
                                      ...component.styles,
                                      height: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g., 20px"
                                disabled={disabled || !component.enabled}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="add-new" className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(componentIcons).map(
                    ([type, IconComponent]) => (
                      <Button
                        key={type}
                        variant="outline"
                        onClick={() =>
                          handleAddComponent(type as ReceiptComponent["type"])
                        }
                        disabled={disabled}
                        className="flex items-center justify-start space-x-2 h-10"
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="capitalize">{type}</span>
                        <Plus className="w-4 h-4 ml-auto" />
                      </Button>
                    ),
                  )}
                </div>

                <Separator />

                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    <strong>Logo:</strong> Store logo image
                  </p>
                  <p>
                    <strong>Header:</strong> Main title/heading
                  </p>
                  <p>
                    <strong>Text:</strong> Custom text block
                  </p>
                  <p>
                    <strong>Item List:</strong> Product items table
                  </p>
                  <p>
                    <strong>Totals:</strong> Order totals section
                  </p>
                  <p>
                    <strong>QR Code:</strong> QR code for receipt
                  </p>
                  <p>
                    <strong>Footer:</strong> Bottom message
                  </p>
                  <p>
                    <strong>Divider:</strong> Horizontal line
                  </p>
                  <p>
                    <strong>Spacer:</strong> Empty space
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesignerControls;
