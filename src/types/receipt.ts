export interface ReceiptComponentStyles {
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  margin?: string;
  padding?: string;
  color?: string;
  backgroundColor?: string;
  width?: string;
  height?: string;
  borderTop?: boolean;
  borderBottom?: boolean;
  spacing?: string;
}

export interface ReceiptComponentData {
  text?: string;
  url?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  qrData?: string;
  [key: string]: any;
}

export interface ReceiptComponent {
  id: string;
  type:
    | "logo"
    | "header"
    | "text"
    | "itemList"
    | "totals"
    | "footer"
    | "divider"
    | "spacer"
    | "qrCode";
  data: ReceiptComponentData;
  styles: ReceiptComponentStyles;
  enabled: boolean;
  order: number;
}

export interface ReceiptGlobalStyles {
  fontSize: string;
  fontFamily: string;
  width: string;
  backgroundColor: string;
  textColor: string;
  margin: string;
  padding: string;
}

export interface ReceiptTemplate {
  id?: string;
  name: string;
  style: {
    styles: ReceiptGlobalStyles;
    components: ReceiptComponent[];
  };
  is_used: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReceiptPreviewData {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  cashierName: string;
  receiptNumber: string;
  date: string;
  time: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  change: number;
  footerText: string;
  qrCodeData?: string;
}

export const DEFAULT_RECEIPT_DATA: ReceiptPreviewData = {
  storeName: "Sample Store",
  storeAddress: "123 Main Street, City, State 12345",
  storePhone: "Tel: (555) 123-4567",
  cashierName: "John Doe",
  receiptNumber: "R001234",
  date: "2024-01-15",
  time: "14:30:25",
  items: [
    {
      name: "Product 1",
      quantity: 2,
      price: 15.99,
      total: 31.98,
    },
    {
      name: "Product 2",
      quantity: 1,
      price: 25.5,
      total: 25.5,
    },
    {
      name: "Product 3",
      quantity: 3,
      price: 8.75,
      total: 26.25,
    },
  ],
  subtotal: 83.73,
  tax: 8.37,
  discount: 5.0,
  total: 87.1,
  paymentMethod: "Cash",
  change: 12.9,
  footerText: "СПАСИБО ЗА ПОКУПКУ!.ЖДЁМ ВАС СНОВА",
};

export const DEFAULT_TEMPLATE: ReceiptTemplate = {
  name: "Standard Template",
  style: {
    styles: {
      fontSize: "12px",
      fontFamily: "monospace",
      width: "300px",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      margin: "0",
      padding: "20px",
    },
    components: [
      {
        id: "logo",
        type: "logo",
        data: {
          url: "/api/placeholder/150/50",
          // text: "{{storeName}}",
        },
        styles: {
          textAlign: "center",
          margin: "0 0 20px 0",
          width: "250px",
        },
        enabled: true,
        order: 0,
      },

      {
        id: "store-info",
        type: "text",
        data: { text: "{{storePhone}}" },
        styles: {
          textAlign: "center",
          margin: "0 0 20px 0",
          fontSize: "10px",
          fontWeight: "bold",
        },
        enabled: true,
        order: 2,
      },
      {
        id: "divider-1",
        type: "divider",
        data: {},
        styles: {
          borderTop: true,
          margin: "10px 0",
        },
        enabled: true,
        order: 3,
      },
      {
        id: "receipt-info",
        type: "text",
        data: {
          text: "Receipt: {{receiptNumber}}\nDate: {{date}} {{time}}\nCashier: {{cashierName}}",
        },
        styles: {
          fontSize: "10px",
          margin: "0 0 15px 0",
          fontWeight: "bold",
        },
        enabled: true,
        order: 4,
      },
      {
        id: "items",
        type: "itemList",
        data: {},
        styles: {
          fontSize: "11px",
          margin: "0 0 15px 0",
          fontWeight: "bold",
        },
        enabled: true,
        order: 5,
      },
      {
        id: "divider-2",
        type: "divider",
        data: {},
        styles: {
          borderTop: true,
          margin: "10px 0",
        },
        enabled: true,
        order: 6,
      },
      {
        id: "totals",
        type: "totals",
        data: {},
        styles: {
          fontSize: "11px",
          margin: "0 0 20px 0",
          fontWeight: "bold",
        },
        enabled: true,
        order: 7,
      },
      {
        id: "payment-info",
        type: "text",
        data: { text: "Payment: {{paymentMethod}}\nChange: ${{change}}" },
        styles: {
          fontSize: "10px",
          margin: "0 0 20px 0",
          fontWeight: "bold",
        },
        enabled: true,
        order: 8,
      },

      {
        id: "footer",
        type: "footer",
        data: { text: "{{footerText}}" },
        styles: {
          textAlign: "center",
          fontSize: "10px",
          margin: "20px 0 0 0",
          fontWeight: "bold",
        },
        enabled: true,
        order: 9,
      },
    ],
  },
  is_used: false,
};

export type ComponentType = ReceiptComponent["type"];

export interface DragEndEvent {
  active: {
    id: string;
  };
  over: {
    id: string;
  } | null;
}
