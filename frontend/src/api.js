const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(path, { token, method = "GET", body, signal } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    signal,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) {
    throw new ApiError(data.message || `Request failed (${response.status})`, response.status);
  }
  return data;
}

export function getStoredSession() {
  try {
    const stored = sessionStorage.getItem("mediaura-session");
    if (!stored) return null;
    const session = JSON.parse(stored);
    return session?.token && session?.user?.role ? session : null;
  } catch {
    return null;
  }
}

export function storeSession(session) {
  sessionStorage.setItem("mediaura-session", JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem("mediaura-session");
}
