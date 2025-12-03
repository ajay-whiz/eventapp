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
console.log(`Backend API Base URL: ${API_BASE_URL}`);

// Check if dist directory exists
const distExists = existsSync(distDir);
if (!distExists) {
  if (isProduction) {
    console.error(`Error: dist directory not found at ${distDir}`);
    console.error('Please run "npm run build" first');
    process.exit(1);
  } else {
    console.warn(`⚠️  Warning: dist directory not found at ${distDir}`);
    console.warn('📝 For local development with live reload, use: npm run dev');
    console.warn('📦 To build for production, use: npm run build');
    console.warn('🔧 This server will only proxy API requests. Frontend files will not be served.\n');
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
    const backendApiUrl = API_BASE_URL || process.env.VITE_API_BASE_URL || 'https://evenpappbackend-production.up.railway.app';
    const backendUrl = new URL(backendApiUrl);
    const isHttps = backendUrl.protocol === 'https:';
    const requestModule = isHttps ? httpsRequest : httpRequest;
    
    // Request comes as /api/v1/auth/login
    // Base URL is https://backend.com
    // We want to proxy to: https://backend.com/api/v1/auth/login
    // So we use the request path as-is since it already includes /api/v1
    const targetPath = req.url; // e.g., /api/v1/auth/login
    const targetUrl = `${backendUrl.origin}${targetPath}`;
    
    console.log(`[${requestId}] Proxying ${req.method} ${req.url} to: ${targetUrl}`);
    
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
      console.log(`[${requestId}] Backend responded with status: ${proxyRes.statusCode}`);
      
      // Copy response headers
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      
      // Pipe the response
      proxyRes.pipe(res);
      
      proxyRes.on('end', () => {
        console.log(`[${requestId}] ✓ API request completed`);
      });
    });

    proxyReq.on('error', (error) => {
      console.error(`[${requestId}] Proxy error:`, error.message);
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
    console.error(`[${requestId}] Proxy setup error:`, error);
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
      console.error(`[${requestId}] File not found: ${filePath}`);
      if (!res.headersSent) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
      return;
    }

    const stats = statSync(filePath);
    if (!stats.isFile()) {
      console.error(`[${requestId}] Path is not a file: ${filePath}`);
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
      console.log(`[${requestId}] ✓ Served ${filePath} (${content.length} bytes, ${mimeType})`);
    } else {
      console.error(`[${requestId}] Headers already sent, cannot serve file`);
    }
  } catch (error) {
    console.error(`[${requestId}] Error serving file:`, error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal server error');
    }
  }
}

const server = createServer((req, res) => {
  // Log incoming requests immediately - this should always fire if requests reach the server
  const requestId = Date.now();
  console.log(`[${requestId}] [${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Set timeout to prevent hanging connections
  req.setTimeout(30000, () => {
    console.log(`[${requestId}] Request timeout`);
    if (!res.headersSent) {
      res.writeHead(408, { 'Content-Type': 'text/plain' });
      res.end('Request timeout');
    }
  });
  
  try {
    // Health check endpoint - Railway might be checking this
    if (req.url === '/health' || req.url === '/healthz') {
      console.log(`[${requestId}] Serving health check`);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      });
      res.end(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        port: PORT
      }));
      console.log(`[${requestId}] ✓ Health check responded`);
      return;
    }

    // Proxy API requests to backend (any path starting with /api)
    if (req.url.startsWith('/api')) {
      console.log(`[${requestId}] Proxying API request: ${req.url}`);
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
    console.log(`[${requestId}] Resolved file path: ${filePath}`);
    
    // Remove query string
    filePath = filePath.split('?')[0];
    
    // Security: prevent directory traversal
    if (filePath.includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    const fullPath = join(distDir, filePath);
    console.log(`[${requestId}] Full path: ${fullPath}`);
    console.log(`[${requestId}] File exists: ${existsSync(fullPath)}`);

    // If file doesn't exist and it's not an API route, serve index.html (for SPA routing)
    if (!existsSync(fullPath) && !filePath.startsWith('/api')) {
      console.log(`[${requestId}] File not found, serving index.html for SPA routing`);
      const indexPath = join(distDir, 'index.html');
      if (existsSync(indexPath)) {
        serveFile(indexPath, res, requestId);
        return;
      } else {
        console.error(`[${requestId}] index.html not found!`);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('index.html not found');
        return;
      }
    }

    serveFile(fullPath, res, requestId);
  } catch (error) {
    console.error('Unhandled error in request handler:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal server error');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`PORT environment variable: ${process.env.PORT || 'default (5173)'}`);
  
  // Verify server is actually listening
  const address = server.address();
  console.log(`Server listening on:`, address);
  
  if (distExists) {
    console.log(`Serving files from: ${distDir}`);
    // Verify index.html exists
    const indexPath = join(distDir, 'index.html');
    if (existsSync(indexPath)) {
      console.log('✓ index.html found');
      const stats = statSync(indexPath);
      console.log(`  File size: ${stats.size} bytes`);
      
      // Test that we can actually read the file
      try {
        const testContent = readFileSync(indexPath, 'utf8');
        console.log(`✓ Successfully read index.html (${testContent.length} chars)`);
      } catch (error) {
        console.error('✗ Error reading index.html:', error);
      }
    } else {
      console.error('✗ index.html NOT found in dist directory!');
    }
    console.log(`Main site available at: http://0.0.0.0:${PORT}/`);
  } else {
    console.log('⚠️  Running in API proxy mode only (dist directory not found)');
    console.log('📝 Use "npm run dev" for full development server');
  }
  
  // Log that server is ready to accept connections
  console.log('✓ Server is ready to accept connections');
  console.log('Waiting for incoming requests...');
  console.log(`Health check available at: http://0.0.0.0:${PORT}/health`);
  console.log(`API proxy available at: http://0.0.0.0:${PORT}/api`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  console.error('Error details:', error.message, error.code);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit, let the server continue running
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, let the server continue running
});

