import { NextRequest, NextResponse } from "next/server";
import {
  getHomeRouteForRole,
  hashPassword,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth";
import { updateDatabase } from "@/lib/store";
import type { User, UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const rawRole = body.role as UserRole;
    // Public registration allows Owner or Tenant; Concierge accounts are internal
    const role: UserRole =
      rawRole === "inquilino" ? "inquilino" : "proprietario";

    if (!name || !email || password.length < 6) {
      return NextResponse.json(
        { error: "Informe nome, e-mail e senha com pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const result = await updateDatabase<{ error?: string; user?: User }>((db) => {
      const exists = db.users.some((u) => u.email.toLowerCase() === email);
      if (exists) {
        return { error: "Já existe uma conta com este e-mail." };
      }

      const newUser: User = {
        id: `usr-${Date.now()}`,
        name,
        email,
        role,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      return { user: newUser };
    });

    if (result.error || !result.user) {
      return NextResponse.json(
        { error: result.error ?? "Erro ao criar conta." },
        { status: 409 }
      );
    }

    const token = signSessionToken(result.user);
    const res = NextResponse.json(
      {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
        redirectTo: getHomeRouteForRole(result.user.role),
      },
      { status: 201 }
    );

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Não foi possível criar sua conta." },
      { status: 500 }
    );
  }
}
