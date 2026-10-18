// functions/_middleware.ts
export const onRequest: PagesFunction = async (context) => {
  if (!(globalThis as any).__fetchPatched) {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (init && 'cache' in init) {
        delete (init as any).cache;
      }
      return originalFetch(input, init);
    };
    (globalThis as any).__fetchPatched = true;
  }

  try {
    const response = await context.next();
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('X-Frame-Options', 'SAMEORIGIN');
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    newHeaders.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://res.cloudinary.com https://raw.githubusercontent.com https://cdn.jsdelivr.net https://images.weserv.nl; connect-src 'self' https://*.upstash.io https://api.github.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
    );
    newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

    const body = (response.status === 204 || response.status === 304) ? null : response.body;

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (err: any) {
    console.error('[Middleware Error]:', err);
    throw err;
  }
};
