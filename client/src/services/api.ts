/**
 * Centralized API fetch layer.
 * Provides typed error objects, automatic JSON detection, optional retry for transient failures,
 * and a single place to evolve cross-cutting concerns (auth headers, tracing, etc.).
 */

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiError extends Error {
  status: number;
  rawMessage?: string;
  fieldErrors?: string[];
  cause?: unknown;
  friendly?: boolean;
}

export interface HttpFetchOptions {
  method?: ApiMethod;
  body?: unknown;
  headers?: Record<string, string>;
  /** Number of automatic retries for network-level failures (NOT for 4xx) */
  retries?: number;
  /** Milliseconds base delay for exponential backoff */
  retryDelayMs?: number;
  /** Optional AbortSignal to cancel the request */
  signal?: AbortSignal;
}

export interface HttpFetchResult<TJson = unknown> {
  raw: Response;
  json?: TJson;
  text?: string;
  /** Convenience access to already-parsed error message if any */
  errorMessage?: string;
}

const DEFAULT_RETRIES = 0;
const DEFAULT_RETRY_DELAY = 250;

function buildFriendlyMessage(status: number, apiMessage?: string): string {
  const defaults: Record<number, string> = {
    400: "Data tidak valid. Periksa form Anda.",
    401: "Sesi tidak valid atau belum login.",
    403: "Anda tidak memiliki izin.",
    404: "Resource tidak ditemukan.",
    409: "Terjadi konflik data.",
    422: "Validasi gagal.",
    429: "Terlalu banyak permintaan. Coba lagi nanti.",
    500: "Kesalahan server internal.",
    502: "Bad gateway.",
    503: "Layanan sementara tidak tersedia.",
    504: "Timeout server.",
  };
  if (status >= 500) return defaults[status] || defaults[500];
  const trimmed = (apiMessage || "").trim();
  if (trimmed && !trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return trimmed;
  }
  return defaults[status] || "Terjadi kesalahan tak terduga.";
}

function isTransientStatus(status: number): boolean {
  return [502, 503, 504].includes(status);
}

export function detectJson(res: Response): boolean {
  const contentType = res.headers.get("content-type") || "";
  return /application\/json|\bjson\b/i.test(contentType);
}

interface ParsedResponse<TJson> {
  apiMessage?: string;
  fieldErrors?: string[];
  text?: string;
  json?: TJson;
}

async function parseResponse<TJson>(res: Response): Promise<ParsedResponse<TJson>> {
  if (detectJson(res)) {
    try {
      type DataWithMeta = {
        message?: string;
        error?: string;
        detail?: string;
        errors?: unknown[];
        issues?: unknown[];
        [key: string]: unknown;
      };
      const data = await res.json() as TJson & DataWithMeta;
      const apiMessage = data.message || data.error || data.detail;
      const errs = data.errors || data.issues;
      const fieldErrors = Array.isArray(errs)
        ? errs
            .map(e => (e && typeof e === 'object' && 'message' in e ? (e as { message?: string }).message : undefined))
            .filter((m): m is string => typeof m === 'string')
            .slice(0, 3)
        : undefined;
      return { json: data as TJson, apiMessage, fieldErrors };
    } catch {
      return { apiMessage: "Gagal parse JSON", text: "" };
    }
  }
  try {
    const text = await res.text();
    return { text, apiMessage: text.slice(0, 200) };
  } catch {
    return { apiMessage: res.statusText || "Unknown error" };
  }
}

async function performFetch(url: string, options: HttpFetchOptions, attempt: number, maxRetries: number, baseDelay: number): Promise<Response> {
  const { method = "GET", body, headers, signal } = options;
  try {
    return await fetch(url, {
      method,
      credentials: "include",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    // If aborted, do not retry
    const aborted = (signal && signal.aborted) || (e instanceof Error && e.name === 'AbortError');
    if (!aborted && attempt < maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
      return performFetch(url, options, attempt + 1, maxRetries, baseDelay);
    }
    const err: ApiError = Object.assign(new Error("Tidak bisa terhubung ke server. Periksa koneksi internet Anda."), {
      status: 0,
      cause: e,
    });
    throw err;
  }
}

export async function httpFetch<TJson = unknown>(url: string, options: HttpFetchOptions = {}): Promise<HttpFetchResult<TJson>> {
  const maxRetries = options.retries ?? DEFAULT_RETRIES;
  const baseDelay = options.retryDelayMs ?? DEFAULT_RETRY_DELAY;
  const raw = await performFetch(url, options, 0, maxRetries, baseDelay);
  const parsed = await parseResponse<TJson>(raw);

  if (!raw.ok) {
    if (maxRetries > 0 && isTransientStatus(raw.status)) {
      // Retry transient server status codes by performing manual retries
      for (let attempt = 0; attempt < maxRetries && isTransientStatus(raw.status); attempt++) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
        const retried = await performFetch(url, options, attempt, 0, baseDelay);
        if (retried.ok) {
          const reparsed = await parseResponse<TJson>(retried);
          return { raw: retried, json: reparsed.json, text: reparsed.text };
        }
      }
    }
    const friendly = buildFriendlyMessage(raw.status, parsed.apiMessage);
    const err: ApiError = Object.assign(new Error(parsed.fieldErrors?.length ? `${friendly} ${parsed.fieldErrors.join(". ")}` : friendly), {
      status: raw.status,
      rawMessage: parsed.apiMessage,
      fieldErrors: parsed.fieldErrors,
      friendly: true,
    });
    throw err;
  }

  return { raw, json: parsed.json, text: parsed.text };
}
