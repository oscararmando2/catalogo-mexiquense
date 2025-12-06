# Test Cases for Fixes

## Overview
This document outlines test cases to verify the three issues have been fixed:
1. Especiales mobile connectivity
2. Credit notification frequency
3. Discount percentage calculation

---

## Test Case 1: Especiales Mobile Connectivity

### Test 1.1: Good Connection
**Steps:**
1. Open application on mobile device with good WiFi
2. Navigate to "Especiales" section
3. Observe if especiales load immediately
4. Check browser console for "Firebase keepSynced enabled"
5. Check for "🟢 Firebase connected" message

**Expected Result:**
- Especiales load successfully
- No errors in console
- Green connection indicator appears

**Pass/Fail:** _____

---

### Test 1.2: Poor Connection
**Steps:**
1. Open application on mobile device with weak 3G/4G
2. Navigate to "Especiales" section
3. Wait up to 5 seconds for initial load
4. If fails, observe retry after 2 seconds
5. Check console for "Retrying especiales load..."

**Expected Result:**
- Especiales eventually load (may take up to 7 seconds)
- Retry mechanism activates if initial load fails
- Falls back to localStorage if all retries fail

**Pass/Fail:** _____

---

### Test 1.3: Offline to Online
**Steps:**
1. Enable airplane mode on mobile device
2. Open application
3. Navigate to "Especiales" section
4. Disable airplane mode
5. Wait for connection to restore
6. Refresh page if needed

**Expected Result:**
- Cached data shows immediately when offline
- Console shows "🔴 Firebase disconnected - using cached data"
- After going online, console shows "🟢 Firebase connected"
- Data syncs automatically

**Pass/Fail:** _____

---

### Test 1.4: Corrupted localStorage
**Steps:**
1. Open browser developer tools
2. Go to Application > Local Storage
3. Find 'especiales' key
4. Modify value to invalid JSON (e.g., `{broken`)
5. Refresh page
6. Check console for error handling

**Expected Result:**
- Console shows "Error parsing especiales from localStorage"
- Corrupted data is removed
- Application doesn't crash
- Falls back to empty array or Firebase data

**Pass/Fail:** _____

---

## Test Case 2: Credit Notification Frequency

### Test 2.1: First Page Load with Overdue Credit
**Steps:**
1. Ensure at least one credit with date > 7 days ago exists
2. Close and reopen browser (new session)
3. Load application
4. Wait 3 seconds (CREDIT_INITIAL_CHECK_DELAY)
5. Observe notification

**Expected Result:**
- Notification appears once: "⚠️ Tienes X crédito(s) con más de 7 días pendiente(s)."
- Notification does not appear again during this session

**Pass/Fail:** _____

---

### Test 2.2: Navigation After Notification
**Steps:**
1. After notification appears (from Test 2.1)
2. Navigate to "Productos" section
3. Navigate to "Especiales" section
4. Navigate back to "Créditos" section
5. Observe if notification appears again

**Expected Result:**
- Notification does NOT appear again
- `creditNotificationShown` flag prevents re-display

**Pass/Fail:** _____

---

### Test 2.3: New Session
**Steps:**
1. Complete Test 2.1 and Test 2.2
2. Close browser completely
3. Reopen browser and load application
4. Wait 3 seconds

**Expected Result:**
- Notification appears again (new session)
- This is expected behavior - notification shows once per session

**Pass/Fail:** _____

---

### Test 2.4: No Overdue Credits
**Steps:**
1. Ensure no credits with date > 7 days ago exist
2. Load application
3. Wait 10 seconds
4. Observe that no notification appears

**Expected Result:**
- No credit notification appears
- Application functions normally

**Pass/Fail:** _____

---

## Test Case 3: Discount Percentage Calculation

### Test 3.1: Price Decrease (Discount)
**Steps:**
1. Navigate to "Especiales" section
2. Add new especial:
   - Última Compra: $10.00
   - Precio Especial: $8.00
3. Save and observe badge

**Expected Result:**
- Red badge displays "-20%"
- Badge positioned at top-left of card
- Calculation: (10 - 8) / 10 * 100 = 20%

**Pass/Fail:** _____

---

### Test 3.2: Price Increase
**Steps:**
1. Navigate to "Especiales" section
2. Add new especial:
   - Última Compra: $0.50
   - Precio Especial: $0.54
3. Save and observe badge

**Expected Result:**
- Orange badge displays "✕ +8%"
- ✕ symbol clearly visible
- Calculation: |0.50 - 0.54| / 0.50 * 100 = 8%
- Orange background (bg-orange-500)

**Pass/Fail:** _____

---

### Test 3.3: Equal Prices
**Steps:**
1. Navigate to "Especiales" section
2. Add new especial:
   - Última Compra: $5.00
   - Precio Especial: $5.00
3. Save and observe badge

**Expected Result:**
- NO badge appears
- Card displays normally without percentage indicator

**Pass/Fail:** _____

---

### Test 3.4: Extreme Price Increase
**Steps:**
1. Navigate to "Especiales" section
2. Add new especial:
   - Última Compra: $1.00
   - Precio Especial: $2.50
3. Save and observe badge

**Expected Result:**
- Orange badge displays "✕ +150%"
- Calculation: |1.00 - 2.50| / 1.00 * 100 = 150%

**Pass/Fail:** _____

---

### Test 3.5: Large Price Decrease
**Steps:**
1. Navigate to "Especiales" section
2. Add new especial:
   - Última Compra: $100.00
   - Precio Especial: $25.00
3. Save and observe badge

**Expected Result:**
- Red badge displays "-75%"
- Calculation: (100 - 25) / 100 * 100 = 75%

**Pass/Fail:** _____

---

## Test Case 4: Code Quality and Performance

### Test 4.1: Console Errors
**Steps:**
1. Open browser developer tools
2. Navigate through all sections of application
3. Observe console for any errors

**Expected Result:**
- No JavaScript errors in console
- Only informational logs appear
- Connection status logs are clear

**Pass/Fail:** _____

---

### Test 4.2: Performance
**Steps:**
1. Open application
2. Navigate to "Especiales" section
3. Measure time to load especiales
4. Add/delete several especiales
5. Observe responsiveness

**Expected Result:**
- Especiales load within 3 seconds on good connection
- UI remains responsive during operations
- No lag when adding/deleting items

**Pass/Fail:** _____

---

## Summary

### Pass Rate
- Test Case 1 (Especiales): ___/4 passed
- Test Case 2 (Notifications): ___/4 passed
- Test Case 3 (Discount): ___/5 passed
- Test Case 4 (Quality): ___/2 passed

**Total:** ___/15 passed

### Notes
[Add any additional observations or issues discovered during testing]

---

## Regression Testing Checklist

Ensure existing functionality still works:
- [ ] Products section loads and displays correctly
- [ ] Search functionality works in all sections
- [ ] Admin panel authentication works
- [ ] CRUD operations for products work
- [ ] CSV import/export works
- [ ] Créditos section displays and functions correctly
- [ ] Mobile menu opens and closes properly
- [ ] All modals open and close correctly
- [ ] Image loading and error handling works
- [ ] Firebase sync works for products and credits

---

## Test Environment

**Date Tested:** _____________

**Browser:** _____________

**OS:** _____________

**Device:** _____________

**Network:** _____________

**Tester:** _____________
