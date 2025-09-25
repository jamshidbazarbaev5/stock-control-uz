import type {
  ReceiptTemplate,
  ReceiptPreviewData,
  ReceiptComponent,
} from "../types/receipt";

// Web Serial API interface
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: WritableStream<Uint8Array>;
}

interface NavigatorSerial {
  serial: {
    requestPort(): Promise<SerialPort>;
  };
}

// ESC/POS Commands
const ESC = "\x1B";
const GS = "\x1D";

export class ThermalPrinterService {
  private commands: string[] = [];

  // Text formatting commands
  private static readonly COMMANDS = {
    INIT: ESC + "@",
    BOLD_ON: ESC + "E" + "\x01",
    BOLD_OFF: ESC + "E" + "\x00",
    UNDERLINE_ON: ESC + "-" + "\x01",
    UNDERLINE_OFF: ESC + "-" + "\x00",
    ALIGN_LEFT: ESC + "a" + "\x00",
    ALIGN_CENTER: ESC + "a" + "\x01",
    ALIGN_RIGHT: ESC + "a" + "\x02",
    SIZE_NORMAL: GS + "!" + "\x00",
    SIZE_DOUBLE_WIDTH: GS + "!" + "\x10",
    SIZE_DOUBLE_HEIGHT: GS + "!" + "\x01",
    SIZE_DOUBLE_BOTH: GS + "!" + "\x11",
    CUT_PAPER: GS + "V" + "\x01",
    LINE_FEED: "\x0A",
    CARRIAGE_RETURN: "\x0D",
    DRAWER_OPEN: ESC + "p" + "\x00" + "\x19" + "\xFA",
  };

  constructor() {
    this.reset();
  }

  private reset(): void {
    this.commands = [ThermalPrinterService.COMMANDS.INIT];
  }

  private addCommand(command: string): void {
    this.commands.push(command);
  }

  private addText(text: string): void {
    this.commands.push(text);
  }

  private addLineBreak(): void {
    this.addCommand(ThermalPrinterService.COMMANDS.LINE_FEED);
  }

  private setAlignment(align: "left" | "center" | "right"): void {
    switch (align) {
      case "left":
        this.addCommand(ThermalPrinterService.COMMANDS.ALIGN_LEFT);
        break;
      case "center":
        this.addCommand(ThermalPrinterService.COMMANDS.ALIGN_CENTER);
        break;
      case "right":
        this.addCommand(ThermalPrinterService.COMMANDS.ALIGN_RIGHT);
        break;
    }
  }

  private setBold(enabled: boolean): void {
    this.addCommand(
      enabled
        ? ThermalPrinterService.COMMANDS.BOLD_ON
        : ThermalPrinterService.COMMANDS.BOLD_OFF,
    );
  }

  private setFontSize(
    size: "normal" | "double-width" | "double-height" | "double-both",
  ): void {
    switch (size) {
      case "normal":
        this.addCommand(ThermalPrinterService.COMMANDS.SIZE_NORMAL);
        break;
      case "double-width":
        this.addCommand(ThermalPrinterService.COMMANDS.SIZE_DOUBLE_WIDTH);
        break;
      case "double-height":
        this.addCommand(ThermalPrinterService.COMMANDS.SIZE_DOUBLE_HEIGHT);
        break;
      case "double-both":
        this.addCommand(ThermalPrinterService.COMMANDS.SIZE_DOUBLE_BOTH);
        break;
    }
  }

  private addSeparatorLine(width: number = 32, char: string = "-"): void {
    this.addText(char.repeat(width));
    this.addLineBreak();
  }

  private formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  // private padString(
  //   text: string,
  //   width: number,
  //   padChar: string = " ",
  // ): string {
  //   if (text.length >= width) return text.substring(0, width);
  //   return text + padChar.repeat(width - text.length);
  // }

  private lineWrap(text: string, width: number): string[] {
    if (text.length <= width) return [text];

    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if ((currentLine + " " + word).length <= width) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is longer than width, force break
          lines.push(word.substring(0, width));
          currentLine = word.substring(width);
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private justifyText(left: string, right: string, width: number = 32): string {
    const totalLength = left.length + right.length;
    if (totalLength >= width) {
      return left.substring(0, width - right.length) + right;
    }
    const padding = " ".repeat(width - totalLength);
    return left + padding + right;
  }

  // Replace template variables with actual data
  private replaceVariables(text: string, data: ReceiptPreviewData): string {
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
      .replace(/\{\{qrCodeData\}\}/g, data.qrCodeData || "")
      .replace(/\{\{footerText\}\}/g, data.footerText);
  }

  public generateReceiptCommands(
    template: ReceiptTemplate,
    data: ReceiptPreviewData,
  ): string {
    this.reset();

    // Sort components by order
    const sortedComponents = [...template.style.components]
      .filter((component) => component.enabled)
      .sort((a, b) => a.order - b.order);

    // Process each component
    sortedComponents.forEach((component) => {
      this.processComponent(component, data);
    });

    // Add final paper cut
    this.addCommand(ThermalPrinterService.COMMANDS.CUT_PAPER);

    return this.commands.join("");
  }

  private processComponent(
    component: ReceiptComponent,
    data: ReceiptPreviewData,
  ): void {
    // Set alignment
    if (component.styles.textAlign) {
      this.setAlignment(component.styles.textAlign);
    }

    // Set bold
    if (component.styles.fontWeight === "bold") {
      this.setBold(true);
    }

    switch (component.type) {
      case "logo":
        this.processLogo(component, data);
        break;
      case "header":
        this.processHeader(component, data);
        break;
      case "text":
        this.processText(component, data);
        break;
      case "itemList":
        this.processItemList(component, data);
        break;
      case "totals":
        this.processTotals(component, data);
        break;
      case "qrCode":
        this.processQRCode(component, data);
        break;
      case "footer":
        this.processFooter(component, data);
        break;
      case "divider":
        this.processDivider();
        break;
      case "spacer":
        this.processSpacer(component);
        break;
    }

    // Reset formatting
    this.setBold(false);
    this.setAlignment("left");
    this.setFontSize("normal");
  }

  private processLogo(
    component: ReceiptComponent,
    data: ReceiptPreviewData,
  ): void {
    // For text-based logo (thermal printers typically can't print images directly)
    const logoText = this.replaceVariables(
      component.data.text || data.storeName,
      data,
    );
    this.setFontSize("double-both");
    this.setBold(true);
    this.addText(logoText);
    this.addLineBreak();
    this.addLineBreak();
  }

  private processHeader(
    component: ReceiptComponent,
    data: ReceiptPreviewData,
  ): void {
    const headerText = this.replaceVariables(component.data.text || "", data);
    this.setFontSize("double-width");
    this.setBold(true);
    this.addText(headerText);
    this.addLineBreak();
  }

  private processText(
    component: ReceiptComponent,
    data: ReceiptPreviewData,
  ): void {
    const text = this.replaceVariables(component.data.text || "", data);
    this.setBold(true);
    const lines = text.split("\n");
    lines.forEach((line) => {
      this.addText(line);
      this.addLineBreak();
    });
  }

  private processItemList(
    _component: ReceiptComponent,
    data: ReceiptPreviewData,
  ): void {
    const width = 32; // For your 58mm printer
    this.addSeparatorLine(width, "-");

    data.items.forEach((item) => {
      const total = this.formatCurrency(item.total);

      // Calculate the space available for the item name
      const availableNameWidth = width - total.length - 1; // -1 for a space buffer

      // Wrap the item name to fit within that available space
      const wrappedNameLines = this.lineWrap(item.name, availableNameWidth);

      // Print the first line of the name justified with the total
      this.addText(this.justifyText(wrappedNameLines[0] || "", total, width));
      this.addLineBreak();

      // If the name wrapped, print the subsequent lines
      if (wrappedNameLines.length > 1) {
        for (let i = 1; i < wrappedNameLines.length; i++) {
          this.addText(wrappedNameLines[i]);
          this.addLineBreak();
        }
      }
    });

    this.addSeparatorLine(width, "-");
  }
  private processTotals(
    _component: ReceiptComponent,
    data: ReceiptPreviewData,
  ): void {
    this.setBold(true);
    const totalsData = [
      { label: "Subtotal:", value: this.formatCurrency(data.subtotal) },
      ...(data.discount > 0
        ? [
            {
              label: "Discount:",
              value: `-${this.formatCurrency(data.discount)}`,
            },
          ]
        : []),
      { label: "Tax:", value: this.formatCurrency(data.tax) },
    ];

    totalsData.forEach((total) => {
      this.addText(this.justifyText(total.label, total.value, 32));
      this.addLineBreak();
    });

    this.addSeparatorLine(32, "=");
    this.addText(
      this.justifyText("TOTAL:", this.formatCurrency(data.total), 32),
    );
    this.addLineBreak();
    this.addSeparatorLine(32, "=");
  }

  private processQRCode(
    component: ReceiptComponent,
    data: ReceiptPreviewData,
  ): void {
    // Most thermal printers support QR code printing via specific commands
    const qrData = this.replaceVariables(
      component.data.qrData || data.qrCodeData || "",
      data,
    );

    // QR Code ESC/POS command (varies by printer model)
    // This is a generic implementation - adjust based on your printer model
    this.setAlignment("center");
    this.addCommand(`${GS}(k\x04\x00\x01A2\x00`); // QR Code model
    this.addCommand(`${GS}(k\x03\x00\x01C\x05`); // QR Code size
    this.addCommand(`${GS}(k\x03\x00\x01E0`); // Error correction level

    // Store QR data
    const qrDataLength = qrData.length + 3;
    const lengthLow = String.fromCharCode(qrDataLength & 0xff);
    const lengthHigh = String.fromCharCode((qrDataLength >> 8) & 0xff);
    this.addCommand(`${GS}(k${lengthLow}${lengthHigh}\x01P0${qrData}`);

    // Print QR Code
    this.addCommand(`${GS}(k\x03\x00\x01Q0`);
    this.addLineBreak();
    this.addLineBreak();
  }

  private processFooter(
    component: ReceiptComponent,
    data: ReceiptPreviewData,
  ): void {
    const footerText = this.replaceVariables(component.data.text || "", data);
    this.setBold(true);
    const lines = footerText.split("\n");
    lines.forEach((line) => {
      this.addText(line);
      this.addLineBreak();
    });
  }

  private processDivider(): void {
    this.addSeparatorLine(32, "-");
  }

  private processSpacer(component: ReceiptComponent): void {
    // Add empty lines based on height
    const height =
      component.styles.height || component.styles.spacing || "20px";
    const lines = Math.max(1, Math.floor(parseInt(height) / 10)); // Rough conversion
    for (let i = 0; i < lines; i++) {
      this.addLineBreak();
    }
  }

  // Print methods for different interfaces
  public async printViaUSB(
    template: ReceiptTemplate,
    data: ReceiptPreviewData,
  ): Promise<void> {
    const commands = this.generateReceiptCommands(template, data);

    try {
      // This would require native USB access - typically handled by a desktop app or service
      if ("serial" in navigator) {
        // Web Serial API (Chrome only, requires user permission)
        const port = await (navigator as NavigatorSerial).serial.requestPort();
        await port.open({ baudRate: 9600 });

        const writer = port.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(commands));
        writer.releaseLock();
        await port.close();
      } else {
        throw new Error("USB printing not supported in this browser");
      }
    } catch (error) {
      console.error("USB printing failed:", error);
      throw error;
    }
  }

  public async printViaNetwork(
    template: ReceiptTemplate,
    data: ReceiptPreviewData,
    printerIP: string,
    port: number = 9100,
  ): Promise<void> {
    const commands = this.generateReceiptCommands(template, data);

    try {
      // Send to network printer via backend service
      const response = await fetch("/api/print/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commands: Array.from(commands).map((c) => c.charCodeAt(0)),
          printerIP,
          port,
        }),
      });

      if (!response.ok) {
        throw new Error("Network printing failed");
      }
    } catch (error) {
      console.error("Network printing failed:", error);
      throw error;
    }
  }

  public printViaBrowser(
    template: ReceiptTemplate,
    data: ReceiptPreviewData,
  ): void {
    // Generate HTML for browser printing with thermal printer CSS
    const html = this.generatePrintHTML(template, data);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      throw new Error("Could not open print window");
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  public generatePrintHTML(
    template: ReceiptTemplate,
    data: ReceiptPreviewData,
  ): string {
    const sortedComponents = [...template.style.components]
      .filter((component) => component.enabled)
      .sort((a, b) => a.order - b.order);

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt Print</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body { margin: 0; }
          }

          body {
            font-family: ${template.style.styles.fontFamily || "'Courier New', monospace"};
            font-size: ${template.style.styles.fontSize || "12px"};
            line-height: 1.2;
            width: 80mm;
            margin: 0;
            padding: 2mm;
            color: black;
            background: white;
          }

          .receipt-header {
            text-align: center;
            font-weight: bold;
            margin-bottom: 5mm;
          }

          .receipt-logo {
            text-align: center;
            font-weight: bold;
            margin-bottom: 3mm;
          }

          .receipt-text {
            margin: 2mm 0;
          }

          .receipt-items table {
            width: 100%;
            border-collapse: collapse;
          }

          .receipt-items th,
          .receipt-items td {
            padding: 1mm;
            text-align: left;
            vertical-align: top; /* Ensures alignment */
          }

          .item-name {
            word-break: break-all; /* This forces long words to wrap */
          }

          .receipt-items th {
            border-bottom: 1px solid black;
            font-weight: bold;
          }

          .receipt-totals {
            margin-top: 3mm;
            border-top: 1px solid black;
            padding-top: 2mm;
          }

          .receipt-total-line {
            display: flex;
            justify-content: space-between;
            margin: 1mm 0;
          }

          .receipt-total-final {
            font-weight: bold;
            border-top: 2px solid black;
            padding-top: 2mm;
            margin-top: 2mm;
          }

          .receipt-footer {
            text-align: center;
            margin-top: 5mm;
          }

          .receipt-divider {
            border-top: 1px dashed black;
            margin: 3mm 0;
          }

          .receipt-spacer {
            margin: 5mm 0;
          }
            .item-name {
            word-break: break-all; /* This forces long words to wrap */
          }
          .total-column {
            width: 35%; /* Reserve space for the total */
            white-space: nowrap; /* Prevent total from wrapping */
            vertical-align: top;
          }

          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
    `;

    sortedComponents.forEach((component) => {
      html += this.generateComponentHTML(component, data);
    });

    html += `
      </body>
      </html>
    `;

    return html;
  }

  private generateComponentHTML(
    component: ReceiptComponent,
    data: ReceiptPreviewData,
  ): string {
    const alignment = component.styles.textAlign || "left";
    const alignmentClass = `text-${alignment}`;
    const boldClass = component.styles.fontWeight === "bold" ? "bold" : "";
    const fontSize = component.styles.fontSize || "12px";
    const fontFamily =
      component.styles.fontFamily || "'Courier New', monospace";
    const fontWeight = component.styles.fontWeight || "normal";
    const color = component.styles.color || "black";
    const margin = component.styles.margin || "0";
    const padding = component.styles.padding || "0";

    const inlineStyles = `font-size: ${fontSize}; font-family: ${fontFamily}; font-weight: ${fontWeight}; color: ${color}; margin: ${margin}; padding: ${padding};`;

    switch (component.type) {
      case "logo": {
        const logoAlignmentClass = `text-${component.styles.textAlign || "center"}`;
        // If an image was uploaded, render an <img> tag
        if (component.data.url) {
          return `
            <div class="receipt-logo ${logoAlignmentClass}">
              <img
                src="${component.data.url}"
                alt="Logo"
                style="width: ${
                  component.styles.width || "150px"
                }; max-width: 100%; height: auto;"
              />
            </div>
          `;
        }
        // Fallback to text if no image exists
        const logoText = this.replaceVariables(
          component.data.text || data.storeName,
          data,
        );
        const logoBoldClass =
          component.styles.fontWeight === "bold" ? "bold" : "";
        return `<div class="receipt-logo ${logoAlignmentClass} ${logoBoldClass}" style="${inlineStyles}">${logoText}</div>`;
      }

      case "header": {
        const headerText = this.replaceVariables(
          component.data.text || "",
          data,
        );
        return `<div class="receipt-header ${alignmentClass} ${boldClass}" style="${inlineStyles}">${headerText}</div>`;
      }

      case "text": {
        const text = this.replaceVariables(component.data.text || "", data);
        return `<div class="receipt-text ${alignmentClass} ${boldClass}" style="${inlineStyles}">${text.replace(/\n/g, "<br>")}</div>`;
      }

      // ... inside the generateComponentHTML method

      case "itemList": {
        let itemsHTML = `<div class="receipt-items" style="${inlineStyles}"><table><thead><tr><th style="text-align: left;" colspan="2">Item</th><th style="text-align: right;" colspan="2">Total</th></tr></thead><tbody>`;

        data.items.forEach((item) => {
          // Row 1: The item name, spanning the full width
          itemsHTML += `<tr><td colspan="4" class="item-name bold">${item.name}</td></tr>`;

          // Row 2: Details on the left, total on the right
          const details = `${item.quantity} x ${this.formatCurrency(item.price)}`;
          // const total = this.formatCurrency(item.total);

          itemsHTML += `<tr>
            <td colspan="2" class="bold" style="text-align: left; padding-left: 8px;">${details}</td>
          </tr>`;
        });

        itemsHTML += "</tbody></table></div>";
        return itemsHTML;
      }

      // ... inside the generateComponentHTML method in thermalPrinterService.ts

      case "totals": {
        // Use a <pre> tag to ensure whitespace is respected, which is key for our manual alignment.
        // We'll also apply bold styling directly here.
        let totalsHTML = `<div class="receipt-totals"><pre style="font-family: ${fontFamily}; font-weight: bold; font-size: ${fontSize}; margin: 0; padding: 0;">`;

        // Character width for 80mm paper is typically around 42.
        const printWidth = 32;

        // Use the justifyText helper to create each line with perfect alignment.
        totalsHTML +=
          this.justifyText(
            "Subtotal:",
            this.formatCurrency(data.subtotal),
            printWidth,
          ) + "\n";

        if (data.discount > 0) {
          totalsHTML +=
            this.justifyText(
              "Discount:",
              `-${this.formatCurrency(data.discount)}`,
              printWidth,
            ) + "\n";
        }

        totalsHTML +=
          this.justifyText("Tax:", this.formatCurrency(data.tax), printWidth) +
          "\n";

        // Add a separator line for clarity.
        totalsHTML += "=".repeat(printWidth) + "\n";

        totalsHTML += this.justifyText(
          "TOTAL:",
          this.formatCurrency(data.total),
          printWidth,
        );

        totalsHTML += "</pre></div>";
        return totalsHTML;
      }

      // ... rest of the method

      case "qrCode":
        return `<div class="${alignmentClass}"><div style="width: 100px; height: 100px; border: 1px solid black; margin: auto; display: flex; align-items: center; justify-content: center; font-size: 8px;">QR CODE</div></div>`;

      case "footer": {
        const footerText = this.replaceVariables(
          component.data.text || "",
          data,
        );
        return `<div class="receipt-footer ${alignmentClass} ${boldClass}" style="${inlineStyles}">${footerText.replace(/\n/g, "<br>")}</div>`;
      }

      case "divider":
        return '<div class="receipt-divider"></div>';

      case "spacer":
        return '<div class="receipt-spacer"></div>';

      default:
        return "";
    }
  }

  // Utility method to get raw ESC/POS commands as byte array
  public getCommandsAsBytes(
    template: ReceiptTemplate,
    data: ReceiptPreviewData,
  ): number[] {
    const commands = this.generateReceiptCommands(template, data);
    return Array.from(commands).map((char) => char.charCodeAt(0));
  }

  // Method to save commands to file (for debugging)
  public downloadCommands(
    template: ReceiptTemplate,
    data: ReceiptPreviewData,
    filename: string = "receipt-commands.prn",
  ): void {
    const commands = this.generateReceiptCommands(template, data);
    const blob = new Blob([commands], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export default new ThermalPrinterService();

// Test function to verify font size handling
export function testFontSizeHandling() {
  const testTemplate: any = {
    id: "test",
    name: "Test Template",
    style: {
      styles: {
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
      },
      components: [
        {
          id: "test-header",
          type: "header",
          order: 0,
          enabled: true,
          data: { text: "Test Header" },
          styles: {
            fontSize: "18px",
            fontWeight: "bold",
            textAlign: "center",
          },
        },
        {
          id: "test-text",
          type: "text",
          order: 1,
          enabled: true,
          data: { text: "Test text with custom font size" },
          styles: {
            fontSize: "16px",
            fontWeight: "normal",
            textAlign: "left",
          },
        },
      ],
    },
  };

  const testData: ReceiptPreviewData = {
    storeName: "Test Store",
    storeAddress: "123 Test St",
    storePhone: "555-0123",
    cashierName: "Test Cashier",
    receiptNumber: "TEST-001",
    date: "2024-01-01",
    time: "12:00",
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    paymentMethod: "Cash",
    change: 0,
    qrCodeData: "test",
    footerText: "Thank you!",
  };

  const service = new ThermalPrinterService();
  const html = service.generatePrintHTML(testTemplate, testData);

  console.log("Generated HTML with font sizes:", html);

  // Check if font sizes are applied
  const hasHeaderFontSize = html.includes("font-size: 18px");
  const hasTextFontSize = html.includes("font-size: 16px");
  const hasGlobalFontSize = html.includes("font-size: 14px");

  console.log("Header font size applied:", hasHeaderFontSize);
  console.log("Text font size applied:", hasTextFontSize);
  console.log("Global font size applied:", hasGlobalFontSize);

  return { hasHeaderFontSize, hasTextFontSize, hasGlobalFontSize };
}
