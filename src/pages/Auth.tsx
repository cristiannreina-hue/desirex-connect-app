import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "signup" | "forgot";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/cuenta` },
        });
        if (error) throw error;

        // Auto-login: si auto-confirm está activo, signUp ya devuelve sesión.
        // Por seguridad, intentamos signIn explícito por si acaso.
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError && !signInError.message.toLowerCase().includes("already")) {
          // Si requiere confirmación de email, avisamos.
          toast({
            title: "Revisa tu email",
            description: "Confirma tu cuenta para iniciar sesión.",
          });
          return;
        }

        toast({ title: "¡Bienvenido a DeseoX!", description: "Tu cuenta fue creada." });
        navigate("/cuenta", { replace: true });
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
                  ? "Solo email y contraseña. El perfil lo creas después."
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
                disabled={loading}
              >
                {loading
                  ? "Procesando…"
                  : mode === "login"
                    ? "Iniciar sesión"
                    : mode === "signup"
                      ? "Crear cuenta"
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
