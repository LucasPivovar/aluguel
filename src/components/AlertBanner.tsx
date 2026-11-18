"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";

export function AlertBanner({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  const isError = type === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
        isError
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {isError ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        )}
        <span>{message}</span>
      </div>
      <button
        type="button"
        aria-label="Fechar aviso"
        onClick={onClose}
        className={`rounded-md p-1 ${
          isError
            ? "text-rose-700 hover:bg-rose-100"
            : "text-emerald-700 hover:bg-emerald-100"
        }`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
