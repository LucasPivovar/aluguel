import { NextRequest, NextResponse } from "next/server";
import {
  getHomeRouteForRole,
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifyPassword,
} from "@/lib/auth";
import { readDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const rememberMe = Boolean(body.rememberMe);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Informe seu e-mail e senha." },
        { status: 400 }
      );
    }

    const db = await readDatabase();
    const user = db.users.find((u) => u.email.toLowerCase() === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    const token = signSessionToken(user);
    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      redirectTo: getHomeRouteForRole(user.role),
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      ...(rememberMe ? { maxAge: 60 * 60 * 24 * 30 } : {}),
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Não foi possível entrar. Tente novamente." },
      { status: 500 }
    );
  }
}
