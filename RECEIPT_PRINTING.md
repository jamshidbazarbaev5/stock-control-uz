# Receipt Printing System

This document describes the automatic receipt printing system implemented for the POS interface.

## Overview

The system automatically prints receipts after successful sales using **user-defined templates** from the API combined with a **Node.js thermal printer service**. The frontend fetches the active template (`is_used: true`) from the API, sends it along with sale data to the Node.js service, which interprets the template and converts it to ESC/POS commands for the H-58C thermal printer. Fully automatic - no browser printing, no user interaction!

## Architecture

### Components

1. **SaleReceiptService** (`src/services/saleReceiptService.ts`)
   - Handles receipt printing logic
   - Communicates with Node.js thermal printer service
   - Shows user notifications
   - No browser fallback - thermal only

2. **POSInterface** (`src/components/POSInterface.tsx`)
   - Integrates receipt printing after successful sales
   - Automatically triggers printing without user interaction
   - Handles printing errors gracefully

3. **Template Manager** (`src/components/receipt-designer/TemplateManager.tsx`)
   - UI for managing receipt templates
   - Users can create, edit, and activate templates
   - Mark template as active with `is_used: true`

4. **Thermal Printer Service** (`thermal-printer-service/server.js`)
   - Node.js service that interprets user templates
   - Converts template components to ESC/POS commands
   - Communicates directly with H-58C thermal printer
   - Supports macOS system printer fallback

## How It Works

### 1. Template System

Users can design custom receipt templates via the Template Manager. Each template contains:

**Global Styles:**
- Width, margin, padding
- Font size, font family, text color
- Background color

**Components (in order):**
- **logo**: Display store logo (converted to text placeholder on thermal)
- **text**: Custom text with variable replacement ({{storeName}}, {{receiptNumber}}, etc.)
- **divider**: Horizontal separator line
- **itemList**: Automatic listing of all sale items
- **totals**: Subtotal and total amounts
- **footer**: Thank you message

**Template Variables:**
- `{{storePhone}}` - Store phone number
- `{{storeName}}` - Store name
- `{{storeAddress}}` - Store address
- `{{receiptNumber}}` - Sale/receipt ID
- `{{date}}` - Sale date
- `{{time}}` - Sale time
- `{{cashierName}}` - Cashier/worker name
- `{{paymentMethod}}` - Payment methods used
- `{{change}}` - Change amount
- `{{footerText}}` - Footer text
- `{{total}}` - Total amount

**Component Styles:**
- `textAlign`: left, center, right
- `fontWeight`: normal, bold
- `fontSize`: Size in px
- `margin`: Spacing
- `enabled`: Show/hide component

The active template (`is_used: true`) is automatically fetched and used for all sales.

### 2. Printing Flow

```
Sale Completed
    ↓
Frontend fetches active template from API (is_used: true)
    ↓
Frontend sends SaleData + Template to Node.js (localhost:3001)
    ↓
Node.js interprets template components
    ↓
Node.js converts to ESC/POS commands:
  - text → printer.println()
  - divider → printer.drawLine()
  - itemList → loop items with formatting
  - totals → bold, large text
  - textAlign center → printer.alignCenter()
  - fontWeight bold → printer.bold(true)
    ↓
Send to H-58C Thermal Printer
    ↓
    ├─ Success → Show success notification
    └─ Failed → Try macOS system printer
              ↓
              ├─ Success → Show success notification
              └─ Failed → Show error notification
```

**Note:** No browser printing! Template is interpreted by Node.js and converted to thermal printer commands.

## Usage

### In POSInterface

After a successful sale:

```typescript
const saleResponse = await createSaleMutation.mutateAsync(saleApiPayload);

// Automatically print receipt using template + thermal service
if (saleResponse) {
  try {
    // Service fetches template (is_used: true) and sends to Node.js
    const printResult = await saleReceiptService.printWithFallback(
      saleResponse as unknown as SaleData
    );
    saleReceiptService.showPrintNotification(printResult);
  } catch (printError) {
    console.error("❌ Receipt printing failed:", printError);
  }
}
```

**Important:** The service fetches the active template from API, then sends both template + sale data to Node.js which interprets the template and prints.

### Thermal Printer Service

The system uses a local Node.js thermal printer service running on `localhost:3001` with the following endpoints:

- `GET /health` - Check printer status
- `POST /test-print` - Print test receipt
- `POST /print-shift-closure` - Print shift closure receipt
- `POST /print-sale-receipt` - Print sale receipt with template

**Service Location:** `thermal-printer-service/server.js`

Request body for sale receipt printing:
```json
{
  "saleData": {
    "id": 18,
    "store_read": {
      "name": "Store Name",
      "address": "Store Address",
      "phone_number": "123456789"
    },
    "worker_read": {
      "name": "Cashier Name"
    },
    "sale_items": [...],
    "total_amount": "10000.00",
    "sale_payments": [...],
    "is_paid": true,
    "sold_date": "2025-10-10T19:22:15.254452Z"
  },
  "template": {
    "id": 5,
    "name": "Standard Template",
    "is_used": true,
    "style": {
      "styles": { "fontSize": "12px", ... },
      "components": [
        { "type": "text", "data": { "text": "{{storeName}}" }, "order": 0, ... },
        { "type": "divider", "order": 1, ... },
        { "type": "itemList", "order": 2, ... },
        ...
      ]
    }
  }
}
```

The service interprets the template and converts it to ESC/POS commands:
- **Template components** → **ESC/POS commands**
- text component → `printer.println()`
- divider component → `printer.drawLine()`
- itemList component → loop with formatting
- totals component → `printer.bold(true)` + `printer.setTextDoubleHeight()`
- textAlign: center → `printer.alignCenter()`
- fontWeight: bold → `printer.bold(true)`

The service automatically handles:
- Direct thermal printing (primary method)
- macOS system printer fallback
- Buffer-only mode if printer is disconnected

## Sale Data Structure

The service expects sale data in the following format:

```typescript
interface SaleData {
  id: number;
  store_read: {
    id: number;
    name: string;
    address: string;
    phone_number: string;
    budget: string;
    created_at: string;
    is_main: boolean;
    color: string;
    parent_store: number | null;
  };
  worker_read: {
    id: number;
    name: string;
    phone_number: string;
    role: string;
    // ... other fields
  };
  sale_items: Array<{
    id: number;
    product_read: {
      product_name: string;
      available_units: Array<{
        id: number;
        short_name: string;
        // ...
      }>;
      // ...
    };
    quantity: string;
    selling_unit: number;
    subtotal: string;
  }>;
  total_amount: string;
  sale_payments: Array<{
    id: number;
    amount: string;
    payment_method: string;
    paid_at: string;
  }>;
  is_paid: boolean;
  sold_date: string;
}
```

## Features

### ✅ Automatic Printing
- Prints immediately after successful sale
- No user interaction required
- Non-blocking (sale completes even if printing fails)
- Same behavior as shift closure receipts

### ✅ Template-Based Printing
- Users design templates via Template Manager UI
- Active template (`is_used: true`) used automatically
- Template components converted to ESC/POS by Node.js
- Supports custom styling (alignment, bold, spacing)
- No HTML generation
- No browser printing

### ✅ Fallback Support
- Primary: Direct thermal printer (ESC/POS)
- Fallback: macOS system printer
- No browser fallback - thermal only!

### ✅ User Notifications
- Success notifications (green)
- Error notifications (red)
- Auto-dismiss after 5 seconds
- Click to dismiss

### ✅ Customizable & Fast
- Template fetched once and cached
- Users control what appears on receipt
- Enable/disable components via template
- Direct communication with printer
- Fast thermal printing

## Configuration

### Changing Print Service URL

Edit `src/services/saleReceiptService.ts`:

```typescript
private readonly PRINT_SERVICE_URL = 'http://localhost:3001';
```

### Changing Printer Service Port

Edit `thermal-printer-service/server.js`:

```javascript
const port = 3001;
```

### Changing Template API URL

Edit `src/services/saleReceiptService.ts`:

```typescript
private readonly TEMPLATE_API_URL = 'https://demo.bondify.uz/api/v1/receipt/template/';
```

### Changing Print Timeout

Edit `src/services/saleReceiptService.ts`:

```typescript
private readonly PRINT_TIMEOUT = 10000; // milliseconds
```

### Starting the Printer Service

Navigate to the thermal printer service directory and start the service:

```bash
cd thermal-printer-service
node server.js
```

The service will output:
```
🚀 Thermal Print Service Started
📡 Server listening at http://localhost:3001
🖨️  Printer Status: ✅ Ready
📋 Available endpoints:
   GET  /health - Check service status
   POST /test-print - Print test receipt
   POST /print-shift-closure - Print shift closure receipt
   POST /print-sale-receipt - Print sale receipt
🔄 Waiting for print requests...
```

## Error Handling

The system handles errors gracefully:

1. **Template Fetch Failed**: Logs error, shows notification
2. **Thermal Printer Failed**: Falls back to browser print
3. **Browser Print Failed**: Shows error notification
4. **Network Timeout**: Catches and handles timeout errors

All errors are logged to console and displayed to user via notifications.

## Testing

### Test Template Fetching
```bash
# Check available templates
curl https://demo.bondify.uz/api/v1/receipt/template/

# Should return array with templates, find one with is_used: true
```

### Test Printer Status
```typescript
const status = await saleReceiptService.checkPrinterStatus();
console.log(status);
```

### Test Receipt Printing
```bash
# Start the Node.js service
cd thermal-printer-service
node server.js

# In another terminal, test printing
curl -X POST http://localhost:3001/test-print
```

### Create Custom Template
1. Navigate to Receipt Designer in the UI
2. Create a new template or edit existing
3. Add/remove components (text, divider, itemList, totals, footer)
4. Style components (alignment, bold, font size)
5. Toggle "Active" switch to set `is_used: true`
6. Template will be used for all sales automatically

## Troubleshooting

### Receipt Not Printing

1. **Check thermal printer service**:
   ```bash
   # Verify service is running
   curl http://localhost:3001/health
   
   # Should return: {"status":"ok","printer_ready":true,"timestamp":"..."}
   ```
   - If service is not running: `cd thermal-printer-service && node server.js`
   - Check service logs for errors
   - Verify printer is connected (USB)

2. **Check printer hardware**:
   - Ensure H-58C thermal printer is connected via USB
   - Check if printer appears in system: `system_profiler SPUSBDataType | grep -A 10 "STMicroelectronics"`
   - Verify printer has paper loaded
   - Check printer power

3. **Check template API**:
   - Verify template API is accessible: `curl https://demo.bondify.uz/api/v1/receipt/template/`
   - Ensure at least one template has `is_used: true`
   - Check template structure is valid (has components array)

4. **Check browser console**:
   - Look for error messages
   - Verify sale data structure matches expected format
   - Check network tab for failed requests to localhost:3001
   - Look for "✅ Receipt template loaded" message

5. **Check network**:
   - Verify no CORS issues (service has CORS enabled)
   - Check firewall/security software isn't blocking localhost:3001

### Printer Service Not Available

- Start the thermal printer service: `cd thermal-printer-service && node server.js`
- Check if port 3001 is available: `lsof -i :3001`
- If port is in use, kill the process or change the port
- Review printer service configuration in `server.js`
- Verify Node.js is installed: `node --version` (requires Node.js 14+)
- Check npm dependencies are installed: `cd thermal-printer-service && npm install`

### Printer Hardware Issues

- Verify printer is powered on
- Check USB cable connection
- Try different USB port
- Check macOS system printer settings
- Run test print: `curl -X POST http://localhost:3001/test-print`

## Future Improvements

- [ ] Support for multiple printers
- [ ] Print preview before printing
- [ ] Print history/log
- [x] Template-based receipts (DONE)
- [ ] Logo/image printing on thermal (currently text only)
- [ ] Email receipt option
- [ ] SMS receipt option
- [ ] PDF generation from template
- [ ] Reprint functionality
- [ ] Multi-language template variables
- [ ] QR code printing
- [ ] Barcode printing
- [ ] Template import/export
- [ ] Template marketplace

## Related Files

### Frontend
- `src/services/saleReceiptService.ts` - Main service implementation
- `src/services/shiftClosureReceiptService.ts` - Similar service for shift closures
- `src/components/POSInterface.tsx` - POS interface with receipt printing
- `src/core/pages/CloseShiftPage.tsx` - Shift closure with receipt printing
- `src/core/api/sale.ts` - Sale API types and hooks

### Backend (Thermal Printer Service)
- `thermal-printer-service/server.js` - Node.js thermal printer service
- `thermal-printer-service/package.json` - Service dependencies

### Key Dependencies
- `node-thermal-printer` - ESC/POS thermal printer driver for Node.js
- `express` - Web server framework
- `cors` - CORS middleware for cross-origin requests

## References

- Similar implementation in `CloseShiftPage.tsx` for shift closure receipts
- Template API: `https://demo.bondify.uz/api/v1/receipt/template/`
- Thermal printer service: `localhost:3001` (Node.js server)
- Printer model: H-58C Thermal Printer (ESC/POS compatible)
- Vendor ID: `0x0483` (STMicroelectronics)
- Product ID: `0x070b`

## Architecture

```
┌─────────────────┐
│  POSInterface   │
│   (React App)   │
└────────┬────────┘
         │ 1. Sale completed
         ↓
┌─────────────────┐
│ Template API    │
│ (demo.bondify)  │
└────────┬────────┘
         │ 2. Fetch template (is_used: true)
         │    Cached after first fetch
         ↓
┌─────────────────┐
│ saleReceipt     │
│   Service       │
│  (TypeScript)   │
└────────┬────────┘
         │ 3. HTTP POST (localhost:3001)
         │    POST /print-sale-receipt
         │    { saleData: {...}, template: {...} }
         ↓
┌─────────────────┐
│  Thermal        │
│  Printer        │
│  Service        │
│  (Node.js)      │
│                 │
│ • Parse template│
│ • Replace vars  │
│ • Convert to    │
│   ESC/POS       │
│ • Handle print  │
└────────┬────────┘
         │ 4. ESC/POS Commands
         │    (Bold, align, drawLine, cut, etc.)
         │    Based on template components
         ↓
┌─────────────────┐
│   H-58C         │
│   Thermal       │
│   Printer       │
│   (Hardware)    │
└─────────────────┘
```

The system uses a three-tier architecture:
1. **Frontend (React)**: Fetches user template from API, prepares sale data, sends both to Node.js
2. **Backend (Node.js)**: Interprets template components, converts to ESC/POS commands, prints to hardware
3. **Template System**: Users design receipts in Template Manager, active template used automatically

**Key Point:** Users control receipt layout via templates. Node.js interprets the template and converts it to thermal printer commands. This gives users full control over what appears on receipts without changing code!
