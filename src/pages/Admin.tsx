import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, BadgeCheck, CreditCard, Trophy, Crown } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AdminProfiles } from "@/components/admin/AdminProfiles";
import { AdminVerifications } from "@/components/admin/AdminVerifications";
import { AdminSubscriptions } from "@/components/admin/AdminSubscriptions";
import { AdminPayments } from "@/components/admin/AdminPayments";
import { AdminRewards } from "@/components/admin/AdminRewards";

const Admin = () => {
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState("profiles");

  useEffect(() => {
    document.title = "Panel Admin · DeseoX";
  }, []);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/", { replace: true });
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Cargando…
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-10 space-y-6">
        <div className="card-premium rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow-soft">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Acceso restringido</p>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                Panel de administración
              </h1>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto p-1 rounded-full bg-secondary/40">
            <TabsTrigger value="profiles" className="gap-1.5 rounded-full">
              <Users className="h-3.5 w-3.5" /> Perfiles
            </TabsTrigger>
            <TabsTrigger value="verifications" className="gap-1.5 rounded-full">
              <BadgeCheck className="h-3.5 w-3.5" /> Verif.
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1.5 rounded-full">
              <Crown className="h-3.5 w-3.5" /> Planes
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5 rounded-full">
              <CreditCard className="h-3.5 w-3.5" /> Pagos
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-1.5 rounded-full">
              <Trophy className="h-3.5 w-3.5" /> Top
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles"><AdminProfiles /></TabsContent>
          <TabsContent value="verifications"><AdminVerifications /></TabsContent>
          <TabsContent value="subscriptions"><AdminSubscriptions /></TabsContent>
          <TabsContent value="payments"><AdminPayments /></TabsContent>
          <TabsContent value="rewards"><AdminRewards /></TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
