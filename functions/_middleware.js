// functions/_middleware.ts
export const onRequest = async (context) => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (input, init) => {
        if (init && 'cache' in init) {
            delete init.cache;
        }
        return originalFetch(input, init);
    };
    try {
        return await context.next();
    }
    catch (err) {
        console.error('[Middleware Error]:', err);
        throw err;
    }
};
