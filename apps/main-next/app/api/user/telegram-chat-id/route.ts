import { NextRequest, NextResponse } from "next/server";
import { NODE_SERVICE } from "@/app/src/config/node_service";

function authHeaders(request: NextRequest): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = request.cookies.get("token")?.value;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${NODE_SERVICE}/user/telegram-chat-id`, {
      method: "GET",
      cache: "no-store",
      headers: authHeaders(request),
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = { error: "Upstream returned non-JSON response" };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[API] GET /user/telegram-chat-id:", error);
    return NextResponse.json(
      { error: "Node Service Unreachable" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${NODE_SERVICE}/user/telegram-chat-id`, {
      method: "PATCH",
      headers: authHeaders(request),
      body: JSON.stringify(body),
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = { error: "Upstream returned non-JSON response" };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[API] PATCH /user/telegram-chat-id:", error);
    return NextResponse.json(
      { error: "Node Service Unreachable" },
      { status: 500 },
    );
  }
}
