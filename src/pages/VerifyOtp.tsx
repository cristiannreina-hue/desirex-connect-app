import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, MailCheck, Loader2, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingSignup {
  email: string;
  password: string;
  birthDate: string;
  age: number;
  intent: "visitor" | "creator";
}

const RESEND_COOLDOWN = 60;

const VerifyOtp = () => {
  const navigate = useNavigate();
  const [pending, setPending] = useState<PendingSignup | null>(null);
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    document.title = "Verifica tu cuenta · DeseoX";
  }, []);

  // Cargar datos del registro pendiente
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("deseox.pendingSignup");
      if (!raw) {
        navigate("/auth", { replace: true });
        return;
      }
      setPending(JSON.parse(raw) as PendingSignup);
    } catch {
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  // Cooldown del botón "Reenviar"
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Foco automático en la primera casilla al cargar
  useEffect(() => {
    if (pending) inputsRef.current[0]?.focus();
  }, [pending]);

  const fullCode = useMemo(() => code.join(""), [code]);
  const codeComplete = fullCode.length === 6 && /^\d{6}$/.test(fullCode);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const arr = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setCode(arr);
    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  const verify = async () => {
    if (!pending || !codeComplete) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: pending.email,
        token: fullCode,
        type: "email",
      });
      if (error) throw error;
      if (!data.session || !data.user) throw new Error("No se pudo crear la sesión");

      // Establecer la contraseña que el usuario eligió en el registro
      const { error: pwdError } = await supabase.auth.updateUser({ password: pending.password });
      if (pwdError && !pwdError.message.toLowerCase().includes("same")) {
        // No bloqueamos si falla; el usuario podrá usar OTP/recovery
        console.warn("No se pudo establecer la contraseña:", pwdError.message);
      }

      // Crear/actualizar perfil con fecha de nacimiento, edad y rol
      await supabase.from("profiles").upsert({
        id: data.user.id,
        birth_date: pending.birthDate,
        age: pending.age,
        account_type: pending.intent,
      });

      sessionStorage.removeItem("deseox.pendingSignup");
      sessionStorage.removeItem("deseox.intent");

      toast({ title: "¡Cuenta verificada!", description: "Bienvenido a DeseoX." });
      navigate(pending.intent === "creator" ? "/dashboard" : "/", { replace: true });
    } catch (err: any) {
      toast({
        title: "Código inválido",
        description: err.message ?? "Verifica el código e inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (!pending || cooldown > 0) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: pending.email,
        options: {
          shouldCreateUser: true,
          data: {
            birth_date: pending.birthDate,
            account_type: pending.intent,
          },
        },
      });
      if (error) throw error;
      setCooldown(RESEND_COOLDOWN);
      setCode(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
      toast({ title: "Código reenviado", description: "Revisa tu correo nuevamente." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  // Auto-verificar cuando se complete el código
  useEffect(() => {
    if (codeComplete && !verifying) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeComplete]);

  if (!pending) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-12 max-w-md mx-auto w-full flex items-center">
        <div className="w-full">
          <div
            className={cn(
              "relative overflow-hidden rounded-3xl p-8 sm:p-10",
              "border border-white/[0.08]",
              "bg-white/[0.03] backdrop-blur-2xl backdrop-saturate-150",
              "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]",
            )}
          >
            {/* Glow decorativo */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full blur-3xl opacity-40"
              style={{ background: "hsl(var(--accent))" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-32 -left-24 h-64 w-64 rounded-full blur-3xl opacity-25"
              style={{ background: "hsl(var(--primary))" }}
            />

            <div className="relative">
              <div className="flex justify-center mb-5">
                <div className="rounded-2xl bg-accent/10 p-4 ring-1 ring-accent/40">
                  <MailCheck className="h-8 w-8 text-accent" />
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 ring-1 ring-accent/40 px-3 py-1 text-xs text-accent font-medium mb-3">
                <ShieldCheck className="h-3.5 w-3.5" /> Verificación segura
              </div>

              <h1 className="font-display text-3xl font-extrabold tracking-tight">
                Verifica tu cuenta
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Te enviamos un código de 6 dígitos a{" "}
                <span className="text-foreground font-semibold break-all">{pending.email}</span>.
              </p>

              {/* 6 casillas */}
              <div className="mt-7 flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={verifying}
                    className={cn(
                      "h-14 w-11 sm:h-16 sm:w-12 rounded-xl text-center text-2xl font-bold",
                      "bg-background/40 backdrop-blur-sm",
                      "border border-border/70",
                      "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
                      "transition-all",
                      digit && "border-accent/60 bg-accent/5 text-accent",
                    )}
                  />
                ))}
              </div>

              <Button
                onClick={verify}
                variant="hero"
                size="lg"
                className="mt-7 w-full rounded-full gap-2"
                disabled={!codeComplete || verifying}
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verificando…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Verificar código
                  </>
                )}
              </Button>

              <div className="mt-5 text-center text-sm">
                <span className="text-muted-foreground">¿No recibiste el código? </span>
                <button
                  type="button"
                  onClick={resend}
                  disabled={cooldown > 0 || resending}
                  className={cn(
                    "inline-flex items-center gap-1.5 font-semibold transition-colors",
                    cooldown > 0 || resending
                      ? "text-muted-foreground/60 cursor-not-allowed"
                      : "text-accent hover:underline",
                  )}
                >
                  {resending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCw className="h-3.5 w-3.5" />
                  )}
                  {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar código"}
                </button>
              </div>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Revisa tu carpeta de spam si no lo ves en tu bandeja.
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            ¿Te equivocaste de correo?{" "}
            <button
              onClick={() => {
                sessionStorage.removeItem("deseox.pendingSignup");
                navigate("/auth?intent=" + pending.intent, { replace: true });
              }}
              className="text-accent hover:underline font-semibold"
            >
              Volver
            </button>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyOtp;
