// Utility functions for the application

// Get the base path for GitHub Pages
function getBasePath() {
    // Check if we're running on GitHub Pages
    const isGitHubPages = window.location.host.includes('github.io');
    
    // If on GitHub Pages, use the repository name as the base path
    // Update this to match your actual repository name
    const repoName = 'core-values';
    
    return isGitHubPages ? `/${repoName}` : '';
}

// Get the full URL for a page
function getPageUrl(pageName) {
    return window.location.origin + getBasePath() + '/' + pageName;
}

// Navigate to a page
function navigateToPage(pageName) {
    window.location.href = getPageUrl(pageName);
}

// Navigate to a page with query parameters
function navigateToPageWithParams(pageName, params) {
    const url = new URL(getPageUrl(pageName), window.location.origin);
    
    // Add each parameter to the URL
    Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
    });
    
    window.location.href = url.toString();
} 
