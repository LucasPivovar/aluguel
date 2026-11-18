import { NextResponse } from "next/server";
import { getCurrentSession, scopeDatabaseForSession } from "@/lib/auth";
import { readDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const db = await readDatabase();
  return NextResponse.json(scopeDatabaseForSession(db, session));
}
