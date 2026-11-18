"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  FilePlus2,
  MessageSquare,
  Send,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { AlertBanner } from "@/components/AlertBanner";
import { StatusPill } from "@/components/StatusPill";
import { formatBRL, formatDateBR, formatDateTimeBR } from "@/lib/format";
import type { Database } from "@/lib/types";

type ScopedData = Omit<Database, "users">;
export type ConciergeSection =
  | "resumo"
  | "financeiro"
  | "chamados"
  | "imoveis";

export function ConciergePortal({
  initialData,
  section = "resumo",
}: {
  initialData: ScopedData;
  section?: ConciergeSection;
}) {
  const [data, setData] = useState<ScopedData>(initialData);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(
    initialData.tickets[0]?.id ?? null
  );
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Issue invoice modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const rentedProperties = data.properties.filter(
    (p) => p.status === "Alugado"
  );
  const [invoicePropertyId, setInvoicePropertyId] = useState(
    rentedProperties[0]?.id ?? ""
  );
  const [referenceMonth, setReferenceMonth] = useState("Dezembro/2026");
  const [dueDate, setDueDate] = useState("2026-12-10");
  const [extraCharges, setExtraCharges] = useState("0");

  // Ticket replies & quotes
  const [replyByTicket, setReplyByTicket] = useState<Record<string, string>>(
    {}
  );
  const [quoteByTicket, setQuoteByTicket] = useState<Record<string, string>>(
    {}
  );

  const propertyMap = new Map(data.properties.map((p) => [p.id, p]));

  async function refreshData() {
    const res = await fetch("/api/overview", { cache: "no-store" });
    if (res.ok) {
      setData((await res.json()) as ScopedData);
    }
  }

  async function handleIssueInvoice(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: invoicePropertyId,
          referenceMonth,
          dueDate,
          extraCharges: Number(extraCharges) || 0,
        }),
      });
      if (res.ok) {
        await refreshData();
        setIsInvoiceModalOpen(false);
        setAlert({
          type: "success",
          message: "Nova fatura emitida e disponibilizada ao locatário.",
        });
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setAlert({
          type: "error",
          message: err.error ?? "Não foi possível emitir a fatura.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Erro de conexão ao emitir a fatura.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransferToOwner(invoiceId: string) {
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invoiceId, action: "transfer" }),
      });
      if (res.ok) {
        await refreshData();
        setAlert({
          type: "success",
          message:
            "Repasse líquido realizado para a chave Pix do proprietário.",
        });
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setAlert({
          type: "error",
          message: err.error ?? "Não foi possível realizar o repasse.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Erro de conexão ao realizar o repasse.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendConciergeReply(ticketId: string) {
    const msg = (replyByTicket[ticketId] ?? "").trim();
    if (!msg) return;
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ticketId,
          sender: "Assessoria",
          message: msg,
          status: "Em Análise",
        }),
      });
      if (res.ok) {
        setReplyByTicket((prev) => ({ ...prev, [ticketId]: "" }));
        await refreshData();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setAlert({
          type: "error",
          message: err.error ?? "Não foi possível enviar a resposta.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Erro de conexão ao enviar a resposta.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetQuote(ticketId: string) {
    const cost = Number(quoteByTicket[ticketId]);
    if (Number.isNaN(cost) || cost <= 0) return;
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, estimatedCost: cost }),
      });
      if (res.ok) {
        setQuoteByTicket((prev) => ({ ...prev, [ticketId]: "" }));
        await refreshData();
        setAlert({
          type: "success",
          message:
            "Orçamento registrado. Se estiver dentro do limite automático, já segue para execução; caso contrário, foi enviado ao proprietário.",
        });
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setAlert({
          type: "error",
          message: err.error ?? "Não foi possível registrar o orçamento.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Erro de conexão ao registrar o orçamento.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolveTicket(ticketId: string) {
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ticketId,
          status: "Resolvido",
          sender: "Assessoria",
          message: "Atendimento concluído e encerrado pela Assessoria Digital.",
        }),
      });
      if (res.ok) {
        await refreshData();
        setAlert({
          type: "success",
          message: "Chamado marcado como resolvido.",
        });
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setAlert({
          type: "error",
          message: err.error ?? "Não foi possível encerrar o chamado.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Erro de conexão ao encerrar o chamado.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const readyToTransferCount = data.invoices.filter(
    (i) => i.status === "Pago"
  ).length;
  const openTicketsCount = data.tickets.filter(
    (t) => t.status !== "Resolvido"
  ).length;

  const pendingInvoicesCount = data.invoices.filter(
    (i) => i.status === "Pendente" || i.status === "Atrasado"
  ).length;

  const transferredTotal = data.invoices
    .filter((i) => i.status === "Repassado")
    .reduce((sum, i) => sum + i.totalAmount, 0);
  const paidReadyTotal = data.invoices
    .filter((i) => i.status === "Pago")
    .reduce((sum, i) => sum + i.totalAmount, 0);
  const pendingTotal = data.invoices
    .filter((i) => i.status === "Pendente" || i.status === "Atrasado")
    .reduce((sum, i) => sum + i.totalAmount, 0);
  const totalInvoiced = transferredTotal + paidReadyTotal + pendingTotal;

  const maxRent = Math.max(
    1,
    ...data.properties.map((p) => p.rentAmount + p.condoFee + p.iptuFee)
  );

  const ticketCategories = (
    ["Manutenção", "Financeiro", "Contrato", "Dúvida"] as const
  ).map((cat) => ({
    category: cat,
    count: data.tickets.filter((t) => t.category === cat).length,
  }));
  const maxTicketCat = Math.max(1, ...ticketCategories.map((c) => c.count));

  return (
    <div className="space-y-6">
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* SECTION: RESUMO (VISÃO GERAL DA ASSESSORIA) */}
      {section === "resumo" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="hover-card rounded-2xl border border-slate-200/80 bg-white p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Repasses prontos</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Wallet className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {readyToTransferCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Faturas pagas aguardando envio ao dono
              </p>
            </div>

            <div className="hover-card rounded-2xl border border-slate-200/80 bg-white p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Chamados em aberto</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <MessageSquare className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {openTicketsCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Solicitações aguardando atendimento
              </p>
            </div>

            <div className="hover-card rounded-2xl border border-slate-200/80 bg-white p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Contratos ativos</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Building2 className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {rentedProperties.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                De {data.properties.length} imóveis cadastrados
              </p>
            </div>
          </div>

          {/* Gráfico 1: Saúde Financeira das Cobranças */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Distribuição financeira das faturas
                </h2>
                <p className="text-xs text-slate-500">
                  Total movimentado na carteira: {formatBRL(totalInvoiced)}
                </p>
              </div>
              <Link
                href="/assessoria/faturas"
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
              >
                <span>Gerenciar faturas</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Segmented Bar */}
            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
              {totalInvoiced > 0 && (
                <>
                  <div
                    className="bg-emerald-600 transition-all"
                    style={{
                      width: `${(transferredTotal / totalInvoiced) * 100}%`,
                    }}
                    title={`Repassado: ${formatBRL(transferredTotal)}`}
                  />
                  <div
                    className="bg-sky-500 transition-all"
                    style={{
                      width: `${(paidReadyTotal / totalInvoiced) * 100}%`,
                    }}
                    title={`Pago (aguardando repasse): ${formatBRL(paidReadyTotal)}`}
                  />
                  <div
                    className="bg-amber-400 transition-all"
                    style={{
                      width: `${(pendingTotal / totalInvoiced) * 100}%`,
                    }}
                    title={`Pendente: ${formatBRL(pendingTotal)}`}
                  />
                </>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-[#FAFAFA] px-3 py-2">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Repassado
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatBRL(transferredTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#FAFAFA] px-3 py-2">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  Pago (a repassar)
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatBRL(paidReadyTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#FAFAFA] px-3 py-2">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Pendente
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatBRL(pendingTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico 2 + 3: Valor por Imóvel & Chamados por Categoria */}
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Imóveis e valor mensal do pacote
                </h2>
                <Link
                  href="/assessoria/imoveis"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Ver todos →
                </Link>
              </div>
              <div className="mt-4 space-y-4">
                {data.properties.map((prop) => {
                  const totalPack =
                    prop.rentAmount + prop.condoFee + prop.iptuFee;
                  const pct = Math.round((totalPack / maxRent) * 100);
                  return (
                    <div key={prop.id}>
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="font-medium text-slate-900 truncate">
                          {prop.title}
                        </span>
                        <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                          {formatBRL(totalPack)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            prop.status === "Alugado"
                              ? "bg-slate-900"
                              : "bg-slate-300"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {prop.tenantName
                          ? `${prop.tenantName} • Venc. dia ${prop.dueDay}`
                          : "Disponível para locação"}{" "}
                        • {prop.type}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Chamados por categoria
                  </h2>
                  <Link
                    href="/assessoria/chamados"
                    className="text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Abrir →
                  </Link>
                </div>
                <div className="mt-4 space-y-3.5">
                  {ticketCategories.map((item) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700">{item.category}</span>
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {item.count}
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{
                            width: `${(item.count / maxTicketCat) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-5 border-t border-slate-100 pt-3 text-xs text-slate-500 tabular-nums">
                {pendingInvoicesCount} faturas aguardando pagamento no ciclo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: COBRANÇAS E REPASSES */}
      {section === "financeiro" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 tabular-nums">
              {data.invoices.length} faturas registradas •{" "}
              {readyToTransferCount} prontas para repasse
            </p>
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(true)}
              disabled={rentedProperties.length === 0}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              <span>Emitir nova fatura</span>
            </button>
          </div>

          <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
          <div className="hidden md:grid md:grid-cols-[1.4fr_1fr_0.9fr_auto] gap-4 border-b border-slate-100 bg-[#FAFAFA] px-6 py-3 text-xs font-medium text-slate-500">
            <span>Fatura e imóvel</span>
            <span>Inquilino e vencimento</span>
            <span className="text-right">Valores</span>
            <span className="text-right min-w-[160px]">Status e ação</span>
          </div>

          <div className="divide-y divide-slate-100">
            {data.invoices.map((inv) => {
              const prop = propertyMap.get(inv.propertyId);
              return (
                <div
                  key={inv.id}
                  className="hover-row grid gap-3 md:grid-cols-[1.4fr_1fr_0.9fr_auto] md:items-center px-5 py-4 sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">
                        {inv.code}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {inv.referenceMonth}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 truncate">
                      {prop?.title}
                    </p>
                  </div>

                  <div className="text-xs text-slate-600">
                    <p className="font-medium text-slate-800">
                      {prop?.tenantName ?? "—"}
                    </p>
                    <p className="mt-0.5 text-slate-500 tabular-nums">
                      Vence em {formatDateBR(inv.dueDate)}
                    </p>
                  </div>

                  <div className="md:text-right">
                    <p className="text-sm font-semibold text-slate-900 tabular-nums">
                      {formatBRL(inv.totalAmount)}
                    </p>
                    <p className="text-xs text-emerald-700 tabular-nums">
                      Repasse: {formatBRL(inv.ownerNetAmount)}
                    </p>
                  </div>

                  <div className="flex items-center md:justify-end gap-2.5 min-w-[160px]">
                    <StatusPill label={inv.status} />
                    {inv.status === "Pago" && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleTransferToOwner(inv.id)}
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        <span>Repassar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        </div>
      )}

      {/* SECTION: CHAMADOS */}
      {section === "chamados" && (
        <section className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden">
          {data.tickets.map((ticket) => {
            const prop = propertyMap.get(ticket.propertyId);
            const isExpanded = expandedTicketId === ticket.id;
            return (
              <div key={ticket.id}>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpandedTicketId(isExpanded ? null : ticket.id)
                  }
                  className="hover-row flex w-full flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 sm:px-6 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">
                        {ticket.code}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {ticket.title}
                      </h3>
                      {ticket.priority === "Urgente" && (
                        <span className="text-xs font-medium text-rose-700">
                          • Urgente
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {prop?.title} • {ticket.category} • Inquilino:{" "}
                      {prop?.tenantName}
                      {ticket.estimatedCost !== null && (
                        <>
                          {" "}
                          • Orçamento:{" "}
                          <strong className="text-slate-900 tabular-nums">
                            {formatBRL(ticket.estimatedCost)}
                          </strong>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusPill label={ticket.status} />
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-[#FAFAFA]/60 px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 text-xs text-slate-500">
                      <span>
                        Limite automático de reparos:{" "}
                        <strong className="text-slate-700 tabular-nums">
                          {formatBRL(prop?.autoApproveLimit ?? 500)}
                        </strong>
                      </span>
                      {ticket.status !== "Resolvido" && (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleResolveTicket(ticket.id)}
                          className="min-h-[32px] rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Marcar como resolvido
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 border-t border-slate-200/60 pt-3">
                      {ticket.messages.map((msg) => (
                        <div key={msg.id} className="text-xs">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  msg.sender === "Assessoria"
                                    ? "bg-emerald-600"
                                    : "bg-slate-400"
                                }`}
                              />
                              {msg.senderName} ({msg.sender})
                            </span>
                            <span className="tabular-nums">
                              {formatDateTimeBR(msg.createdAt)}
                            </span>
                          </div>
                          <p className="pl-3 text-slate-700 leading-relaxed max-w-prose">
                            {msg.body}
                          </p>
                        </div>
                      ))}
                    </div>

                    {ticket.status !== "Resolvido" && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                        <div className="flex gap-2">
                          <input
                            aria-label="Responder ao inquilino como Assessoria"
                            value={replyByTicket[ticket.id] ?? ""}
                            onChange={(e) =>
                              setReplyByTicket((prev) => ({
                                ...prev,
                                [ticket.id]: e.target.value,
                              }))
                            }
                            placeholder="Responder ao inquilino..."
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                          />
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleSendConciergeReply(ticket.id)}
                            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Responder</span>
                          </button>
                        </div>

                        {ticket.category === "Manutenção" && (
                          <div className="flex gap-2">
                            <input
                              aria-label="Orçamento em reais"
                              type="number"
                              min={1}
                              value={quoteByTicket[ticket.id] ?? ""}
                              onChange={(e) =>
                                setQuoteByTicket((prev) => ({
                                  ...prev,
                                  [ticket.id]: e.target.value,
                                }))
                              }
                              placeholder="Orçamento (R$)"
                              className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 tabular-nums focus:border-slate-900"
                            />
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => handleSetQuote(ticket.id)}
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              <Wrench className="h-3.5 w-3.5" />
                              <span>Lançar valor</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* SECTION: IMÓVEIS SOB GESTÃO */}
      {section === "imoveis" && (
        <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
          <div className="divide-y divide-slate-100">
            {data.properties.map((prop) => (
              <div
                key={prop.id}
                className="hover-row flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 sm:px-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {prop.title}
                    </h3>
                    <StatusPill label={prop.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 truncate">
                    {prop.address}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Proprietário: {prop.ownerName} •{" "}
                    {prop.tenantName
                      ? `Inquilino: ${prop.tenantName}`
                      : "Sem inquilino"}{" "}
                    • Limite automático:{" "}
                    <span className="tabular-nums font-medium">
                      {formatBRL(prop.autoApproveLimit)}
                    </span>
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">
                    {formatBRL(prop.rentAmount)}/mês
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    Pix: {prop.ownerPixKey}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal: Emitir Fatura */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="modal-enter w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Emitir nova fatura
              </h2>
              <button
                type="button"
                aria-label="Fechar modal"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              A fatura será enviada ao Portal do Inquilino com Pix Copia e Cola
              automático.
            </p>

            <form onSubmit={handleIssueInvoice} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Imóvel / Locatário
                </label>
                <select
                  value={invoicePropertyId}
                  onChange={(e) => setInvoicePropertyId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                >
                  {rentedProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.tenantName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Mês de referência
                  </label>
                  <input
                    required
                    value={referenceMonth}
                    onChange={(e) => setReferenceMonth(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Vencimento
                  </label>
                  <input
                    required
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Encargos adicionais ou descontos (R$)
                </label>
                <input
                  type="number"
                  value={extraCharges}
                  onChange={(e) => setExtraCharges(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting ? "Emitindo..." : "Emitir fatura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
