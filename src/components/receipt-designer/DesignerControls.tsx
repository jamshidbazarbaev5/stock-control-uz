import React from "react";
import { useTranslation } from "react-i18next";
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
  MessageSquare,
  Minus,
  Space,
  Plus,
  Trash2,
  QrCode,
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
  const { t } = useTranslation();
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
      logo: { url: "", text: "" },
      header: { text: t("receiptDesignerControls.storeName") },
      text: { text: t("receiptDesignerControls.customText") },
      itemList: {},
      totals: {},
      qrCode: { qrData: "" },
      footer: { text: t("receiptDesignerControls.thankYouMessage") },
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
        width: "250px",
      },
      header: {
        fontSize: "16px",
        fontWeight: "bold" as const,
        textAlign: "center" as const,
        margin: "0 0 10px 0",
      },
      text: { fontSize: "11px", margin: "5px 0", fontWeight: "bold" as const },
      itemList: {
        fontSize: "10px",
        margin: "10px 0",
        fontWeight: "bold" as const,
      },
      totals: {
        fontSize: "11px",
        margin: "10px 0",
        fontWeight: "bold" as const,
      },
      footer: {
        fontSize: "10px",
        textAlign: "center" as const,
        margin: "10px 0 0 0",
      },
      qrCode: {
        textAlign: "center" as const,
        margin: "10px 0",
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
            <CardTitle>
              {t("receiptDesignerControls.templateSettings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="templateName">
                {t("receiptDesignerControls.templateName")}
              </Label>
              <Input
                id="templateName"
                value={template.name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={t("receiptDesignerControls.enterTemplateName")}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Global Styles */}
        <Card>
          <CardHeader>
            <CardTitle>{t("receiptDesignerControls.globalStyles")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fontSize">
                  {t("receiptDesignerControls.fontSize")}
                </Label>
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
                <Label htmlFor="fontFamily">
                  {t("receiptDesignerControls.fontFamily")}
                </Label>
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
                    <SelectItem value="monospace">
                      {t("receiptDesignerControls.monospace")}
                    </SelectItem>
                    <SelectItem value="Arial, sans-serif">
                      {t("receiptDesignerControls.arial")}
                    </SelectItem>
                    <SelectItem value="Times, serif">
                      {t("receiptDesignerControls.times")}
                    </SelectItem>
                    <SelectItem value="Courier New, monospace">
                      {t("receiptDesignerControls.courierNew")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="receiptWidth">
                {t("receiptDesignerControls.receiptWidth")}
              </Label>
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
                  <SelectItem value="250px">
                    {t("receiptDesignerControls.small")} (250px)
                  </SelectItem>
                  <SelectItem value="300px">
                    {t("receiptDesignerControls.medium")} (300px)
                  </SelectItem>
                  <SelectItem value="350px">
                    {t("receiptDesignerControls.large")} (350px)
                  </SelectItem>
                  <SelectItem value="400px">
                    {t("receiptDesignerControls.extraLarge")} (400px)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Components */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("receiptDesignerControls.receiptComponents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="components" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="components">
                  {t("receiptDesignerControls.components")}
                </TabsTrigger>
                <TabsTrigger value="add-new">
                  {t("receiptDesignerControls.addNew")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="components" className="space-y-4">
                {sortedComponents.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">
                      {t("receiptDesignerControls.noComponentsAdded")}
                    </p>
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
                              <Label>
                                {t("receiptDesignerControls.textContent")}
                              </Label>
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
                                placeholder={t(
                                  "receiptDesignerControls.enterTextContent",
                                )}
                                rows={3}
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
                                    <Label>
                                      {t("receiptDesignerControls.textAlign")}
                                    </Label>
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
                                          {t("receiptDesignerControls.left")}
                                        </SelectItem>
                                        <SelectItem value="center">
                                          {t("receiptDesignerControls.center")}
                                        </SelectItem>
                                        <SelectItem value="right">
                                          {t("receiptDesignerControls.right")}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label>
                                      {t("receiptDesignerControls.fontSize")}
                                    </Label>
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
                              <Label>
                                {t("receiptDesignerControls.margin")}
                              </Label>
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

                          {component.type === "logo" && (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>
                                    {t("receiptDesignerControls.width")}
                                  </Label>
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
                                <div>
                                  <Label>
                                    {t("receiptDesignerControls.height")}
                                  </Label>
                                  <Input
                                    value={component.styles.height || ""}
                                    onChange={(e) =>
                                      handleUpdateComponent(component.id, {
                                        styles: {
                                          ...component.styles,
                                          height: e.target.value,
                                        },
                                      })
                                    }
                                    placeholder="auto"
                                    disabled={disabled || !component.enabled}
                                  />
                                </div>
                              </div>
                              <div>
                                <Label>
                                  {t("receiptDesignerControls.presetSizes")}
                                </Label>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleUpdateComponent(component.id, {
                                        styles: {
                                          ...component.styles,
                                          width: "80px",
                                          height: "auto",
                                          textAlign:
                                            component.styles.textAlign ||
                                            "center",
                                        },
                                      })
                                    }
                                    disabled={disabled || !component.enabled}
                                  >
                                    Small
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleUpdateComponent(component.id, {
                                        styles: {
                                          ...component.styles,
                                          width: "150px",
                                          height: "auto",
                                          textAlign:
                                            component.styles.textAlign ||
                                            "center",
                                        },
                                      })
                                    }
                                    disabled={disabled || !component.enabled}
                                  >
                                    Medium
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleUpdateComponent(component.id, {
                                        styles: {
                                          ...component.styles,
                                          width: "250px",
                                          height: "auto",
                                          textAlign:
                                            component.styles.textAlign ||
                                            "center",
                                        },
                                      })
                                    }
                                    disabled={disabled || !component.enabled}
                                  >
                                    Large
                                  </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  {t(
                                    "receiptDesignerControls.dragCornerToResize",
                                  )}
                                </p>
                              </div>
                            </>
                          )}

                          {component.type === "spacer" && (
                            <div>
                              <Label>
                                {t("receiptDesignerControls.height")}
                              </Label>
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
                    <strong>{t("receiptDesigner.components.logo")}:</strong>{" "}
                    {t("receiptDesignerControls.componentDescriptions.logo")}
                  </p>
                  <p>
                    <strong>{t("receiptDesigner.components.header")}:</strong>{" "}
                    {t("receiptDesignerControls.componentDescriptions.header")}
                  </p>
                  <p>
                    <strong>{t("receiptDesigner.components.text")}:</strong>{" "}
                    {t("receiptDesignerControls.componentDescriptions.text")}
                  </p>
                  <p>
                    <strong>{t("receiptDesigner.components.itemList")}:</strong>{" "}
                    {t(
                      "receiptDesignerControls.componentDescriptions.itemList",
                    )}
                  </p>
                  <p>
                    <strong>{t("receiptDesigner.components.totals")}:</strong>{" "}
                    {t("receiptDesignerControls.componentDescriptions.totals")}
                  </p>

                  <p>
                    <strong>{t("receiptDesigner.components.footer")}:</strong>{" "}
                    {t("receiptDesignerControls.componentDescriptions.footer")}
                  </p>
                  <p>
                    <strong>{t("receiptDesigner.components.divider")}:</strong>{" "}
                    {t("receiptDesignerControls.componentDescriptions.divider")}
                  </p>
                  <p>
                    <strong>{t("receiptDesigner.components.spacer")}:</strong>{" "}
                    {t("receiptDesignerControls.componentDescriptions.spacer")}
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
