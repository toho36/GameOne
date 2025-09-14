import ky, { KyInstance, Options } from "ky";

// Centralized API client using Ky
// - Unwraps { success, data } payloads
// - Throws on HTTP errors (default Ky behavior)
// - Provides typed helpers for common verbs

export const api: KyInstance = ky.create({
  timeout: 10000,
  retry: { limit: 1 },
  hooks: {
    beforeRequest: [
      async (request) => {
        // Ensure JSON content-type for requests with body
        if (request.method !== "GET" && !request.headers.get("Content-Type")) {
          request.headers.set("Content-Type", "application/json");
        }
      },
    ],
  },
});

export type Json = Record<string, unknown> | Array<unknown> | null;

function unwrapData<T>(payload: any): T {
  if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

export async function getJson<T>(url: string, options?: Options): Promise<T> {
  const res = await api.get(url, options).json<any>();
  return unwrapData<T>(res);
}

export async function postJson<T>(url: string, json?: Json, options?: Options): Promise<T> {
  const res = await api.post(url, { json, ...options }).json<any>();
  return unwrapData<T>(res);
}

export async function putJson<T>(url: string, json?: Json, options?: Options): Promise<T> {
  const res = await api.put(url, { json, ...options }).json<any>();
  return unwrapData<T>(res);
}

export async function patchJson<T>(url: string, json?: Json, options?: Options): Promise<T> {
  const res = await api.patch(url, { json, ...options }).json<any>();
  return unwrapData<T>(res);
}

export async function deleteJson<T>(url: string, options?: Options): Promise<T> {
  const res = await api.delete(url, options).json<any>();
  return unwrapData<T>(res);
}

