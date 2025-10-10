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
  paymentMethod: string;
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
  subtotal?: number;
  tax?: number;
  discount?: number;
  total: number;
  payments: Array<{
    method: string;
    amount: string;
  }>;
  change: number;
  footerText: string;
  qrCodeData?: string;
}

export const DEFAULT_RECEIPT_DATA: ReceiptPreviewData = {
  storeName: "GLAV",
  paymentMethod: "Наличные",
  storeAddress: "ADDRESSS_1",
  storePhone: "975000502",
  cashierName: "root",
  receiptNumber: "33",
  date: "2025-10-10",
  time: "20:33:44",
  items: [
    {
      name: "Стропила 0.20х0.048х6",
      quantity: 1,
      price: 10000,
      total: 10000,
    },
  ],
  // subtotal: 10000,
  // tax: 0,
  // discount: 0,
  total: 10000,
  payments: [
    {
      method: "Наличные",
      amount: "10000.00",
    },
  ],
  change: 0,
  footerText: "СПАСИБО ЗА ПОКУПКУ",
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
        id: "header",
        type: "text",
        data: { text: "ЧЕК ПРОДАЖИ" },
        styles: {
          textAlign: "center",
          fontSize: "12px",
          fontWeight: "bold",
          margin: "0 0 10px 0",
        },
        enabled: true,
        order: 0,
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
        order: 1,
      },
      {
        id: "store-info",
        type: "text",
        data: {
          text: "Магазин: {{storeName}}\nАдрес: {{storeAddress}}\nТелефон: {{storePhone}}",
        },
        styles: {
          textAlign: "left",
          fontSize: "10px",
          margin: "0 0 10px 0",
        },
        enabled: true,
        order: 2,
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
        order: 3,
      },
      {
        id: "receipt-info",
        type: "text",
        data: {
          text: "Чек №: {{receiptNumber}}\nДата: {{date}} {{time}}\nКассир: {{cashierName}}",
        },
        styles: {
          fontSize: "10px",
          margin: "0 0 10px 0",
          fontWeight: "bold",
        },
        enabled: true,
        order: 4,
      },
      {
        id: "divider-3",
        type: "divider",
        data: {},
        styles: {
          borderTop: true,
          margin: "10px 0",
        },
        enabled: true,
        order: 5,
      },
      {
        id: "items-header",
        type: "text",
        data: { text: "ТОВАРЫ" },
        styles: {
          fontSize: "11px",
          fontWeight: "bold",
          margin: "0 0 5px 0",
        },
        enabled: true,
        order: 6,
      },
      {
        id: "items",
        type: "itemList",
        data: {},
        styles: {
          fontSize: "11px",
          margin: "0 0 15px 0",
        },
        enabled: true,
        order: 7,
      },
      {
        id: "divider-4",
        type: "divider",
        data: {},
        styles: {
          borderTop: true,
          margin: "10px 0",
        },
        enabled: true,
        order: 8,
      },

      {
        id: "totals",
        type: "totals",
        data: {},
        styles: {
          fontSize: "11px",
          margin: "0 0 15px 0",
          fontWeight: "bold",
          textAlign: "right",
        },
        enabled: true,
        order: 9,
      },
      {
        id: "divider-5",
        type: "divider",
        data: {},
        styles: {
          borderTop: true,
          margin: "10px 0",
        },
        enabled: true,
        order: 10,
      },
      {
        id: "payment-info",
        type: "text",
        data: {
          text: "СПОСОБ ОПЛАТЫ:\n{{payments}}\nСдача: {{change}} UZS",
        },
        styles: {
          fontSize: "10px",
          margin: "0 0 15px 0",
          fontWeight: "bold",
        },
        enabled: true,
        order: 11,
      },
      {
        id: "divider-6",
        type: "divider",
        data: {},
        styles: {
          borderTop: true,
          margin: "10px 0",
        },
        enabled: true,
        order: 12,
      },
      {
        id: "footer",
        type: "footer",
        data: { text: "СПАСИБО ЗА ПОКУПКУ" },
        styles: {
          textAlign: "center",
          fontSize: "10px",
          margin: "20px 0 0 0",
          fontWeight: "bold",
        },
        enabled: true,
        order: 13,
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
