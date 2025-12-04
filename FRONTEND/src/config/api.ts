// Centralized API base URL for your frontend
// Uses Vite's environment variable if available, otherwise falls back to the correct API URL

// Default API base URL (without /api/v1)
const DEFAULT_API_BASE = 'https://apimarketplace.whiz-cloud.com';

// For local development and production, use the production API URL
const getApiBaseUrl = () => {
  // Check if VITE_API_BASE_URL is set
  let envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // Validate and fix if wrong URL is set (marketplace -> apimarketplace)
  if (envUrl && envUrl.includes('marketplace.whiz-cloud.com') && !envUrl.includes('apimarketplace.whiz-cloud.com')) {
    envUrl = envUrl.replace('marketplace.whiz-cloud.com', 'apimarketplace.whiz-cloud.com');
  }
  
  // If VITE_API_BASE_URL is explicitly set, use it
  if (envUrl) {
    // Ensure the URL ends with /api/v1/
    envUrl = envUrl.replace(/\/+$/, ''); // Remove trailing slashes
    
    // Add /api/v1 if not present
    if (!envUrl.includes('/api/v1')) {
      envUrl = `${envUrl}/api/v1`;
    }
    
    // Ensure it ends with a slash for proper path joining
    if (!envUrl.endsWith('/')) {
      envUrl = `${envUrl}/`;
    }
    
    return envUrl;
  }
  
  // Default: Always use the production API URL directly
  // This works in both development (via Vite proxy) and production
  return `${DEFAULT_API_BASE}/api/v1/`;
};

export const API_BASE_URL = getApiBaseUrl();

// Get the base URL without /api/v1/ for image URLs and other direct API calls
export const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If VITE_API_BASE_URL is set, use it (but fix if wrong)
  if (envUrl) {
    let url = envUrl;
    // Fix incorrect URL if present
    if (url.includes('marketplace.whiz-cloud.com') && !url.includes('apimarketplace.whiz-cloud.com')) {
      url = url.replace('marketplace.whiz-cloud.com', 'apimarketplace.whiz-cloud.com');
    }
    // Remove /api/v1/ if present
    url = url.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    return url;
  }
  
  // Default to the correct API URL
  return DEFAULT_API_BASE;
};

export const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || `${getBaseUrl()}/uploads/profile/`;
