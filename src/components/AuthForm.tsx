"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Users,
} from "lucide-react";
import { AlertBanner } from "@/components/AlertBanner";
import type { UserRole } from "@/lib/types";

const DEMO_ACCOUNTS: Array<{
  label: string;
  roleLabel: string;
  email: string;
  password: string;
}> = [
  {
    label: "Ricardo Mendes",
    roleLabel: "Proprietário",
    email: "ricardo@aluga.com",
    password: "123456",
  },
  {
    label: "Camila Ferreira",
    roleLabel: "Inquilina",
    email: "camila@aluga.com",
    password: "123456",
  },
  {
    label: "Lucas Andrade",
    roleLabel: "Inquilino (fatura pendente)",
    email: "lucas@aluga.com",
    password: "123456",
  },
  {
    label: "Equipe Aluga",
    roleLabel: "Assessoria Digital",
    email: "assessoria@aluga.com",
    password: "123456",
  },
];

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Login / shared state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Register state
  const [role, setRole] = useState<UserRole>("proprietario");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Forgot password state
  const [forgotSent, setForgotSent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: "login" | "register" | "forgot") {
    setMode(next);
    setStep(1);
    setError(null);
    setForgotSent(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }

      router.push(data.redirectTo ?? "/");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!name.trim() || !email.trim()) {
        setError("Preencha seu nome e e-mail para continuar.");
        return;
      }
      setStep(3);
      return;
    }

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Não foi possível criar sua conta.");
        return;
      }

      router.push(data.redirectTo ?? "/");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQuickLogin(demoEmail: string, demoPassword: string) {
    setMode("login");
    setEmail(demoEmail);
    setPassword(demoPassword);
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: demoEmail,
          password: demoPassword,
          rememberMe: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.push(data.redirectTo ?? "/");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Informe seu e-mail cadastrado.");
      return;
    }
    setForgotSent(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] items-stretch py-2">
      {/* Left: Quiet Architectural Photo */}
      <div className="animate-fade-up hidden lg:block">
        <div className="relative h-full min-h-[540px] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100">
          <Image
            src="/images/auth-interior.jpg"
            alt="Ambiente residencial moderno com luz natural"
            fill
            sizes="42vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* Right: Structured White Form Card */}
      <div className="animate-fade-up animate-delay-1 flex flex-col justify-center rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-10">
        <div className="mx-auto w-full max-w-md">
          {/* LOGIN */}
          {mode === "login" && (
            <>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Entrar na Aluga
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Acesse seu painel para acompanhar imóveis, faturas e chamados.
                </p>
              </div>

              {error && (
                <div className="mt-5">
                  <AlertBanner
                    type="error"
                    message={error}
                    onClose={() => setError(null)}
                  />
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-medium text-slate-700"
                  >
                    E-mail
                  </label>
                  <input
                    id="login-email"
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Senha
                  </label>
                  <input
                    id="login-password"
                    required
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                    />
                    <span>Lembrar de mim</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-4"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  <span>{submitting ? "Entrando..." : "Entrar"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Criar conta embaixo do Entrar */}
              <div className="mt-4 text-center">
                <span className="text-xs text-slate-500">
                  Ainda não tem conta?{" "}
                </span>
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="text-xs font-semibold text-slate-900 hover:text-emerald-700 underline underline-offset-4"
                >
                  Criar conta
                </button>
              </div>

              {/* Quick Demo Accounts */}
              <div className="mt-7 border-t border-slate-100 pt-5">
                <p className="text-xs font-medium text-slate-500">
                  Contas prontas para testar
                </p>
                <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleQuickLogin(acc.email, acc.password)}
                      className="hover-row flex flex-col rounded-lg border border-slate-200/80 px-3 py-2 text-left text-xs disabled:opacity-50"
                    >
                      <span className="font-medium text-slate-900 truncate">
                        {acc.label}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate">
                        {acc.roleLabel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ESQUECEU A SENHA */}
          {mode === "forgot" && (
            <>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Voltar para entrar</span>
              </button>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                Recuperar senha
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Informe o e-mail da sua conta para receber as instruções de
                redefinição.
              </p>

              {error && (
                <div className="mt-4">
                  <AlertBanner
                    type="error"
                    message={error}
                    onClose={() => setError(null)}
                  />
                </div>
              )}

              {forgotSent ? (
                <div className="mt-6 space-y-4">
                  <AlertBanner
                    type="success"
                    message={`Se houver uma conta vinculada a ${email}, enviamos um link de redefinição de senha.`}
                    onClose={() => setForgotSent(false)}
                  />
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Voltar ao login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-xs font-medium text-slate-700"
                    >
                      E-mail cadastrado
                    </label>
                    <input
                      id="forgot-email"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    <span>Enviar instruções</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </>
          )}

          {/* CRIAR CONTA POR ETAPAS */}
          {mode === "register" && (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-900 tabular-nums">
                  Etapa {step} de 3
                </span>
                <span>Cadastro rápido</span>
              </div>

              {/* Step Progress Bar */}
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-colors ${
                      s <= step ? "bg-slate-900" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
                {step === 1 && "Como você vai usar a Aluga?"}
                {step === 2 && "Seus dados de contato"}
                {step === 3 && "Crie sua senha de acesso"}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {step === 1 && "Escolha o perfil que melhor descreve você."}
                {step === 2 && "Usaremos esses dados para identificar seu painel."}
                {step === 3 && "Defina uma senha segura com pelo menos 6 caracteres."}
              </p>

              {error && (
                <div className="mt-4">
                  <AlertBanner
                    type="error"
                    message={error}
                    onClose={() => setError(null)}
                  />
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-5">
                {/* Step 1: Role */}
                {step === 1 && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setRole("proprietario")}
                      className={`flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-colors ${
                        role === "proprietario"
                          ? "border-slate-900 bg-slate-50/70"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          Sou proprietário
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          Quero cadastrar imóveis e acompanhar repasses sem
                          lidar com cobranças.
                        </p>
                      </div>
                      {role === "proprietario" && (
                        <Check className="h-4 w-4 text-slate-900 mt-0.5 shrink-0" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("inquilino")}
                      className={`flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-colors ${
                        role === "inquilino"
                          ? "border-slate-900 bg-slate-50/70"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <Users className="h-4 w-4" />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          Sou inquilino
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          Quero pagar faturas via Pix e abrir solicitações com a
                          assessoria.
                        </p>
                      </div>
                      {role === "inquilino" && (
                        <Check className="h-4 w-4 text-slate-900 mt-0.5 shrink-0" />
                      )}
                    </button>
                  </div>
                )}

                {/* Step 2: Name & Email */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="reg-name"
                        className="block text-xs font-medium text-slate-700"
                      >
                        Nome completo
                      </label>
                      <input
                        id="reg-name"
                        required
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ana Paula Silva"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reg-email"
                        className="block text-xs font-medium text-slate-700"
                      >
                        E-mail
                      </label>
                      <input
                        id="reg-email"
                        required
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Password */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="reg-password"
                        className="block text-xs font-medium text-slate-700"
                      >
                        Senha
                      </label>
                      <input
                        id="reg-password"
                        required
                        type="password"
                        minLength={6}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reg-confirm"
                        className="block text-xs font-medium text-slate-700"
                      >
                        Confirmar senha
                      </label>
                      <input
                        id="reg-confirm"
                        required
                        type="password"
                        minLength={6}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:border-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center gap-3">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setStep((step - 1) as 1 | 2);
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Voltar</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    <span>
                      {submitting
                        ? "Criando conta..."
                        : step < 3
                          ? "Continuar"
                          : "Criar conta e entrar"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>

              <div className="mt-5 text-center">
                <span className="text-xs text-slate-500">
                  Já tem uma conta?{" "}
                </span>
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-xs font-semibold text-slate-900 hover:text-emerald-700 underline underline-offset-4"
                >
                  Entrar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
