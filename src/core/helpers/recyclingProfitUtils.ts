import type { Recycling } from '@/core/api/recycling';

/**
 * Find a recycling record for a given stock's product id.
 * Only returns a record if the product is in category "Рейка" (id 13).
 * @param recyclings - Array of recycling records
 * @param productId - The product id of the selected stock
 * @param stockId - The stock id of the selected stock
 * @returns The matching recycling record or undefined
 */
export function findRecyclingForStock(recyclings: Recycling[], productId: number,stockId: number) {
  return recyclings.find(
      (rec) =>
          rec.to_product_read?.id === productId &&
          rec.to_stock_read.id === stockId &&
          rec.to_product_read?.category_read?.category_name === 'Рейка'
  );
}

/**
 * Calculate profit for a recycled product sale based on recycling record and quantity.
 * @param recycling - Recycling record
 * @param quantity - Quantity user wants to sell
 * @param customSellingPrice - Optional custom selling price (e.g. from subtotal input)
 * @returns Calculated profit
 */
export function calculateRecyclingProfit(recycling: any, quantity: number, customSellingPrice?: number) {
  const spentAmount = Number(recycling.spent_amount);
  const getAmount = Number(recycling.get_amount);
  // Use the original (from) product's prices for profit calculation
  const originalSellingPrice = Number(recycling.from_to_read.selling_price);
  const originalMinPrice = Number(recycling.from_to_read.min_price);
  const profitPerUnit = originalSellingPrice - originalMinPrice;
  const totalProfit = profitPerUnit * spentAmount;
  let finalProfit = (originalMinPrice / getAmount) * quantity;


  // Add additional profit if selling at a custom price
  if (customSellingPrice) {
    const defaultPrice = Number(recycling.to_stock_read.selling_price);
    const additionalProfit = (customSellingPrice - defaultPrice) * quantity;
    finalProfit += additionalProfit;
  }

  // Debugging logs
  console.log('Recycling Profit Calculation Debug:', {
    spentAmount,
    getAmount,
    customSellingPrice,
    originalSellingPrice,
    originalMinPrice,
    profitPerUnit,
    totalProfit,
    finalProfit,
    recyclingDetails: {
      fromProduct: recycling.from_to_read?.product_read?.product_name,
      toProduct: recycling.to_product_read?.product_name,
      fromSellingPrice: recycling.from_to_read?.selling_price,
      toSellingPrice: recycling.to_stock_read?.selling_price,
      fromMinPrice: recycling.from_to_read?.min_price,
      toMinPrice: recycling.to_stock_read?.min_price
    }
  });

  return finalProfit;
}
