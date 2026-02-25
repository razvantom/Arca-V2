const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export const API_BASE_URL = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
export const API_V1_BASE_URL = `${API_BASE_URL}/api/v1`;
