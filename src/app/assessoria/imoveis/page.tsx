import { DashboardShell } from "@/components/DashboardShell";
import { ConciergePortal } from "@/components/ConciergePortal";
import { getConciergeNavItems, requireRolePage } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export default async function AssessoriaImoveisPage() {
  const { session, scoped } = await requireRolePage("assessoria");

  return (
    <DashboardShell
      session={session}
      navItems={getConciergeNavItems(scoped)}
      title="Imóveis sob gestão"
      subtitle="Carteira completa de imóveis, proprietários, locatários e limites de autonomia."
    >
      <ConciergePortal initialData={scoped} section="imoveis" />
    </DashboardShell>
  );
}
