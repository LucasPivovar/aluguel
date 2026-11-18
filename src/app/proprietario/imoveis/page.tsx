import { DashboardShell } from "@/components/DashboardShell";
import { OwnerPortal } from "@/components/OwnerPortal";
import { getOwnerNavItems, requireRolePage } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export default async function ProprietarioImoveisPage() {
  const { session, scoped } = await requireRolePage("proprietario");

  return (
    <DashboardShell
      session={session}
      navItems={getOwnerNavItems(scoped)}
      title="Meus imóveis"
      subtitle="Cadastre novos imóveis e acompanhe os valores e limites de cada locação."
    >
      <OwnerPortal
        initialData={scoped}
        userEmail={session.email}
        section="imoveis"
      />
    </DashboardShell>
  );
}
