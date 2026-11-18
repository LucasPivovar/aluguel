"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, CreditCard, ShieldCheck, Users, Wallet, Wrench } from "lucide-react";

type RoleTab = "proprietario" | "inquilino";

const CONTENT: Record<
  RoleTab,
  {
    headline: string;
    description: string;
    items: Array<{ title: string; detail: string }>;
    previewTitle: string;
    previewAmount: string;
    previewSub: string;
    previewNote: string;
  }
> = {
  proprietario: {
    headline: "Você acompanha os repasses sem lidar com cobranças.",
    description:
      "Cadastre o imóvel e deixe a operação com a nossa equipe. Você só decide se algum reparo passar do limite que você definiu.",
    items: [
      {
        title: "Cadastro único",
        detail: "Informe aluguel, condomínio, IPTU e sua chave Pix.",
      },
      {
        title: "Limite de autonomia",
        detail: "Pequenos reparos são resolvidos sem te ligar.",
      },
      {
        title: "Repasse transparente",
        detail: "Acompanhe o valor líquido transferido todo mês.",
      },
    ],
    previewTitle: "Repasse enviado para sua chave Pix",
    previewAmount: "R$ 4.994,00",
    previewSub: "Apartamento Jardins • Novembro/2026",
    previewNote: "Taxa de assessoria (8%) já descontada",
  },
  inquilino: {
    headline: "Um canal único para pagar e resolver qualquer demanda.",
    description:
      "Sem precisar procurar o proprietário por mensagem. O locatário resolve tudo pelo portal com atendimento ágil da assessoria.",
    items: [
      {
        title: "Pagamento em segundos",
        detail: "Copie o código Pix ou pague a fatura direto no painel.",
      },
      {
        title: "Chamados organizados",
        detail: "Registre manutenção, dúvidas financeiras ou de contrato.",
      },
      {
        title: "Acompanhamento claro",
        detail: "Converse com a equipe e veja o status em tempo real.",
      },
    ],
    previewTitle: "Fatura mensal disponível",
    previewAmount: "R$ 3.635,00",
    previewSub: "Vencimento em 20/11/2026 • Studio Vila Madalena",
    previewNote: "Pix Copia e Cola pronto para pagamento",
  },
};

export function HomeFlowPreview() {
  const [role, setRole] = useState<RoleTab>("proprietario");
  const active = CONTENT[role];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Experiência pensada para cada lado
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Alterne abaixo para ver o que cada perfil faz na plataforma.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Alternar visão por perfil"
          className="inline-flex rounded-lg border border-slate-200 bg-[#FAFAFA] p-1 self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={role === "proprietario"}
            onClick={() => setRole("proprietario")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              role === "proprietario"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Proprietário</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === "inquilino"}
            onClick={() => setRole("inquilino")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              role === "inquilino"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Inquilino</span>
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {active.headline}
          </h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-prose">
            {active.description}
          </p>

          <div className="mt-6 space-y-4">
            {active.items.map((item, idx) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="font-mono text-xs text-slate-400 pt-0.5 tabular-nums">
                  0{idx + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Focused Preview Panel */}
        <div className="rounded-xl border border-slate-200/80 bg-[#FAFAFA] p-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              {role === "proprietario" ? (
                <Wallet className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <CreditCard className="h-3.5 w-3.5 text-slate-700" />
              )}
              {active.previewTitle}
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>

          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {active.previewAmount}
          </p>
          <p className="mt-1 text-xs text-slate-600">{active.previewSub}</p>

          <div className="mt-5 flex items-center justify-between border-t border-slate-200/80 pt-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <Wrench className="h-3.5 w-3.5 text-slate-400" />
              {active.previewNote}
            </span>
            <Link
              href="/entrar"
              className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800"
            >
              <span>Testar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
