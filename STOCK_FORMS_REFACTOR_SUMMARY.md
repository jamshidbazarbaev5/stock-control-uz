# Stock Forms Refactoring Summary

## Overview
Successfully refactored both `create-stock.tsx` and `edit-stock-2.tsx` to use backend-driven calculations instead of frontend calculation logic. The forms now send user input to a backend calculation endpoint and dynamically render fields based on the API response.

## Key Changes Made

### 1. API Service Enhancement (`/src/core/api/stock.ts`)
- **Added calculation types**: `StockCalculationRequest`, `DynamicField`, `StockCalculationResponse`
- **Added calculation function**: `calculateStock()` that calls `POST /api/v1/items/stock/calculate/`
- **Enhanced CreateStockDTO**: Added new fields for backend calculation support:
  - `currency?: number`
  - `purchase_unit?: number`
  - `purchase_unit_quantity?: number`
  - `total_price_in_currency?: number`
  - `price_per_unit_currency?: number`
  - `base_unit_in_uzs?: number`
  - `total_price_in_uz?: number`

### 2. Create Stock Form (`/src/core/pages/create-stock.tsx`)
**Complete rewrite with backend-driven approach:**

#### New FormValues Interface
```typescript
interface FormValues {
  // Required initial fields
  store: number | string;
  product: number | string;
  currency: number | string;
  purchase_unit: number | string;
  supplier: number | string;
  date_of_arrived: string;
  
  // Dynamic calculation fields (user input)
  purchase_unit_quantity?: number | string;
  total_price_in_currency?: number | string;
  price_per_unit_currency?: number | string;
  
  // Backend calculated fields
  quantity?: number | string;
  total_price_in_uz?: number | string;
  base_unit_in_uzs?: number | string;
}
```

#### Key Features
- **Required Initial Fields**: Store, Product, Currency, Purchase Unit, Supplier, Date of Arrival
- **Dynamic Calculation**: Triggers backend calculation when user enters `purchase_unit_quantity`, `total_price_in_currency`, or `price_per_unit_currency`
- **Debounced API Calls**: 500ms debounce to prevent excessive API calls
- **Dynamic Field Rendering**: Fields are shown/hidden and enabled/disabled based on API response
- **Real-time Updates**: Form fields update automatically when backend calculations complete

#### Workflow
1. User fills required fields (store, product, currency, purchase_unit, supplier, date_of_arrived)
2. User starts entering calculation trigger fields
3. Frontend sends async request to `/api/v1/items/stock/calculate/`
4. Backend responds with `dynamic_fields` object
5. Frontend updates form fields based on response (show/hide, enable/disable, set values)
6. Final submission includes both user input and calculated values

### 3. Edit Stock Form (`/src/core/pages/edit-stock-2.tsx`)
**Complete rewrite with same backend-driven approach:**

#### Additional Features for Edit Mode
- **Initial Data Loading**: Populates form with existing stock data
- **Currency/Unit Inference**: Attempts to determine currency and purchase unit from existing data
- **Calculation Preservation**: Preserves existing calculated values until user modifies input
- **Backward Compatibility**: Handles stocks created with old system

#### Data Loading Strategy
1. Loads existing stock data from API
2. Maps old field names to new structure
3. Infers currency from `exchange_rate_read` if available
4. Infers purchase unit from product measurements
5. Sets initial dynamic fields from existing calculated values
6. Enables real-time recalculation when user modifies inputs

### 4. Dynamic Field System
Both forms implement a sophisticated dynamic field system:

#### Field Configuration
```typescript
interface DynamicField {
  value: number | string | null;
  editable: boolean;    // Controls if field is read-only
  show: boolean;        // Controls if field is visible
  label: string;        // Dynamic label from backend
}
```

#### Field Types
- **Base Fields**: Always visible required fields (store, product, etc.)
- **Calculation Input Fields**: User-editable trigger fields
- **Dynamic Calculated Fields**: Backend-controlled fields with dynamic visibility/editability

### 5. API Integration
#### Request Format
```json
{
  "store": 1,
  "product": 4,
  "currency": 2,
  "purchase_unit": 3,
  "supplier": 1,
  "date_of_arrived": "2025-10-04",
  "exchange_rate": 1,
  "purchase_unit_quantity": 5,
  "total_price_in_currency": 500,
  "price_per_unit_currency": null
}
```

#### Response Format
```json
{
  "dynamic_fields": {
    "quantity": { 
      "value": 2500.0, 
      "editable": false, 
      "show": true, 
      "label": "Количество (м)" 
    },
    "total_price_in_uz": { 
      "value": 6500000.0, 
      "editable": false, 
      "show": true, 
      "label": "Общая стоимость (UZS)" 
    }
  }
}
```

## Benefits Achieved

### 1. **Centralized Business Logic**
- All calculation logic moved to backend
- Consistent calculations across all clients
- Easier to maintain and update business rules

### 2. **Dynamic UI**
- Fields appear/disappear based on business rules
- Fields become editable/read-only based on context
- Labels are dynamic and can be localized on backend

### 3. **Real-time Feedback**
- Users see calculated values immediately
- Prevents invalid data entry
- Better user experience with instant validation

### 4. **Maintainability**
- Frontend only handles UI logic
- Backend handles all business rules
- Clear separation of concerns

### 5. **Flexibility**
- Easy to add new calculation fields
- Easy to modify business rules without frontend changes
- Supports complex calculation scenarios

## Files Modified

### New Files
- `/src/core/pages/create-stock.tsx` - Completely rewritten
- `/src/core/pages/edit-stock-2.tsx` - Completely rewritten

### Modified Files
- `/src/core/api/stock.ts` - Added calculation types and functions

### Backup Files Created
- `/src/core/pages/create-stock-old.tsx` - Original create form
- `/src/core/pages/edit-stock-2-old.tsx` - Original edit form

## Testing Recommendations

1. **Basic Workflow Testing**
   - Test form with all required fields
   - Test calculation triggers
   - Test form submission

2. **Edge Cases**
   - Test with missing required fields
   - Test with invalid calculation inputs
   - Test backend calculation errors

3. **Edit Mode Testing**
   - Test loading existing stock data
   - Test modifying existing calculations
   - Test backward compatibility with old data

4. **Performance Testing**
   - Test debounced API calls
   - Test with slow backend responses
   - Test concurrent calculations

## Future Enhancements

1. **Error Handling**: Add more sophisticated error handling for calculation failures
2. **Offline Support**: Cache calculation results for offline scenarios  
3. **Validation**: Add client-side validation before sending calculation requests
4. **Loading States**: Add more granular loading indicators for better UX
5. **Field Dependencies**: Support more complex field dependency scenarios

## Conclusion

The refactoring successfully removes all calculation logic from the frontend and implements a robust backend-driven system. The forms are now more maintainable, flexible, and provide better user experience through dynamic field rendering and real-time calculations.
