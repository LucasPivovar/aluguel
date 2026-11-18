"use client";

import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Preciso conversar com o inquilino quando houver algum problema?",
    a: "Não. Todas as dúvidas, solicitações de manutenção e cobranças passam pela nossa Assessoria Digital. Você só é acionado se algum orçamento ultrapassar o limite automático que você definiu.",
  },
  {
    q: "Como funciona a taxa da plataforma e o repasse?",
    a: "A taxa de assessoria é de 8% sobre o valor do aluguel (condomínio e IPTU são repassados integralmente). Assim que o inquilino paga a fatura via Pix, o valor líquido é transferido para a sua chave Pix.",
  },
  {
    q: "O que o inquilino consegue fazer pelo portal dele?",
    a: "O locatário acessa um canal único para copiar o código Pix ou pagar a fatura mensal, acompanhar comprovantes e abrir chamados de manutenção ou dúvidas direto com a nossa equipe.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-slate-200/80 border-t border-b border-slate-200/80">
      {FAQ_ITEMS.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={item.q}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors hover:text-slate-600"
            >
              <span className="text-sm sm:text-base font-medium text-slate-900">
                {item.q}
              </span>
              {isOpen ? (
                <Minus className="h-4 w-4 shrink-0 text-slate-400" />
              ) : (
                <Plus className="h-4 w-4 shrink-0 text-slate-400" />
              )}
            </button>
            {isOpen && (
              <p className="pb-5 pr-8 text-sm text-slate-600 leading-relaxed max-w-prose">
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
