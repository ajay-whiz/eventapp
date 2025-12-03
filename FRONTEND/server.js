import { createServer } from 'http';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 5173;
const distDir = join(__dirname, 'dist');
const isProduction = process.env.NODE_ENV === 'production';

// Backend API configuration - base URL without /api/v1 (we'll add it in the proxy)
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://apimarketplace.whiz-cloud.com';

// Check if dist directory exists
const distExists = existsSync(distDir);
if (!distExists) {
  if (isProduction) {
    process.exit(1);
  }
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
};

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function proxyRequest(req, res, requestId) {
  try {
    // Ensure API_BASE_URL is defined
    const backendApiUrl = API_BASE_URL || process.env.VITE_API_BASE_URL || 'https://apimarketplace.whiz-cloud.com';
    const backendUrl = new URL(backendApiUrl);
    const isHttps = backendUrl.protocol === 'https:';
    const requestModule = isHttps ? httpsRequest : httpRequest;
    
    // Request comes as /api/v1/auth/login
    // Base URL is https://backend.com
    // We want to proxy to: https://backend.com/api/v1/auth/login
    // So we use the request path as-is since it already includes /api/v1
    const targetPath = req.url; // e.g., /api/v1/auth/login
    const targetUrl = `${backendUrl.origin}${targetPath}`;
    
    // Copy headers but update host
    const headers = { ...req.headers };
    headers.host = backendUrl.hostname;
    // Remove connection header as it's connection-specific
    delete headers.connection;
    
    const options = {
      hostname: backendUrl.hostname,
      port: backendUrl.port || (isHttps ? 443 : 80),
      path: targetPath,
      method: req.method,
      headers: headers
    };

    const proxyReq = requestModule(options, (proxyRes) => {
      // Copy response headers
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      
      // Pipe the response
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (error) => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Bad Gateway', 
          message: 'Failed to connect to backend server',
          details: error.message
        }));
      }
    });

    // Pipe the request body
    req.pipe(proxyReq);
    
  } catch (error) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'Failed to setup proxy',
        details: error.message
      }));
    }
  }
}

function serveFile(filePath, res, requestId = '') {
  try {
    if (!existsSync(filePath)) {
      if (!res.headersSent) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
      return;
    }

    const stats = statSync(filePath);
    if (!stats.isFile()) {
      if (!res.headersSent) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not a file');
      }
      return;
    }

    const content = readFileSync(filePath);
    const mimeType = getMimeType(filePath);
    
    if (!res.headersSent) {
      res.writeHead(200, { 
        'Content-Type': mimeType,
        'Content-Length': content.length,
        'Connection': 'keep-alive'
      });
      res.end(content);
    }
  } catch (error) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal server error');
    }
  }
}

const server = createServer((req, res) => {
  const requestId = Date.now();
  
  // Set timeout to prevent hanging connections
  req.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.writeHead(408, { 'Content-Type': 'text/plain' });
      res.end('Request timeout');
    }
  });
  
  try {
    // Health check endpoint - Railway might be checking this
    if (req.url === '/health' || req.url === '/healthz') {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      });
      res.end(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        port: PORT
      }));
      return;
    }

    // Proxy API requests to backend (any path starting with /api)
    if (req.url.startsWith('/api')) {
      proxyRequest(req, res, requestId);
      return;
    }

    // Handle root path and all other requests
    // If dist directory doesn't exist, only proxy API requests
    if (!distExists) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Service Unavailable',
        message: 'Frontend files not built. For local development, use "npm run dev" instead of "npm start".',
        suggestion: 'Run "npm run dev" for development server with live reload, or "npm run build" to build for production.'
      }));
      return;
    }

    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Remove query string
    filePath = filePath.split('?')[0];
    
    // Security: prevent directory traversal
    if (filePath.includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    const fullPath = join(distDir, filePath);

    // If file doesn't exist and it's not an API route, serve index.html (for SPA routing)
    if (!existsSync(fullPath) && !filePath.startsWith('/api')) {
      const indexPath = join(distDir, 'index.html');
      if (existsSync(indexPath)) {
        serveFile(indexPath, res, requestId);
        return;
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('index.html not found');
        return;
      }
    }

    serveFile(fullPath, res, requestId);
  } catch (error) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal server error');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  // Server is ready
});

server.on('error', (error) => {
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  // Don't exit, let the server continue running
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  // Don't exit, let the server continue running
});

