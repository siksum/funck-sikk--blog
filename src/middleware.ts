import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /categories/[...] to /blog/categories/[...]
  if (pathname.startsWith('/categories/') || pathname === '/categories') {
    const newPath = pathname.replace('/categories', '/blog/categories');
    return NextResponse.redirect(new URL(newPath + request.nextUrl.search, request.url), 301);
  }

  // Redirect /sikk/category/[...] to /sikk/categories/[...]
  if (pathname.startsWith('/sikk/category/') || pathname === '/sikk/category') {
    const newPath = pathname.replace('/sikk/category', '/sikk/categories');
    return NextResponse.redirect(new URL(newPath + request.nextUrl.search, request.url), 301);
  }

  // Redirect old /blog/db/[slug] to a search or appropriate page
  // Since we can't look up the category in middleware, redirect to the blog main page
  // The user should update their bookmarks to the new URL format
  if (pathname.startsWith('/blog/db/')) {
    // For database pages, we need category info which isn't in the URL
    // Redirect to /blog and let the user navigate from there
    // Or keep the old route working (handled in Phase 6)
  }

  // Redirect old /sikk/db/[slug] similarly
  if (pathname.startsWith('/sikk/db/')) {
    // For database pages, we need category info which isn't in the URL
    // Keep the old route working for now (handled in Phase 6)
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match /categories paths
    '/categories/:path*',
    '/categories',
    // Match /sikk/category paths
    '/sikk/category/:path*',
    '/sikk/category',
    // Old database routes (optional handling)
    // '/blog/db/:path*',
    // '/sikk/db/:path*',
  ],
};
