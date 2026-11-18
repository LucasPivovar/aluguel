import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FaqAccordion } from "@/components/FaqAccordion";
import { HomeFlowPreview } from "@/components/HomeFlowPreview";
import { getCurrentSession, getHomeRouteForRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getCurrentSession();
  const primaryHref = session ? getHomeRouteForRole(session.role) : "/entrar";
  const primaryLabel = session ? "Ir para meu painel" : "Entrar na plataforma";

  return (
    <AppShell session={session}>
      {/* 1. Hero */}
      <section className="animate-fade-up grid items-center gap-10 py-6 sm:py-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.1]">
            Aluguel sem dor de cabeça para quem é dono do imóvel.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
            Você cadastra o imóvel uma única vez. Nossa assessoria cuida das
            cobranças, atende o inquilino e transfere o valor direto para o seu
            Pix.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={primaryHref}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              <span>{primaryLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            {!session && (
              <Link
                href="/entrar"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-2 py-2"
              >
                Testar contas prontas →
              </Link>
            )}
          </div>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100">
          <Image
            src="/images/hero-apartment.jpg"
            alt="Sala de estar iluminada de um apartamento moderno administrado pela Aluga"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 48vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* 2. Como funciona (3 etapas separadas por linha) */}
      <section className="animate-fade-up animate-delay-1 mt-12 border-t border-slate-200/80 py-14">
        <div className="mb-8">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Como funciona na prática
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Três etapas simples do cadastro ao recebimento mensal.
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              01
            </span>
            <h3 className="mt-2 text-base font-semibold text-slate-900">
              Cadastre o imóvel
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Informe o endereço, o valor do aluguel, sua chave Pix e até quanto
              podemos aprovar em pequenos reparos automaticamente.
            </p>
          </div>

          <div>
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              02
            </span>
            <h3 className="mt-2 text-base font-semibold text-slate-900">
              A gente cuida de tudo
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              O inquilino paga a fatura e fala direto com a nossa equipe se
              precisar de algo no imóvel. Você não precisa cobrar ninguém.
            </p>
          </div>

          <div>
            <span className="font-mono text-xs text-emerald-700 tabular-nums">
              03
            </span>
            <h3 className="mt-2 text-base font-semibold text-slate-900">
              Receba no seu Pix
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Assim que o pagamento é confirmado, o valor líquido é repassado
              para a sua conta com total transparência.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Experiência interativa por perfil */}
      <section className="animate-fade-up animate-delay-2 py-4">
        <HomeFlowPreview />
      </section>

      {/* 4. Perguntas frequentes */}
      <section className="animate-fade-up animate-delay-3 mt-14 grid gap-8 lg:grid-cols-[0.38fr_0.62fr] items-start border-t border-slate-200/80 py-14">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Perguntas frequentes
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Entenda os detalhes da intermediação, taxas e atendimento.
          </p>
        </div>
        <FaqAccordion />
      </section>

      {/* 5. Chamada final */}
      <section className="border-t border-slate-200/80 py-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Pronto para alugar sem burocracia?
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Entre agora com uma conta de teste ou crie a sua em segundos.
          </p>
        </div>
        <Link
          href={primaryHref}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          <span>{primaryLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </AppShell>
  );
}
