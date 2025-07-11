import type { Recycling } from '@/core/api/recycling';

/**
 * Find a recycling record for a given stock's product id.
 * Only returns a record if the product is in category "Рейка" (id 13).
 * @param recyclings - Array of recycling records
 * @param productId - The product id of the selected stock
 * @returns The matching recycling record or undefined
 */
export function findRecyclingForStock(recyclings: Recycling[], productId: number) {
  return recyclings.find(
    (rec) =>
      rec.to_product_read?.id === productId &&
      rec.to_product_read?.category_read?.id === 13 &&
      rec.to_product_read?.category_read?.category_name === 'Рейка'
  );
}

/**
 * Calculate profit for a recycled product sale based on recycling record and quantity.
 * @param recycling - Recycling record
 * @param quantity - Quantity user wants to sell
 * @returns Calculated profit
 */
export function calculateRecyclingProfit(recycling: any, quantity: number) {
  const spentAmount = Number(recycling.spent_amount);
  const getAmount = Number(recycling.get_amount);
  const sellingPrice = Number(recycling.from_to_read.selling_price);
  const minPrice = Number(recycling.from_to_read.min_price);
  const profitPerUnit = sellingPrice - minPrice;
  const totalProfit = profitPerUnit * spentAmount;
  return (totalProfit / getAmount) * quantity;
}
