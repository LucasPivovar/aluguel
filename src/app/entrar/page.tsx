import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentSession, getHomeRouteForRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EntrarPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect(getHomeRouteForRole(session.role));
  }

  return (
    <AppShell>
      <AuthForm />
    </AppShell>
  );
}
