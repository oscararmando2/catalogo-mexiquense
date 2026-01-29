# Especiales to Products Synchronization

## Overview
This feature automatically creates or updates products in the main catalog when special prices (especiales) are added. This ensures that all items in the "ESPECIALES" section are also available in the "PRODUCTOS" catalog with their special price information.

## Problem Statement
When users add special price items to the "ESPECIALES" section, they need those items to be automatically reflected in the main products catalog to maintain consistency and avoid duplicate data entry. The system should:

1. Check if a product already exists (by UPC or Item Code)
2. If it exists, update it with the special price as a custom field
3. If it doesn't exist, create a new product with all available information
4. Store the special price as a custom field, not as the regular cost

## Implementation Details

### 1. New Field: Item Code
Added an optional "Item Code" field to the especiales form:
- **Field ID**: `especialItemNumber`
- **Location**: Between UPC and "Última Compra" fields
- **Purpose**: Allows matching products by both UPC and Item Code

### 2. Enhanced addEspecial Function
**Signature**: `async function addEspecial(nombre, upc, itemNumber, antes, precio, imageUrl, proveedor, notas = '')`

**Changes**:
- Added `itemNumber` parameter
- Stores itemNumber in the especial object
- Calls `syncProductFromEspecial()` to sync with products catalog
- Returns action status ('created', 'updated', or null)
- Shows appropriate toast message based on action

### 3. New Function: syncProductFromEspecial
**Signature**: `async function syncProductFromEspecial(especial)`

**Purpose**: Creates or updates products based on especial data

**Logic**:
```javascript
1. Search for existing product by UPC or itemNumber
2. If product exists:
   - Add/update "Precio Especial" custom field
   - Update image URL if product doesn't have one
   - Save and re-render
   - Return 'updated'
3. If product doesn't exist:
   - Create new product with:
     * Generated ID
     * Item Number from especial (or 'N/A')
     * Name and description from especial
     * UPC from especial
     * Cost from "Última Compra" (antes)
     * Image URL from especial
     * Custom fields: "Precio Especial" and "Proveedor"
   - Save and re-render
   - Return 'created'
```

### 4. Enhanced deleteEspecial Function
**Changes**:
- Finds corresponding product by UPC or itemNumber
- Removes "Precio Especial" custom field from product
- Saves products after cleanup
- Maintains data consistency

### 5. UI Enhancements
- Displays Item Code in especiales cards (if present)
- Search functionality includes itemNumber
- Toast messages indicate whether product was created or updated

## Data Structure

### Especial Object
```javascript
{
  id_price: number,
  nombre: string,
  upc: string,
  itemNumber: string,      // NEW
  antes: number,
  price: number,
  imageUrl: string,
  proveedor: string,
  notas: string
}
```

### Product Object (created from especial)
```javascript
{
  id: string,
  itemNumber: string,      // From especial.itemNumber or 'N/A'
  description: string,     // From especial.nombre
  upc: string,            // From especial.upc
  nombre: string,         // From especial.nombre
  size: 'N/A',           // Default
  qty: 1,                // Default
  costo: number,         // From especial.antes (Última Compra)
  url: string,           // From especial.imageUrl
  customFields: {
    'Precio Especial': string,  // Formatted currency from especial.price
    'Proveedor': string         // From especial.proveedor
  },
  dateAdded: number      // Timestamp
}
```

## Usage Example

### Scenario 1: Creating a new especial for an existing product
```
User inputs:
- Nombre: Knorr Caldo Sazonados 2.2 lb
- UPC: 048001011687
- Item Code: 0700143
- Última Compra: $7.31
- Precio Especial: $6.44
- Image URL: https://example.com/knorr.jpg
- Proveedor: AWG

Result:
- Especial is created
- Existing product (if found by UPC or Item Code) is updated with:
  * Custom field "Precio Especial" = "$6.44"
- Toast: "Especial agregado y producto actualizado con precio especial"
```

### Scenario 2: Creating a new especial for a non-existent product
```
User inputs:
- Nombre: XL-3 COLD MEDICINE 20 CT
- UPC: 00064598100021
- Item Code: 0691584
- Última Compra: $3.45
- Precio Especial: $2.83
- Image URL: https://example.com/xl3.jpg
- Proveedor: AWG

Result:
- Especial is created
- New product is created with:
  * itemNumber: 0691584
  * nombre: XL-3 COLD MEDICINE 20 CT
  * upc: 00064598100021
  * costo: 3.45 (from Última Compra)
  * customFields: { "Precio Especial": "$2.83", "Proveedor": "AWG" }
- Toast: "Especial agregado y producto nuevo creado en el catálogo"
```

### Scenario 3: Deleting an especial
```
User deletes an especial

Result:
- Especial is removed from especiales array
- Corresponding product (if found) has "Precio Especial" custom field removed
- Product remains in catalog with regular information
- Toast: "Especial eliminado correctamente"
```

## Benefits

1. **No Duplicate Data Entry**: Users only need to enter special price information once
2. **Consistency**: All especiales automatically appear in products catalog
3. **Flexibility**: Can match by UPC or Item Code
4. **Special Price Tracking**: Special prices are stored as custom fields, not replacing regular cost
5. **Image Sync**: If product doesn't have an image but especial does, it's copied
6. **Cleanup**: Removing an especial also removes its special price from the product

## Technical Notes

- Uses Firebase/localStorage for data persistence
- Async/await pattern for proper save sequencing
- Duplicate checking by both UPC and itemNumber
- Custom fields are preserved and extended, not replaced
- Re-renders admin and public views after sync
- Console logging for debugging and monitoring

## Testing Recommendations

1. Test creating especial for existing product (should update)
2. Test creating especial for new product (should create)
3. Test creating especial with only UPC (no Item Code)
4. Test creating especial with only Item Code (no UPC - not recommended)
5. Test deleting especial (should clean up custom field)
6. Test search functionality with Item Code
7. Verify special price appears in product details
8. Verify regular cost is not affected by special price
9. Test Firebase sync with multiple browser tabs
10. Test localStorage fallback when Firebase is unavailable

## Future Enhancements

Potential improvements:
- Bulk import of especiales from CSV
- Edit especial functionality (currently only add/delete)
- Date range for special prices (start/end dates)
- Automatic expiration of special prices
- Discount percentage calculation and display
- History tracking of price changes
- Notification when special price is applied
