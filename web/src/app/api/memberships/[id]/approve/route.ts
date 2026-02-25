import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_V1_BASE_URL } from "../../../../../lib/api";
import { AUTH_COOKIE } from "../../../../../lib/auth";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let response: Response;
  try {
    response = await fetch(`${API_V1_BASE_URL}/memberships/${params.id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
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
