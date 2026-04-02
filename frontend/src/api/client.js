const configuredBaseUrl = (import.meta.env.VITE_API_URL || "").trim();

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiRequest(path, options = {}) {
  const { body, headers, ...rest } = options;
  const isFormData = body instanceof FormData;
  const requestHeaders = { ...(headers || {}) };

  if (body !== undefined && !isFormData && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(buildApiUrl(path), {
    credentials: "include",
    body,
    headers: requestHeaders,
    ...rest,
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new ApiError(
      data?.error || `Request failed with status ${response.status}`,
      response.status,
      data,
    );
  }

  return data || {};
}
