import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_V1_BASE_URL } from "../../../../lib/api";
import { AUTH_COOKIE } from "../../../../lib/auth";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(`${API_V1_BASE_URL}/documents/${params.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let response: Response;
  try {
    response = await fetch(`${API_V1_BASE_URL}/documents/${params.id}`, {
      method: "DELETE",
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
