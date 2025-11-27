// Centralized API base URL for your frontend
// Uses Vite's environment variable if available, otherwise falls back to localhost

// For local development, use relative paths to go through Vite proxy
// For production, use relative paths to go through the proxy server
const getApiBaseUrl = () => {
  // Check if VITE_API_BASE_URL is set
  let envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // In production, use relative paths to go through our proxy server
  if (import.meta.env.PROD) {
    // Production: Use relative path so requests go through our proxy server
    const prodUrl = '/api/v1/';
    return prodUrl;
  }
  
  // In development mode:
  // If VITE_API_BASE_URL is explicitly set, use it (for direct API calls)
  // Otherwise, use relative path to go through Vite proxy (recommended for local dev)
  if (envUrl) {
    // Ensure the URL ends with /api/v1/
    // Remove trailing slash if present
    envUrl = envUrl.replace(/\/+$/, '');
    
    // Check if /api/v1 is already in the URL
    if (!envUrl.includes('/api/v1')) {
      envUrl = `${envUrl}/api/v1`;
    }
    
    // Ensure it ends with a slash for proper path joining
    if (!envUrl.endsWith('/')) {
      envUrl = `${envUrl}/`;
    }
    
    return envUrl;
  }
  
  // Default: Use relative path in development to go through Vite proxy
  // This will proxy to http://localhost:10030 (or VITE_PROXY_TARGET if set)
  const devUrl = '/api/v1/';
  return devUrl;
};

export const API_BASE_URL = getApiBaseUrl();

export const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:10030/uploads/profile/";
