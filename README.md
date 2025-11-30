# Steam Bundle Image Generator (SteamBIG)

![SteamBIG In-Use](https://github.com/koksny/SteamBIG/blob/main/SteamBIG_production.png)

<div align="center">

![Version](https://img.shields.io/badge/version-1.5-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-web-lightgrey.svg)

**Create promotional graphics for Steam bundles by merging assets from two games.**

[Features](#features) • [Quick Start](#quick-start) • [Usage](#usage) • [Documentation](docs/README.md) • [Contributing](CONTRIBUTING.md)

</div>

---

## Overview

Steam Bundle Image Generator (SteamBIG) is a browser-based tool that allows you to create professional promotional images for Steam game bundles. It automatically fetches game assets (logos, backgrounds, screenshots) from Steam's API and lets you combine them with various split styles, border options, and positioning controls.

## Features

### Game Asset Loading
- **Search by Name**: Find games directly by searching Steam's catalog
- **Direct ID Input**: Enter Steam App IDs for precise game selection
- **File Upload**: Use your own custom logos and backgrounds
- **Multiple Background Options**: Choose from library heroes, screenshots, headers, and more

### Image Customization
- **Split Styles**: Horizontal, vertical, and diagonal splits with adjustable angles
- **Border Controls**: Customizable split line and frame borders with color pickers
- **Logo Positioning**: Center logos together or keep them separate on their respective sides
- **Background Adjustments**: Pan and scale each background independently
- **Logo Scaling**: Resize logos with per-game scale controls
- **Drag-to-Position**: Click and drag directly on the preview to adjust positions

### Output Formats
Generate images in Steam's official asset dimensions:
| Format | Dimensions | Use Case |
|--------|------------|----------|
| Package Header | 1414×464 | Bundle store pages |
| Header Capsule | 920×430 | Store page headers |
| Main Capsule | 1232×706 | Featured sections |
| Small Capsule | 462×174 | Store listings |

### Additional Features
- Real-time preview with instant updates
- High-quality image rendering with multi-step downscaling
- Automatic text logo generation when official logos are unavailable
- SteamDB integration for fetching high-quality logos
- Local caching for faster subsequent loads
- Responsive design for different screen sizes

## Quick Start

### Option 1: Use Online
Simply open `src/index.html` in a modern web browser. No installation or build process required!

### Option 2: Local Development
```bash
# Clone the repository
git clone https://github.com/koksny/SteamBIG.git

# Navigate to the project
cd SteamBIG

# Open in browser (or use a local server)
# On Windows:
start src/index.html

# On macOS:
open src/index.html

# On Linux:
xdg-open src/index.html
```

### Option 3: Local Server (Recommended for Development)
```bash
# Using Python
python -m http.server 8080 --directory src

# Using Node.js (with npx)
npx serve src

# Using PHP
php -S localhost:8080 -t src
```
Then open `http://localhost:8080` in your browser.

## Usage

### Basic Workflow

1. **Select Game 1**: Search by name, enter a Steam ID, or upload custom files
2. **Select Game 2**: Same options as Game 1
3. **Choose Background**: Click on the thumbnail to select from available backgrounds
4. **Customize Layout**: Adjust split style, borders, and positioning
5. **Fine-tune**: Use sliders or drag directly on the preview
6. **Download**: Click the download button to save your image

### Tips

- **Dragging**: Click and drag on the preview canvas to move backgrounds; click directly on logos to move them
- **Swap Options**: Use "Swap Backgrounds" or "Swap Logos" to quickly exchange game positions
- **Missing Logos**: If a logo fails to load, click "Get Real Logo (SteamDB)" for manual retrieval
- **Custom Files**: Upload your own PNG/JPG files for complete control

## Project Structure

```
SteamBIG/
├── src/
│   ├── index.html          # Main application page
│   ├── css/
│   │   └── styles.css      # Application styles
│   └── js/
│       ├── script.js           # Application entry point
│       ├── steamApi.js         # Steam API integration
│       ├── imageManager.js     # Image loading and management
│       ├── imageGenerator.js   # Canvas rendering engine
│       ├── gameSearch.js       # Game search functionality
│       ├── uiControls.js       # UI event handling
│       ├── generatorFormats.js # Output format definitions
│       ├── canvasUtils.js      # Canvas utility functions
│       ├── drawBackgrounds.js  # Background rendering
│       └── drawLogos.js        # Logo rendering
├── docs/                   # Additional documentation
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

## Browser Support

SteamBIG works best in modern browsers:
- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 13+

## Technical Notes

### CORS Handling
Steam's CDN doesn't allow direct cross-origin requests from browsers. SteamBIG uses a CORS proxy to fetch game assets. The default proxy is `corsproxy.io`.

### API Usage
This tool uses Steam's public Store API for:
- Game search (`/api/storesearch/`)
- Game details (`/api/appdetails/`)
- Enhanced assets (`IStoreBrowseService/GetItems/`)

No Steam API key is required.

### Caching
- API responses are cached for 5 minutes
- Logo hashes are persisted to localStorage for faster subsequent loads

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Steam and all game assets are property of their respective owners
- This tool is not affiliated with or endorsed by Valve Corporation
- Built with vanilla JavaScript - no frameworks required!
