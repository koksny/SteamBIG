# SteamBIG Technical Documentation

This documentation provides in-depth technical details about the Steam Bundle Image Generator architecture, APIs, and extension points.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Module Reference](#module-reference)
- [Steam API Integration](#steam-api-integration)
- [Canvas Rendering](#canvas-rendering)
- [Extending SteamBIG](#extending-steambig)

---

## Architecture Overview

SteamBIG follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                         index.html                               │
│                    (UI Structure & Layout)                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          script.js                               │
│                    (Application Entry Point)                     │
│                                                                  │
│  ┌─────────────┐   ┌───────────────┐   ┌────────────────────┐   │
│  │  SteamAPI   │◄──│ ImageManager  │◄──│  ImageGenerator    │   │
│  └─────────────┘   └───────────────┘   └────────────────────┘   │
│         ▲                  ▲                      ▲              │
│         │                  │                      │              │
│  ┌──────┴──────┐   ┌──────┴───────┐    ┌────────┴─────────┐    │
│  │ GameSearch  │   │  Canvas Util  │    │   UIControls     │    │
│  │   Manager   │   │   Functions   │    │                  │    │
│  └─────────────┘   └──────────────┘    └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Initialization Flow

1. `DOMContentLoaded` event fires
2. `script.js` creates instances in order:
   - `SteamAPI` - API client (standalone)
   - `ImageManager` - Image handling (requires SteamAPI)
   - `ImageGenerator` - Rendering (requires ImageManager)
   - `GameSearchManager` - Search UI (requires SteamAPI, ImageManager)
   - `UIControls` - UI bindings (requires ImageGenerator)
3. Circular reference resolved: `imageManager.generator = generator`

---

## Module Reference

### SteamAPI (`steamApi.js`)

Handles all Steam API interactions and asset URL construction.

#### Constructor
```javascript
const api = new SteamAPI();
```

#### Properties
| Property | Type | Description |
|----------|------|-------------|
| `CORS_PROXY` | string | Proxy URL prefix for CORS bypass |
| `cache` | Map | Request cache storage |
| `CACHE_TTL` | number | Cache time-to-live (5 minutes) |
| `logoHashCache` | object | Persisted logo hash storage |

#### Methods

##### `searchGame(query)`
Search Steam's catalog for games.
```javascript
const results = await api.searchGame('cyberpunk');
// Returns: [{ id, name, ... }, ...]
```

##### `fetchAssetUrls(appId)`
Get all available asset URLs for a game.
```javascript
const assets = await api.fetchAssetUrls(1174180);
// Returns: {
//   gameName, appId, logoSources, library_hero,
//   library_hero_2x, page_bg_raw, header_image,
//   capsule_image, library_capsule, library_600x900,
//   screenshots, hasHashedAssets, hasLogoHash
// }
```

##### `openSteamDBForLogoHash(appId)`
Opens SteamDB and prompts for manual logo hash input.
```javascript
const hash = api.openSteamDBForLogoHash(1174180);
// Opens browser tab, shows prompt, returns hash or null
```

---

### ImageManager (`imageManager.js`)

Manages image loading, caching, and preview display.

#### Constructor
```javascript
const imageManager = new ImageManager(steamApi, generator);
```

#### Properties
| Property | Type | Description |
|----------|------|-------------|
| `images` | object | Loaded images: `{ game1: { logo, bg, appId }, game2: { ... } }` |

#### Methods

##### `loadGameAssets(appId, gameKey)`
Load all assets for a game.
```javascript
await imageManager.loadGameAssets(1174180, 'game1');
```

##### `loadUploadedImage(file, gameKey, imageType)`
Load an image from file upload.
```javascript
imageManager.loadUploadedImage(file, 'game1', 'logo');
```

##### `updatePreview(gameKey, imageType, src)`
Update preview element with image source.

##### `checkIfAllImagesLoaded()`
Check if all 4 required images are loaded and enable download.

---

### ImageGenerator (`imageGenerator.js`)

Core rendering engine using HTML5 Canvas.

#### Constructor
```javascript
const generator = new ImageGenerator(imageManager);
```

#### Properties
| Property | Type | Description |
|----------|------|-------------|
| `previewCanvas` | HTMLCanvasElement | Main preview canvas |
| `ctx` | CanvasRenderingContext2D | Canvas context |
| `formats` | object | Output format definitions |

#### Methods

##### `autoGenerate()`
Check if ready and generate image if all assets loaded.

##### `generateImage()`
Main rendering method. Collects all configuration and renders to canvas.

##### `downloadImage()`
Triggers download of generated image.

---

### UIControls (`uiControls.js`)

Handles all UI interactions and event bindings.

#### Constructor
```javascript
new UIControls(generator);
```

#### Key Methods

##### `setupEventListeners()`
Binds all UI control events.

##### `setupSlider(sliderId, displayId, suffix)`
Sets up a slider with value display.

##### `setupCanvasDrag()`
Enables drag-to-position on preview canvas.

---

### Canvas Utilities (`canvasUtils.js`)

Standalone utility functions for canvas operations.

#### `drawImageFitted(ctx, img, x, y, width, height, mode, offset)`
Draw image with cover/contain fitting.

```javascript
window.drawImageFitted(ctx, img, 0, 0, 800, 600, 'cover', {
    x: 0,      // X pan offset
    y: 0,      // Y pan offset  
    scale: 1   // Zoom scale
});
```

#### `getCanvasPNGDataURL(canvas)`
Get high-quality PNG data URL from canvas.

---

### DrawBackgrounds (`drawBackgrounds.js`)

Background rendering with split styles.

#### `drawSplitBackgrounds(ctx, splitStyle, dimensions, borderWidth, borderColor, splitAngle, images, swapBackgrounds, bgOffsets)`

Renders split backgrounds to canvas.

| Parameter | Type | Description |
|-----------|------|-------------|
| `splitStyle` | 'horizontal' \| 'vertical' \| 'diagonal' | Split type |
| `dimensions` | object | `{ width, height }` |
| `borderWidth` | number | Split line width |
| `borderColor` | string | CSS color |
| `splitAngle` | number | Angle for diagonal (0-180) |
| `images` | object | Image manager images |
| `swapBackgrounds` | boolean | Swap game positions |
| `bgOffsets` | object | Per-game `{ x, y, scale }` |

---

### DrawLogos (`drawLogos.js`)

Logo rendering and positioning.

#### `drawLogos(ctx, logoPosition, splitStyle, dimensions, offsets, images, swapLogos, logoScales)`

Renders game logos to canvas.

| Parameter | Type | Description |
|-----------|------|-------------|
| `logoPosition` | 'center' \| 'separate' | Positioning mode |
| `offsets` | object | `{ game1: { x, y }, game2: { x, y } }` |
| `logoScales` | object | `{ game1Scale, game2Scale }` |

#### Global: `window.logoBounds`
Stores logo hit boxes for drag detection:
```javascript
{
    game1: { x, y, width, height },
    game2: { x, y, width, height }
}
```

---

### Generator Formats (`generatorFormats.js`)

Output format definitions.

```javascript
window.GENERATOR_FORMATS = {
    'main-capsule': { width: 1232, height: 706, label: 'Main Capsule' },
    'header-capsule': { width: 920, height: 430, label: 'Header Capsule' },
    'small-capsule': { width: 462, height: 174, label: 'Small Capsule' },
    'package-header': { width: 1414, height: 464, label: 'Package Header' }
};
```

---

## Steam API Integration

### Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/api/storesearch/` | Game name search |
| `/api/appdetails/` | Game details and basic assets |
| `IStoreBrowseService/GetItems/` | Enhanced hash-based assets |

### Asset URL Construction

Modern Steam games use hash-based URLs:
```
https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/{appid}/{hash}/logo.png
```

Legacy games use simple paths:
```
https://cdn.akamai.steamstatic.com/steam/apps/{appid}/library_logo.png
```

### CORS Handling

All Steam requests go through `corsproxy.io`:
```javascript
const url = `${this.CORS_PROXY}${steamUrl}`;
```

---

## Canvas Rendering

### Rendering Pipeline

1. **Setup Canvas** - Set dimensions, clear, configure smoothing
2. **Draw Backgrounds** - Apply split style and clipping
3. **Draw Logos** - Position and scale logos
4. **Draw Borders** - Frame border if configured

### Quality Optimization

Multi-step downscaling for logos:
```javascript
if (logo.width > destWidth * 2) {
    // Draw to intermediate canvas at 2x target size
    // Then draw intermediate to final destination
}
```

---

## Extending SteamBIG

### Adding a New Split Style

1. Add option to `index.html`:
```html
<option value="radial">Radial Split</option>
```

2. Add case in `drawBackgrounds.js`:
```javascript
case 'radial': {
    // Draw radial split implementation
    break;
}
```

3. Update logo positioning in `drawLogos.js` if needed.

### Adding a New Output Format

Add to `generatorFormats.js`:
```javascript
'new-format': { width: 1000, height: 500, label: 'New Format' }
```

The format automatically appears in the dropdown.

### Adding New Controls

1. Add HTML in `index.html`
2. Add event binding in `uiControls.js`
3. Read value in `imageGenerator.js` `generateImage()`
4. Use value in appropriate drawing function

---

## Performance Considerations

- **Caching**: API responses cached for 5 minutes
- **LocalStorage**: Logo hashes persisted between sessions
- **Debouncing**: Search input debounced at 300ms
- **Lazy Loading**: Background options load on demand
- **Canvas Cleanup**: Temporary canvases explicitly cleared

---

## Browser Compatibility

Features used and their support:

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Canvas 2D | ✅ | ✅ | ✅ | ✅ |
| Fetch API | ✅ | ✅ | ✅ | ✅ |
| async/await | ✅ | ✅ | ✅ | ✅ |
| localStorage | ✅ | ✅ | ✅ | ✅ |
| OffscreenCanvas | ✅ | ✅ | ✅ | ✅ |
