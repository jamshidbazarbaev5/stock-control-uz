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
import { Input } from "../ui/input";
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
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import type { ReceiptTemplate, ReceiptPreviewData } from "../../types/receipt";
import { ThermalPrinterService } from "../../services/thermalPrinter";
import {
  Printer,
  Usb,
  Wifi,
  Globe,
  Download,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

const thermalPrinterService = new ThermalPrinterService();

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ReceiptTemplate;
  previewData: ReceiptPreviewData;
}

type PrintMethod = "browser" | "usb" | "network" | "download";

interface PrinterSettings {
  networkIP: string;
  networkPort: number;
  paperWidth: number;
  baudRate: number;
  encoding: string;
}

const PrintDialog: React.FC<PrintDialogProps> = ({
  open,
  onOpenChange,
  template,
  previewData,
}) => {
  const [printMethod, setPrintMethod] = useState<PrintMethod>("browser");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connected" | "error"
  >("idle");
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    networkIP: "192.168.1.100",
    networkPort: 9100,
    paperWidth: 80,
    baudRate: 9600,
    encoding: "utf-8",
  });

  const printMethods = [
    {
      id: "browser" as const,
      title: "Browser Print",
      description: "Print using browser print dialog (recommended)",
      icon: Globe,
      supported: true,
    },
    {
      id: "usb" as const,
      title: "USB Printer",
      description: "Direct USB connection (Chrome with Web Serial API)",
      icon: Usb,
      supported: "serial" in navigator,
    },
    {
      id: "network" as const,
      title: "Network Printer",
      description: "Print via IP address (requires backend service)",
      icon: Wifi,
      supported: true,
    },
    {
      id: "download" as const,
      title: "Download Commands",
      description: "Download ESC/POS commands file",
      icon: Download,
      supported: true,
    },
  ];

  const handleTestConnection = async () => {
    setIsConnecting(true);
    setConnectionStatus("idle");

    try {
      switch (printMethod) {
        case "network":
          // Test network connection
          const response = await fetch(
            `http://${printerSettings.networkIP}:${printerSettings.networkPort}`,
            {
              method: "HEAD",
              mode: "no-cors",
            },
          );
          setConnectionStatus("connected");
          toast.success("Network printer connection successful");
          break;

        case "usb":
          if ("serial" in navigator) {
            const port = await (navigator as any).serial.requestPort();
            await port.open({ baudRate: printerSettings.baudRate });
            await port.close();
            setConnectionStatus("connected");
            toast.success("USB printer connection successful");
          } else {
            throw new Error("USB printing not supported");
          }
          break;

        default:
          setConnectionStatus("connected");
          toast.success("Connection test successful");
      }
    } catch (error) {
      setConnectionStatus("error");
      toast.error("Connection test failed: " + (error as Error).message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);

    try {
      switch (printMethod) {
        case "browser":
          thermalPrinterService.printViaBrowser(template, previewData);
          toast.success("Print dialog opened");
          break;

        case "usb":
          await thermalPrinterService.printViaUSB(template, previewData);
          toast.success("Printed to USB printer");
          break;

        case "network":
          await thermalPrinterService.printViaNetwork(
            template,
            previewData,
            printerSettings.networkIP,
            printerSettings.networkPort,
          );
          toast.success("Printed to network printer");
          break;

        case "download":
          thermalPrinterService.downloadCommands(
            template,
            previewData,
            `receipt-${Date.now()}.prn`,
          );
          toast.success("ESC/POS commands downloaded");
          break;
      }

      onOpenChange(false);
    } catch (error) {
      toast.error("Print failed: " + (error as Error).message);
    } finally {
      setIsPrinting(false);
    }
  };

  const updateSetting = <K extends keyof PrinterSettings>(
    key: K,
    value: PrinterSettings[K],
  ) => {
    setPrinterSettings((prev) => ({ ...prev, [key]: value }));
    setConnectionStatus("idle");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Printer className="w-5 h-5" />
            <span>Print Receipt</span>
          </DialogTitle>
          <DialogDescription>
            Choose your preferred printing method and configure settings
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Print Method Selection */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-3">Print Methods</h3>
            <div className="space-y-2">
              {printMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Card
                    key={method.id}
                    className={`cursor-pointer transition-colors ${
                      printMethod === method.id
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    } ${!method.supported ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() =>
                      method.supported && setPrintMethod(method.id)
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-sm">
                              {method.title}
                            </h4>
                            {!method.supported && (
                              <Badge variant="secondary" className="text-xs">
                                Not Supported
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Settings Panel */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Printer Settings</h3>
              {connectionStatus === "connected" && (
                <Badge
                  variant="default"
                  className="flex items-center space-x-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Connected</span>
                </Badge>
              )}
              {connectionStatus === "error" && (
                <Badge
                  variant="destructive"
                  className="flex items-center space-x-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>Connection Failed</span>
                </Badge>
              )}
            </div>

            <Tabs defaultValue="connection" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="connection">Connection</TabsTrigger>
                <TabsTrigger value="format">Format</TabsTrigger>
              </TabsList>

              <TabsContent value="connection" className="space-y-4">
                {printMethod === "network" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Network Settings
                      </CardTitle>
                      <CardDescription>
                        Configure network printer connection
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="networkIP">Printer IP Address</Label>
                          <Input
                            id="networkIP"
                            value={printerSettings.networkIP}
                            onChange={(e) =>
                              updateSetting("networkIP", e.target.value)
                            }
                            placeholder="192.168.1.100"
                          />
                        </div>
                        <div>
                          <Label htmlFor="networkPort">Port</Label>
                          <Input
                            id="networkPort"
                            type="number"
                            value={printerSettings.networkPort}
                            onChange={(e) =>
                              updateSetting(
                                "networkPort",
                                parseInt(e.target.value) || 9100,
                              )
                            }
                            placeholder="9100"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {printMethod === "usb" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">USB Settings</CardTitle>
                      <CardDescription>
                        Configure USB printer connection
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <Label htmlFor="baudRate">Baud Rate</Label>
                        <Select
                          value={printerSettings.baudRate.toString()}
                          onValueChange={(value) =>
                            updateSetting("baudRate", parseInt(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="9600">9600</SelectItem>
                            <SelectItem value="19200">19200</SelectItem>
                            <SelectItem value="38400">38400</SelectItem>
                            <SelectItem value="115200">115200</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {printMethod === "browser" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Browser Print</CardTitle>
                      <CardDescription>
                        This method will open the browser's print dialog
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>
                          • Make sure your thermal printer is set as default
                          printer
                        </p>
                        <p>
                          • Select the correct paper size (80mm) in print
                          settings
                        </p>
                        <p>• Disable headers/footers and margins</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {printMethod === "download" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Download Commands
                      </CardTitle>
                      <CardDescription>
                        Download raw ESC/POS commands for manual printing
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>• File will contain raw ESC/POS printer commands</p>
                        <p>
                          • Can be sent to printer using terminal or printer
                          utilities
                        </p>
                        <p>
                          • Useful for debugging and advanced printer setups
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="format" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Paper Settings</CardTitle>
                    <CardDescription>
                      Configure paper size and formatting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="paperWidth">Paper Width (mm)</Label>
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
                          <SelectItem value="58">58mm (2 inch)</SelectItem>
                          <SelectItem value="80">80mm (3 inch)</SelectItem>
                          <SelectItem value="112">112mm (4 inch)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="encoding">Character Encoding</Label>
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
                          <SelectItem value="utf-8">UTF-8</SelectItem>
                          <SelectItem value="windows-1252">
                            Windows-1252
                          </SelectItem>
                          <SelectItem value="iso-8859-1">ISO-8859-1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Preview</CardTitle>
                    <CardDescription>
                      Current template: {template.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        • Components:{" "}
                        {
                          template.style.components.filter((c) => c.enabled)
                            .length
                        }{" "}
                        enabled
                      </p>
                      <p>• Paper width: {printerSettings.paperWidth}mm</p>
                      <p>
                        • Print method:{" "}
                        {printMethods.find((m) => m.id === printMethod)?.title}
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
          <div className="flex items-center space-x-2">
            {(printMethod === "network" || printMethod === "usb") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isConnecting}
                className="flex items-center space-x-2"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4" />
                )}
                <span>Test Connection</span>
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePrint}
              disabled={
                isPrinting ||
                (printMethod !== "browser" &&
                  printMethod !== "download" &&
                  connectionStatus !== "connected")
              }
              className="flex items-center space-x-2"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>
                {isPrinting
                  ? "Printing..."
                  : printMethod === "download"
                    ? "Download"
                    : "Print"}
              </span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintDialog;
