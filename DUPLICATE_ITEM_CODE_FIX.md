# Fix: Duplicate Item Code Validation

## Problem Statement
Multiple products and especiales (special prices) in the catalog were using the same Item Code, which is incorrect. Each product should have a unique Item Code to properly identify and manage inventory.

## Solution Implemented
Added comprehensive validation to prevent duplicate Item Codes globally across both products and especiales collections.

## Changes Made

### 1. Unified Validation Function
Created `isDuplicateItemCode(itemNumber, excludeProductId, excludeEspecialId)` that:
- Checks for duplicates across **both** products and especiales collections
- Returns `true` if the item code is already in use by another product or especial
- Allows excluding the current product/especial being edited
- Skips validation for empty or "N/A" item codes

### 2. Product Form Validation
- Added validation before saving new products
- Added validation before updating existing products
- Shows user-friendly error message: "El Item Code 'XXXX' ya está en uso por otro producto o especial. Por favor, use un código diferente."

### 3. Especial Form Validation
- Added validation before saving new especiales
- Added validation before updating existing especiales
- Uses the same unified validation function to check globally

### 4. CSV Import Validation
- Added validation during CSV product imports
- Products with duplicate Item Codes are skipped and counted as errors
- Error messages logged to console: "Fila X: Item Code duplicado 'XXXX' - producto omitido"

### 5. Inline Item Code Editing
- Added validation when editing Item Codes directly in the admin view
- Restores original value if duplicate is detected
- Prevents accidental duplication during quick edits

## Files Modified
- `script.js` - JavaScript file with validation logic
- `index.html` - HTML file with embedded JavaScript (contains duplicate logic for standalone operation)

## Testing
All validation scenarios have been tested:
1. ✅ Duplicate item code in products
2. ✅ Duplicate item code in especiales
3. ✅ Duplicate across both collections
4. ✅ New unique item codes allowed
5. ✅ Empty and "N/A" item codes allowed
6. ✅ Editing with exclusion works correctly
7. ✅ Cross-collection validation works

## Security
- ✅ CodeQL security scan passed with no vulnerabilities
- All user input is sanitized before validation
- No SQL injection or XSS vulnerabilities introduced

## Why Global Uniqueness?
Item codes serve as unique identifiers in the catalog system. A product and a special price (especial) having the same item code would create ambiguity when:
- Searching for products by item code
- Identifying products in the inventory
- Managing stock and pricing
- Generating reports

Therefore, item codes must be unique across the entire system, not just within each collection.

## User Impact
Users will now receive clear error messages when attempting to:
- Add a new product with a duplicate item code
- Edit an existing product to use a duplicate item code
- Add a new especial with a duplicate item code
- Edit an existing especial to use a duplicate item code
- Import CSV files containing duplicate item codes

This ensures data integrity and prevents confusion in inventory management.
