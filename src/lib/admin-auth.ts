import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

/**
 * 관리자 쿠키 검증 헬퍼
 * 인증 실패 시 401 Response 반환, 성공 시 null 반환
 *
 * 사용법:
 *   const unauth = await requireAdmin();
 *   if (unauth) return unauth;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("admin_auth")?.value;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expectedToken = await hashPassword(adminPassword);
  if (cookie !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
