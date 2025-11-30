/**
 * Canvas utilities used by the image generator
 */
(function() {
    /**
     * Draws an image fitted to specified dimensions using cover or contain mode
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLImageElement} img - Image to draw
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Target width
     * @param {number} height - Target height
     * @param {'cover'|'contain'} mode - Fit mode
     * @param {Object} offset - Optional {x, y, scale} offset for panning/zooming the image within the frame
     */
    function drawImageFitted(ctx, img, x, y, width, height, mode = 'cover', offset = { x: 0, y: 0, scale: 1 }) {
        if (!img || !img.width || !img.height) return;

        const imgScale = offset.scale || 1;
        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
        let destX = x, destY = y, destWidth = width, destHeight = height;

        if (mode === 'cover') {
            // Calculate base scale for cover mode
            const baseScale = Math.max(width / img.width, height / img.height);
            // Apply user scale on top of base scale
            const totalScale = baseScale * imgScale;
            
            // Calculate source dimensions based on total scale
            sWidth = width / totalScale;
            sHeight = height / totalScale;
            
            // Calculate center crop position
            sx = (img.width - sWidth) / 2;
            sy = (img.height - sHeight) / 2;
            
            // Apply offset (convert from pixel offset to source image coordinates)
            sx -= offset.x / totalScale;
            sy -= offset.y / totalScale;
            
            // Only clamp if source rect would go outside image bounds
            // Allow some overflow for panning effect
            if (sWidth < img.width) {
                sx = Math.max(0, Math.min(img.width - sWidth, sx));
            }
            if (sHeight < img.height) {
                sy = Math.max(0, Math.min(img.height - sHeight, sy));
            }
        } else {
            // contain mode
            const scale = Math.min(width / img.width, height / img.height) * imgScale;
            destWidth = img.width * scale;
            destHeight = img.height * scale;
            destX = x + (width - destWidth) / 2 + offset.x;
            destY = y + (height - destHeight) / 2 + offset.y;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, destX, destY, destWidth, destHeight);
    }

    /**
     * Converts canvas to high-quality PNG data URL
     * @param {HTMLCanvasElement} canvas - Source canvas
     * @returns {string} PNG data URL
     */
    function getCanvasPNGDataURL(canvas) {
        // Use OffscreenCanvas if available for better performance
        if (typeof OffscreenCanvas !== 'undefined') {
            const offscreen = new OffscreenCanvas(canvas.width, canvas.height);
            const ctx = offscreen.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(canvas, 0, 0);
            return canvas.toDataURL('image/png', 1.0);
        }

        // Fallback for browsers without OffscreenCanvas
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0);
        const url = tempCanvas.toDataURL('image/png', 1.0);
        
        // Cleanup
        tempCanvas.width = tempCanvas.height = 0;
        return url;
    }

    window.drawImageFitted = drawImageFitted;
    window.getCanvasPNGDataURL = getCanvasPNGDataURL;
})();