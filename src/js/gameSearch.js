/**
 * Game search and selection functionality
 */
class GameSearchManager {
    constructor(steamApi, imageManager) {
        this.steamApi = steamApi;
        this.imageManager = imageManager;
        this.debounceTimers = new Map();
        this.setupEventListeners();
    }

    /**
     * Debounce function with proper context handling
     */
    debounce(key, func, wait) {
        return (...args) => {
            clearTimeout(this.debounceTimers.get(key));
            this.debounceTimers.set(key, setTimeout(() => func.apply(this, args), wait));
        };
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Game inputs
        ['game1', 'game2'].forEach(gameKey => {
            const nameInput = document.getElementById(`${gameKey}-name`);
            const idInput = document.getElementById(`${gameKey}-id`);
            const logoUpload = document.getElementById(`${gameKey}-logo-upload`);
            const bgUpload = document.getElementById(`${gameKey}-bg-upload`);

            // Name search with debounce
            nameInput.addEventListener('input', this.debounce(gameKey, (e) => {
                this.searchGame(e.target.value, gameKey);
            }, 300));

            // Direct ID input
            idInput.addEventListener('change', (e) => {
                const value = e.target.value.trim();
                if (value) this.loadGameById(value, gameKey);
            });

            // File uploads
            logoUpload.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0], gameKey, 'logo'));
            bgUpload.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0], gameKey, 'bg'));

            // Setup tabs
            this.setupInputMethodTabs(gameKey);
        });
    }

    /**
     * Set up tabs for switching between input methods
     */
    setupInputMethodTabs(gameKey) {
        const tabs = ['name', 'id', 'upload'].map(type => ({
            tab: document.getElementById(`${gameKey}-${type}-tab`),
            panel: document.getElementById(`${gameKey}-${type}-panel`),
            type
        }));
        const previewEl = document.getElementById(`${gameKey}-preview`);

        tabs.forEach(({ tab, panel, type }) => {
            tab.addEventListener('click', () => {
                // Update active states
                tabs.forEach(t => {
                    t.tab.classList.toggle('active', t.tab === tab);
                    t.panel.classList.toggle('active', t.panel === panel);
                });

                // Show preview if game is loaded or on upload tab
                const hasGame = this.imageManager.images[gameKey].appId;
                previewEl.style.display = (hasGame || type === 'upload') ? 'block' : 'none';
            });
        });
    }

    /**
     * Search for games by name
     */
    async searchGame(query, gameKey) {
        const resultsContainer = document.getElementById(`${gameKey}-results`);
        resultsContainer.innerHTML = '';

        if (!query || query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }

        resultsContainer.innerHTML = '<div class="search-result">Searching Steam games...</div>';
        resultsContainer.style.display = 'block';

        try {
            const results = await this.steamApi.searchGame(query);

            if (results.length === 0) {
                resultsContainer.innerHTML = '<div class="search-result">No games found. Try a different search.</div>';
                return;
            }

            resultsContainer.innerHTML = '';
            const fallbackImg = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2280%22%20height%3D%2230%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%2280%22%20height%3D%2230%22%20fill%3D%22%23555%22%2F%3E%3Ctext%20x%3D%2240%22%20y%3D%2215%22%20font-family%3D%22Arial%22%20font-size%3D%2210%22%20fill%3D%22white%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';

            results.slice(0, 20).forEach(game => {
                if (!game.id || !game.name) return;

                const resultEl = document.createElement('div');
                resultEl.className = 'search-result';
                resultEl.innerHTML = `
                    <img src="${this.steamApi.CORS_PROXY}https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/capsule_231x87.jpg" 
                         onerror="this.src='${fallbackImg}'" alt="${game.name}">
                    <span>${game.name}</span>
                `;
                resultEl.addEventListener('click', () => this.selectGame({ appid: game.id, name: game.name }, gameKey));
                resultsContainer.appendChild(resultEl);
            });
        } catch (error) {
            console.error('Error searching for games:', error);
            resultsContainer.innerHTML = `
                <div class="search-result">Search error: ${error.message}</div>
                <div class="search-result">Try using a more specific search term.</div>
            `;
        }
    }

    /**
     * Handle file uploads for logos/backgrounds
     */
    handleFileUpload(file, gameKey, imageType) {
        if (!file) return;

        // Clear appId when uploading custom files
        this.imageManager.images[gameKey].appId = null;
        document.getElementById(`${gameKey}-id`).value = '';

        document.getElementById(`${gameKey}-preview`).style.display = 'block';
        this.imageManager.loadUploadedImage(file, gameKey, imageType);
    }

    /**
     * Load game by Steam app ID
     */
    async loadGameById(appId, gameKey) {
        const numericId = parseInt(appId, 10);
        if (isNaN(numericId)) {
            alert('Please enter a valid Steam Game ID (numbers only)');
            return;
        }

        const previewEl = document.getElementById(`${gameKey}-preview`);
        const logoPreview = document.getElementById(`${gameKey}-logo-preview`);
        const bgPreview = document.getElementById(`${gameKey}-bg-preview`);

        previewEl.style.display = 'block';
        logoPreview.innerHTML = '<div style="color: #66c0f4;">Loading logo...</div>';
        bgPreview.innerHTML = '<div style="color: #66c0f4;">Loading background options...</div>';

        try {
            const gameName = await this.steamApi.verifyGameId(numericId);
            document.getElementById(`${gameKey}-name`).value = gameName;
            this.imageManager.images[gameKey].appId = numericId;
            this.imageManager.loadGameAssets(numericId, gameKey);
        } catch (error) {
            console.error('Error loading game by ID:', error);
            const errorMsg = `<div style="color: #ff6b6b;">Error: ${error.message}</div>`;
            logoPreview.innerHTML = errorMsg;
            bgPreview.innerHTML = errorMsg;
        }
    }

    /**
     * Select a game from search results
     */
    selectGame(game, gameKey) {
        document.getElementById(`${gameKey}-name`).value = game.name;
        document.getElementById(`${gameKey}-id`).value = game.appid;
        document.getElementById(`${gameKey}-results`).style.display = 'none';
        document.getElementById(`${gameKey}-preview`).style.display = 'block';

        this.imageManager.images[gameKey].appId = game.appid;
        this.imageManager.loadGameAssets(game.appid, gameKey);
    }
}