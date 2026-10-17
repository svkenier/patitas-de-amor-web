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
