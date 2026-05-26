import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams, useLocation } from "react-router-dom";
import { z } from "zod";
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
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "signup" | "forgot";

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

// ---------- Validación ----------
const emailSchema = z
  .string()
  .trim()
  .min(1, "El email es obligatorio")
  .max(255, "Email demasiado largo")
  .email("Formato de email inválido");

const passwordRules = {
  length: (v: string) => v.length >= 8,
  upper: (v: string) => /[A-Z]/.test(v),
  lower: (v: string) => /[a-z]/.test(v),
  number: (v: string) => /\d/.test(v),
};

const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres")
  .refine((v) => /[A-Z]/.test(v), "Debe incluir una mayúscula")
  .refine((v) => /[a-z]/.test(v), "Debe incluir una minúscula")
  .refine((v) => /\d/.test(v), "Debe incluir un número");

const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    birthDate: z.string().min(1, "La fecha de nacimiento es obligatoria"),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: "Debes aceptar los Términos y Condiciones" }),
    }),
    acceptedPrivacy: z.literal(true, {
      errorMap: () => ({ message: "Debes aceptar el Tratamiento de Datos" }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((d) => calculateAge(d.birthDate) >= 18, {
    message: "Debes ser mayor de 18 años",
    path: ["birthDate"],
  });

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es obligatoria"),
});

const forgotSchema = z.object({ email: emailSchema });

// Mapea errores comunes de Supabase a mensajes en español
const mapAuthError = (msg?: string): string => {
  if (!msg) return "Ocurrió un error inesperado";
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Email o contraseña incorrectos";
  if (m.includes("email logins are disabled") || m.includes("email provider is disabled") || m.includes("provider_disabled"))
    return "El acceso con email está desactivado temporalmente. Lo estoy corrigiendo en la configuración.";
  if (m.includes("email not confirmed"))
    return "Debes verificar tu correo antes de iniciar sesión";
  if (m.includes("user already registered") || m.includes("already registered"))
    return "Este email ya está registrado. Inicia sesión.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  if (m.includes("password") && m.includes("pwned"))
    return "Esta contraseña aparece en filtraciones públicas. Elige otra más segura.";
  if (m.includes("weak password")) return "Contraseña demasiado débil";
  if (m.includes("network")) return "Sin conexión. Revisa tu internet.";
  return msg;
};

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const location = useLocation();
  const intentParam = params.get("intent");
  const redirectParam = params.get("redirect");
  const safeRedirect =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : null;
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const intent: "visitor" | "creator" = useMemo(() => {
    if (location.pathname.endsWith("/registro/creadora")) return "creator";
    if (location.pathname.endsWith("/registro/visitante")) return "visitor";
    if (intentParam === "creator" || intentParam === "visitor") return intentParam;
    try {
      const v = sessionStorage.getItem("deseox.intent");
      if (v === "creator" || v === "visitor") return v;
    } catch {}
    return "visitor";
  }, [intentParam, location.pathname]);

  useEffect(() => {
    if (
      location.pathname.endsWith("/registro/creadora") ||
      location.pathname.endsWith("/registro/visitante") ||
      intentParam === "creator" ||
      intentParam === "visitor"
    ) {
      setMode("signup");
    }
  }, [intentParam, location.pathname]);

  useEffect(() => {
    setErrors({});
  }, [mode]);

  const age = useMemo(() => calculateAge(birthDate), [birthDate]);
  const ageValid = birthDate !== "" && age >= 18;
  const ageError = birthDate !== "" && age < 18;

  const maxDob = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear() - 18, d.getMonth(), d.getDate())
      .toISOString()
      .slice(0, 10);
  }, []);

  const pwdStrength = useMemo(() => {
    const checks = {
      length: passwordRules.length(password),
      upper: passwordRules.upper(password),
      lower: passwordRules.lower(password),
      number: passwordRules.number(password),
    };
    const score = Object.values(checks).filter(Boolean).length;
    return { checks, score };
  }, [password]);

  useEffect(() => {
    document.title =
      mode === "login"
        ? "Iniciar sesión · DeseoX"
        : mode === "signup"
          ? "Crear cuenta · DeseoX"
          : "Recuperar contraseña · DeseoX";
  }, [mode]);

  useEffect(() => {
    if (user) {
      navigate(safeRedirect ?? "/cuenta", { replace: true });
    }
  }, [user, navigate, mode, safeRedirect]);

  const openAccountSelector = () => {
    navigate(safeRedirect ? `/registro?redirect=${encodeURIComponent(safeRedirect)}` : "/registro");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      if (mode === "signup") {
        const result = signupSchema.safeParse({
          email: normalizedEmail,
          password,
          confirmPassword,
          birthDate,
          acceptedTerms,
          acceptedPrivacy,
        });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of result.error.issues) {
            const key = String(issue.path[0] ?? "form");
            if (!fieldErrors[key]) fieldErrors[key] = issue.message;
          }
          setErrors(fieldErrors);
          throw new Error(Object.values(fieldErrors)[0] ?? "Datos inválidos");
        }

        const redirectPath = safeRedirect ?? (intent === "creator" ? "/verificacion" : "/cuenta");
        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectPath}`,
            data: {
              birth_date: birthDate,
              account_type: intent,
              privacy_accepted_at: new Date().toISOString(),
              terms_accepted_at: new Date().toISOString(),
            },
          },
        });
        if (error) throw error;

        sessionStorage.removeItem("deseox.pendingSignup");
        sessionStorage.setItem("deseox.intent", intent);

        toast({
          title: "Registro exitoso",
          description:
            "Tu cuenta fue creada y ya puedes iniciar sesión sin verificar el correo.",
        });

        setPassword("");
        setConfirmPassword("");
        setBirthDate("");
        setAcceptedTerms(false);
        setAcceptedPrivacy(false);
        setMode("login");
      } else if (mode === "login") {
        const result = loginSchema.safeParse({ email: normalizedEmail, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of result.error.issues) {
            const key = String(issue.path[0] ?? "form");
            if (!fieldErrors[key]) fieldErrors[key] = issue.message;
          }
          setErrors(fieldErrors);
          throw new Error(Object.values(fieldErrors)[0] ?? "Datos inválidos");
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        toast({ title: "Bienvenido de nuevo" });
        navigate(safeRedirect ?? "/cuenta", { replace: true });
      } else if (mode === "forgot") {
        const result = forgotSchema.safeParse({ email: normalizedEmail });
        if (!result.success) {
          setErrors({ email: result.error.issues[0]?.message ?? "Email inválido" });
          throw new Error("Email inválido");
        }
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: "Email enviado",
          description: "Si la cuenta existe, recibirás un enlace para restablecer la contraseña.",
        });
        setMode("login");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: mapAuthError(err?.message),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signupBlocked =
    mode === "signup" &&
    (!ageValid ||
      pwdStrength.score < 4 ||
      password !== confirmPassword ||
      !acceptedTerms ||
      !acceptedPrivacy);

  const submitDisabled = loading || signupBlocked;

  const strengthLabel =
    pwdStrength.score <= 1
      ? "Muy débil"
      : pwdStrength.score === 2
        ? "Débil"
        : pwdStrength.score === 3
          ? "Buena"
          : "Fuerte";

  const strengthColor =
    pwdStrength.score <= 1
      ? "bg-destructive"
      : pwdStrength.score === 2
        ? "bg-amber-500"
        : pwdStrength.score === 3
          ? "bg-yellow-500"
          : "bg-emerald-500";

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
                  ? `Cuenta de ${intent === "creator" ? "creadora" : "visitante"} · acceso inmediato después del registro.`
                  : "Te enviaremos un enlace para restablecerla."}
            </p>

            {mode === "signup" && (
              <div className="mt-4 rounded-2xl border border-border/60 bg-background/40 p-3">
                <p className="text-xs text-muted-foreground">
                  ¿Quieres registrarte con otro tipo de cuenta?{" "}
                  <button
                    type="button"
                    onClick={openAccountSelector}
                    className="font-semibold text-accent hover:underline"
                  >
                    Cambiar tipo de cuenta
                  </button>
                </p>
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    inputMode="email"
                    autoComplete="email"
                    maxLength={255}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="bg-background/60 pl-10"
                  />
                </div>
                {errors.email && (
                  <p id="email-error" role="alert" className="text-xs text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>

              {mode !== "forgot" && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={mode === "signup" ? 8 : 1}
                      maxLength={72}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "signup" ? "Mínimo 8 caracteres" : "Tu contraseña"}
                      className="bg-background/60 pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" role="alert" className="text-xs text-destructive">
                      {errors.password}
                    </p>
                  )}

                  {mode === "signup" && password.length > 0 && (
                    <div className="mt-2 space-y-2" aria-live="polite">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full transition-all ${strengthColor}`}
                            style={{ width: `${(pwdStrength.score / 4) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground w-16 text-right">
                          {strengthLabel}
                        </span>
                      </div>
                      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {[
                          { ok: pwdStrength.checks.length, label: "8+ caracteres" },
                          { ok: pwdStrength.checks.upper, label: "Una mayúscula" },
                          { ok: pwdStrength.checks.lower, label: "Una minúscula" },
                          { ok: pwdStrength.checks.number, label: "Un número" },
                        ].map((r) => (
                          <li
                            key={r.label}
                            className={`inline-flex items-center gap-1 ${r.ok ? "text-emerald-500" : ""}`}
                          >
                            {r.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {r.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                        type={showConfirm ? "text" : "password"}
                        required
                        minLength={8}
                        maxLength={72}
                        autoComplete="new-password"
                        aria-invalid={!!errors.confirmPassword}
                        aria-describedby={
                          errors.confirmPassword ? "confirm-error" : undefined
                        }
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                        className="bg-background/60 pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        aria-label={
                          showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-xs text-destructive inline-flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Las contraseñas no coinciden
                      </p>
                    )}
                    {errors.confirmPassword && (
                      <p id="confirm-error" role="alert" className="text-xs text-destructive">
                        {errors.confirmPassword}
                      </p>
                    )}
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
                        min="1925-01-01"
                        aria-invalid={!!errors.birthDate || ageError}
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

                  <div className="space-y-2 rounded-xl border border-border/60 bg-background/40 p-3">
                    <label
                      htmlFor="acceptTerms"
                      className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
                    >
                      <input
                        id="acceptTerms"
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border accent-[hsl(var(--accent))] cursor-pointer"
                        required
                      />
                      <span>
                        He leído y acepto los{" "}
                        <Link
                          to="/legal/terminos"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent font-semibold hover:underline"
                        >
                          Términos y Condiciones
                        </Link>
                        .
                      </span>
                    </label>

                    <label
                      htmlFor="acceptPrivacy"
                      className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
                    >
                      <input
                        id="acceptPrivacy"
                        type="checkbox"
                        checked={acceptedPrivacy}
                        onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border accent-[hsl(var(--accent))] cursor-pointer"
                        required
                      />
                      <span>
                        Autorizo el tratamiento de mis datos conforme a la{" "}
                        <Link
                          to="/legal/privacidad"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent font-semibold hover:underline"
                        >
                          Política de Privacidad
                        </Link>{" "}
                        (Ley 1581/2012).
                      </span>
                    </label>
                    {(errors.acceptedTerms || errors.acceptedPrivacy) && (
                      <p role="alert" className="text-xs text-destructive">
                        {errors.acceptedTerms || errors.acceptedPrivacy}
                      </p>
                    )}
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
                      ? "Registrarme"
                      : "Enviar enlace"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>

              {mode === "signup" && (
                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  Tus datos se almacenan cifrados y solo se usan para operar la plataforma.
                  Nunca los vendemos a terceros.
                </p>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" && (
                <>
                  ¿Aún no tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={openAccountSelector}
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
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-accent font-semibold hover:underline"
                  >
                    Iniciar sesión
                  </button>
                </>
              )}
              {mode === "forgot" && (
                <button
                  type="button"
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
