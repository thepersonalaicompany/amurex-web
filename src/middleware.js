import { NextResponse } from 'next/server';

// This middleware will run for all routes
export function middleware(request) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Only apply CORS for API routes
  if (pathname.startsWith('/api/')) {
    // Get the origin header from the request
    const origin = request.headers.get('origin') || '';
    
    // List of allowed origins - you can expand this as needed
    const allowedOrigins = [
      'https://app.amurex.ai',
      "http://localhost:3000",
      // Add other trusted domains if necessary
      // e.g., 'https://admin.amurex.ai',
    ];
    
    // Check if the request origin is in the allowed origins list
    const isAllowedOrigin = allowedOrigins.includes(origin);
    
    // Configure the response headers
    const responseHeaders = new Headers(request.headers);
    
    // Only set Access-Control-Allow-Origin if it's from an allowed origin
    if (isAllowedOrigin) {
      responseHeaders.set('Access-Control-Allow-Origin', origin);
      responseHeaders.set('Access-Control-Allow-Credentials', 'true');
      
      // For OPTIONS requests (preflight), handle these separately
      if (request.method === 'OPTIONS') {
        responseHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
        responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        responseHeaders.set('Access-Control-Max-Age', '86400'); // 24 hours
        
        // Return an empty response for OPTIONS requests
        return new NextResponse(null, {
          status: 204,
          headers: responseHeaders,
        });
      }
    }
    
    // Clone the response with new headers
    const response = NextResponse.next({
      request: {
        headers: responseHeaders,
      },
    });
    
    // Only set CORS headers if it's from an allowed origin
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    return response;
  }
  
  // For non-API routes, continue without modification
  return NextResponse.next();
}

// Configure the middleware to run only for API routes and OPTIONS requests
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 