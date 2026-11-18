import { DashboardShell } from "@/components/DashboardShell";
import { OwnerPortal } from "@/components/OwnerPortal";
import { getOwnerNavItems, requireRolePage } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export default async function ProprietarioResumoPage() {
  const { session, scoped } = await requireRolePage("proprietario");

  return (
    <DashboardShell
      session={session}
      navItems={getOwnerNavItems(scoped)}
      title={`Olá, ${session.name.split(" ")[0]}`}
      subtitle="Resumo da gestão dos seus imóveis. A nossa equipe cuida das cobranças e do atendimento."
    >
      <OwnerPortal
        initialData={scoped}
        userEmail={session.email}
        section="resumo"
      />
    </DashboardShell>
  );
}
