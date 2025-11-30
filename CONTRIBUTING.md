# Contributing to SteamBIG

First off, thank you for considering contributing to Steam Bundle Image Generator! It's people like you that make SteamBIG such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inclusive experience for everyone. Please be respectful and constructive in all interactions.

## Getting Started

SteamBIG is a vanilla JavaScript project with no build process or dependencies. This makes it easy to get started:

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/SteamBIG.git`
3. Open `src/index.html` in your browser
4. Make your changes
5. Test in multiple browsers
6. Submit a pull request

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs what actually happened
- **Screenshots** if applicable
- **Browser and OS** information
- **Console errors** if any

### Suggesting Enhancements

Enhancement suggestions are welcome! Please include:

- **Clear title** and description
- **Use case** - why would this be useful?
- **Possible implementation** ideas (optional)
- **Mockups or examples** if applicable

### Code Contributions

#### Good First Issues

Look for issues labeled `good first issue` - these are great for newcomers.

#### Areas for Contribution

- **New output formats** - Additional Steam asset dimensions
- **Split styles** - New ways to combine backgrounds
- **UI improvements** - Better controls or visual feedback
- **Performance** - Optimization opportunities
- **Browser compatibility** - Fixes for edge cases
- **Documentation** - Improvements to docs and comments

## Development Setup

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, or Safari)
- A text editor or IDE (VS Code recommended)
- Basic knowledge of HTML, CSS, and JavaScript

### Local Development

```bash
# Clone the repo
git clone https://github.com/koksny/SteamBIG.git
cd SteamBIG

# Option 1: Open directly in browser
# Just open src/index.html

# Option 2: Use a local server (recommended)
# Python
python -m http.server 8080 --directory src

# Node.js
npx serve src
```

### Project Structure

```
src/
├── index.html          # Main HTML - UI structure
├── css/
│   └── styles.css      # All styling
└── js/
    ├── script.js           # Entry point, initializes components
    ├── steamApi.js         # Steam API interactions
    ├── imageManager.js     # Image loading/management
    ├── imageGenerator.js   # Canvas rendering
    ├── gameSearch.js       # Search functionality
    ├── uiControls.js       # UI event handling
    ├── generatorFormats.js # Output format definitions
    ├── canvasUtils.js      # Canvas helper functions
    ├── drawBackgrounds.js  # Background rendering
    └── drawLogos.js        # Logo rendering
```

### Architecture Notes

- **No frameworks** - Pure vanilla JavaScript
- **Module pattern** - IIFEs for utilities, classes for managers
- **Global window exports** - Shared functions attached to window
- **Event-driven** - Components communicate through events and method calls

## Style Guidelines

### JavaScript

```javascript
// Use JSDoc comments for functions
/**
 * Description of what the function does
 * @param {type} paramName - Parameter description
 * @returns {type} Description of return value
 */
function myFunction(paramName) {
    // Implementation
}

// Use const/let, never var
const immutable = 'value';
let mutable = 'value';

// Use meaningful variable names
const gameAssets = await fetchAssets(appId);  // Good
const x = await f(id);                         // Bad

// Use template literals for string interpolation
const message = `Loading ${gameName}...`;

// Use async/await over .then() chains
async function loadData() {
    const data = await fetch(url);
    return data.json();
}
```

### CSS

```css
/* Use kebab-case for class names */
.game-preview { }
.option-group { }

/* Group related properties */
.element {
    /* Positioning */
    position: relative;
    
    /* Box model */
    display: flex;
    padding: 10px;
    
    /* Visual */
    background-color: #1b2838;
    border-radius: 5px;
    
    /* Typography */
    font-size: 1rem;
    color: #ddd;
}

/* Use CSS variables for theming (if adding) */
:root {
    --primary-color: #66c0f4;
    --bg-dark: #1b2838;
}
```

### HTML

```html
<!-- Use semantic elements -->
<section class="controls">
    <h2>Settings</h2>
    <!-- content -->
</section>

<!-- Use meaningful IDs and classes -->
<input type="text" id="game1-name" class="text-input">

<!-- Keep attributes ordered: id, class, type, other -->
<button id="download-btn" class="primary-btn" type="button" disabled>
    Download
</button>
```

## Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, not CSS)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```
feat(split): add radial split style option

fix(logo): handle missing logo gracefully with fallback

docs(readme): add browser compatibility section

refactor(api): consolidate fetch methods into single class
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the style guidelines
   - Test in multiple browsers
   - Update documentation if needed

3. **Commit your changes**
   - Use meaningful commit messages
   - Keep commits focused and atomic

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changes you made and why
   - Include screenshots for UI changes

6. **Address review feedback**
   - Respond to comments
   - Make requested changes
   - Push additional commits as needed

### PR Checklist

Before submitting, ensure:

- [ ] Code follows project style guidelines
- [ ] Changes work in Chrome, Firefox, and Edge
- [ ] No console errors or warnings
- [ ] Documentation updated if needed
- [ ] Commit messages are clear and descriptive

## Questions?

Feel free to open an issue for any questions about contributing. We're happy to help!

---

Thank you for contributing to SteamBIG! 🎮
