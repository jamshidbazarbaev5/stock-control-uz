// Test file to verify font size fixes in thermal printer
import { ThermalPrinterService, testFontSizeHandling } from './services/thermalPrinter';

// Test template with various font sizes
const testTemplate = {
  id: "font-test",
  name: "Font Size Test Template",
  style: {
    styles: {
      fontSize: "12px",
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#ffffff",
      textColor: "#000000"
    },
    components: [
      {
        id: "logo-test",
        type: "logo",
        order: 0,
        enabled: true,
        data: { text: "LOGO TEXT" },
        styles: {
          fontSize: "24px",
          fontWeight: "bold",
          textAlign: "center",
          fontFamily: "Arial, sans-serif"
        },
      },
      {
        id: "header-test",
        type: "header",
        order: 1,
        enabled: true,
        data: { text: "Receipt Header - Large Font" },
        styles: {
          fontSize: "20px",
          fontWeight: "bold",
          textAlign: "center",
          color: "#333333"
        },
      },
      {
        id: "text-test",
        type: "text",
        order: 2,
        enabled: true,
        data: { text: "This is regular text with medium font size\nSecond line of text" },
        styles: {
          fontSize: "14px",
          fontWeight: "normal",
          textAlign: "left",
          margin: "10px 0"
        },
      },
      {
        id: "small-text-test",
        type: "text",
        order: 3,
        enabled: true,
        data: { text: "Small footer text for additional information" },
        styles: {
          fontSize: "10px",
          fontWeight: "normal",
          textAlign: "center",
          color: "#666666",
          fontStyle: "italic"
        },
      },
      {
        id: "itemlist-test",
        type: "itemList",
        order: 4,
        enabled: true,
        data: {},
        styles: {
          fontSize: "11px",
          fontWeight: "normal",
          margin: "15px 0"
        },
      },
      {
        id: "totals-test",
        type: "totals",
        order: 5,
        enabled: true,
        data: {},
        styles: {
          fontSize: "13px",
          fontWeight: "bold",
          margin: "10px 0"
        },
      }
    ],
  },
};

// Test data
const testData = {
  storeName: "Font Test Store",
  storeAddress: "123 Font Street, Test City",
  storePhone: "+1 (555) 123-4567",
  cashierName: "Test Cashier",
  receiptNumber: "TEST-FONT-001",
  date: "2024-01-15",
  time: "14:30:00",
  items: [
    {
      id: "1",
      name: "Test Item with Long Name to Check Wrapping",
      quantity: 2,
      price: 15.99,
      total: 31.98
    },
    {
      id: "2",
      name: "Short Item",
      quantity: 1,
      price: 5.50,
      total: 5.50
    }
  ],
  subtotal: 37.48,
  discount: 2.00,
  tax: 3.55,
  total: 39.03,
  paymentMethod: "Credit Card",
  change: 0,
  qrCodeData: "https://test.com/receipt/TEST-FONT-001",
  footerText: "Thank you for testing!\nVisit us again soon."
};

// Function to test font size application
function testFontSizes() {
  console.log("🧪 Starting font size test...");

  const thermalPrinter = new ThermalPrinterService();

  try {
    // Generate HTML
    const html = thermalPrinter.generatePrintHTML(testTemplate, testData);

    // Check for font size applications
    const checks = {
      globalFontSize: html.includes('font-size: 12px'),
      logoFontSize: html.includes('font-size: 24px'),
      headerFontSize: html.includes('font-size: 20px'),
      textFontSize: html.includes('font-size: 14px'),
      smallTextFontSize: html.includes('font-size: 10px'),
      itemListFontSize: html.includes('font-size: 11px'),
      totalsFontSize: html.includes('font-size: 13px'),
    };

    // Check for other styles
    const styleChecks = {
      fontFamily: html.includes('Arial, sans-serif'),
      fontWeightBold: html.includes('font-weight: bold'),
      textAlign: html.includes('text-align: center'),
      margins: html.includes('margin: 10px 0'),
    };

    console.log("📊 Font Size Results:");
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
    });

    console.log("📊 Style Application Results:");
    Object.entries(styleChecks).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
    });

    // Print HTML for manual inspection
    console.log("📄 Generated HTML (first 1000 chars):");
    console.log(html.substring(0, 1000) + "...");

    // Overall result
    const allFontSizesWork = Object.values(checks).every(Boolean);
    const allStylesWork = Object.values(styleChecks).every(Boolean);

    if (allFontSizesWork && allStylesWork) {
      console.log("🎉 SUCCESS: All font sizes and styles are being applied correctly!");
    } else {
      console.log("❌ ISSUES: Some font sizes or styles are not being applied properly.");
    }

    return {
      success: allFontSizesWork && allStylesWork,
      fontSizeChecks: checks,
      styleChecks: styleChecks,
      html: html
    };

  } catch (error) {
    console.error("❌ Error during font size test:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to create a test print (opens print dialog)
function createTestPrint() {
  console.log("🖨️ Creating test print...");

  const thermalPrinter = new ThermalPrinterService();

  try {
    thermalPrinter.printViaBrowser(testTemplate, testData);
    console.log("✅ Print dialog should be open - check if font sizes are correct!");
  } catch (error) {
    console.error("❌ Error creating test print:", error);
  }
}

// Export functions for use in browser console
if (typeof window !== 'undefined') {
  window.testFontSizes = testFontSizes;
  window.createTestPrint = createTestPrint;

  console.log("🔧 Font size test functions loaded!");
  console.log("Run testFontSizes() to check font size application");
  console.log("Run createTestPrint() to test actual printing with font sizes");
}

// Run test automatically if in Node.js environment
if (typeof window === 'undefined') {
  testFontSizes();
}

export { testFontSizes, createTestPrint, testTemplate, testData };
