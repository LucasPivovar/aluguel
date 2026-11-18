import crypto from "crypto";
import { cookies } from "next/headers";
import type { Database, User, UserRole } from "./types";

export const SESSION_COOKIE_NAME = "aluga_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getAuthSecret(): string {
  return process.env.ALUGA_AUTH_SECRET || "aluga-local-dev-secret-change-in-prod";
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(":");
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, "hex");
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  exp: number;
}

export function signSessionToken(user: Pick<User, "id" | "name" | "email" | "role">): string {
  const payload: SessionPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getAuthSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac("sha256", getAuthSecret())
    .update(encoded)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    ) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function getHomeRouteForRole(role: UserRole): string {
  switch (role) {
    case "proprietario":
      return "/proprietario";
    case "inquilino":
      return "/inquilino";
    case "assessoria":
      return "/assessoria";
  }
}

/** Filters database records so each user only sees data they are authorized to access. */
export function scopeDatabaseForSession(
  db: Database,
  session: SessionPayload
): Omit<Database, "users"> {
  if (session.role === "assessoria") {
    return {
      properties: db.properties,
      invoices: db.invoices,
      tickets: db.tickets,
    };
  }

  const emailLower = session.email.toLowerCase();

  const properties =
    session.role === "proprietario"
      ? db.properties.filter((p) => p.ownerEmail.toLowerCase() === emailLower)
      : db.properties.filter(
          (p) => p.tenantEmail?.toLowerCase() === emailLower
        );

  const allowedPropIds = new Set(properties.map((p) => p.id));

  return {
    properties,
    invoices: db.invoices.filter((inv) => allowedPropIds.has(inv.propertyId)),
    tickets: db.tickets.filter((t) => allowedPropIds.has(t.propertyId)),
  };
}
