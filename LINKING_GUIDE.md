# DDP Calculator - Linking & Navigation Guide

## Overview

This guide explains how to handle in-app linking and navigation within the DDP Calculator, especially when deployed behind reverse proxies or as part of larger applications.

## Table of Contents

- [Navigation Architecture](#navigation-architecture)
- [Linking Best Practices](#linking-best-practices)
- [Common Navigation Patterns](#common-navigation-patterns)
- [SessionStorage Communication](#sessionstorage-communication)
- [Reverse Proxy Considerations](#reverse-proxy-considerations)
- [Troubleshooting Navigation Issues](#troubleshooting-navigation-issues)

---

## Navigation Architecture

### Application Structure

The DDP Calculator consists of two main pages:

1. **Main Calculator** (`index.html`)
   - Entry point
   - Cost calculation interface
   - Results display
   - Navigation to quotation page

2. **Quotation Builder** (`quotation.html`)
   - Receives data from main calculator
   - Generates professional quotations
   - PDF export functionality

### Data Flow

```
Main Calculator (index.html)
    ↓
    └─ User clicks "Generate Quotation"
    ↓
    └─ Store data in SessionStorage
    ↓
    └─ Open quotation.html in new tab
    ↓
Quotation Builder (quotation.html)
    ↓
    └─ Read data from SessionStorage
    ↓
    └─ Display quotation interface
```

---

## Linking Best Practices

### Rule #1: Use Relative Paths

**✅ CORRECT - Relative Path:**
```javascript
// Opens quotation.html in same directory
window.open('quotation.html', '_blank');
```

**❌ WRONG - Absolute Path:**
```javascript
// Navigates to root, ignoring current path context
window.open('/quotation.html', '_blank');
```

### Why Relative Paths Matter

When deployed behind a reverse proxy with path prefixes:

**Scenario:** App deployed at `https://example.com/ddp-calculator/`

| Code | Opens URL | Result |
|------|-----------|--------|
| `window.open('quotation.html')` | `https://example.com/ddp-calculator/quotation.html` | ✅ Works |
| `window.open('/quotation.html')` | `https://example.com/quotation.html` | ❌ 404 Error |

### Rule #2: Target New Tab for Quotation

Always use `_blank` target to preserve calculator state:

```javascript
window.open('quotation.html', '_blank');
```

**Benefits:**
- Calculator remains open
- User can generate multiple quotations
- SessionStorage data persists
- No navigation history issues

### Rule #3: Never Use window.location for Cross-Page Navigation

**❌ WRONG:**
```javascript
window.location.href = 'quotation.html'; // Replaces current page
```

**✅ CORRECT:**
```javascript
window.open('quotation.html', '_blank'); // Opens in new tab
```

---

## Common Navigation Patterns

### Pattern 1: Navigate to Quotation Page

**Location:** `src/components/ResultsPanel.jsx`

```javascript
const handleGenerateQuotation = () => {
    // 1. Prepare data
    const quotationItems = itemBreakdowns.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitType: item.unitType,
        ddpPerUnit: item.ddpPerUnit
    }));

    // 2. Store in SessionStorage
    sessionStorage.setItem('quotationItems', JSON.stringify(quotationItems));

    // 3. Open quotation page (RELATIVE PATH!)
    window.open('quotation.html', '_blank');
};
```

### Pattern 2: Return to Calculator

**Location:** `src/quotation/QuotationApp.jsx`

```javascript
const handleBackToCalculator = () => {
    // Simply close the quotation tab
    window.close();

    // Or navigate back to calculator (relative path)
    window.location.href = './'; // or 'index.html'
};
```

### Pattern 3: External Links

For external links (documentation, support, etc.):

```javascript
// Always use absolute URLs for external links
const handleOpenDocs = () => {
    window.open('https://arabiantraderoute.com/docs', '_blank');
};
```

---

## SessionStorage Communication

### Writing Data (Main Calculator)

```javascript
// Store complex objects as JSON
const data = {
    items: [...],
    settings: {...},
    timestamp: new Date().toISOString()
};

sessionStorage.setItem('quotationItems', JSON.stringify(data));
```

### Reading Data (Quotation Page)

```javascript
// Read and parse JSON data
const storedData = sessionStorage.getItem('quotationItems');
const data = storedData ? JSON.parse(storedData) : null;

if (!data) {
    // Handle missing data scenario
    console.warn('No quotation data found');
    // Show empty state or redirect back
}
```

### Best Practices for SessionStorage

1. **Always JSON.stringify() objects**
   ```javascript
   // ✅ CORRECT
   sessionStorage.setItem('data', JSON.stringify(myObject));

   // ❌ WRONG - stores "[object Object]"
   sessionStorage.setItem('data', myObject);
   ```

2. **Always validate parsed data**
   ```javascript
   try {
       const data = JSON.parse(sessionStorage.getItem('data'));
       if (!data || !data.items) {
           throw new Error('Invalid data');
       }
   } catch (error) {
       console.error('Failed to parse data:', error);
       // Handle error
   }
   ```

3. **Clear data when appropriate**
   ```javascript
   // After quotation is generated
   sessionStorage.removeItem('quotationItems');

   // Or clear all session data
   sessionStorage.clear();
   ```

### SessionStorage Limitations

- **Scope:** Same origin only (protocol + domain + port)
- **Lifetime:** Until browser tab/window closes
- **Storage:** ~5-10MB depending on browser
- **Synchronous:** Blocks JavaScript execution

**Important:** SessionStorage is NOT shared between:
- Different domains
- Different subdomains (unless configured)
- Different ports
- Different protocols (http vs https)

---

## Reverse Proxy Considerations

### Path Prefix Stripping

When deployed behind Traefik or nginx with path prefix:

**External URL:** `https://example.com/ddp-calculator/`
**Internal URL:** `http://container/`

**Traefik StripPrefix Middleware:**
```yaml
labels:
  - "traefik.http.middlewares.strip-ddp.stripprefix.prefixes=/ddp-calculator"
  - "traefik.http.routers.ddp-calc.middlewares=strip-ddp"
```

**Result:**
- Browser requests: `https://example.com/ddp-calculator/quotation.html`
- Container receives: `GET /quotation.html`

### Base URL Handling

If you need to reference the base URL dynamically:

```javascript
// Get current base path
const getBasePath = () => {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);

    // If path includes ddp-calculator, include it
    if (segments.includes('ddp-calculator')) {
        return '/ddp-calculator/';
    }

    return '/';
};

// Use in navigation
const basePath = getBasePath();
window.open(`${basePath}quotation.html`, '_blank');
```

**However:** Using relative paths is simpler and more reliable:
```javascript
// Much simpler - just use relative path
window.open('quotation.html', '_blank');
```

### Asset Loading

Assets are automatically resolved relative to page location:

```html
<!-- Relative asset loading -->
<script type="module" src="/assets/quotation-[hash].js"></script>
<link rel="stylesheet" href="/assets/index-[hash].css">
<img src="/logo-standalone-web.png" alt="Logo">
```

These work correctly because:
1. Vite generates paths starting with `/`
2. Browser resolves `/` relative to current origin
3. Reverse proxy handles path rewriting

---

## Troubleshooting Navigation Issues

### Issue: Quotation Page Not Found (404)

**Symptoms:**
- Clicking "Generate Quotation" shows 404 error
- Browser URL shows wrong path

**Diagnosis:**
```javascript
// Add debug logging
const handleGenerateQuotation = () => {
    console.log('Current URL:', window.location.href);
    console.log('Opening:', 'quotation.html');

    sessionStorage.setItem('quotationItems', JSON.stringify(data));
    window.open('quotation.html', '_blank');
};
```

**Solutions:**
1. Check for absolute paths (`/quotation.html`) - change to relative (`quotation.html`)
2. Verify Traefik StripPrefix is configured correctly
3. Check nginx configuration for correct root directory
4. Verify both HTML files exist in build output

### Issue: SessionStorage Data Not Available

**Symptoms:**
- Quotation page is blank
- "No data found" message appears
- Console shows parsing errors

**Diagnosis:**
```javascript
// Debug SessionStorage
console.log('All SessionStorage keys:', Object.keys(sessionStorage));
console.log('quotationItems:', sessionStorage.getItem('quotationItems'));
```

**Solutions:**
1. **Same Origin Issue:** Ensure both pages served from same domain
   ```javascript
   // Check origins match
   console.log('Origin:', window.location.origin);
   ```

2. **Data Not Set:** Verify data is stored before navigation
   ```javascript
   sessionStorage.setItem('quotationItems', JSON.stringify(data));
   console.log('Stored:', sessionStorage.getItem('quotationItems'));
   ```

3. **Popup Blocked:** Check if browser blocked popup
   ```javascript
   const popup = window.open('quotation.html', '_blank');
   if (!popup) {
       alert('Please allow popups for this site');
   }
   ```

### Issue: Navigation Loops/Redirects

**Symptoms:**
- Page keeps redirecting
- Infinite loading
- Browser shows too many redirects error

**Causes:**
1. Middleware redirecting incorrectly
2. Authentication intercepting requests
3. Wrong base path configuration

**Solutions:**
1. Check Traefik/nginx redirect rules
2. Verify authentication allows both pages
3. Add logging to track redirect chain

### Issue: Assets Load But Page is Blank

**Symptoms:**
- No errors in console
- Network tab shows all assets loaded
- React app not rendering

**Diagnosis:**
```javascript
// Check React root mounting
console.log('Root element:', document.getElementById('root'));
console.log('React version:', React.version);
```

**Solutions:**
1. Verify `<div id="root"></div>` exists in HTML
2. Check JavaScript console for render errors
3. Verify entry point file is loaded correctly
4. Check for CSS that hides content

---

## Testing Navigation

### Manual Testing Checklist

- [ ] Main calculator loads at base URL
- [ ] Click "Generate Quotation" opens new tab
- [ ] Quotation page loads with correct data
- [ ] Close quotation tab - calculator still open
- [ ] Generate multiple quotations - all work
- [ ] Refresh quotation page - data persists
- [ ] Close all tabs - SessionStorage cleared
- [ ] Direct URL to quotation - handles missing data gracefully

### Automated Testing (Example)

```javascript
// Cypress test example
describe('Navigation', () => {
    it('should navigate to quotation page', () => {
        cy.visit('/');

        // Add items and calculate
        cy.get('[data-testid="add-item"]').click();
        cy.get('[data-testid="calculate"]').click();

        // Click generate quotation
        cy.get('[data-testid="generate-quotation"]').click();

        // Switch to new window
        cy.window().then(win => {
            cy.stub(win, 'open').callsFake(url => {
                expect(url).to.equal('quotation.html');
            });
        });
    });
});
```

---

## Best Practices Summary

✅ **DO:**
- Use relative paths for internal navigation
- Open quotation in new tab (`_blank`)
- Store data in SessionStorage before navigation
- Handle missing SessionStorage data gracefully
- Add console logging for debugging
- Test navigation in production-like environment

❌ **DON'T:**
- Use absolute paths for internal links
- Use `window.location.href` for cross-page navigation
- Assume SessionStorage data always exists
- Forget to JSON.stringify objects
- Navigate without storing data first
- Mix relative and absolute paths inconsistently

---

## Code Examples

### Complete Navigation Flow

**ResultsPanel.jsx:**
```javascript
import { useState } from 'react';

const ResultsPanel = ({ results, items, settings }) => {
    const handleGenerateQuotation = () => {
        try {
            // Prepare quotation data
            const quotationData = {
                items: results.itemBreakdowns.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitType: item.unitType,
                    price: item.ddpPerUnit
                })),
                metadata: {
                    timestamp: new Date().toISOString(),
                    settings: settings
                }
            };

            // Store in SessionStorage
            sessionStorage.setItem('quotationItems', JSON.stringify(quotationData));

            // Open quotation page
            const popup = window.open('quotation.html', '_blank');

            if (!popup) {
                alert('Please enable popups to generate quotations');
            }
        } catch (error) {
            console.error('Failed to generate quotation:', error);
            alert('Failed to generate quotation. Please try again.');
        }
    };

    return (
        <button onClick={handleGenerateQuotation}>
            Generate Quotation
        </button>
    );
};
```

**quotation.jsx:**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import QuotationApp from './quotation/QuotationApp';

// Load items from SessionStorage
let initialItems = [];

try {
    const stored = sessionStorage.getItem('quotationItems');
    if (stored) {
        const data = JSON.parse(stored);
        initialItems = data.items || [];
    }
} catch (error) {
    console.error('Failed to load quotation data:', error);
}

// Render app with initial data
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QuotationApp initialItems={initialItems} />
    </React.StrictMode>
);
```

---

## Additional Resources

- [MDN: SessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- [MDN: window.open()](https://developer.mozilla.org/en-US/docs/Web/API/Window/open)
- [HTML5 Storage Guide](https://diveintohtml5.info/storage.html)
- [SPA Routing Patterns](https://developer.mozilla.org/en-US/docs/Web/API/History_API)

---

## Support

For navigation issues:
1. Check browser console for errors
2. Verify SessionStorage content
3. Test in production-like environment
4. Review Traefik/nginx configuration
5. Check this guide's troubleshooting section
