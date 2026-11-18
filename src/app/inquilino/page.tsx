import { DashboardShell } from "@/components/DashboardShell";
import { TenantPortal } from "@/components/TenantPortal";
import { getTenantNavItems, requireRolePage } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export default async function InquilinoResumoPage() {
  const { session, scoped } = await requireRolePage("inquilino");

  return (
    <DashboardShell
      session={session}
      navItems={getTenantNavItems(scoped)}
      title={`Olá, ${session.name.split(" ")[0]}`}
      subtitle="Resumo da sua locação: próxima fatura e status dos seus chamados."
    >
      <TenantPortal initialData={scoped} section="resumo" />
    </DashboardShell>
  );
}
