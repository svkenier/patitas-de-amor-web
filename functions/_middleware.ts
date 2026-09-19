// functions/_middleware.ts
export const onRequest: PagesFunction = async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (init && 'cache' in init) {
      delete (init as any).cache;
    }
    return originalFetch(input, init);
  };

  try {
    return await context.next();
  } catch (err: any) {
    console.error('[Middleware Error]:', err);
    throw err;
  }
};
