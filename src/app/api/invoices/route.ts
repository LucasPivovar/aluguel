import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { calculateInvoiceTotals, updateDatabase } from "@/lib/store";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (session.role !== "assessoria") {
    return NextResponse.json(
      { error: "Apenas a Assessoria Digital pode emitir faturas." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const propertyId = String(body.propertyId ?? "").trim();
    const referenceMonth = String(body.referenceMonth ?? "").trim();
    const dueDate = String(body.dueDate ?? "").trim();
    const extraCharges = Number(body.extraCharges) || 0;

    if (!propertyId || !referenceMonth || !dueDate) {
      return NextResponse.json(
        { error: "Informe o imóvel, mês de referência e data de vencimento." },
        { status: 400 }
      );
    }

    const result = await updateDatabase<{
      error?: string;
      status?: number;
      invoice?: Invoice;
    }>((db) => {
      const property = db.properties.find((p) => p.id === propertyId);

      if (!property) {
        return { error: "Imóvel não encontrado.", status: 404 };
      }

      if (property.status !== "Alugado") {
        return {
          error: "Apenas imóveis alugados podem receber faturas.",
          status: 400,
        };
      }

      const { totalAmount, platformFee, ownerNetAmount } =
        calculateInvoiceTotals(
          property.rentAmount,
          property.condoFee,
          property.iptuFee,
          extraCharges
        );

      const codeNum = Math.floor(1200 + Math.random() * 8700);
      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        code: `FAT-2026-${codeNum}`,
        propertyId: property.id,
        referenceMonth,
        dueDate,
        rentAmount: property.rentAmount,
        condoFee: property.condoFee,
        iptuFee: property.iptuFee,
        extraCharges,
        totalAmount,
        platformFee,
        ownerNetAmount,
        status: "Pendente",
        pixCopyPaste: `00020126580014br.gov.bcb.pix0136aluga-assessoria-fat-${codeNum}5204000053039865802BR5913Aluga Digital6009SAO PAULO62070503***6304B2C9`,
        paidAt: null,
        transferredAt: null,
      };

      db.invoices.unshift(newInvoice);
      return { invoice: newInvoice };
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 }
      );
    }

    return NextResponse.json({ invoice: result.invoice }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao emitir fatura." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const id = String(body.id ?? "").trim();
    const action = String(body.action ?? "").trim();

    if (action === "transfer" && session.role !== "assessoria") {
      return NextResponse.json(
        { error: "Apenas a Assessoria Digital pode executar repasses." },
        { status: 403 }
      );
    }

    if (
      action === "pay" &&
      session.role !== "inquilino" &&
      session.role !== "assessoria"
    ) {
      return NextResponse.json(
        { error: "Você não tem permissão para pagar esta fatura." },
        { status: 403 }
      );
    }

    const result = await updateDatabase<{
      error?: string;
      status?: number;
      invoice?: Invoice;
    }>((db) => {
      const invoice = db.invoices.find((inv) => inv.id === id);

      if (!invoice) {
        return { error: "Fatura não encontrada.", status: 404 };
      }

      if (session.role === "inquilino") {
        const property = db.properties.find((p) => p.id === invoice.propertyId);
        if (
          !property ||
          property.tenantEmail?.toLowerCase() !== session.email.toLowerCase()
        ) {
          return {
            error: "Esta fatura não pertence ao seu contrato.",
            status: 403,
          };
        }
      }

      const now = new Date().toISOString();

      if (action === "pay") {
        invoice.status = "Pago";
        invoice.paidAt = now;
      } else if (action === "transfer") {
        if (invoice.status !== "Pago") {
          return {
            error: "A fatura precisa estar paga antes do repasse.",
            status: 400,
          };
        }
        invoice.status = "Repassado";
        invoice.transferredAt = now;
      } else {
        return { error: "Ação inválida.", status: 400 };
      }

      return { invoice };
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 }
      );
    }

    return NextResponse.json({ invoice: result.invoice });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar fatura." },
      { status: 500 }
    );
  }
}
