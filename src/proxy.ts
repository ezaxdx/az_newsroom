import { NextRequest, NextResponse } from "next/server";

/** 비밀번호를 SHA-256 해시로 변환 */
async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 로그인 페이지와 auth API는 통과
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/auth")) {
    return NextResponse.next();
  }

  // /admin/* 경로 보호
  if (pathname.startsWith("/admin")) {
    const cookie = req.cookies.get("admin_auth")?.value;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || !cookie) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const expectedToken = await hashPassword(adminPassword);
    if (cookie !== expectedToken) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
