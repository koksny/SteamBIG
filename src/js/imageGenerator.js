/**
 * Image generation and canvas operations
 */
class ImageGenerator {
    constructor(imageManager) {
        this.imageManager = imageManager;
        this.previewCanvas = document.getElementById('preview-canvas');
        this.ctx = this.previewCanvas.getContext('2d');
        this.formats = window.GENERATOR_FORMATS;
    }

    /**
     * Check if all required images are loaded and auto-generate
     */
    autoGenerate() {
        const { game1, game2 } = this.imageManager.images;
        if (game1.logo && game1.bg && game2.logo && game2.bg) {
            this.generateImage();
        }
    }

    /**
     * Get value from input element with fallback
     */
    getInputValue(id, defaultValue = 0, type = 'int') {
        const el = document.getElementById(id);
        if (!el) return defaultValue;
        const val = type === 'int' ? parseInt(el.value, 10) : el.value;
        return isNaN(val) ? defaultValue : val;
    }

    /**
     * Generate the merged bundle image
     */
    generateImage() {
        const { game1, game2 } = this.imageManager.images;
        
        // Early return if images not ready
        if (!game1.logo || !game1.bg || !game2.logo || !game2.bg) {
            return;
        }

        // Gather all configuration options
        const format = document.getElementById('format-select').value;
        const dimensions = this.formats[format];
        
        // Scale border width proportionally based on format size
        // Reference: package-header (1414x464) as the "standard" size
        const baseBorderWidth = this.getInputValue('border-width', 0);
        const referenceArea = 1414 * 464;
        const currentArea = dimensions.width * dimensions.height;
        const scaleFactor = Math.sqrt(currentArea / referenceArea);
        const scaledBorderWidth = Math.round(baseBorderWidth * scaleFactor);
        
        const config = {
            splitStyle: document.getElementById('split-style').value,
            logoPosition: document.getElementById('logo-position').value,
            splitAngle: this.getInputValue('split-angle', 45),
            borderWidth: scaledBorderWidth,
            borderColor: document.getElementById('border-color').value,
            frameBorderWidth: this.getInputValue('frame-border-width', 0),
            frameBorderColor: document.getElementById('frame-border-color')?.value || '#66c0f4',
            swapBackgrounds: document.getElementById('swap-backgrounds').checked,
            swapLogos: document.getElementById('swap-logos').checked
        };

        const offsets = {
            game1: {
                x: this.getInputValue('game1-x-offset', 0),
                y: this.getInputValue('game1-y-offset', 0)
            },
            game2: {
                x: this.getInputValue('game2-x-offset', 0),
                y: this.getInputValue('game2-y-offset', 0)
            }
        };

        const bgOffsets = {
            game1: {
                x: this.getInputValue('game1-bg-x-offset', 0),
                y: this.getInputValue('game1-bg-y-offset', 0),
                scale: this.getInputValue('game1-bg-scale', 100) / 100
            },
            game2: {
                x: this.getInputValue('game2-bg-x-offset', 0),
                y: this.getInputValue('game2-bg-y-offset', 0),
                scale: this.getInputValue('game2-bg-scale', 100) / 100
            }
        };

        const logoScales = {
            game1Scale: this.getInputValue('game1-scale', 100) / 100,
            game2Scale: this.getInputValue('game2-scale', 100) / 100
        };

        // Setup canvas
        this.previewCanvas.width = dimensions.width;
        this.previewCanvas.height = dimensions.height;
        this.ctx.clearRect(0, 0, dimensions.width, dimensions.height);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // Draw backgrounds
        window.drawSplitBackgrounds(
            this.ctx,
            config.splitStyle,
            dimensions,
            config.borderWidth,
            config.borderColor,
            config.splitAngle,
            this.imageManager.images,
            config.swapBackgrounds,
            bgOffsets
        );

        // Draw logos
        window.drawLogos(
            this.ctx,
            config.logoPosition,
            config.splitStyle,
            dimensions,
            offsets,
            this.imageManager.images,
            config.swapLogos,
            logoScales
        );

        // Draw frame border around entire image
        if (config.frameBorderWidth > 0) {
            this.drawFrameBorder(dimensions, config.frameBorderWidth, config.frameBorderColor);
        }

        // Enable download button
        this.imageManager.checkIfAllImagesLoaded();
    }

    /**
     * Draw a border frame around the entire image
     */
    drawFrameBorder(dimensions, width, color) {
        const { width: w, height: h } = dimensions;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width * 2; // Double because half is outside canvas
        this.ctx.strokeRect(0, 0, w, h);
    }

    /**
     * Download the generated image
     */
    downloadImage() {
        const format = document.getElementById('format-select').value;
        const game1Name = this.sanitizeFilename(document.getElementById('game1-name').value || 'game1');
        const game2Name = this.sanitizeFilename(document.getElementById('game2-name').value || 'game2');
        const filename = `${game1Name}-${game2Name}-bundle-${format}.png`;

        const dataUrl = window.getCanvasPNGDataURL(this.previewCanvas);
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    }

    /**
     * Sanitize string for use in filename
     */
    sanitizeFilename(name) {
        return name.replace(/[^a-z0-9]/gi, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
}