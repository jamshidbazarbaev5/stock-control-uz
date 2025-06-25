import api from '../api/api';

// Helper to diff arrays by id
function diffById<T extends { id?: number }>(original: T[], edited: T[]) {
  const added = edited.filter(e => !e.id || !original.some(o => o.id === e.id));
  const updated = edited.filter(e => e.id && original.some(o => o.id === e.id && JSON.stringify(o) !== JSON.stringify(e)));
  const removed = original.filter(o => o.id && !edited.some(e => e.id === o.id));
  return { added, updated, removed };
}

export async function syncSaleEditApis({
  saleId,
  originalSale,
  editedSale
}: {
  saleId: number;
  originalSale: any;
  editedSale: any;
}) {
  const requests: Promise<any>[] = [];

  // Payments
  const origPayments = originalSale.sale_payments || [];
  const editPayments = editedSale.sale_payments || [];
  const { added: addedPayments, updated: updatedPayments, removed: removedPayments } = diffById(origPayments, editPayments);
  for (const payment of addedPayments) {
    requests.push(api.post(`/sales/${saleId}/payments/`, payment));
  }
  for (const payment of updatedPayments) {
    requests.push(api.patch(`/sales/${saleId}/payments/${payment.id}/`, payment));
  }
  for (const payment of removedPayments) {
    requests.push(api.delete(`/sales/${saleId}/payments/${payment.id}/`));
  }

  // Sale items
  const origItems = originalSale.sale_items || [];
  const editItems = editedSale.sale_items || [];
  const { added: addedItems, updated: updatedItems, removed: removedItems } = diffById(origItems, editItems);
  for (const item of addedItems) {
    requests.push(api.post(`/sales/${saleId}/items/`, item));
  }
  for (const item of updatedItems) {
    requests.push(api.patch(`/sales/${saleId}/items/${item.id}/`, item));
  }
  for (const item of removedItems) {
    requests.push(api.delete(`/sales/${saleId}/items/${item.id}/`));
  }

  // Sale total/store/worker
  if (
    originalSale.total_amount !== editedSale.total_amount ||
    originalSale.store_read?.id !== editedSale.store_read?.id ||
    originalSale.sold_by !== editedSale.sold_by // Add this check to always update if worker changed
  ) {
    requests.push(api.patch(`/sales/${saleId}/`, {
      total_amount: editedSale.total_amount,
      store: editedSale.store_read?.id,
      total_pure_revenue: editedSale.total_pure_revenue,
      sold_by: editedSale.sold_by, // Allow changing the worker (seller)
    }));
  }

  // Await all
  await Promise.all(requests);
}
