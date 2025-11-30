/**
 * Image loading and management
 */
class ImageManager {
    constructor(steamApi, generator) {
        this.steamApi = steamApi;
        this.generator = generator;
        this.images = {
            game1: { logo: null, bg: null, appId: null },
            game2: { logo: null, bg: null, appId: null }
        };
    }

    /**
     * Load an image from a user-uploaded file
     */
    loadUploadedImage(file, gameKey, imageType) {
        if (!file || !file.type.startsWith('image/')) {
            console.error('Invalid file type provided for image upload.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.images[gameKey][imageType] = img;
                this.updatePreview(gameKey, imageType, e.target.result);
                this.checkIfAllImagesLoaded();
                this.generator?.autoGenerate();
            };
            img.src = e.target.result;
        };
        reader.onerror = () => console.error('Failed to read uploaded file');
        reader.readAsDataURL(file);
    }

    /**
     * Update the preview element with an image
     */
    updatePreview(gameKey, imageType, src) {
        const previewEl = document.getElementById(`${gameKey}-${imageType}-preview`);
        if (!previewEl) return;
        
        previewEl.innerHTML = '';
        const displayImg = document.createElement('img');
        displayImg.src = src;
        displayImg.alt = `${gameKey} ${imageType}`;
        previewEl.appendChild(displayImg);
    }

    /**
     * Display error message in preview
     */
    showError(gameKey, message) {
        const logoPreview = document.getElementById(`${gameKey}-logo-preview`);
        const bgPreview = document.getElementById(`${gameKey}-bg-preview`);
        const errorHtml = `<div style="color: #ff6b6b;">Error: ${message}</div>`;
        
        if (logoPreview) logoPreview.innerHTML = errorHtml;
        if (bgPreview) bgPreview.innerHTML = errorHtml;
    }

    /**
     * Load game assets (logo and background)
     */
    async loadGameAssets(appId, gameKey) {
        const logoPreview = document.getElementById(`${gameKey}-logo-preview`);
        const bgPreview = document.getElementById(`${gameKey}-bg-preview`);

        try {
            if (logoPreview) logoPreview.innerHTML = '<div style="color: #66c0f4;">Loading logo...</div>';
            if (bgPreview) bgPreview.innerHTML = '<div style="color: #66c0f4;">Loading background options...</div>';

            const assets = await this.steamApi.fetchAssetUrls(appId);
            this.loadLogoWithPriority(gameKey, assets);
            this.loadBackgroundOptions(gameKey, assets);
        } catch (error) {
            console.error('Error loading game assets:', error);
            this.showError(gameKey, error.message);
        }
    }

    /**
     * Load logo with fallback priority
     * Uses the pre-built logoSources array from steamApi
     * Priority: library_logo (legacy) > logo (legacy) > library_capsule > text logo
     */
    loadLogoWithPriority(gameKey, assets) {
        // Store assets for later use in fallback
        this.currentAssets = this.currentAssets || {};
        this.currentAssets[gameKey] = assets;

        // Use the logoSources array from steamApi (already filtered)
        const logoSources = (assets.logoSources || [])
            .filter(Boolean)
            .map(url => `${this.steamApi.CORS_PROXY}${url}`);

        if (logoSources.length === 0) {
            console.error(`No logo sources found for ${gameKey}`);
            this.createTextLogo(gameKey, assets.gameName);
            return;
        }

        console.log(`Loading logo for ${gameKey} with ${logoSources.length} sources:`, logoSources);
        this.tryLoadImageSequence(logoSources, 0, gameKey, 'logo', assets.gameName);
    }

    /**
     * Try loading images from sources in sequence
     * @param {string[]} sources - Array of image URLs to try
     * @param {number} index - Current index in the sources array
     * @param {string} gameKey - 'game1' or 'game2'
     * @param {string} type - 'logo' or 'bg'
     * @param {string} gameName - Game name for text logo fallback
     */
    tryLoadImageSequence(sources, index, gameKey, type, gameName) {
        if (index >= sources.length) {
            console.error(`Failed to load ${type} for ${gameKey} after trying all sources`);
            if (type === 'logo') {
                this.createTextLogoWithSteamDBOption(gameKey, gameName);
            } else {
                this.createPlaceholderBackground(gameKey);
            }
            return;
        }

        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            this.images[gameKey][type] = img;
            if (type === 'logo') {
                this.updatePreview(gameKey, 'logo', img.src);
            }
            this.checkIfAllImagesLoaded();
            this.generator?.autoGenerate();
        };

        img.onerror = () => {
            console.log(`Failed to load ${sources[index]}, trying next source...`);
            this.tryLoadImageSequence(sources, index + 1, gameKey, type, gameName);
        };

        img.src = sources[index];
    }

    /**
     * Create text logo with option to fetch from SteamDB
     */
    createTextLogoWithSteamDBOption(gameKey, gameName) {
        const assets = this.currentAssets?.[gameKey];
        const appId = assets?.appId;
        
        // Create the text logo - this will call updatePreview which replaces innerHTML
        // So we need to add the button AFTER the logo image loads
        this.createTextLogoWithCallback(gameKey, gameName, () => {
            // Add the SteamDB fetch button after logo is rendered
            if (appId) {
                const logoPreview = document.getElementById(`${gameKey}-logo-preview`);
                if (logoPreview) {
                    const fetchBtn = document.createElement('button');
                    fetchBtn.className = 'steamdb-fetch-btn';
                    fetchBtn.innerHTML = '🔗 Get Real Logo (SteamDB)';
                    fetchBtn.title = 'Opens SteamDB to copy the logo URL, then paste it here';
                    fetchBtn.onclick = async () => {
                        const hash = this.steamApi.openSteamDBForLogoHash(appId);
                        if (hash) {
                            // Reload assets with new hash
                            fetchBtn.disabled = true;
                            fetchBtn.textContent = '✓ Loading...';
                            await this.loadGameAssets(appId, gameKey);
                        }
                    };
                    logoPreview.appendChild(fetchBtn);
                }
            }
        });
    }

    /**
     * Load background options and show selection interface
     * Uses both enhanced (hash-based) and legacy URLs
     */
    loadBackgroundOptions(gameKey, assets) {
        const bgPreview = document.getElementById(`${gameKey}-bg-preview`);
        if (!bgPreview) return;

        bgPreview.innerHTML = '<div style="color: #66c0f4;">Loading background options...</div>';

        // Build background sources list with enhanced URLs when available
        const bgSources = [
            { name: 'Page BG', url: assets.page_bg_raw },
            { name: 'Library Hero', url: assets.library_hero },
            { name: 'Library Hero 2x', url: assets.library_hero_2x },
            { name: 'Header', url: assets.header_image },
            { name: 'Library Art', url: assets.library_600x900 },
            { name: 'Library Capsule', url: assets.library_capsule },
            ...(assets.screenshots || []).slice(0, 4).map((url, i) => ({
                name: `Screenshot ${i + 1}`,
                url
            }))
        ].filter(s => s.url);

        if (bgSources.length === 0) {
            bgPreview.innerHTML = '<div style="color: #ff6b6b;">No backgrounds available</div>';
            this.createPlaceholderBackground(gameKey);
            return;
        }

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'bg-options-container';

        let loadedCount = 0;
        let isFirstLoad = true;

        const handleImageLoad = (img, source) => {
            loadedCount++;

            if (isFirstLoad) {
                bgPreview.innerHTML = '';
                const label = document.createElement('div');
                label.className = 'bg-options-label';
                label.textContent = 'Select background:';
                bgPreview.appendChild(label);
                bgPreview.appendChild(optionsContainer);
            }

            const option = document.createElement('div');
            option.className = 'bg-option';
            option.innerHTML = `
                <img src="${img.src}" alt="${source.name}">
                <span>${source.name}</span>
            `;

            option.addEventListener('click', () => {
                bgPreview.querySelectorAll('.bg-option').forEach(el => el.classList.remove('selected'));
                option.classList.add('selected');
                this.images[gameKey].bg = img;
                this.checkIfAllImagesLoaded();
                this.generator?.autoGenerate();
            });

            optionsContainer.appendChild(option);

            if (isFirstLoad) {
                isFirstLoad = false;
                option.click();
            }
        };

        const handleImageError = (source) => {
            console.log(`Failed to load background: ${source.name}`);
            loadedCount++;
            if (loadedCount === bgSources.length && isFirstLoad) {
                bgPreview.innerHTML = '<div style="color: #ff6b6b;">No backgrounds available</div>';
                this.createPlaceholderBackground(gameKey);
            }
        };

        bgSources.forEach(source => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => handleImageLoad(img, source);
            img.onerror = () => handleImageError(source);
            // Handle both full URLs and relative paths
            const fullUrl = source.url.startsWith('http') 
                ? source.url 
                : source.url;
            img.src = `${this.steamApi.CORS_PROXY}${fullUrl}`;
        });
    }

    /**
     * Create a text-based logo when image fails to load
     * Creates a professional-looking text logo with transparent background
     * @param {string} gameKey - 'game1' or 'game2'
     * @param {string} providedName - Optional game name from API
     * @param {Function} callback - Optional callback after logo is rendered
     */
    createTextLogo(gameKey, providedName, callback) {
        this.createTextLogoWithCallback(gameKey, providedName, callback);
    }

    /**
     * Create a text-based logo with optional callback
     * @param {string} gameKey - 'game1' or 'game2'
     * @param {string} providedName - Optional game name from API
     * @param {Function} callback - Optional callback after logo is rendered
     */
    createTextLogoWithCallback(gameKey, providedName, callback) {
        const gameName = providedName || document.getElementById(`${gameKey}-name`)?.value || 'Unknown Game';
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');

        // Clear with transparency
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate dynamic font size based on text length
        let fontSize = 36;
        ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
        
        // Reduce font size if text is too wide
        const maxWidth = canvas.width - 40;
        while (ctx.measureText(gameName).width > maxWidth && fontSize > 16) {
            fontSize -= 2;
            ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
        }

        // Smart text wrapping for very long names
        const lines = this.wrapText(ctx, gameName, maxWidth);
        const lineHeight = fontSize + 8;

        // Draw text shadow/outline for visibility on any background
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate vertical centering
        const totalHeight = lines.length * lineHeight;
        const startY = canvas.height / 2 - totalHeight / 2 + lineHeight / 2;

        // Draw shadow (multiple passes for thickness)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        const shadowOffsets = [[2, 2], [-2, 2], [2, -2], [-2, -2], [0, 3], [3, 0], [-3, 0], [0, -3]];
        lines.forEach((line, i) => {
            const y = startY + i * lineHeight;
            shadowOffsets.forEach(([ox, oy]) => {
                ctx.fillText(line, canvas.width / 2 + ox, y + oy);
            });
        });

        // Draw white text
        ctx.fillStyle = '#ffffff';
        lines.forEach((line, i) => {
            const y = startY + i * lineHeight;
            ctx.fillText(line, canvas.width / 2, y);
        });

        const logoImg = new Image();
        logoImg.onload = () => {
            this.images[gameKey].logo = logoImg;
            this.updatePreview(gameKey, 'logo', logoImg.src);
            this.checkIfAllImagesLoaded();
            this.generator?.autoGenerate();
            // Call callback after preview is updated
            if (callback) callback();
        };
        logoImg.src = canvas.toDataURL();
        
        console.log(`Created text logo for ${gameKey}: "${gameName}" (font size: ${fontSize}px)`);
    }

    /**
     * Word wrap text to fit within maxWidth
     */
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        // Limit to 2 lines max
        return lines.slice(0, 2);
    }

    /**
     * Create a placeholder background when all image sources fail
     */
    createPlaceholderBackground(gameKey) {
        const canvas = document.createElement('canvas');
        canvas.width = 460;
        canvas.height = 215;
        const ctx = canvas.getContext('2d');

        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#1b2838');
        gradient.addColorStop(1, '#2a3f5a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add decorative circles (use seeded random for consistency)
        ctx.fillStyle = 'rgba(102, 192, 244, 0.1)';
        const seed = gameKey === 'game1' ? 12345 : 67890;
        let rand = seed;
        const seededRandom = () => {
            rand = (rand * 1103515245 + 12345) & 0x7fffffff;
            return rand / 0x7fffffff;
        };

        for (let i = 0; i < 10; i++) {
            const x = seededRandom() * canvas.width;
            const y = seededRandom() * canvas.height;
            const size = 5 + seededRandom() * 20;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        const bgImg = new Image();
        bgImg.onload = () => {
            this.images[gameKey].bg = bgImg;
            this.updatePreview(gameKey, 'bg', bgImg.src);
            this.checkIfAllImagesLoaded();
            this.generator?.autoGenerate();
        };
        bgImg.src = canvas.toDataURL();
    }

    /**
     * Check if all required images are loaded
     */
    checkIfAllImagesLoaded() {
        const { game1, game2 } = this.images;
        const allLoaded = game1.logo && game1.bg && game2.logo && game2.bg;
        
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.disabled = !allLoaded;
        }
    }
}