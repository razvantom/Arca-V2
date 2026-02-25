import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_V1_BASE_URL } from "../../../lib/api";
import { AUTH_COOKIE } from "../../../lib/auth";

export async function GET(request: Request) {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const apiUrl = `${API_V1_BASE_URL}/memberships${query ? `?${query}` : ""}`;

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "API unavailable" }, { status: 502 });
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(data ?? { message: "Request failed" }, { status: response.status });
  }

  return NextResponse.json(data);
}
