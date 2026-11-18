import { DashboardShell } from "@/components/DashboardShell";
import { ConciergePortal } from "@/components/ConciergePortal";
import { getConciergeNavItems, requireRolePage } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export default async function AssessoriaFaturasPage() {
  const { session, scoped } = await requireRolePage("assessoria");

  return (
    <DashboardShell
      session={session}
      navItems={getConciergeNavItems(scoped)}
      title="Cobranças e repasses"
      subtitle="Emita faturas mensais e execute o repasse líquido para os proprietários."
    >
      <ConciergePortal initialData={scoped} section="financeiro" />
    </DashboardShell>
  );
}
