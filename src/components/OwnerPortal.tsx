"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { AlertBanner } from "@/components/AlertBanner";
import { StatusPill } from "@/components/StatusPill";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { Database, PropertyType } from "@/lib/types";

type ScopedData = Omit<Database, "users">;
export type OwnerSection = "resumo" | "imoveis" | "repasses" | "atendimentos";

export function OwnerPortal({
  initialData,
  userEmail,
  section = "resumo",
}: {
  initialData: ScopedData;
  userEmail: string;
  section?: OwnerSection;
}) {
  const [data, setData] = useState<ScopedData>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form state for new property
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<PropertyType>("Apartamento");
  const [rentAmount, setRentAmount] = useState("3500");
  const [condoFee, setCondoFee] = useState("650");
  const [iptuFee, setIptuFee] = useState("180");
  const [autoApproveLimit, setAutoApproveLimit] = useState("500");
  const [ownerPixKey, setOwnerPixKey] = useState(userEmail);
  const [hasTenant, setHasTenant] = useState(true);
  const [tenantName, setTenantName] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [dueDay, setDueDay] = useState("10");

  async function refreshData() {
    const res = await fetch("/api/overview", { cache: "no-store" });
    if (res.ok) {
      const next = (await res.json()) as ScopedData;
      setData(next);
    }
  }

  async function handleCreateProperty(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          address,
          type,
          rentAmount: Number(rentAmount),
          condoFee: Number(condoFee),
          iptuFee: Number(iptuFee),
          autoApproveLimit: Number(autoApproveLimit),
          ownerName: "Ricardo Mendes",
          ownerPixKey,
          tenantName: hasTenant ? tenantName : null,
          tenantEmail: hasTenant ? tenantEmail : null,
          dueDay: Number(dueDay),
        }),
      });
      if (res.ok) {
        await refreshData();
        setIsModalOpen(false);
        setTitle("");
        setAddress("");
        setTenantName("");
        setTenantEmail("");
        setAlert({
          type: "success",
          message:
            "Imóvel cadastrado com sucesso. A Assessoria Digital já assumiu a gestão.",
        });
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setAlert({
          type: "error",
          message: err.error ?? "Não foi possível cadastrar o imóvel.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Erro de conexão ao cadastrar o imóvel.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApproveTicket(ticketId: string, approved: boolean) {
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, ownerApproved: approved }),
      });
      if (res.ok) {
        await refreshData();
        setAlert({
          type: "success",
          message: approved
            ? "Orçamento aprovado. A equipe já está agendando o serviço."
            : "Orçamento recusado. Nossa assessoria buscará uma nova opção.",
        });
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setAlert({
          type: "error",
          message: err.error ?? "Não foi possível atualizar a aprovação.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Erro de conexão ao processar a aprovação.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const totalTransferred = data.invoices
    .filter((i) => i.status === "Repassado")
    .reduce((sum, i) => sum + i.ownerNetAmount, 0);

  const upcomingTransfer = data.invoices
    .filter((i) => i.status === "Pago" || i.status === "Pendente")
    .reduce((sum, i) => sum + i.ownerNetAmount, 0);

  const monthlyNetRent = data.properties
    .filter((p) => p.status === "Alugado")
    .reduce((sum, p) => sum + Math.round(p.rentAmount * 0.92), 0);

  const totalFinancial = totalTransferred + upcomingTransfer;
  const transferredPct =
    totalFinancial > 0
      ? Math.round((totalTransferred / totalFinancial) * 100)
      : 0;

  const rentedCount = data.properties.filter(
    (p) => p.status === "Alugado"
  ).length;

  const pendingApprovals = data.tickets.filter(
    (t) => t.status === "Aguardando Aprovação" && t.ownerApproved === null
  );

  const propertyMap = new Map(data.properties.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* SECTION: RESUMO */}
      {section === "resumo" && (
        <>
          {/* Tranquility Status Banner */}
          <div className="hover-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3.5">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  pendingApprovals.length > 0
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {pendingApprovals.length > 0
                    ? `${pendingApprovals.length} orçamento precisa da sua aprovação`
                    : "Você não precisa fazer nada agora"}
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  {pendingApprovals.length > 0
                    ? "Um reparo ficou acima do limite combinado. Aprove ou recuse em um clique."
                    : "Cobranças, faturas e atendimento ao inquilino estão sendo cuidados pela nossa equipe."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              <span>Cadastrar imóvel</span>
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="hover-card rounded-2xl border border-slate-200/80 bg-white p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Já caiu no seu Pix</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Wallet className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {formatBRL(totalTransferred)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Valor líquido já transferido para você
              </p>
            </div>

            <div className="hover-card rounded-2xl border border-slate-200/80 bg-white p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Vai cair em breve</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {formatBRL(upcomingTransfer)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Faturas deste mês em andamento
              </p>
            </div>

            <div className="hover-card rounded-2xl border border-slate-200/80 bg-white p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Renda mensal líquida</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Building2 className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {formatBRL(monthlyNetRent)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {rentedCount} de {data.properties.length} imóveis alugados
              </p>
            </div>
          </div>

          {/* Visual Financial Progress Bar */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Andamento dos repasses
                </h3>
                <p className="text-xs text-slate-500">
                  Proporção do valor já transferido vs. previsto neste ciclo
                </p>
              </div>
              <span className="text-xs font-medium text-emerald-700 tabular-nums">
                {transferredPct}% já repassado
              </span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${transferredPct}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span className="tabular-nums">
                Repassado: {formatBRL(totalTransferred)}
              </span>
              <Link
                href="/proprietario/repasses"
                className="inline-flex items-center gap-1 font-medium text-slate-900 hover:text-emerald-700"
              >
                <span>Ver extrato completo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Informações e Rendimento por Imóvel */}
          {data.properties.length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Resumo por imóvel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Aluguel líquido vs. encargos e situação do contrato
                  </p>
                </div>
                <Link
                  href="/proprietario/imoveis"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Gerenciar imóveis →
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {data.properties.map((prop) => {
                  const totalPack =
                    prop.rentAmount + prop.condoFee + prop.iptuFee;
                  const rentPct = Math.round(
                    (prop.rentAmount / Math.max(1, totalPack)) * 100
                  );
                  const condoPct = Math.round(
                    (prop.condoFee / Math.max(1, totalPack)) * 100
                  );
                  const iptuPct = Math.max(0, 100 - rentPct - condoPct);

                  return (
                    <div
                      key={prop.id}
                      className="rounded-xl border border-slate-100 bg-[#FAFAFA] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {prop.title}
                          </span>
                          <StatusPill label={prop.status} />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">
                          Líquido {formatBRL(Math.round(prop.rentAmount * 0.92))}
                          /mês
                        </span>
                      </div>

                      <div className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="bg-emerald-600"
                          style={{ width: `${rentPct}%` }}
                          title={`Aluguel: ${formatBRL(prop.rentAmount)}`}
                        />
                        <div
                          className="bg-slate-400"
                          style={{ width: `${condoPct}%` }}
                          title={`Condomínio: ${formatBRL(prop.condoFee)}`}
                        />
                        <div
                          className="bg-slate-300"
                          style={{ width: `${iptuPct}%` }}
                          title={`IPTU: ${formatBRL(prop.iptuFee)}`}
                        />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 tabular-nums">
                        <span>
                          {prop.tenantName
                            ? `Inquilino: ${prop.tenantName} • Venc. dia ${prop.dueDay}`
                            : "Disponível para locação"}{" "}
                          • {prop.type}
                        </span>
                        <span>
                          Aluguel {formatBRL(prop.rentAmount)} • Cond.{" "}
                          {formatBRL(prop.condoFee)} • IPTU{" "}
                          {formatBRL(prop.iptuFee)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Approvals */}
          {pendingApprovals.length > 0 && (
            <section className="rounded-2xl border border-amber-200/90 bg-white overflow-hidden">
              <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50/60 px-5 py-3.5 sm:px-6">
                <Wrench className="h-4 w-4 text-amber-700" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Aprovação de orçamento acima do limite automático
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {pendingApprovals.map((ticket) => {
                  const prop = propertyMap.get(ticket.propertyId);
                  return (
                    <div
                      key={ticket.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 sm:px-6"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-slate-400">
                            {ticket.code}
                          </span>
                          <span className="text-sm font-medium text-slate-900">
                            {ticket.title}
                          </span>
                          {ticket.priority === "Urgente" && (
                            <span className="text-xs font-medium text-rose-700">
                              • Urgente
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {prop?.title} • Orçamento técnico:{" "}
                          <strong className="font-semibold text-slate-900 tabular-nums">
                            {ticket.estimatedCost
                              ? formatBRL(ticket.estimatedCost)
                              : "—"}
                          </strong>{" "}
                          (limite automático:{" "}
                          {formatBRL(prop?.autoApproveLimit ?? 500)})
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleApproveTicket(ticket.id, false)}
                          className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Recusar
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleApproveTicket(ticket.id, true)}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Aprovar e autorizar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* SECTION: IMÓVEIS */}
      {section === "imoveis" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 tabular-nums">
              {data.properties.length} imóveis cadastrados • {rentedCount}{" "}
              alugados
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Cadastrar imóvel</span>
            </button>
          </div>

          <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
            <div className="divide-y divide-slate-100">
              {data.properties.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">
                  Você ainda não cadastrou nenhum imóvel. Clique em{" "}
                  <strong className="font-medium text-slate-900">
                    Cadastrar imóvel
                  </strong>{" "}
                  acima para começar.
                </div>
              ) : (
                data.properties.map((prop) => (
                  <div
                    key={prop.id}
                    className="hover-row flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 sm:px-6"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium text-slate-900">
                            {prop.title}
                          </h3>
                          <StatusPill label={prop.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 truncate">
                          {prop.address}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-600">
                          {prop.tenantName
                            ? `Inquilino: ${prop.tenantName} (atendido pela assessoria)`
                            : "Disponível para locação"}{" "}
                          • Reparos automáticos até{" "}
                          <span className="font-medium tabular-nums">
                            {formatBRL(prop.autoApproveLimit)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-baseline sm:items-end justify-between gap-1 shrink-0 pl-13 sm:pl-0">
                      <span className="text-sm font-semibold text-slate-900 tabular-nums">
                        {formatBRL(prop.rentAmount)}
                        <span className="text-xs font-normal text-slate-500">
                          /mês
                        </span>
                      </span>
                      <span className="text-xs text-slate-500 tabular-nums">
                        Cond. {formatBRL(prop.condoFee)} • IPTU{" "}
                        {formatBRL(prop.iptuFee)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* SECTION: REPASSES */}
      {section === "repasses" && (
        <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
          <div className="divide-y divide-slate-100">
            {data.invoices.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                Nenhum repasse registrado ainda.
              </div>
            ) : (
              data.invoices.map((inv) => {
                const prop = propertyMap.get(inv.propertyId);
                return (
                  <div
                    key={inv.id}
                    className="hover-row flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          inv.status === "Repassado"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Wallet className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            {inv.referenceMonth}
                          </span>
                          <StatusPill label={inv.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 truncate">
                          {prop?.title} • Venc. {formatDateBR(inv.dueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-900 tabular-nums">
                        {formatBRL(inv.ownerNetAmount)}
                      </p>
                      <p className="text-[11px] text-slate-400 tabular-nums">
                        Bruto {formatBRL(inv.totalAmount)} • Taxa{" "}
                        {formatBRL(inv.platformFee)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* SECTION: ATENDIMENTOS */}
      {section === "atendimentos" && (
        <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
          <div className="divide-y divide-slate-100">
            {data.tickets.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                Nenhuma solicitação registrada nos seus imóveis.
              </div>
            ) : (
              data.tickets.map((ticket) => {
                const prop = propertyMap.get(ticket.propertyId);
                const lastMessage =
                  ticket.messages[ticket.messages.length - 1];
                return (
                  <div
                    key={ticket.id}
                    className="hover-row px-5 py-4 sm:px-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-slate-400">
                            {ticket.code}
                          </span>
                          <span className="text-sm font-medium text-slate-900">
                            {ticket.title}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {prop?.title} • {ticket.category}
                          {ticket.estimatedCost !== null && (
                            <>
                              {" "}
                              • Valor:{" "}
                              <span className="font-medium text-slate-700 tabular-nums">
                                {formatBRL(ticket.estimatedCost)}
                              </span>
                            </>
                          )}
                        </p>
                        {lastMessage && (
                          <p className="mt-2 text-xs text-slate-600 max-w-prose">
                            <span className="font-medium text-slate-700">
                              Última atualização ({lastMessage.sender}):
                            </span>{" "}
                            {lastMessage.body}
                          </p>
                        )}
                      </div>
                      <StatusPill label={ticket.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* Modal: Cadastrar Imóvel */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="modal-enter w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.08)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Cadastrar novo imóvel
              </h2>
              <button
                type="button"
                aria-label="Fechar modal"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Após o cadastro, a Assessoria Digital assume cobranças, faturas e
              suporte ao locatário.
            </p>

            <form onSubmit={handleCreateProperty} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="prop-title"
                  className="block text-xs font-medium text-slate-700"
                >
                  Identificação do imóvel
                </label>
                <input
                  id="prop-title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Apartamento Moema — 3 Quartos"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="prop-address"
                  className="block text-xs font-medium text-slate-700"
                >
                  Endereço completo
                </label>
                <input
                  id="prop-address"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, complemento — Cidade, UF"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="prop-type"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Tipo
                  </label>
                  <select
                    id="prop-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as PropertyType)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                  >
                    <option value="Apartamento">Apartamento</option>
                    <option value="Casa">Casa</option>
                    <option value="Studio">Studio</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="prop-rent"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Aluguel mensal (R$)
                  </label>
                  <input
                    id="prop-rent"
                    required
                    type="number"
                    min={100}
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 tabular-nums focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="prop-condo"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Condomínio (R$)
                  </label>
                  <input
                    id="prop-condo"
                    type="number"
                    min={0}
                    value={condoFee}
                    onChange={(e) => setCondoFee(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 tabular-nums focus:border-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prop-iptu"
                    className="block text-xs font-medium text-slate-700"
                  >
                    IPTU (R$)
                  </label>
                  <input
                    id="prop-iptu"
                    type="number"
                    min={0}
                    value={iptuFee}
                    onChange={(e) => setIptuFee(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 tabular-nums focus:border-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prop-limit"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Autonomia (R$)
                  </label>
                  <input
                    id="prop-limit"
                    type="number"
                    min={0}
                    value={autoApproveLimit}
                    onChange={(e) => setAutoApproveLimit(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 tabular-nums focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="prop-pix"
                  className="block text-xs font-medium text-slate-700"
                >
                  Chave Pix para repasse automático
                </label>
                <input
                  id="prop-pix"
                  required
                  value={ownerPixKey}
                  onChange={(e) => setOwnerPixKey(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasTenant}
                    onChange={(e) => setHasTenant(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span>Já possui inquilino ativo (emitir 1ª fatura agora)</span>
                </label>

                {hasTenant && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      aria-label="Nome do inquilino"
                      required
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      placeholder="Nome do inquilino"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                    />
                    <input
                      aria-label="E-mail do inquilino"
                      type="email"
                      value={tenantEmail}
                      onChange={(e) => setTenantEmail(e.target.value)}
                      placeholder="E-mail"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                    />
                    <input
                      aria-label="Dia de vencimento"
                      type="number"
                      min={1}
                      max={28}
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      placeholder="Dia venc."
                      className="rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm text-slate-900 tabular-nums focus:border-slate-900"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting ? "Salvando..." : "Salvar e ativar assessoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
