import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import type { ReceiptTemplate, ReceiptPreviewData } from "../../types/receipt";
import { ThermalPrinterService } from "../../services/thermalPrinter";
import { Printer, Globe, Download, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const thermalPrinterService = new ThermalPrinterService();

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ReceiptTemplate;
  previewData: ReceiptPreviewData;
}

interface PrinterSettings {
  paperWidth: number;
  encoding: string;
}

const PrintDialog: React.FC<PrintDialogProps> = ({
  open,
  onOpenChange,
  template,
  previewData,
}) => {
  const { t } = useTranslation();
  const [isPrinting, setIsPrinting] = useState(false);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    paperWidth: 58, // Default to 58mm as requested
    encoding: "utf-8", // Default to UTF-8 as requested
  });

  const handlePrint = async () => {
    setIsPrinting(true);

    try {
      // Always use browser print as requested
      thermalPrinterService.printViaBrowser(template, previewData);
      toast.success(t("receiptDesigner.printDialog.printDialogOpened"));
      onOpenChange(false);
    } catch (error) {
      toast.error(
        t("receiptDesigner.printDialog.printFailed") +
          ": " +
          (error as Error).message,
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async () => {
    try {
      thermalPrinterService.downloadCommands(
        template,
        previewData,
        `receipt-${Date.now()}.prn`,
      );
      toast.success(t("receiptDesigner.printDialog.commandsDownloaded"));
    } catch (error) {
      toast.error(
        t("receiptDesigner.printDialog.printFailed") +
          ": " +
          (error as Error).message,
      );
    }
  };

  const updateSetting = <K extends keyof PrinterSettings>(
    key: K,
    value: PrinterSettings[K],
  ) => {
    setPrinterSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Printer className="w-5 h-5" />
            <span>{t("receiptDesigner.printDialog.title")}</span>
          </DialogTitle>
          <DialogDescription>
            {t("receiptDesigner.printDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Browser Print Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>{t("receiptDesigner.printDialog.browserPrint")}</span>
              </CardTitle>
              <CardDescription>
                {t("receiptDesigner.printDialog.browserPrintDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  •{" "}
                  {
                    t(
                      "receiptDesigner.printDialog.browserPrintInstructions",
                    ).split("\n")[0]
                  }
                </p>
                <p>
                  •{" "}
                  {
                    t(
                      "receiptDesigner.printDialog.browserPrintInstructions",
                    ).split("\n")[1]
                  }
                </p>
                <p>
                  •{" "}
                  {
                    t(
                      "receiptDesigner.printDialog.browserPrintInstructions",
                    ).split("\n")[2]
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Settings Panel */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              {t("receiptDesigner.printDialog.printerSettings")}
            </h3>

            <Tabs defaultValue="format" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="format">
                  {t("receiptDesigner.printDialog.format")}
                </TabsTrigger>
                <TabsTrigger value="preview">
                  {t("receiptDesigner.preview")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="format" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("receiptDesigner.printDialog.paperSettings")}
                    </CardTitle>
                    <CardDescription>
                      {t(
                        "receiptDesigner.printDialog.paperSettingsDescription",
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="paperWidth">
                        {t("receiptDesigner.printDialog.paperWidth")}
                      </Label>
                      <Select
                        value={printerSettings.paperWidth.toString()}
                        onValueChange={(value) =>
                          updateSetting("paperWidth", parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="58">
                            {t("receiptDesigner.paperSizes.58mm")}
                          </SelectItem>
                          <SelectItem value="80">
                            {t("receiptDesigner.paperSizes.80mm")}
                          </SelectItem>
                          <SelectItem value="112">
                            {t("receiptDesigner.paperSizes.112mm")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="encoding">
                        {t("receiptDesigner.printDialog.characterEncoding")}
                      </Label>
                      <Select
                        value={printerSettings.encoding}
                        onValueChange={(value) =>
                          updateSetting("encoding", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utf-8">
                            {t("receiptDesigner.encodings.utf8")}
                          </SelectItem>
                          <SelectItem value="windows-1252">
                            {t("receiptDesigner.encodings.windows1252")}
                          </SelectItem>
                          <SelectItem value="iso-8859-1">
                            {t("receiptDesigner.encodings.iso88591")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("receiptDesigner.printDialog.currentTemplate")}:{" "}
                      {template.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        • {t("receiptDesigner.printDialog.components")}:{" "}
                        {
                          template.style.components.filter((c) => c.enabled)
                            .length
                        }{" "}
                        {t("receiptDesigner.printDialog.enabled")}
                      </p>
                      <p>
                        • {t("receiptDesigner.printDialog.paperWidth")}:{" "}
                        {printerSettings.paperWidth}mm
                      </p>
                      <p>
                        • {t("receiptDesigner.printDialog.characterEncoding")}:{" "}
                        {printerSettings.encoding.toUpperCase()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleDownload}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{t("receiptDesigner.printDialog.downloadCommands")}</span>
          </Button>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("receiptDesigner.printDialog.cancel")}
            </Button>
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center space-x-2"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>
                {isPrinting
                  ? t("receiptDesigner.printDialog.printing")
                  : t("receiptDesigner.print")}
              </span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintDialog;
