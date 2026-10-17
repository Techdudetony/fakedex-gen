import { NextResponse, type NextRequest } from "next/server";

/**
 * When FAKEDEX_PASSWORD is set, the whole site sits behind HTTP basic auth (any username).
 * This keeps strangers from spending your Claude and Gemini credits until real accounts exist.
 */
export function proxy(request: NextRequest) {
  const password = process.env.FAKEDEX_PASSWORD;
  if (!password) return NextResponse.next();

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    if (decoded.slice(decoded.indexOf(":") + 1) === password) return NextResponse.next();
  }

  return new NextResponse("Password required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Fakedex", charset="UTF-8"' },
  });
}
