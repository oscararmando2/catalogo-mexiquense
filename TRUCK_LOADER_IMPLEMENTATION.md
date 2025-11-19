# Truck Loader Implementation Guide

## Overview
This document describes the implementation of the animated truck loader that displays for 4 seconds when the page loads or refreshes.

## Features
- ✅ Displays on page load/refresh
- ✅ 4-second display duration
- ✅ Smooth fade-out transition (0.5s)
- ✅ Fully responsive (mobile and desktop)
- ✅ Animated spinning wheels
- ✅ Glowing headlights and taillights
- ✅ Detailed truck graphics with windows, body panels, and accessories
- ✅ Purple gradient background
- ✅ "Cargando..." text with pulse animation

## Implementation Details

### 1. HTML Structure (index.html)
The truck loader is positioned at the very start of the `<body>` tag, before all other content:

```html
<div id="truckLoader" class="truck-loader-overlay">
    <div class="truck-loader-container">
        <div class="truck">
            <!-- Complete truck structure with body, wheels, lights, etc. -->
        </div>
        <p class="truck-loader-text">Cargando...</p>
    </div>
</div>
```

**Location:** Lines 70-129 in `index.html`

### 2. CSS Styling (styles.css)
All truck loader styles are contained in a dedicated section with the following components:

#### Overlay Container
```css
.truck-loader-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    z-index: 99999;
    /* ... transition properties ... */
}
```

#### Responsive Breakpoints
- **Desktop (default):** 220px truck width, 24px text
- **Tablet (≤768px):** 180px truck width, 18px text
- **Mobile (≤480px):** 150px truck width, 16px text

#### Key Animations
- **Wheel Spin:** 0.35s infinite linear rotation
- **Text Pulse:** 2s infinite pulse effect
- **Fade-out:** 0.5s ease-out opacity transition

**Location:** Lines 177-770 in `styles.css`

### 3. JavaScript Control (script.js)

#### Main Function
```javascript
function hideTruckLoader() {
    const loader = document.getElementById('truckLoader');
    if (!loader) return;
    
    // Wait 4 seconds before hiding
    setTimeout(() => {
        loader.classList.add('fade-out');
        
        // Remove from DOM after fade completes (500ms)
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 500);
    }, 4000);
}
```

#### Integration
The function is called in the `init()` function at the very start, ensuring the loader is visible during page initialization:

```javascript
function init() {
    // Hide truck loader after 4 seconds
    hideTruckLoader();
    
    // ... rest of initialization ...
}
```

**Location:** Lines 2641-2657 in `script.js`

## Timeline

```
Page Load
    ↓
Truck Loader Visible (z-index: 99999)
    ↓
[4000ms delay]
    ↓
Fade-out starts (opacity: 1 → 0)
    ↓
[500ms transition]
    ↓
Loader hidden (display: none)
    ↓
Main content fully visible
```

## Responsive Design

### Desktop (>768px)
- Truck width: 220px (variable --width: 220)
- Text size: 24px
- Full details visible

### Tablet (≤768px)
- Truck width: 180px
- Text size: 18px
- Optimized for medium screens

### Mobile (≤480px)
- Truck width: 150px
- Text size: 16px
- Compact but fully functional

## Browser Compatibility
- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ CSS animations supported
- ✅ CSS clip-path for truck shapes
- ✅ Flexbox layout
- ✅ CSS custom properties (CSS variables)

## Customization Options

### Change Display Duration
Modify the timeout in `script.js`:
```javascript
setTimeout(() => {
    // Change 4000 to desired milliseconds
}, 4000);
```

### Change Background Gradient
Modify in `styles.css`:
```css
.truck-loader-overlay {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    /* Replace with your gradient colors */
}
```

### Change Truck Size
Adjust the CSS variable:
```css
.truck {
    --width: 220; /* Change this value */
}
```

### Change Loading Text
Edit in `index.html`:
```html
<p class="truck-loader-text">Cargando...</p>
```

## Performance Notes
- The loader uses CSS animations which are GPU-accelerated
- After hiding, the loader is removed from the DOM to free memory
- Z-index of 99999 ensures it appears above all content
- Fade-out transition provides smooth UX

## Testing
To test the loader:
1. Open the application in a browser
2. The loader should appear immediately
3. After 4 seconds, it should fade out smoothly
4. Refresh the page to see it again

## Troubleshooting

### Loader doesn't appear
- Check that `truckLoader` element exists in HTML
- Verify CSS is properly linked
- Check browser console for errors

### Loader doesn't disappear
- Verify `hideTruckLoader()` is called in `init()`
- Check JavaScript console for errors
- Ensure no JavaScript errors block execution

### Animations don't work
- Verify browser supports CSS animations
- Check for CSS syntax errors
- Test in different browsers

## File Locations
- **HTML:** `/home/runner/work/catalogo-mexiquense/catalogo-mexiquense/index.html`
- **CSS:** `/home/runner/work/catalogo-mexiquense/catalogo-mexiquense/styles.css`
- **JavaScript:** `/home/runner/work/catalogo-mexiquense/catalogo-mexiquense/script.js`

## Credits
Truck animation based on CSS artwork techniques with custom responsive adaptations for the MEXIQUENSE catalog application.
