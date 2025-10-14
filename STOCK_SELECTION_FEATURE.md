# Stock Selection Feature Documentation

## Overview

This feature enables selling products from specific stock entries when the product category has `sell_from_stock` enabled. When this flag is true, users must select which stock entry to sell from before adding the product to the sale.

## How It Works

### 1. Product Category Configuration

Products are linked to categories, and each category has a `sell_from_stock` boolean field:

```json
{
  "category_read": {
    "id": 10,
    "category_name": "Рейка",
    "sell_from_stock": true,
    "attributes_read": []
  }
}
```

### 2. Stock Selection Flow

When a product with `sell_from_stock: true` is added to cart:

1. **Stock Modal Opens**: A modal displays all available stock entries for the product
2. **API Call**: Fetches stock data from `/api/v1/items/stock/?product={productId}&product_zero=false`
3. **User Selection**: User selects which stock entry to sell from
4. **Cart Update**: Product is added to cart with the selected stock ID

### 3. Stock Data Structure

The stock API returns detailed information about each stock entry:

```json
{
  "results": [
    {
      "id": 86,
      "store": {
        "id": 1,
        "name": "Нокис Агаш Базар"
      },
      "product": {
        "id": 122,
        "product_name": "Стропила 0.27x6.5x6",
        "base_unit": 6
      },
      "currency": {
        "id": 2,
        "name": "Доллар",
        "short_name": "USD",
        "is_base": false
      },
      "supplier": {
        "id": 1,
        "name": "s"
      },
      "purchase_unit": {
        "id": 5,
        "measurement_name": "Куб",
        "short_name": "м3"
      },
      "quantity": "596.00",
      "purchase_unit_quantity": "6.3200",
      "price_per_unit_currency": "330.00",
      "total_price_in_currency": "2085.60",
      "price_per_unit_uz": "4059000.00",
      "total_price_in_uz": "25652880.00",
      "base_unit_in_currency": "3.48",
      "base_unit_in_uzs": "42754.80",
      "date_of_arrived": "2025-10-13T09:32:35.017852Z"
    }
  ]
}
```

### 4. Sale Submission

When submitting a sale with products from stock, the stock ID is included:

```json
{
  "sale_items": [
    {
      "product_write": 10,
      "quantity": 1,
      "selling_unit": 6,
      "price_per_unit": 300000
    },
    {
      "product_write": 4,
      "quantity": 1,
      "selling_unit": 6,
      "price_per_unit": 200000,
      "stock": 5
    }
  ]
}
```

## Implementation Details

### Files Modified

1. **`src/core/api/product.ts`**
   - Added `sell_from_stock` field to `category_read` interface

2. **`src/core/api/stock.ts`**
   - Added `fetchStockByProduct()` function to fetch stock entries

3. **`src/components/StockSelectionModal.tsx`** (NEW)
   - Modal component for selecting stock
   - Displays stock details (store, supplier, quantity, prices, date)
   - Allows user to skip stock selection if needed

4. **`src/components/POSInterface.tsx`**
   - Updated `ProductInCart` interface to include `stock` and `stockId` fields
   - Added stock selection modal state
   - Modified `handleProductDirectAdd()` to check for `sell_from_stock`
   - Updated sale payload to include `stock` field

5. **`src/core/pages/create-sale.tsx`**
   - Updated `ProductInCart` and `FormSaleItem` interfaces
   - Added stock selection modal state
   - Modified `handleProductSelection()` to check for `sell_from_stock`
   - Created `addProductToCart()` helper function
   - Added `handleStockSelect()` callback
   - Updated form submission to include stock ID

### Component Structure

```
POSInterface / CreateSale
  ├── Product Selection
  ├── Check if sell_from_stock is true
  │   ├── YES → Show StockSelectionModal
  │   │   ├── Fetch stocks via API
  │   │   ├── Display stock list
  │   │   ├── User selects stock
  │   │   └── Add product with stock ID
  │   └── NO → Add product normally
  └── Submit sale with stock IDs
```

### Key Functions

#### `fetchStockByProduct(productId, productZero)`
Fetches available stock entries for a product.

```typescript
export const fetchStockByProduct = async (
  productId: number,
  productZero: boolean = false,
): Promise<Stock[]> => {
  const response = await api.get(
    `items/stock/?product=${productId}&product_zero=${productZero}`
  );
  return response.data.results || [];
};
```

#### `handleProductDirectAdd(product, stock?)`
Adds product to cart with optional stock information.

```typescript
const handleProductDirectAdd = useCallback(
  (product: Product, stock?: Stock) => {
    // Check if stock selection is required
    if (product.category_read?.sell_from_stock && !stock) {
      setProductForStockSelection(product);
      setIsStockModalOpen(true);
      return;
    }
    
    // Add product with stock ID
    const newProduct: ProductInCart = {
      // ... other fields
      stock: stock,
      stockId: stock?.id,
    };
  },
  [cartProducts]
);
```

#### `handleStockSelect(stock)`
Callback when user selects a stock entry.

```typescript
const handleStockSelect = useCallback(
  (stock: Stock) => {
    if (productForStockSelection) {
      handleProductDirectAdd(productForStockSelection, stock);
      setProductForStockSelection(null);
    }
  },
  [productForStockSelection, handleProductDirectAdd]
);
```

## User Interface

### Stock Selection Modal Features

- **Stock List**: Displays all available stock entries
- **Stock Details**: Shows store, supplier, quantity, prices (in currency and UZS), arrival date
- **Selection**: Click to select a stock entry (highlighted in blue)
- **Actions**:
  - **Выбрать (Select)**: Confirm selection
  - **Пропустить (Skip)**: Add product without stock
  - **Отмена (Cancel)**: Close modal

### Visual Feedback

- Selected stock entry is highlighted with blue border and background
- No stocks available shows appropriate message
- Loading state with spinner during API call

## API Integration

### Endpoint: GET `/api/v1/items/stock/`

**Query Parameters:**
- `product` (required): Product ID
- `product_zero` (optional): Include stocks with zero quantity (default: false)

**Response:**
```json
{
  "links": { ... },
  "total_pages": 1,
  "current_page": 1,
  "page_range": [1],
  "page_size": 30,
  "results": [ /* Stock objects */ ],
  "count": 1
}
```

### Endpoint: POST `/api/v1/sales/sale/`

**Request Body:**
```json
{
  "store": 1,
  "sold_by": 5,
  "on_credit": false,
  "total_amount": "500000",
  "sale_items": [
    {
      "product_write": 10,
      "quantity": "1",
      "selling_unit": 6,
      "price_per_unit": "300000",
      "stock": 86  // Optional: Include when selling from stock
    }
  ],
  "sale_payments": [ ... ]
}
```

## Usage Examples

### Example 1: Product Requires Stock Selection

```typescript
// Product with sell_from_stock enabled
const product = {
  id: 122,
  product_name: "Стропила 0.27x6.5x6",
  category_read: {
    sell_from_stock: true
  }
};

// User adds product → Modal opens → User selects stock → Product added
```

### Example 2: Product Without Stock Selection

```typescript
// Product with sell_from_stock disabled or not set
const product = {
  id: 80,
  product_name: "Рейка 0.20x4.4x6",
  category_read: {
    sell_from_stock: false
  }
};

// User adds product → Directly added to cart
```

## Testing

### Test Cases

1. **Stock Selection Required**
   - Product with `sell_from_stock: true`
   - Modal should open when adding product
   - Should fetch and display available stocks
   - Should add product with selected stock ID

2. **Stock Selection Optional**
   - Product with `sell_from_stock: false` or undefined
   - Product should be added directly without modal

3. **No Stocks Available**
   - Product with `sell_from_stock: true` but no stock entries
   - Modal should show "no stocks" message
   - User can skip or cancel

4. **Multiple Products**
   - Cart with mixed products (with and without stock)
   - Should handle each product appropriately
   - Sale submission should include stock IDs only for relevant items

5. **Skip Stock Selection**
   - User clicks "Skip" button
   - Product should be added without stock ID

## Future Enhancements

- [ ] Stock filtering by store
- [ ] Stock sorting by date, price, or quantity
- [ ] Auto-select stock when only one is available
- [ ] Display stock history and tracking
- [ ] Stock quantity warnings
- [ ] FIFO (First In, First Out) stock selection
- [ ] Stock reservation during sale process

## Troubleshooting

### Issue: Modal doesn't open
- Check if `category_read.sell_from_stock` is set to `true`
- Verify API endpoint is accessible
- Check browser console for errors

### Issue: No stocks displayed
- Verify product has stock entries in database
- Check API response with `product_zero=false` parameter
- Ensure stock quantities are greater than 0

### Issue: Stock ID not included in sale
- Verify `stockId` is set in `ProductInCart` object
- Check sale payload construction in submit handler
- Ensure form value is set: `form.setValue('sale_items.${index}.stock', stockId)`

## Notes

- Stock selection is only triggered when `sell_from_stock` is explicitly `true`
- Users can skip stock selection if needed (product added without stock ID)
- Stock ID is optional in the sale item payload
- The feature works in both POS Interface and Create Sale page