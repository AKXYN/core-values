// Utility functions for the application

// Get the base path for GitHub Pages
function getBasePath() {
    const isGitHubPages = window.location.host.includes('github.io');
    return isGitHubPages ? '/core-values-app' : '';
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
    let url = getPageUrl(pageName);
    if (params) {
        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        url += `?${queryString}`;
    }
    window.location.href = url;
} 