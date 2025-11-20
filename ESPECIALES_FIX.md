# Fix for Especiales Deletion Issue

## Problem Description
When users deleted "especiales" (special price items), the items would reappear immediately after deletion. This was caused by a race condition in the Firebase real-time synchronization.

## Root Cause
The issue occurred due to the following sequence:

1. User clicks delete button
2. `deleteEspecial()` filters the array locally: `especiales = especiales.filter(...)`
3. `saveEspeciales()` is called to save to Firebase
4. **BUT** before the Firebase save completes, the `.on('value')` listener fires with OLD data
5. The listener overwrites the filtered array with the old data
6. Result: Deleted items reappear

## Solution Implemented
Added a semaphore flag `isSavingEspeciales` to prevent the Firebase listener from overwriting local changes during save operations.

### Changes Made

#### 1. Added global flag
```javascript
let isSavingEspeciales = false; // Flag to prevent listener from overwriting during save
```

#### 2. Modified `loadEspeciales()` 
Added check to skip listener updates during save:
```javascript
database.ref('especiales').on('value', (snapshot) => {
    // Don't overwrite local changes while we're saving
    if (isSavingEspeciales) {
        console.log('Skipping especiales update from Firebase - save in progress');
        return;
    }
    // ... rest of the listener code
});
```

#### 3. Modified `saveEspeciales()`
Set flag at start and clear it after save completes:
```javascript
function saveEspeciales() {
    return new Promise((resolve) => {
        try {
            // Set flag to prevent listener from overwriting during save
            isSavingEspeciales = true;
            
            // ... save logic ...
            
            // Clear the flag after a short delay to ensure Firebase has propagated
            setTimeout(() => {
                isSavingEspeciales = false;
            }, 500);
        } catch (err) {
            isSavingEspeciales = false; // Clear flag on error
        }
    });
}
```

## How to Test
1. Open the application in a browser
2. Navigate to "Especiales" view
3. Add several test items
4. Delete one or more items
5. Verify that deleted items do NOT reappear
6. Refresh the page to ensure changes persisted
7. Verify deleted items are still gone after refresh

## Additional Benefits
- Works with both Firebase and localStorage fallback
- Prevents data corruption during concurrent operations
- Maintains data consistency across sessions
- Improves user experience by preventing unexpected UI behavior

## Technical Notes
- The 500ms delay ensures Firebase has time to propagate the changes before re-enabling the listener
- The flag is cleared on error to prevent the listener from being permanently disabled
- This fix doesn't affect other Firebase operations (products, credits)
