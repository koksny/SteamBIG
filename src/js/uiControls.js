/**
 * UI controls and event handling
 */
class UIControls {
    constructor(generator) {
        this.generator = generator;
        this.setupEventListeners();
    }

    /**
     * Helper to get element by ID with null check
     */
    $(id) {
        return document.getElementById(id);
    }

    /**
     * Set up all event listeners for UI controls
     */
    setupEventListeners() {
        // Main controls that trigger regeneration
        const regenerateControls = [
            'format-select', 'split-style', 'swap-backgrounds', 'swap-logos', 'logo-position'
        ];

        regenerateControls.forEach(id => {
            this.$(id)?.addEventListener('change', () => this.generator.autoGenerate());
        });

        // Slider controls with value display
        this.setupSlider('split-angle', 'split-angle-value', '°');
        this.setupSlider('border-width', 'border-width-value', 'px');
        this.setupSlider('frame-border-width', 'frame-border-width-value', 'px');
        this.setupSlider('game1-scale', 'game1-scale-value', '%');
        this.setupSlider('game2-scale', 'game2-scale-value', '%');
        this.setupSlider('game1-x-offset', 'game1-x-offset-value', 'px');
        this.setupSlider('game1-y-offset', 'game1-y-offset-value', 'px');
        this.setupSlider('game2-x-offset', 'game2-x-offset-value', 'px');
        this.setupSlider('game2-y-offset', 'game2-y-offset-value', 'px');
        
        // Background offset sliders
        this.setupSlider('game1-bg-x-offset', 'game1-bg-x-offset-value', 'px');
        this.setupSlider('game1-bg-y-offset', 'game1-bg-y-offset-value', 'px');
        this.setupSlider('game1-bg-scale', 'game1-bg-scale-value', '%');
        this.setupSlider('game2-bg-x-offset', 'game2-bg-x-offset-value', 'px');
        this.setupSlider('game2-bg-y-offset', 'game2-bg-y-offset-value', 'px');
        this.setupSlider('game2-bg-scale', 'game2-bg-scale-value', '%');

        // Border color controls
        this.setupColorSync('border-color', 'border-color-text');
        this.setupColorSync('frame-border-color', 'frame-border-color-text');
        
        // Setup canvas drag for background and logo positioning
        this.setupCanvasDrag();

        // Download button
        this.$('download-btn')?.addEventListener('click', () => this.generator.downloadImage());

        // Split style conditional display
        this.$('split-style')?.addEventListener('change', (e) => {
            const diagonalOptions = this.$('diagonal-options');
            diagonalOptions?.classList.toggle('visible', e.target.value === 'diagonal');
        });

        // Initialize UI state
        this.initializeState();
    }

    /**
     * Set up a slider with value display and auto-regenerate
     */
    setupSlider(sliderId, displayId, suffix = '') {
        const slider = this.$(sliderId);
        const display = this.$(displayId);

        if (!slider) return;

        slider.addEventListener('input', () => {
            if (display) display.textContent = slider.value + suffix;
            this.generator.autoGenerate();
        });
    }

    /**
     * Set up color picker and text input synchronization
     */
    setupColorSync(pickerId, textId) {
        const picker = this.$(pickerId);
        const text = this.$(textId);

        if (!picker || !text) return;

        picker.addEventListener('input', () => {
            text.value = picker.value;
            this.generator.autoGenerate();
        });

        text.addEventListener('input', () => {
            // Validate hex color format
            if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(text.value)) {
                picker.value = text.value;
                this.generator.autoGenerate();
            }
        });
    }

    /**
     * Initialize UI to default state
     */
    initializeState() {
        // Hide diagonal options unless diagonal is selected
        const diagonalOptions = this.$('diagonal-options');
        const splitStyle = this.$('split-style');
        
        if (diagonalOptions) {
            diagonalOptions.classList.toggle('visible', splitStyle?.value === 'diagonal');
        }

        // Disable download until images are loaded
        const downloadBtn = this.$('download-btn');
        if (downloadBtn) downloadBtn.disabled = true;
    }

    /**
     * Set up canvas drag for background and logo positioning
     */
    setupCanvasDrag() {
        const canvas = this.$('preview-canvas');
        if (!canvas) return;

        let isDragging = false;
        let startX, startY;
        let activeGame = null; // 'game1' or 'game2'
        let dragMode = 'background'; // 'background' or 'logo'

        const getCanvasCoords = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
                scaleX,
                scaleY
            };
        };

        const isPointInRect = (px, py, rect) => {
            if (!rect) return false;
            return px >= rect.x && px <= rect.x + rect.width &&
                   py >= rect.y && py <= rect.y + rect.height;
        };

        const detectClickTarget = (canvasX, canvasY) => {
            const bounds = window.logoBounds || {};
            
            // Check if clicking on a logo first (logos are on top)
            // bounds.game1 always controls game1's sliders, bounds.game2 controls game2's
            if (isPointInRect(canvasX, canvasY, bounds.game1)) {
                return { mode: 'logo', game: 'game1' };
            }
            if (isPointInRect(canvasX, canvasY, bounds.game2)) {
                return { mode: 'logo', game: 'game2' };
            }
            
            // Not on a logo, determine background based on split style
            const splitStyle = this.$('split-style')?.value || 'diagonal';
            const swapBg = this.$('swap-backgrounds')?.checked || false;
            
            const relX = canvasX / canvas.width;
            const relY = canvasY / canvas.height;

            // Determine if click is in the "first" visual position
            // First position = top (horizontal), left (vertical), or upper-left area (diagonal)
            let isFirstPosition;
            switch (splitStyle) {
                case 'horizontal':
                    isFirstPosition = relY < 0.5;
                    break;
                case 'vertical':
                    isFirstPosition = relX < 0.5;
                    break;
                case 'diagonal':
                default:
                    // Simple diagonal check based on default 45-degree-ish split
                    // Upper-left region vs lower-right region
                    isFirstPosition = (relX + relY) < 1;
                    break;
            }

            // In drawBackgrounds.js:
            // - When swap OFF: first position uses game1's offset, second uses game2's
            // - When swap ON: first position uses game2's offset, second uses game1's
            let game;
            if (swapBg) {
                game = isFirstPosition ? 'game2' : 'game1';
            } else {
                game = isFirstPosition ? 'game1' : 'game2';
            }
            
            return { mode: 'background', game };
        };

        const updateSlider = (sliderId, valueId, delta, suffix = 'px') => {
            const slider = this.$(sliderId);
            const display = this.$(valueId);
            if (!slider) return;

            const newVal = Math.max(
                parseInt(slider.min),
                Math.min(parseInt(slider.max), parseInt(slider.value) + delta)
            );
            slider.value = newVal;
            if (display) display.textContent = newVal + suffix;
        };

        canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left click
            
            const coords = getCanvasCoords(e);
            const target = detectClickTarget(coords.x, coords.y);
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            dragMode = target.mode;
            activeGame = target.game;
            
            canvas.classList.add('dragging');
            canvas.classList.toggle('dragging-logo', dragMode === 'logo');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging || !activeGame) return;

            const coords = getCanvasCoords(e);
            const deltaX = Math.round((e.clientX - startX) * coords.scaleX);
            const deltaY = Math.round((e.clientY - startY) * coords.scaleY);

            if (deltaX !== 0 || deltaY !== 0) {
                if (dragMode === 'logo') {
                    // Update logo offsets
                    updateSlider(`${activeGame}-x-offset`, `${activeGame}-x-offset-value`, deltaX);
                    updateSlider(`${activeGame}-y-offset`, `${activeGame}-y-offset-value`, deltaY);
                } else {
                    // Update background offsets
                    updateSlider(`${activeGame}-bg-x-offset`, `${activeGame}-bg-x-offset-value`, deltaX);
                    updateSlider(`${activeGame}-bg-y-offset`, `${activeGame}-bg-y-offset-value`, deltaY);
                }
                startX = e.clientX;
                startY = e.clientY;
                this.generator.autoGenerate();
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            activeGame = null;
            dragMode = 'background';
            canvas.classList.remove('dragging', 'dragging-logo');
        });

        // Update cursor on hover to indicate what will be dragged
        canvas.addEventListener('mousemove', (e) => {
            if (isDragging) return; // Don't change cursor while dragging
            
            const coords = getCanvasCoords(e);
            const target = detectClickTarget(coords.x, coords.y);
            
            canvas.classList.toggle('over-logo', target.mode === 'logo');
        });

        canvas.addEventListener('mouseleave', () => {
            if (!isDragging) {
                canvas.classList.remove('over-logo');
            }
        });
    }
}