/**
 * JSON API helper with credentials. On 401 in the browser, redirects to login unless `redirectOn401: false`.
 */
export async function apiJson(url, options = {}) {
  const { redirectOn401 = true, ...fetchOpts } = options;
  const res = await fetch(url, {
    ...fetchOpts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(fetchOpts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (redirectOn401 !== false && typeof window !== "undefined" && res.status === 401) {
      const from = window.location.pathname + window.location.search;
      window.location.assign(`/login?from=${encodeURIComponent(from)}`);
    }
    const err = new Error(
      typeof data.error === "string" ? data.error : res.statusText || "Request failed"
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
