import { redirect } from "next/navigation";
import type { SidebarNavItem } from "@/components/DashboardShell";
import {
  getCurrentSession,
  getHomeRouteForRole,
  scopeDatabaseForSession,
  type SessionPayload,
} from "@/lib/auth";
import { readDatabase } from "@/lib/store";
import type { Database, UserRole } from "@/lib/types";

export async function requireRolePage(expectedRole: UserRole): Promise<{
  session: SessionPayload;
  scoped: Omit<Database, "users">;
}> {
  const session = await getCurrentSession();
  if (!session) redirect("/entrar");
  if (session.role !== expectedRole) {
    redirect(getHomeRouteForRole(session.role));
  }

  const db = await readDatabase();
  const scoped = scopeDatabaseForSession(db, session);
  return { session, scoped };
}

export function getOwnerNavItems(
  scoped: Omit<Database, "users">
): SidebarNavItem[] {
  const pendingApprovals = scoped.tickets.filter(
    (t) => t.status === "Aguardando Aprovação" && t.ownerApproved === null
  ).length;

  return [
    {
      href: "/proprietario",
      label: "Resumo",
      icon: "dashboard",
      badge: pendingApprovals > 0 ? pendingApprovals : undefined,
    },
    {
      href: "/proprietario/imoveis",
      label: "Meus imóveis",
      icon: "properties",
    },
    {
      href: "/proprietario/repasses",
      label: "Repasses",
      icon: "payouts",
    },
    {
      href: "/proprietario/atendimentos",
      label: "Atendimentos",
      icon: "tickets",
    },
  ];
}

export function getTenantNavItems(
  scoped: Omit<Database, "users">
): SidebarNavItem[] {
  const openTickets = scoped.tickets.filter(
    (t) => t.status !== "Resolvido"
  ).length;

  return [
    {
      href: "/inquilino",
      label: "Visão geral",
      icon: "dashboard",
    },
    {
      href: "/inquilino/faturas",
      label: "Minhas faturas",
      icon: "invoices",
    },
    {
      href: "/inquilino/chamados",
      label: "Chamados",
      icon: "tickets",
      badge: openTickets > 0 ? openTickets : undefined,
    },
  ];
}

export function getConciergeNavItems(
  scoped: Omit<Database, "users">
): SidebarNavItem[] {
  const openTickets = scoped.tickets.filter(
    (t) => t.status !== "Resolvido"
  ).length;
  const readyTransfers = scoped.invoices.filter(
    (i) => i.status === "Pago"
  ).length;

  return [
    {
      href: "/assessoria",
      label: "Visão geral",
      icon: "dashboard",
    },
    {
      href: "/assessoria/faturas",
      label: "Cobranças e repasses",
      icon: "payouts",
      badge: readyTransfers > 0 ? readyTransfers : undefined,
    },
    {
      href: "/assessoria/chamados",
      label: "Chamados",
      icon: "tickets",
      badge: openTickets > 0 ? openTickets : undefined,
    },
    {
      href: "/assessoria/imoveis",
      label: "Imóveis",
      icon: "properties",
    },
  ];
}
