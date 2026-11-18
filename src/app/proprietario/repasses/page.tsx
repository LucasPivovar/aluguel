import { DashboardShell } from "@/components/DashboardShell";
import { OwnerPortal } from "@/components/OwnerPortal";
import { getOwnerNavItems, requireRolePage } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export default async function ProprietarioRepassesPage() {
  const { session, scoped } = await requireRolePage("proprietario");

  return (
    <DashboardShell
      session={session}
      navItems={getOwnerNavItems(scoped)}
      title="Repasses"
      subtitle="Extrato transparente do que já foi pago pelo inquilino e transferido para o seu Pix."
    >
      <OwnerPortal
        initialData={scoped}
        userEmail={session.email}
        section="repasses"
      />
    </DashboardShell>
  );
}
