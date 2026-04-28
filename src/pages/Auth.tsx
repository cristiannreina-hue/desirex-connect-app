import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, Sparkles, ShieldCheck, ArrowRight, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
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
  const [loading, setLoading] = useState(false);

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
    return new Date(d.getFullYear() - 18, d.getMonth(), d.getDate()).toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    document.title =
      mode === "login"
        ? "Iniciar sesión · DeseoX"
        : mode === "signup"
          ? "Crear cuenta · DeseoX"
          : "Recuperar contraseña · DeseoX";
  }, [mode]);

  useEffect(() => {
    if (user) navigate("/cuenta", { replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
        if (password !== confirmPassword) throw new Error("Las contraseñas no coinciden");
        if (!birthDate) throw new Error("La fecha de nacimiento es obligatoria");
        if (age < 18) throw new Error("Debes ser mayor de 18 años para acceder a esta plataforma");

        // Enviar OTP de 6 dígitos al correo. shouldCreateUser=true crea el usuario al verificar.
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            data: { birth_date: birthDate, account_type: intent },
          },
        });
        if (error) throw error;

        // Guardamos los datos del registro temporalmente para usarlos tras la verificación
        try {
          sessionStorage.setItem(
            "deseox.pendingSignup",
            JSON.stringify({ email, password, birthDate, age, intent }),
          );
        } catch {}

        toast({
          title: "Código enviado",
          description: "Revisa tu correo y escribe el código de 6 dígitos.",
        });
        navigate("/verificar", { replace: true });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Bienvenido de nuevo" });
        navigate("/cuenta", { replace: true });
      } else {
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
    (mode === "signup" && (!ageValid || password.length < 6 || password !== confirmPassword));

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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
