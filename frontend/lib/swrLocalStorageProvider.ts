// A tiny SWR cache provider backed by localStorage
// Usage:
// <SWRConfig value={{ provider: localStorageProvider('swr-cache'), ... }}>
//   ...
// </SWRConfig>

type CacheRecord = Record<string, any>

export function localStorageProvider(namespace: string = "swr-cache") {
    const storageKey = `__${namespace}__`
    // In SSR/edge where window/localStorage are unavailable, fall back to in-memory map.
    if (typeof window === 'undefined') {
        return new Map<string, any>()
    }

    // When initializing, we restore the data from `localStorage` into a map.
    const map = new Map<string, any>(JSON.parse(localStorage.getItem(storageKey) || "[]"))

    // Before unloading the app, we write back all the data into `localStorage`.
    const persist = () => {
        const appCache: [string, any][] = Array.from(map.entries())
        try {
            localStorage.setItem(storageKey, JSON.stringify(appCache))
        } catch { }
    }
    if (typeof window !== 'undefined') {
        window.addEventListener("beforeunload", persist)
    }

    // We still use the map for write & read for performance.
    return map
}


