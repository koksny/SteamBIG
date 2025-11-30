# Changelog

All notable changes to Steam Bundle Image Generator (SteamBIG) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2025-11-30

### Added
- **Initial GitHub Release** - First public version of Steam Bundle Image Generator
- **Game Search**: Search Steam's catalog by game name with live results
- **Direct ID Input**: Load games using their Steam App ID
- **File Upload**: Support for custom logo and background uploads (PNG, JPG, WebP, GIF)
- **Multiple Split Styles**: Horizontal, vertical, and diagonal splits
- **Diagonal Angle Control**: Adjustable angle (0-180°) for diagonal splits
- **Border Customization**: 
  - Split border with width and color controls
  - Frame border around the entire image
- **Logo Controls**:
  - Center together or keep separate positioning
  - Per-game scale adjustment (25-400%)
  - X/Y offset controls per logo
  - Swap logos option
- **Background Controls**:
  - Multiple background options per game (library hero, screenshots, headers)
  - Per-game pan (X/Y offset) and scale controls
  - Swap backgrounds option
- **Output Formats**:
  - Package Header (1414×464)
  - Header Capsule (920×430)
  - Main Capsule (1232×706)
  - Small Capsule (462×174)
- **Interactive Preview**:
  - Real-time preview with instant updates
  - Drag-to-position for backgrounds
  - Click-to-drag logos
- **Smart Logo Fallback**:
  - Auto-generated text logos when image logos unavailable
  - SteamDB integration for manual logo retrieval
- **Quality Features**:
  - Multi-step downscaling for high-quality logo rendering
  - High-quality image smoothing
  - Automatic border scaling based on output format
- **Performance**:
  - 5-minute API response caching
  - LocalStorage persistence for logo hashes
  - Efficient canvas rendering

### Technical
- Vanilla JavaScript implementation (no frameworks)
- Modular code architecture with separate concerns
- CORS proxy integration for Steam API access
- Responsive CSS design
- Steam-inspired dark theme UI

---

## Version History Notes

This is the first public release on GitHub. Previous versions (1.0 - 1.4) were internal development iterations.

### Pre-release Development History
- **v1.4** - Added diagonal split with angle control
- **v1.3** - Implemented SteamDB logo hash integration
- **v1.2** - Added drag-to-position functionality
- **v1.1** - Multiple background options per game
- **v1.0** - Initial development version
