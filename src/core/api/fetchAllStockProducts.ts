// Fetch all stock products from the paginated API
// Usage: await fetchAllStockProducts({ params })

export async function fetchAllStockProducts({ params = {} } = {}): Promise<any[]> {
  const baseUrl = 'https://bondify.uz/api/v1/items/stock/';
  let page = 1;
  let allResults: any[] = [];
  let totalPages = 1;
  let urlParams = new URLSearchParams(params);
  const token = localStorage.getItem('token');

  do {
    let url = `${baseUrl}?page=${page}`;
    const paramString = urlParams.toString();
    if (paramString) {
      url += `&${paramString}`;
    }
    const response = await fetch(url, {
         headers: {
    'Authorization': `Bearer ${token}`,
    // ...other headers if needed
  }
     
    });
    if (!response.ok) throw new Error('Failed to fetch stock products');
    const data = await response.json();
    allResults = allResults.concat(data.results);
    totalPages = data.total_pages || 1;
    page++;
  } while (page <= totalPages);

  return allResults;
}
