// recyclingProfit.ts
// Utility to calculate profit for recycled products

export interface RecyclingRecord {
  spent_amount: number;
  get_amount: number;
  from_to_read: {
    selling_price: number;
    min_price: number;
  };
}

/**
 * Calculates the profit for a recycled product sale.
 * @param recyclingRecord - The recycling record from the API
 * @param userRequestedQty - The quantity the user wants to sell
 * @returns The calculated profit for the requested quantity
 */
export function calculateRecyclingProfit(
  recyclingRecord: RecyclingRecord,
  userRequestedQty: number
): number {
  const { spent_amount, get_amount, from_to_read } = recyclingRecord;
  const { selling_price, min_price } = from_to_read;

  const profitPerUnit = selling_price - min_price;
  const totalProfit = profitPerUnit * spent_amount;

  // If user requests the same as get_amount, return totalProfit
  if (userRequestedQty === get_amount) return totalProfit;

  // Otherwise, scale profit to requested quantity
  return (totalProfit / get_amount) * userRequestedQty;
}
