/**
 * Main application entry point
 * Initializes all managers and controllers
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Steam API client
    const steamApi = new SteamAPI();

    // Initialize image manager (generator reference set later due to circular dependency)
    const imageManager = new ImageManager(steamApi, null);

    // Initialize the image generator
    const generator = new ImageGenerator(imageManager);

    // Set generator reference in imageManager to complete the circular dependency
    imageManager.generator = generator;

    // Initialize game search functionality
    new GameSearchManager(steamApi, imageManager);

    // Initialize UI controls
    new UIControls(generator);
});