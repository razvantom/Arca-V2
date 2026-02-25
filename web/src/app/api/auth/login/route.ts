import { NextResponse } from "next/server";
import { API_V1_BASE_URL } from "../../../../lib/api";
import { AUTH_COOKIE } from "../../../../lib/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(`${API_V1_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ message: "API unavailable" }, { status: 502 });
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(data ?? { message: "Login failed" }, { status: response.status });
  }

  const token = (data as { accessToken?: string } | null)?.accessToken;
  if (!token) {
    return NextResponse.json({ message: "Missing access token" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return res;
}
