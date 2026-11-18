import { DashboardShell } from "@/components/DashboardShell";
import { TenantPortal } from "@/components/TenantPortal";
import { getTenantNavItems, requireRolePage } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export default async function InquilinoChamadosPage() {
  const { session, scoped } = await requireRolePage("inquilino");

  return (
    <DashboardShell
      session={session}
      navItems={getTenantNavItems(scoped)}
      title="Chamados e atendimento"
      subtitle="Abra solicitações de manutenção ou tire dúvidas direto com a Assessoria Digital."
    >
      <TenantPortal initialData={scoped} section="chamados" />
    </DashboardShell>
  );
}
