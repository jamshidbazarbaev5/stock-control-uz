export { default as ReceiptDesigner } from './ReceiptDesigner';
export { default as ReceiptPreview } from './ReceiptPreview';
export { default as DesignerControls } from './DesignerControls';

// Re-export types for convenience
export type {
  ReceiptTemplate,
  ReceiptComponent,
  ReceiptPreviewData,
  ReceiptComponentStyles,
  ReceiptGlobalStyles,
  ComponentType,
  DragEndEvent
} from '../../types/receipt';

// Export default template and sample data
export {
  DEFAULT_TEMPLATE,
  DEFAULT_RECEIPT_DATA
} from '../../types/receipt';
