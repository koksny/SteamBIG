/**
 * Background split rendering for the image generator
 */
(function() {
    const { width: W, height: H } = { width: 0, height: 0 }; // Placeholder for dimensions

    /**
     * Draw a border line or rectangle
     */
    function drawBorder(ctx, borderWidth, borderColor, type, dimensions, params = {}) {
        if (borderWidth <= 0) return;
        
        ctx.fillStyle = borderColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;

        switch (type) {
            case 'horizontal':
                ctx.fillRect(0, dimensions.height / 2 - borderWidth / 2, dimensions.width, borderWidth);
                break;
            case 'vertical':
                ctx.fillRect(dimensions.width / 2 - borderWidth / 2, 0, borderWidth, dimensions.height);
                break;
            case 'diagonal':
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(params.startX, params.startY);
                ctx.lineTo(params.endX, params.endY);
                ctx.stroke();
                ctx.restore();
                break;
        }
    }

    /**
     * Draw split backgrounds based on the selected style
     */
    function drawSplitBackgrounds(ctx, splitStyle, dimensions, borderWidth, borderColor, splitAngle, images, swapBackgrounds, bgOffsets = { game1: { x: 0, y: 0 }, game2: { x: 0, y: 0 } }) {
        const [bg1, bg2] = swapBackgrounds 
            ? [images.game2.bg, images.game1.bg] 
            : [images.game1.bg, images.game2.bg];

        // Also swap offsets if backgrounds are swapped
        const [offset1, offset2] = swapBackgrounds
            ? [bgOffsets.game2, bgOffsets.game1]
            : [bgOffsets.game1, bgOffsets.game2];

        const halfBorder = borderWidth / 2;
        const { width, height } = dimensions;

        switch (splitStyle) {
            case 'horizontal': {
                const halfHeight = height / 2;
                window.drawImageFitted(ctx, bg1, 0, 0, width, halfHeight - halfBorder, 'cover', offset1);
                window.drawImageFitted(ctx, bg2, 0, halfHeight + halfBorder, width, halfHeight - halfBorder, 'cover', offset2);
                drawBorder(ctx, borderWidth, borderColor, 'horizontal', dimensions);
                break;
            }

            case 'vertical': {
                const halfWidth = width / 2;
                window.drawImageFitted(ctx, bg1, 0, 0, halfWidth - halfBorder, height, 'cover', offset1);
                window.drawImageFitted(ctx, bg2, halfWidth + halfBorder, 0, halfWidth - halfBorder, height, 'cover', offset2);
                drawBorder(ctx, borderWidth, borderColor, 'vertical', dimensions);
                break;
            }

            case 'diagonal': {
                // Draw first background fully
                window.drawImageFitted(ctx, bg1, 0, 0, width, height, 'cover', offset1);

                // Calculate diagonal line points
                const angleRad = (splitAngle * Math.PI) / 180;
                const centerX = width / 2;
                const centerY = height / 2;
                const radius = Math.hypot(width, height) / 2;
                const cosA = Math.cos(angleRad);
                const sinA = Math.sin(angleRad);
                const startX = centerX - radius * cosA;
                const startY = centerY - radius * sinA;
                const endX = centerX + radius * cosA;
                const endY = centerY + radius * sinA;

                // Create clipping path for second background
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);

                // Complete the polygon based on angle quadrant
                const PI = Math.PI;
                if (angleRad <= PI / 2) {
                    ctx.lineTo(width, endY);
                    ctx.lineTo(width, height);
                    ctx.lineTo(0, height);
                    ctx.lineTo(0, startY);
                } else if (angleRad <= PI) {
                    ctx.lineTo(endX, height);
                    ctx.lineTo(0, height);
                    ctx.lineTo(0, 0);
                    ctx.lineTo(startX, 0);
                } else if (angleRad <= 1.5 * PI) {
                    ctx.lineTo(0, endY);
                    ctx.lineTo(0, 0);
                    ctx.lineTo(width, 0);
                    ctx.lineTo(width, startY);
                } else {
                    ctx.lineTo(endX, 0);
                    ctx.lineTo(width, 0);
                    ctx.lineTo(width, height);
                    ctx.lineTo(startX, height);
                }

                ctx.closePath();
                ctx.clip();
                window.drawImageFitted(ctx, bg2, 0, 0, width, height, 'cover', offset2);
                ctx.restore();

                drawBorder(ctx, borderWidth, borderColor, 'diagonal', dimensions, { startX, startY, endX, endY });
                break;
            }
        }
    }

    window.drawSplitBackgrounds = drawSplitBackgrounds;
})();