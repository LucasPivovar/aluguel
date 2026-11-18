"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import type { ShellSession } from "@/components/AppShell";
import type { UserRole } from "@/lib/types";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: "dashboard" | "properties" | "payouts" | "tickets" | "invoices";
  badge?: number;
}

const ICONS = {
  dashboard: LayoutDashboard,
  properties: Building2,
  payouts: Wallet,
  tickets: MessageSquare,
  invoices: CreditCard,
};

const ROLE_LABELS: Record<UserRole, string> = {
  proprietario: "Proprietário",
  inquilino: "Inquilino",
  assessoria: "Assessoria Digital",
};

export function DashboardShell({
  children,
  session,
  navItems,
  title,
  subtitle,
  action,
}: {
  children: React.ReactNode;
  session: ShellSession;
  navItems: SidebarNavItem[];
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/entrar");
  }

  const navContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        <Link
          href="/"
          className="flex items-center gap-2.5 px-2 py-1.5 font-semibold tracking-tight text-slate-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <ShieldCheck className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="text-base">Aluga</span>
        </Link>

        <nav
          aria-label="Menu lateral"
          className="mt-6 space-y-1"
        >
          {navItems.map((item) => {
            const Icon = ICONS[item.icon];
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="px-2 pb-3">
          <p className="text-sm font-medium text-slate-900 truncate">
            {session.name}
          </p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[session.role]}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sair da conta</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#FAFAFA] text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-60 shrink-0 border-r border-slate-200/80 bg-white sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-white border-r border-slate-200 h-full">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="flex md:hidden items-center justify-between border-b border-slate-200/80 bg-white px-4 h-14 sticky top-0 z-30">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-slate-900"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <ShieldCheck className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="text-sm">Aluga</span>
          </Link>
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-8 py-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
