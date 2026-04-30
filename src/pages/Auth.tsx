import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Mail,
  Lock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Calendar as CalendarIcon,
  AlertTriangle,
  MailCheck,
  Loader2,
  RotateCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup" | "forgot" | "otp";

const RESEND_COOLDOWN = 60;

const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  const today = new Date();
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const intentParam = params.get("intent");
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP state
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const skipRedirectRef = useRef(false);

  const intent: "visitor" | "creator" = useMemo(() => {
    if (intentParam === "creator" || intentParam === "visitor") return intentParam;
    try {
      const v = sessionStorage.getItem("deseox.intent");
      if (v === "creator" || v === "visitor") return v;
    } catch {}
    return "visitor";
  }, [intentParam]);

  useEffect(() => {
    if (intentParam === "creator" || intentParam === "visitor") setMode("signup");
  }, [intentParam]);

  const age = useMemo(() => calculateAge(birthDate), [birthDate]);
  const ageValid = birthDate !== "" && age >= 18;
  const ageError = birthDate !== "" && age < 18;

  const maxDob = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear() - 18, d.getMonth(), d.getDate())
      .toISOString()
      .slice(0, 10);
  }, []);

  useEffect(() => {
    document.title =
      mode === "login"
        ? "Iniciar sesión · DeseoX"
        : mode === "signup"
          ? "Crear cuenta · DeseoX"
          : mode === "otp"
            ? "Verifica tu cuenta · DeseoX"
            : "Recuperar contraseña · DeseoX";
  }, [mode]);

  // Redirect if already logged in (skip during OTP flow — we handle it manually)
  useEffect(() => {
    if (user && !skipRedirectRef.current && mode !== "otp") {
      navigate("/cuenta", { replace: true });
    }
  }, [user, navigate, mode]);

  // Cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Auto-focus on first OTP input when entering OTP mode
  useEffect(() => {
    if (mode === "otp") {
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    }
  }, [mode]);

  const fullCode = useMemo(() => code.join(""), [code]);
  const codeComplete = fullCode.length === 6 && /^\d{6}$/.test(fullCode);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const arr = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setCode(arr);
    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  const sendOtp = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // No emailRedirectTo => no Magic Link link in email (only token shown)
        data: { birth_date: birthDate, account_type: intent },
      },
    });
    if (error) throw error;
  };

  const verifyOtp = async () => {
    if (!codeComplete) return;
    setVerifying(true);
    skipRedirectRef.current = true;
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: fullCode,
        type: "email",
      });
      if (error) throw error;
      if (!data.session || !data.user) throw new Error("No se pudo crear la sesión");

      // Set the password chosen at registration
      if (password) {
        const { error: pwdError } = await supabase.auth.updateUser({ password });
        if (pwdError && !pwdError.message.toLowerCase().includes("same")) {
          console.warn("No se pudo establecer la contraseña:", pwdError.message);
        }
      }

      // Upsert profile with birth date, age and account_type
      await supabase.from("profiles").upsert({
        id: data.user.id,
        birth_date: birthDate || null,
        age: age || null,
        account_type: intent,
      });

      sessionStorage.removeItem("deseox.pendingSignup");
      sessionStorage.removeItem("deseox.intent");

      toast({ title: "¡Cuenta verificada!", description: "Bienvenido a DeseoX." });
      // Redirección por rol: creador -> verificación de fotos, visitante -> home
      navigate(intent === "creator" ? "/verificacion" : "/", { replace: true });
    } catch (err: any) {
      skipRedirectRef.current = false;
      toast({
        title: "Código inválido",
        description: err.message ?? "Verifica el código e inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await sendOtp();
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

  // Auto-verify when 6 digits are entered
  useEffect(() => {
    if (mode === "otp" && codeComplete && !verifying) {
      verifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeComplete, mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (password.length < 6)
          throw new Error("La contraseña debe tener al menos 6 caracteres");
        if (password !== confirmPassword)
          throw new Error("Las contraseñas no coinciden");
        if (!birthDate) throw new Error("La fecha de nacimiento es obligatoria");
        if (age < 18)
          throw new Error("Debes ser mayor de 18 años para acceder a esta plataforma");
        if (!acceptedTerms)
          throw new Error("Debes aceptar los Términos y Condiciones para continuar");

        await sendOtp();

        toast({
          title: "Código enviado",
          description: "Ingresa los 6 números que enviamos a tu correo.",
        });
        setCode(["", "", "", "", "", ""]);
        setCooldown(RESEND_COOLDOWN);
        setMode("otp");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Bienvenido de nuevo" });
        navigate("/cuenta", { replace: true });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: "Email enviado",
          description: "Revisa tu correo para restablecer la contraseña.",
        });
        setMode("login");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitDisabled =
    loading ||
    (mode === "signup" &&
      (!ageValid || password.length < 6 || password !== confirmPassword || !acceptedTerms));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-10 max-w-md mx-auto w-full">
        <div className="card-premium rounded-3xl p-8 shadow-elevated relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-50"
            style={{ background: "hsl(var(--accent))" }}
          />
          <div className="relative">
            {mode === "otp" ? (
              <>
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
                  Ingresa los 6 números que enviamos a{" "}
                  <span className="text-foreground font-semibold break-all">{email}</span>.
                </p>

                <div
                  className="mt-7 flex justify-center gap-2 sm:gap-3"
                  onPaste={handleOtpPaste}
                >
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputsRef.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
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
                  onClick={verifyOtp}
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
                    onClick={resendOtp}
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

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setCode(["", "", "", "", "", ""]);
                    }}
                    className="text-xs text-accent hover:underline font-semibold"
                  >
                    ¿Te equivocaste de correo? Volver
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 ring-1 ring-accent/40 px-3 py-1 text-xs text-accent font-medium mb-4">
                  <ShieldCheck className="h-3.5 w-3.5" /> Acceso seguro · solo +18
                </div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight">
                  {mode === "login"
                    ? "Bienvenido de nuevo"
                    : mode === "signup"
                      ? "Crea tu cuenta"
                      : "Recuperar contraseña"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mode === "login"
                    ? "Inicia sesión para gestionar tu perfil."
                    : mode === "signup"
                      ? `Cuenta de ${intent === "creator" ? "creador" : "visitante"} · te enviaremos un código de 6 dígitos.`
                      : "Te enviaremos un enlace para restablecerla."}
                </p>

                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        className="bg-background/60 pl-10"
                      />
                    </div>
                  </div>

                  {mode !== "forgot" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="password">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          required
                          minLength={6}
                          autoComplete={mode === "signup" ? "new-password" : "current-password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="bg-background/60 pl-10"
                        />
                      </div>
                    </div>
                  )}

                  {mode === "signup" && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            required
                            minLength={6}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite tu contraseña"
                            className="bg-background/60 pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="birthDate"
                            type="date"
                            required
                            max={maxDob}
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="bg-background/60 pl-10"
                          />
                        </div>
                        {birthDate && ageValid && (
                          <p className="text-xs text-muted-foreground">Edad: {age} años ✓</p>
                        )}
                        {ageError && (
                          <p className="text-xs text-destructive inline-flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Debes ser mayor de 18 años para acceder a esta plataforma
                          </p>
                        )}
                      </div>

                      <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/40 p-3">
                        <input
                          id="acceptTerms"
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-border accent-[hsl(var(--accent))] cursor-pointer"
                          required
                        />
                        <label htmlFor="acceptTerms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                          He leído y acepto los{" "}
                          <Link
                            to="/legal/terminos"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent font-semibold hover:underline"
                          >
                            Términos y Condiciones
                          </Link>{" "}
                          de DeseoX.
                        </label>
                      </div>
                    </>
                  )}

                  {mode === "login" && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-accent hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full rounded-full gap-2"
                    disabled={submitDisabled}
                  >
                    {loading
                      ? "Procesando…"
                      : mode === "login"
                        ? "Iniciar sesión"
                        : mode === "signup"
                          ? "Enviar código"
                          : "Enviar enlace"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {mode === "login" && (
                    <>
                      ¿Aún no tienes cuenta?{" "}
                      <button
                        onClick={() => setMode("signup")}
                        className="text-accent font-semibold hover:underline"
                      >
                        Crear cuenta
                      </button>
                    </>
                  )}
                  {mode === "signup" && (
                    <>
                      ¿Ya tienes cuenta?{" "}
                      <button
                        onClick={() => setMode("login")}
                        className="text-accent font-semibold hover:underline"
                      >
                        Iniciar sesión
                      </button>
                    </>
                  )}
                  {mode === "forgot" && (
                    <button
                      onClick={() => setMode("login")}
                      className="text-accent font-semibold hover:underline"
                    >
                      Volver a iniciar sesión
                    </button>
                  )}
                </p>

                <div className="mt-6 pt-6 border-t border-border/60 text-center">
                  <Link
                    to="/verificacion"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors"
                  >
                    <Sparkles className="h-3 w-3" /> ¿Cómo funciona la verificación?
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
