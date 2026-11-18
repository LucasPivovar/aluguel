import { DashboardShell } from "@/components/DashboardShell";
import { TenantPortal } from "@/components/TenantPortal";
import { getTenantNavItems, requireRolePage } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export default async function InquilinoFaturasPage() {
  const { session, scoped } = await requireRolePage("inquilino");

  return (
    <DashboardShell
      session={session}
      navItems={getTenantNavItems(scoped)}
      title="Minhas faturas"
      subtitle="Acompanhe seus boletos e pague via Pix com confirmação imediata."
    >
      <TenantPortal initialData={scoped} section="faturas" />
    </DashboardShell>
  );
}
