/**
 * Logo rendering for the image generator
 */
(function() {
    const LOGO_GAP = 20; // Gap between logos when centered

    // Store logo bounds for hit detection
    window.logoBounds = {
        game1: null,
        game2: null
    };

    /**
     * Draw a logo with high-quality downscaling
     */
    function drawSmoothLogo(ctx, logo, destX, destY, destWidth, destHeight) {
        if (!logo || destWidth <= 0 || destHeight <= 0) return;

        const needsMultiStep = logo.width > destWidth * 2 || logo.height > destHeight * 2;

        if (needsMultiStep) {
            // Multi-step downscaling for better quality
            const interWidth = destWidth * 2;
            const interHeight = destHeight * 2;
            const interCanvas = document.createElement('canvas');
            interCanvas.width = interWidth;
            interCanvas.height = interHeight;
            const interCtx = interCanvas.getContext('2d');
            interCtx.imageSmoothingEnabled = true;
            interCtx.imageSmoothingQuality = 'high';
            interCtx.drawImage(logo, 0, 0, logo.width, logo.height, 0, 0, interWidth, interHeight);
            ctx.drawImage(interCanvas, 0, 0, interWidth, interHeight, destX, destY, destWidth, destHeight);
            interCanvas.width = interCanvas.height = 0;
        } else {
            ctx.drawImage(logo, 0, 0, logo.width, logo.height, destX, destY, destWidth, destHeight);
        }
    }

    /**
     * Calculate logo dimensions maintaining aspect ratio
     */
    function calculateLogoDimensions(logo, maxHeight, scale) {
        const aspect = logo.width / logo.height;
        const height = Math.min(maxHeight, logo.height) * scale;
        const width = height * aspect;
        return { width, height };
    }

    /**
     * Get logo position based on split style
     */
    function getLogoPosition(splitStyle, dimensions, logoWidth, logoHeight, isSecondLogo) {
        const { width, height } = dimensions;
        let x, y;

        switch (splitStyle) {
            case 'horizontal':
                x = (width - logoWidth) / 2;
                y = isSecondLogo 
                    ? (height * 0.75) - (logoHeight / 2)
                    : (height * 0.25) - (logoHeight / 2);
                break;

            case 'vertical':
                x = isSecondLogo
                    ? (width * 0.75) - (logoWidth / 2)
                    : (width * 0.25) - (logoWidth / 2);
                y = (height - logoHeight) / 2;
                break;

            case 'diagonal':
            default:
                x = isSecondLogo
                    ? width * 0.75 - (logoWidth / 2)
                    : width * 0.25 - (logoWidth / 2);
                y = isSecondLogo
                    ? height * 0.75 - (logoHeight / 2)
                    : height * 0.25 - (logoHeight / 2);
                break;
        }

        return { x, y };
    }

    /**
     * Draw game logos with the specified configuration
     */
    function drawLogos(ctx, logoPosition, splitStyle, dimensions, offsets, images, swapLogos, logoScales) {
        const [logo1, logo2] = swapLogos
            ? [images.game2.logo, images.game1.logo]
            : [images.game1.logo, images.game2.logo];

        if (!logo1 || !logo2) return;

        const maxLogoHeight = dimensions.height * 0.3;
        const scale1 = logoScales.game1Scale || 1;
        const scale2 = logoScales.game2Scale || 1;

        const dims1 = calculateLogoDimensions(logo1, maxLogoHeight, scale1);
        const dims2 = calculateLogoDimensions(logo2, maxLogoHeight, scale2);

        let logo1X, logo1Y, logo2X, logo2Y;

        if (logoPosition === 'center') {
            const totalWidth = dims1.width + dims2.width + LOGO_GAP;
            const startX = (dimensions.width - totalWidth) / 2;

            logo1X = startX + offsets.game1.x;
            logo1Y = (dimensions.height - dims1.height) / 2 + offsets.game1.y;
            logo2X = startX + dims1.width + LOGO_GAP + offsets.game2.x;
            logo2Y = (dimensions.height - dims2.height) / 2 + offsets.game2.y;

            drawSmoothLogo(ctx, logo1, logo1X, logo1Y, dims1.width, dims1.height);
            drawSmoothLogo(ctx, logo2, logo2X, logo2Y, dims2.width, dims2.height);
        } else {
            const pos1 = getLogoPosition(splitStyle, dimensions, dims1.width, dims1.height, false);
            const pos2 = getLogoPosition(splitStyle, dimensions, dims2.width, dims2.height, true);

            logo1X = pos1.x + offsets.game1.x;
            logo1Y = pos1.y + offsets.game1.y;
            logo2X = pos2.x + offsets.game2.x;
            logo2Y = pos2.y + offsets.game2.y;

            drawSmoothLogo(ctx, logo1, logo1X, logo1Y, dims1.width, dims1.height);
            drawSmoothLogo(ctx, logo2, logo2X, logo2Y, dims2.width, dims2.height);
        }

        // Store bounds for hit detection (in canvas coordinates)
        // Note: bounds are stored as game1/game2 regardless of swap - the swap is handled in detection
        window.logoBounds.game1 = { x: logo1X, y: logo1Y, width: dims1.width, height: dims1.height };
        window.logoBounds.game2 = { x: logo2X, y: logo2Y, width: dims2.width, height: dims2.height };
    }

    window.drawLogos = drawLogos;
})();