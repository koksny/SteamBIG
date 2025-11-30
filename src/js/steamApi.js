/**
 * Steam API handling and asset fetching
 */
class SteamAPI {
    constructor() {
        this.CORS_PROXY = 'https://corsproxy.io/?';
        this.cache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
        // CDN bases for different asset types
        this.CDN_STORE_ASSETS = 'https://shared.cloudflare.steamstatic.com/store_item_assets/';
        this.CDN_LEGACY = 'https://cdn.akamai.steamstatic.com/steam/apps/';
        // Logo hash cache (persisted to localStorage)
        this.logoHashCache = this.loadLogoHashCache();
    }

    /**
     * Load logo hash cache from localStorage
     */
    loadLogoHashCache() {
        try {
            const cached = localStorage.getItem('steamLogoHashCache');
            return cached ? JSON.parse(cached) : {};
        } catch {
            return {};
        }
    }

    /**
     * Save logo hash cache to localStorage
     */
    saveLogoHashCache() {
        try {
            localStorage.setItem('steamLogoHashCache', JSON.stringify(this.logoHashCache));
        } catch (e) {
            console.warn('Failed to save logo hash cache:', e);
        }
    }

    /**
     * Try to fetch library assets from Steam's authenticated API
     * NOTE: This will fail due to CORS when running from a web page
     * Kept for potential future use with a backend proxy
     * @param {number|string} appId - Steam App ID
     * @returns {Promise<object|null>} Library assets or null
     */
    async fetchAuthenticatedLibraryAssets(appId) {
        // Check cache first - this is the main path that works
        if (this.logoHashCache[appId]) {
            console.log(`Using cached logo hash for ${appId}`);
            return { logo: this.logoHashCache[appId] };
        }

        // Skip the authenticated API call - it fails due to CORS
        // The fetch to store.steampowered.com/api/libraryassets/ returns 403
        // because Steam doesn't set Access-Control-Allow-Origin header
        return null;
    }

    /**
     * Prompt user to get logo hash - simplified approach
     * @param {number|string} appId - Steam App ID
     * @returns {string|null} Logo hash or null
     */
    openSteamDBForLogoHash(appId) {
        const instructions = `Logo not found for this game via public Steam APIs.

To get the logo manually:

OPTION 1 - From SteamDB (recommended):
1. Go to: steamdb.info/app/${appId}/info/
2. Scroll to "Library Assets" section
3. Right-click the "Logo" image → Copy Image Address
4. Paste the full URL below

OPTION 2 - Paste just the 40-character hash:
Example: 518b713e99018516a49ddb4b61304b9039402c6a

The hash will be saved for future use.`;

        // Open SteamDB in new tab
        window.open(`https://steamdb.info/app/${appId}/info/`, '_blank');
        
        const input = prompt(instructions);
        
        if (!input) return null;
        
        const trimmed = input.trim();
        
        // Try to extract hash from full URL or direct hash input
        let hash = null;
        
        // Check if it's a direct 40-char hash
        if (/^[a-f0-9]{40}$/i.test(trimmed)) {
            hash = trimmed.toLowerCase();
        } 
        // Try to extract hash from URL
        else {
            const hashMatch = trimmed.match(/([a-f0-9]{40})/i);
            if (hashMatch) {
                hash = hashMatch[1].toLowerCase();
            }
        }
        
        if (hash) {
            this.logoHashCache[appId] = hash;
            this.saveLogoHashCache();
            console.log(`Saved logo hash for ${appId}: ${hash}`);
            return hash;
        }
        
        alert('Could not extract a valid hash from the input. Please try again with a valid URL or 40-character hash.');
        return null;
    }

    /**
     * Fetch with caching support
     * @param {string} url - URL to fetch
     * @returns {Promise<object>} Parsed JSON response
     */
    async fetchWithCache(url) {
        const cached = this.cache.get(url);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed (status: ${response.status})`);
        }

        let data;
        try {
            data = await response.json();
        } catch (e) {
            throw new Error('Failed to parse response as JSON');
        }

        this.cache.set(url, { data, timestamp: Date.now() });
        return data;
    }

    /**
     * Fetch enhanced assets from IStoreBrowseService API
     * This API returns hash-based URLs for modern Steam games
     * @param {number|string} appId - Steam App ID
     * @returns {Promise<object|null>} Enhanced assets or null if unavailable
     */
    async fetchEnhancedAssets(appId) {
        try {
            const inputJson = JSON.stringify({
                ids: [{ appid: Number(appId) }],
                context: { language: 'english', country_code: 'US', steam_realm: 1 },
                data_request: { include_assets: true }
            });
            const url = `${this.CORS_PROXY}https://api.steampowered.com/IStoreBrowseService/GetItems/v1?input_json=${encodeURIComponent(inputJson)}`;
            const data = await this.fetchWithCache(url);
            
            const storeItem = data?.response?.store_items?.[0];
            if (!storeItem?.assets) return null;

            const assets = storeItem.assets;
            const assetUrlFormat = assets.asset_url_format || `steam/apps/${appId}/\${FILENAME}`;
            
            // Build full URLs for available assets
            const buildUrl = (filename) => {
                if (!filename) return null;
                // Replace ${FILENAME} placeholder with actual filename
                const path = assetUrlFormat.replace('${FILENAME}', filename);
                return `${this.CDN_STORE_ASSETS}${path}`;
            };

            return {
                // Library assets with hashes (for modern games)
                library_capsule: buildUrl(assets.library_capsule),
                library_capsule_2x: buildUrl(assets.library_capsule_2x),
                library_hero: buildUrl(assets.library_hero),
                library_hero_2x: buildUrl(assets.library_hero_2x),
                header: buildUrl(assets.header),
                // Note: library_logo is NOT included in this API response
                // We'll try to derive it or fall back to other sources
                hasHashedAssets: true
            };
        } catch (e) {
            console.log('Enhanced assets not available:', e.message);
            return null;
        }
    }

    /**
     * Fetch asset URLs from Steam for a given app
     * Combines data from multiple APIs for best coverage
     * @param {number|string} appId - Steam App ID
     * @returns {Promise<object>} Asset URLs object
     */
    async fetchAssetUrls(appId) {
        // Fetch basic details (always available)
        const detailsUrl = `${this.CORS_PROXY}https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`;
        const detailsData = await this.fetchWithCache(detailsUrl);

        if (!detailsData[appId]?.success) {
            throw new Error('Invalid game ID or game not found on Steam.');
        }

        const gameData = detailsData[appId].data;
        
        // Fetch enhanced assets (has hash-based URLs for modern games)
        const enhanced = await this.fetchEnhancedAssets(appId);
        
        // Try to get authenticated library assets (includes logo hash)
        const authAssets = await this.fetchAuthenticatedLibraryAssets(appId);

        // Legacy CDN paths (work for older games without hashed URLs)
        const legacyBase = `${this.CDN_LEGACY}${appId}/`;

        // Build logo sources list
        const logoSources = [];
        
        // If we have a logo hash (from auth API or cache), add it first
        if (authAssets?.logo || this.logoHashCache[appId]) {
            const hash = authAssets?.logo || this.logoHashCache[appId];
            logoSources.push(`${this.CDN_STORE_ASSETS}steam/apps/${appId}/${hash}/logo.png`);
            console.log(`Using logo hash for ${appId}: ${hash}`);
        }
        
        // Add legacy paths as fallback
        logoSources.push(`${legacyBase}library_logo.png`);  // Legacy path (older games)
        logoSources.push(`${legacyBase}logo.png`);          // Alternative legacy path

        return {
            // Game identification
            gameName: gameData.name,
            appId: appId,

            // Logo sources - try cached hash first, then legacy paths
            logoSources: logoSources.filter(Boolean),

            // Background/Hero sources - use enhanced (hash-based) URLs when available
            library_hero: enhanced?.library_hero || `${legacyBase}library_hero.jpg`,
            library_hero_2x: enhanced?.library_hero_2x,
            
            // Page backgrounds and headers
            page_bg_raw: gameData.background_raw,
            header_image: gameData.header_image,
            capsule_image: gameData.capsule_image,
            
            // Library capsules (good for backgrounds, NOT for logos)
            library_capsule: enhanced?.library_capsule || `${legacyBase}library_capsule.jpg`,
            library_600x900: `${legacyBase}library_600x900.jpg`,
            
            // Screenshots from API
            screenshots: gameData.screenshots?.map(ss => ss.path_full) || [],
            
            // Metadata about asset types
            hasHashedAssets: enhanced?.hasHashedAssets || false,
            
            // Flag if we have a cached logo hash
            hasLogoHash: !!this.logoHashCache[appId]
        };
    }

    /**
     * Search for games by name
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of game results
     */
    async searchGame(query) {
        const url = `${this.CORS_PROXY}https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
        const data = await this.fetchWithCache(url);
        return data.items || [];
    }

    /**
     * Verify game ID and get game name
     * @param {number|string} appId - Steam App ID
     * @returns {Promise<string>} Game name
     */
    async verifyGameId(appId) {
        const url = `${this.CORS_PROXY}https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`;
        const data = await this.fetchWithCache(url);

        if (!data[appId]?.success) {
            throw new Error('Invalid game ID or game not found');
        }

        return data[appId].data.name;
    }

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
}