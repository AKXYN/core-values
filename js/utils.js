// Utility functions for the application

// Get the base path for GitHub Pages
function getBasePath() {
    // Check if we're running on GitHub Pages
    const isGitHubPages = window.location.host.includes('github.io');
    console.log("Is GitHub Pages:", isGitHubPages);
    console.log("Current host:", window.location.host);
    console.log("Current pathname:", window.location.pathname);
    
    // If on GitHub Pages, use the repository name as the base path
    const repoName = 'core-values';
    const basePath = isGitHubPages ? `/${repoName}` : '';
    
    console.log("Base path:", basePath);
    return basePath;
}

// Get the full URL for a page
function getPageUrl(pageName) {
    const basePath = getBasePath();
    const url = window.location.origin + basePath + '/' + pageName;
    console.log("Generated URL:", url);
    return url;
}

// Navigate to a page
function navigateToPage(pageName) {
    const url = getPageUrl(pageName);
    console.log("Navigating to:", url);
    window.location.href = url;
}

// Navigate to a page with query parameters
function navigateToPageWithParams(pageName, params) {
    const basePath = getBasePath();
    const url = new URL(window.location.origin + basePath + '/' + pageName);
    
    // Add each parameter to the URL
    Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
    });
    
    console.log("Navigating to with params:", url.toString());
    window.location.href = url.toString();
} 