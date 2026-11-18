import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { updateDatabase } from "@/lib/store";
import type {
  MessageSender,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES: TicketCategory[] = [
  "Manutenção",
  "Financeiro",
  "Contrato",
  "Dúvida",
];
const VALID_PRIORITIES: TicketPriority[] = ["Normal", "Urgente"];
const VALID_STATUSES: TicketStatus[] = [
  "Aberto",
  "Em Análise",
  "Aguardando Aprovação",
  "Resolvido",
];

function roleToMessageSender(
  role: "proprietario" | "inquilino" | "assessoria"
): MessageSender {
  if (role === "assessoria") return "Assessoria";
  if (role === "proprietario") return "Proprietário";
  return "Inquilino";
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (session.role !== "inquilino" && session.role !== "assessoria") {
    return NextResponse.json(
      { error: "Apenas locatários ou a assessoria podem abrir chamados." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const propertyId = String(body.propertyId ?? "").trim();
    const rawCategory = body.category as TicketCategory;
    const category: TicketCategory = VALID_CATEGORIES.includes(rawCategory)
      ? rawCategory
      : "Manutenção";
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const rawPriority = body.priority as TicketPriority;
    const priority: TicketPriority = VALID_PRIORITIES.includes(rawPriority)
      ? rawPriority
      : "Normal";

    if (!propertyId || !title || !description) {
      return NextResponse.json(
        { error: "Preencha o imóvel, assunto e descrição da solicitação." },
        { status: 400 }
      );
    }

    const result = await updateDatabase<{
      error?: string;
      status?: number;
      ticket?: Ticket;
    }>((db) => {
      const property = db.properties.find((p) => p.id === propertyId);

      if (!property) {
        return { error: "Imóvel não encontrado.", status: 404 };
      }

      if (
        session.role === "inquilino" &&
        property.tenantEmail?.toLowerCase() !== session.email.toLowerCase()
      ) {
        return {
          error: "Você só pode abrir chamados para o seu imóvel alugado.",
          status: 403,
        };
      }

      const now = new Date().toISOString();
      const codeNum = Math.floor(1043 + Math.random() * 8900);

      const newTicket: Ticket = {
        id: `tkt-${Date.now()}`,
        code: `CHM-${codeNum}`,
        propertyId,
        category,
        title,
        description,
        priority,
        status: "Aberto",
        estimatedCost: null,
        ownerApprovalRequired: false,
        ownerApproved: null,
        createdAt: now,
        updatedAt: now,
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: roleToMessageSender(session.role),
            senderName: session.name,
            body: description,
            createdAt: now,
          },
        ],
      };

      db.tickets.unshift(newTicket);
      return { ticket: newTicket };
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 }
      );
    }

    return NextResponse.json({ ticket: result.ticket }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao registrar solicitação." },
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

    if (
      (typeof body.estimatedCost === "number" || body.status) &&
      session.role !== "assessoria"
    ) {
      return NextResponse.json(
        { error: "Apenas a Assessoria Digital pode alterar orçamentos ou status." },
        { status: 403 }
      );
    }

    if (
      typeof body.ownerApproved === "boolean" &&
      session.role !== "proprietario"
    ) {
      return NextResponse.json(
        { error: "Apenas o proprietário pode aprovar ou recusar orçamentos." },
        { status: 403 }
      );
    }

    const result = await updateDatabase<{
      error?: string;
      status?: number;
      ticket?: Ticket;
    }>((db) => {
      const ticket = db.tickets.find((t) => t.id === id);

      if (!ticket) {
        return { error: "Chamado não encontrado.", status: 404 };
      }

      const property = db.properties.find((p) => p.id === ticket.propertyId);
      if (!property) {
        return { error: "Imóvel do chamado não encontrado.", status: 404 };
      }

      const emailLower = session.email.toLowerCase();
      if (
        session.role === "proprietario" &&
        property.ownerEmail.toLowerCase() !== emailLower
      ) {
        return { error: "Acesso negado a este imóvel.", status: 403 };
      }
      if (
        session.role === "inquilino" &&
        property.tenantEmail?.toLowerCase() !== emailLower
      ) {
        return { error: "Acesso negado a este chamado.", status: 403 };
      }

      const now = new Date().toISOString();

      if (body.message) {
        const trimmedMessage = String(body.message).trim();
        if (trimmedMessage) {
          ticket.messages.push({
            id: `msg-${Date.now()}`,
            sender: roleToMessageSender(session.role),
            senderName: session.name,
            body: trimmedMessage,
            createdAt: now,
          });
        }
      }

      if (typeof body.estimatedCost === "number" && body.estimatedCost > 0) {
        ticket.estimatedCost = body.estimatedCost;
        const limit = property.autoApproveLimit ?? 500;
        if (body.estimatedCost > limit) {
          ticket.ownerApprovalRequired = true;
          ticket.ownerApproved = null;
          ticket.status = "Aguardando Aprovação";
        } else {
          ticket.ownerApprovalRequired = false;
          ticket.ownerApproved = true;
          ticket.status = "Em Análise";
        }
      }

      if (typeof body.ownerApproved === "boolean") {
        ticket.ownerApproved = body.ownerApproved;
        ticket.status = body.ownerApproved ? "Em Análise" : "Resolvido";
        ticket.messages.push({
          id: `msg-${Date.now() + 1}`,
          sender: "Assessoria",
          senderName: "Equipe Aluga",
          body: body.ownerApproved
            ? "Orçamento aprovado pelo proprietário. Nossa equipe já está agendando a execução do serviço."
            : "Orçamento recusado pelo proprietário. Nossa assessoria entrará em contato com uma alternativa.",
          createdAt: now,
        });
      }

      if (body.status && VALID_STATUSES.includes(body.status as TicketStatus)) {
        ticket.status = body.status as TicketStatus;
      }

      ticket.updatedAt = now;
      return { ticket };
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 }
      );
    }

    return NextResponse.json({ ticket: result.ticket });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar chamado." },
      { status: 500 }
    );
  }
}
