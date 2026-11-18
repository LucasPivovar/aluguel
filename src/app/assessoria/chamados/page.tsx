import { DashboardShell } from "@/components/DashboardShell";
import { ConciergePortal } from "@/components/ConciergePortal";
import { getConciergeNavItems, requireRolePage } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export default async function AssessoriaChamadosPage() {
  const { session, scoped } = await requireRolePage("assessoria");

  return (
    <DashboardShell
      session={session}
      navItems={getConciergeNavItems(scoped)}
      title="Central de chamados"
      subtitle="Atenda os locatários, lance orçamentos de manutenção e conclua solicitações."
    >
      <ConciergePortal initialData={scoped} section="chamados" />
    </DashboardShell>
  );
}
