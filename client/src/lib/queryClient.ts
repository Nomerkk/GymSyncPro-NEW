import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { Query, Mutation } from "@tanstack/query-core";
/**
 * NOTE: This module now delegates low-level HTTP concerns to `services/api.ts`.
 * Over time, callers should prefer importing helpers from `@/services/api` rather than
 * using `apiRequest` directly. `apiRequest` remains for backward compatibility and will be phased out.
 */
import { httpFetch, type ApiMethod, type ApiError, detectJson } from "@/services/api";

// legacy friendly message helper removed; httpFetch creates friendly messages.

// Note: legacy response checker removed; httpFetch throws typed ApiError already.

/**
 * @deprecated Use `httpFetch` (and domain services/hooks) instead.
 * Legacy low-level request wrapper retained temporarily for backward compatibility with
 * older components. New code should:
 * 1. Add a domain service in `services/` that calls `httpFetch`.
 * 2. Wrap it with a React Query hook (e.g. `useX` / `useXActions`).
 * 3. Handle toasts + cache invalidation in the hook layer.
 * This function will be removed after full migration.
 */
export async function apiRequest(
  method: ApiMethod,
  url: string,
  data?: unknown,
): Promise<Response> {
  const res = await httpFetch(url, { method, body: data });
  // httpFetch already throws typed ApiError on network / status issues.
  return res.raw;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export function getQueryFn<T>(options: { on401: "throw" }): QueryFunction<T>;
export function getQueryFn<T>(options: { on401: "returnNull" }): QueryFunction<T | null>;
export function getQueryFn<T>(options: { on401: UnauthorizedBehavior }): QueryFunction<T | null> {
  const { on401: unauthorizedBehavior } = options;
  return async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    let apiRes: Awaited<ReturnType<typeof httpFetch>>;
    try {
      apiRes = await httpFetch(url, { method: "GET" });
    } catch (e) {
      const err = e as ApiError;
      if (unauthorizedBehavior === "returnNull" && err.status === 401) {
        return null as unknown as T | null;
      }
      throw err;
    }
    // Ensure JSON response; if not JSON return raw text for debugging
    if (!detectJson(apiRes.raw)) {
      return apiRes.text as unknown as T;
    }
    return apiRes.json as T;
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      // Keep cached data visible instantly when switching pages
      // React Query v5 replacement for keepPreviousData
      placeholderData: (prev: unknown) => prev,
      // Never becomes stale to avoid auto refetch on navigation
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Admin-only persistence: allowlist admin queries and hydrate/persist via localStorage.
const ADMIN_QUERY_ALLOWLIST = new Set<string>([
  "members",
  "classes",
  "trainers",
  "promotions",
  "class-bookings",
  "pt-bookings",
  "pt-session-packages",
  "pt-session-attendance",
]);

let persistenceStarted = false;

export function enableAdminPersistence(): void {
  if (persistenceStarted) return;
  if (typeof window === "undefined" || !window.localStorage) return;

  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: "gsp-admin-rq-v1",
    throttleTime: 1000,
  });

  persistQueryClient({
    queryClient,
    persister,
    // Keep indefinitely; we control visibility via app logic and manual invalidations
    maxAge: Infinity,
    dehydrateOptions: {
      // Persist only admin-relevant queries
      shouldDehydrateQuery: (query: Query) => {
        const key0 = Array.isArray(query.queryKey)
          ? (query.queryKey[0] as unknown)
          : (query.queryKey as unknown);
        if (typeof key0 === "string") {
          if (key0.startsWith("/api/admin")) return true;
          if (ADMIN_QUERY_ALLOWLIST.has(key0)) return true;
        }
        return false;
      },
      // Persist only admin-relevant mutations (based on mutationKey if provided)
      shouldDehydrateMutation: (mutation: Mutation) => {
        const mKey = mutation.options.mutationKey as unknown;
        const key0 = Array.isArray(mKey) ? (mKey[0] as unknown) : mKey;
        if (typeof key0 === "string") {
          if (key0.startsWith("/api/admin")) return true;
          if (ADMIN_QUERY_ALLOWLIST.has(key0)) return true;
        }
        return false;
      },
    },
  });

  persistenceStarted = true;
}
