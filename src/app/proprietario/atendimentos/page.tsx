import { DashboardShell } from "@/components/DashboardShell";
import { OwnerPortal } from "@/components/OwnerPortal";
import { getOwnerNavItems, requireRolePage } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export default async function ProprietarioAtendimentosPage() {
  const { session, scoped } = await requireRolePage("proprietario");

  return (
    <DashboardShell
      session={session}
      navItems={getOwnerNavItems(scoped)}
      title="Atendimentos"
      subtitle="Solicitações dos inquilinos que a nossa assessoria está resolvendo por você."
    >
      <OwnerPortal
        initialData={scoped}
        userEmail={session.email}
        section="atendimentos"
      />
    </DashboardShell>
  );
}
