import type { Stock } from '@/core/api/stock';
import api from './api';

// Fetch all paginated stock data from the API
export async function fetchAllStocks(params: Record<string, any> = {}) {
  let page = 1;
  let allResults: Stock[] = [];
  let hasNext = true;

  while (hasNext) {
    const response = await api.get('/items/stock/', {
      params: { ...params, page,product_zero: false }, // Ensure product_zero is always true
    });
    const data = response.data;
    allResults = allResults.concat(data.results);
    hasNext = !!data.links.next;
    page++;
  }

  return allResults;
}
