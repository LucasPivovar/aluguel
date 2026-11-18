"use client";

import React from "react";

type Variant = "emerald" | "amber" | "rose" | "slate" | "blue";

const VARIANT_STYLES: Record<Variant, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  amber: "bg-amber-50 text-amber-700 border-amber-200/70",
  rose: "bg-rose-50 text-rose-700 border-rose-200/70",
  blue: "bg-sky-50 text-sky-700 border-sky-200/70",
  slate: "bg-slate-100 text-slate-700 border-slate-200/80",
};

const DOT_STYLES: Record<Variant, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  blue: "bg-sky-500",
  slate: "bg-slate-400",
};

export function getStatusVariant(status: string): Variant {
  switch (status) {
    case "Repassado":
    case "Pago":
    case "Alugado":
    case "Resolvido":
      return "emerald";
    case "Pendente":
    case "Em Análise":
    case "Em Vistoria":
      return "blue";
    case "Aguardando Aprovação":
    case "Aberto":
      return "amber";
    case "Atrasado":
    case "Urgente":
      return "rose";
    default:
      return "slate";
  }
}

export function StatusPill({
  label,
  variant,
}: {
  label: string;
  variant?: Variant;
}) {
  const resolved = variant ?? getStatusVariant(label);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${VARIANT_STYLES[resolved]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[resolved]}`} />
      {label}
    </span>
  );
}
