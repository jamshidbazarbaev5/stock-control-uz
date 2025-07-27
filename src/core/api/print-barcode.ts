import api from './api';

interface PrintBarcodeParams {
    label_size: number;
    quantity: number;
}

export const printBarcode = (productId: number, params: PrintBarcodeParams) => {
    return api.post(`items/print_barcode/${productId}/`, params);
};
