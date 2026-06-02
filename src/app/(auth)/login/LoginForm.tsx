"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Eye, EyeOff, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!email.trim() || !password.trim()) {
        setError("Email y contraseña son requeridos");
        return;
      }

      setLoading(true);

      try {
        const supabase = createSupabaseBrowserClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        router.push(redirectTo);
        router.refresh();
      } catch {
        setError("Error de conexión. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    },
    [email, password, redirectTo, router],
  );

  return (
    <div className="space-y-8">
      {/* ── Brand ─────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-factus-primary shadow-sm shadow-factus-primary/20">
          <Bot className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-mono font-semibold tracking-tight text-content-primary">
            Factus-API Agent
          </h1>
          <p className="mt-1 text-sm font-mono text-content-tertiary">
            Inicia sesión para continuar
          </p>
        </div>
      </div>

      {/* ── Card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-line-subtle bg-surface-panel p-6 shadow-sm">
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-widest text-content-tertiary/80"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              disabled={loading}
              autoComplete="email"
              required
              className="block w-full rounded-xl border border-line-default bg-surface-input px-3.5 py-2.5 text-sm text-content-primary placeholder:text-content-tertiary/50 transition-all focus:border-factus-primary focus:ring-2 focus:ring-factus-primary/20 focus:outline-none disabled:opacity-40"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-widest text-content-tertiary/80"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
                required
                className="block w-full rounded-xl border border-line-default bg-surface-input px-3.5 py-2.5 pr-10 text-sm text-content-primary placeholder:text-content-tertiary/50 transition-all focus:border-factus-primary focus:ring-2 focus:ring-factus-primary/20 focus:outline-none disabled:opacity-40"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-tertiary/60 transition-colors hover:text-content-secondary"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/15 bg-red-500/10 px-3.5 py-2.5">
              <p className="text-xs font-medium text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full font-mono items-center justify-center gap-2 rounded-xl bg-factus-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-factus-primary/20 transition-all hover:bg-factus-primary-hover active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <p className="text-center text-[11px] text-content-tertiary/50">
        Facturación electrónica colombiana &middot; Factus-API, HALLTEC
      </p>
    </div>
  );
}
