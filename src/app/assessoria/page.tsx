import { DashboardShell } from "@/components/DashboardShell";
import { ConciergePortal } from "@/components/ConciergePortal";
import { getConciergeNavItems, requireRolePage } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export default async function AssessoriaResumoPage() {
  const { session, scoped } = await requireRolePage("assessoria");

  return (
    <DashboardShell
      session={session}
      navItems={getConciergeNavItems(scoped)}
      title="Visão geral da assessoria"
      subtitle="Acompanhe repasses prontos, chamados abertos e contratos em operação."
    >
      <ConciergePortal initialData={scoped} section="resumo" />
    </DashboardShell>
  );
}
