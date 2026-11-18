"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import type { UserRole } from "@/lib/types";

export interface ShellSession {
  name: string;
  email: string;
  role: UserRole;
}

const ROLE_LABELS: Record<UserRole, string> = {
  proprietario: "Proprietário",
  inquilino: "Inquilino",
  assessoria: "Assessoria",
};

const ROLE_HOME: Record<UserRole, string> = {
  proprietario: "/proprietario",
  inquilino: "/inquilino",
  assessoria: "/assessoria",
};

export function AppShell({
  children,
  title,
  subtitle,
  action,
  session,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  session?: ShellSession | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/entrar");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 h-16">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight text-slate-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <ShieldCheck className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="text-base">Aluga</span>
          </Link>

          <nav
            aria-label="Navegação principal"
            className="flex items-center gap-2"
          >
            {session ? (
              <>
                <Link
                  href={ROLE_HOME[session.role]}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    pathname.startsWith(ROLE_HOME[session.role])
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  Meu painel
                </Link>

                <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3 text-xs text-slate-600">
                  <span className="font-medium text-slate-900">
                    {session.name}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span>{ROLE_LABELS[session.role]}</span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Sair da conta"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sair</span>
                </button>
              </>
            ) : (
              <Link
                href="/entrar"
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  pathname === "/entrar"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 py-8">
        {(title || action) && (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </main>

      <footer className="border-t border-slate-200/70 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-4 text-xs text-slate-500">
          <span>Aluga — Gestão de aluguéis sem burocracia.</span>
          <span>Cobranças, faturas, atendimento e repasses em um só lugar.</span>
        </div>
      </footer>
    </div>
  );
}
