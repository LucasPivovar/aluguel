import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, scopeDatabaseForSession } from "@/lib/auth";
import {
  calculateInvoiceTotals,
  readDatabase,
  updateDatabase,
} from "@/lib/store";
import type { Property, PropertyStatus, PropertyType } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_TYPES: PropertyType[] = ["Apartamento", "Casa", "Studio", "Comercial"];

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const db = await readDatabase();
  const scoped = scopeDatabaseForSession(db, session);
  return NextResponse.json({ properties: scoped.properties });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (session.role !== "proprietario" && session.role !== "assessoria") {
    return NextResponse.json(
      { error: "Apenas proprietários ou a assessoria podem cadastrar imóveis." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const address = String(body.address ?? "").trim();
    const rawType = body.type as PropertyType;
    const type: PropertyType = VALID_TYPES.includes(rawType)
      ? rawType
      : "Apartamento";
    const rentAmount = Math.max(0, Number(body.rentAmount) || 0);
    const condoFee = Math.max(0, Number(body.condoFee) || 0);
    const iptuFee = Math.max(0, Number(body.iptuFee) || 0);
    const ownerName =
      session.role === "proprietario"
        ? session.name
        : String(body.ownerName ?? session.name).trim();
    const ownerEmail =
      session.role === "proprietario"
        ? session.email
        : String(body.ownerEmail ?? session.email)
            .trim()
            .toLowerCase();
    const ownerPixKey = String(body.ownerPixKey ?? ownerEmail).trim();
    const autoApproveLimit = Math.max(0, Number(body.autoApproveLimit) || 500);
    const tenantName = body.tenantName ? String(body.tenantName).trim() : null;
    const tenantEmail = body.tenantEmail
      ? String(body.tenantEmail).trim().toLowerCase()
      : null;
    const tenantPhone = body.tenantPhone
      ? String(body.tenantPhone).trim()
      : null;
    const dueDay = Math.min(28, Math.max(1, Number(body.dueDay) || 10));

    if (!title || !address || rentAmount <= 0 || !ownerPixKey) {
      return NextResponse.json(
        { error: "Preencha identificação, endereço, chave Pix e valor do aluguel." },
        { status: 400 }
      );
    }

    const id = `prop-${Date.now()}`;
    const hasTenant = Boolean(tenantName);
    const status: PropertyStatus = hasTenant ? "Alugado" : "Disponível";
    const now = new Date().toISOString();

    const newProperty: Property = {
      id,
      title,
      address,
      type,
      rentAmount,
      condoFee,
      iptuFee,
      ownerName,
      ownerEmail,
      ownerPixKey,
      autoApproveLimit,
      tenantName,
      tenantEmail,
      tenantPhone,
      contractStart: hasTenant ? now.slice(0, 10) : null,
      dueDay,
      status,
      createdAt: now,
    };

    await updateDatabase((db) => {
      db.properties.unshift(newProperty);

      if (hasTenant) {
        const { totalAmount, platformFee, ownerNetAmount } =
          calculateInvoiceTotals(rentAmount, condoFee, iptuFee);
        const codeNum = Math.floor(1100 + Math.random() * 8900);
        const due = new Date();
        due.setDate(dueDay);
        if (due.getTime() < Date.now()) {
          due.setMonth(due.getMonth() + 1);
        }

        db.invoices.unshift({
          id: `inv-${Date.now()}`,
          code: `FAT-2026-${codeNum}`,
          propertyId: id,
          referenceMonth: "Novembro/2026",
          dueDate: due.toISOString().slice(0, 10),
          rentAmount,
          condoFee,
          iptuFee,
          extraCharges: 0,
          totalAmount,
          platformFee,
          ownerNetAmount,
          status: "Pendente",
          pixCopyPaste: `00020126580014br.gov.bcb.pix0136aluga-assessoria-fat-${codeNum}5204000053039865802BR5913Aluga Digital6009SAO PAULO62070503***6304F9A1`,
          paidAt: null,
          transferredAt: null,
        });
      }
    });

    return NextResponse.json({ property: newProperty }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível cadastrar o imóvel." },
      { status: 500 }
    );
  }
}
