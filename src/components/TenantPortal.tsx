"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Copy,
  CreditCard,
  MessageSquare,
  Plus,
  Send,
  X,
} from "lucide-react";
import { AlertBanner } from "@/components/AlertBanner";
import { StatusPill } from "@/components/StatusPill";
import { formatBRL, formatDateBR, formatDateTimeBR } from "@/lib/format";
import type {
  Database,
  TicketCategory,
  TicketPriority,
} from "@/lib/types";

type ScopedData = Omit<Database, "users">;
export type TenantSection = "resumo" | "faturas" | "chamados";

export function TenantPortal({
  initialData,
  section = "resumo",
}: {
  initialData: ScopedData;
  section?: TenantSection;
}) {
  const [data, setData] = useState<ScopedData>(initialData);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(
    initialData.tickets[0]?.id ?? null
  );
  const rentedProperties = useMemo(
    () => data.properties.filter((p) => p.status === "Alugado"),
    [data.properties]
  );

  const selectedPropertyId = rentedProperties[0]?.id ?? "";
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // New ticket modal
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [category, setCategory] = useState<TicketCategory>("Manutenção");
  const [priority, setPriority] = useState<TicketPriority>("Normal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Active ticket reply
  const [replyByTicket, setReplyByTicket] = useState<Record<string, string>>(
    {}
  );

  const selectedProperty = rentedProperties.find(
    (p) => p.id === selectedPropertyId
  );

  const propertyInvoices = data.invoices.filter(
    (inv) => inv.propertyId === selectedPropertyId
  );

  const propertyTickets = data.tickets.filter(
    (t) => t.propertyId === selectedPropertyId
  );

  async function refreshData() {
    const res = await fetch("/api/overview", { cache: "no-store" });
    if (res.ok) {
      setData((await res.json()) as ScopedData);
    }
  }

  async function handleCopyPix(invoiceId: string, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(invoiceId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  }

  async function handlePayInvoice(invoiceId: string) {
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invoiceId, action: "pay" }),
      });
      if (res.ok) {
        await refreshData();
        setAlert({
          type: "success",
          message:
            "Pagamento confirmado! A Assessoria Digital já recebeu a compensação e cuidará do repasse.",
        });
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setAlert({
          type: "error",
          message: err.error ?? "Não foi possível confirmar o pagamento.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Erro de conexão ao processar o pagamento.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPropertyId) return;
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          category,
          priority,
          title,
          description,
        }),
      });
      if (res.ok) {
        await refreshData();
        setIsTicketModalOpen(false);
        setTitle("");
        setDescription("");
        setAlert({
          type: "success",
          message:
            "Solicitação registrada. Nossa equipe de assessoria responderá por aqui.",
        });
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setAlert({
          type: "error",
          message: err.error ?? "Não foi possível registrar a solicitação.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Erro de conexão ao registrar a solicitação.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendReply(ticketId: string) {
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
          sender: "Inquilino",
          message: msg,
        }),
      });
      if (res.ok) {
        setReplyByTicket((prev) => ({ ...prev, [ticketId]: "" }));
        await refreshData();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setAlert({
          type: "error",
          message: err.error ?? "Não foi possível enviar a mensagem.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Erro de conexão ao enviar a mensagem.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (rentedProperties.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Nenhum imóvel com locatário ativo no momento.
      </div>
    );
  }

  const nextPendingInvoice = propertyInvoices.find(
    (inv) => inv.status === "Pendente" || inv.status === "Atrasado"
  );
  const openTicketsCount = propertyTickets.filter(
    (t) => t.status !== "Resolvido"
  ).length;

  return (
    <div className="space-y-6">
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* SECTION: RESUMO (VISÃO GERAL DO INQUILINO) */}
      {section === "resumo" && (
        <div className="space-y-6">
          {/* Property Header */}
          <div className="hover-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Seu imóvel alugado
                </p>
                <p className="mt-0.5 text-base font-semibold text-slate-900">
                  {selectedProperty?.title}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedProperty?.address}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTicketModalOpen(true)}
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              <span>Abrir chamado</span>
            </button>
          </div>

          {/* 2 Focused Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Next Invoice Card */}
            <div className="hover-card flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Próxima fatura</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <CreditCard className="h-3.5 w-3.5" />
                  </span>
                </div>
                {nextPendingInvoice ? (
                  <>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                      {formatBRL(nextPendingInvoice.totalAmount)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 tabular-nums">
                      {nextPendingInvoice.referenceMonth} • Vence em{" "}
                      {formatDateBR(nextPendingInvoice.dueDate)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-xl font-semibold text-emerald-700">
                      Tudo em dia
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Nenhuma fatura pendente no momento.
                    </p>
                  </>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                {nextPendingInvoice ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handlePayInvoice(nextPendingInvoice.id)}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Pagar com Pix</span>
                  </button>
                ) : (
                  <span />
                )}
                <Link
                  href="/inquilino/faturas"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                >
                  <span>Ver todas as faturas</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Tickets Summary Card */}
            <div className="hover-card flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Atendimentos com a assessoria</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                  {openTicketsCount}{" "}
                  <span className="text-sm font-normal text-slate-500">
                    {openTicketsCount === 1 ? "em aberto" : "em aberto"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Total de {propertyTickets.length} solicitações registradas
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(true)}
                  className="text-xs font-medium text-slate-700 hover:text-slate-900"
                >
                  + Nova solicitação
                </button>
                <Link
                  href="/inquilino/chamados"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                >
                  <span>Abrir chamados</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Composição da Mensalidade & Dados do Contrato */}
          {selectedProperty && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
              {(() => {
                const totalPack =
                  selectedProperty.rentAmount +
                  selectedProperty.condoFee +
                  selectedProperty.iptuFee;
                const rentPct = Math.round(
                  (selectedProperty.rentAmount / Math.max(1, totalPack)) * 100
                );
                const condoPct = Math.round(
                  (selectedProperty.condoFee / Math.max(1, totalPack)) * 100
                );
                const iptuPct = Math.max(0, 100 - rentPct - condoPct);

                return (
                  <>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          Composição da sua mensalidade
                        </h2>
                        <p className="text-xs text-slate-500">
                          {selectedProperty.type} • Vencimento todo dia{" "}
                          {selectedProperty.dueDay}
                          {selectedProperty.contractStart
                            ? ` • Início em ${formatDateBR(selectedProperty.contractStart)}`
                            : ""}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 tabular-nums">
                        {formatBRL(totalPack)}/mês
                      </span>
                    </div>

                    <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="bg-slate-900"
                        style={{ width: `${rentPct}%` }}
                      />
                      <div
                        className="bg-emerald-600"
                        style={{ width: `${condoPct}%` }}
                      />
                      <div
                        className="bg-slate-400"
                        style={{ width: `${iptuPct}%` }}
                      />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
                      <div className="flex items-center justify-between rounded-lg bg-[#FAFAFA] px-3 py-2">
                        <span className="inline-flex items-center gap-2 text-slate-600">
                          <span className="h-2 w-2 rounded-full bg-slate-900" />
                          Aluguel ({rentPct}%)
                        </span>
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {formatBRL(selectedProperty.rentAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-[#FAFAFA] px-3 py-2">
                        <span className="inline-flex items-center gap-2 text-slate-600">
                          <span className="h-2 w-2 rounded-full bg-emerald-600" />
                          Condomínio ({condoPct}%)
                        </span>
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {formatBRL(selectedProperty.condoFee)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-[#FAFAFA] px-3 py-2">
                        <span className="inline-flex items-center gap-2 text-slate-600">
                          <span className="h-2 w-2 rounded-full bg-slate-400" />
                          IPTU ({iptuPct}%)
                        </span>
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {formatBRL(selectedProperty.iptuFee)}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* SECTION: FATURAS */}
      {section === "faturas" && (
        <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
          <div className="hidden md:grid md:grid-cols-[1.4fr_0.9fr_auto] gap-4 border-b border-slate-100 bg-[#FAFAFA] px-6 py-3 text-xs font-medium text-slate-500">
            <span>Mês e detalhamento</span>
            <span className="text-right">Valor total</span>
            <span className="text-right min-w-[210px]">Status e pagamento</span>
          </div>

          <div className="divide-y divide-slate-100">
            {propertyInvoices.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Nenhuma fatura emitida até o momento.
              </div>
            ) : (
              propertyInvoices.map((inv) => {
                const isPending =
                  inv.status === "Pendente" || inv.status === "Atrasado";
                return (
                  <div
                    key={inv.id}
                    className="hover-row grid gap-3 md:grid-cols-[1.4fr_0.9fr_auto] md:items-center px-5 py-4 sm:px-6"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">
                          {inv.code}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {inv.referenceMonth}
                        </span>
                        <StatusPill label={inv.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500 tabular-nums">
                        Vencimento: {formatDateBR(inv.dueDate)} • Aluguel{" "}
                        {formatBRL(inv.rentAmount)} + Cond.{" "}
                        {formatBRL(inv.condoFee)} + IPTU{" "}
                        {formatBRL(inv.iptuFee)}
                      </p>
                    </div>

                    <div className="md:text-right">
                      <span className="text-base font-semibold text-slate-900 tabular-nums">
                        {formatBRL(inv.totalAmount)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center md:justify-end gap-2 min-w-[210px]">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyPix(inv.id, inv.pixCopyPaste)
                            }
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>
                              {copiedId === inv.id
                                ? "Pix copiado"
                                : "Copiar Pix"}
                            </span>
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handlePayInvoice(inv.id)}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Pagar com Pix</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-emerald-700 font-medium">
                          {inv.paidAt
                            ? `Pago em ${formatDateBR(inv.paidAt)}`
                            : "Liquidado"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* SECTION: CHAMADOS */}
      {section === "chamados" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 tabular-nums">
              {propertyTickets.length} chamados registrados
            </p>
            <button
              type="button"
              onClick={() => setIsTicketModalOpen(true)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Abrir chamado</span>
            </button>
          </div>

          {propertyTickets.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-500">
              Nenhuma solicitação registrada para este imóvel.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden">
              {propertyTickets.map((ticket) => {
                const isExpanded = expandedTicketId === ticket.id;
                return (
                  <div key={ticket.id}>
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() =>
                        setExpandedTicketId(isExpanded ? null : ticket.id)
                      }
                      className="hover-row flex w-full items-center justify-between gap-4 px-5 py-4 sm:px-6 text-left"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-slate-400">
                            {ticket.code}
                          </span>
                          <h3 className="text-sm font-semibold text-slate-900">
                            {ticket.title}
                          </h3>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {ticket.category} • Prioridade {ticket.priority} •{" "}
                          {ticket.messages.length} mensagens
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
                        <div className="space-y-3">
                          {ticket.messages.map((msg) => (
                            <div key={msg.id} className="text-xs">
                              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 mb-0.5">
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
                          <div className="mt-4 flex gap-2">
                            <input
                              aria-label="Mensagem para a Assessoria Digital"
                              value={replyByTicket[ticket.id] ?? ""}
                              onChange={(e) =>
                                setReplyByTicket((prev) => ({
                                  ...prev,
                                  [ticket.id]: e.target.value,
                                }))
                              }
                              placeholder="Enviar mensagem para a Assessoria Digital..."
                              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                            />
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => handleSendReply(ticket.id)}
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>Enviar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Modal: Nova Solicitação */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="modal-enter w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Nova solicitação
              </h2>
              <button
                type="button"
                aria-label="Fechar modal"
                onClick={() => setIsTicketModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Sua demanda é recebida e tratada diretamente pela nossa Assessoria
              Digital.
            </p>

            <form onSubmit={handleCreateTicket} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as TicketCategory)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    <option value="Manutenção">Manutenção</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Contrato">Contrato</option>
                    <option value="Dúvida">Dúvida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as TicketPriority)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Assunto
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Vazamento na pia da cozinha"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Descrição detalhada
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o que está acontecendo ou qual informação precisa..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting ? "Enviando..." : "Enviar solicitação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
