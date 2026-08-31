const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export class BackendError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = "BackendError";
    this.status = status;
  }
}

export async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      cache: "no-store",
    });
  } catch {
    throw new BackendError("MasterShield backend is unreachable. Start FastAPI on port 8000.");
  }
  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const detail = typeof data === "object" && data && "detail" in data ? String((data as {detail?: unknown}).detail) : `HTTP ${response.status}`;
    throw new BackendError(detail, response.status);
  }
  return data as T;
}

export function backendUrl(path = "/health") { return `${API_BASE}${path}`; }
