import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, LayoutDashboard, BadgeCheck, Users, Crown, CreditCard,
  Trophy, Settings, UserCog, TrendingUp, MessageSquare, Mail, Inbox, Webhook,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminMetrics } from "@/components/admin/AdminMetrics";
import { AdminProfiles } from "@/components/admin/AdminProfiles";
import { AdminVerifications } from "@/components/admin/AdminVerifications";
import { AdminSubscriptions } from "@/components/admin/AdminSubscriptions";
import { AdminPayments } from "@/components/admin/AdminPayments";
import { AdminRewards } from "@/components/admin/AdminRewards";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { AdminRecentSignups } from "@/components/admin/AdminRecentSignups";
import { AdminTraffic } from "@/components/admin/AdminTraffic";
import { AdminReviews } from "@/components/admin/AdminReviews";
import { AdminLeads } from "@/components/admin/AdminLeads";
import { AdminEmails } from "@/components/admin/AdminEmails";
import { AdminWompiEvents } from "@/components/admin/AdminWompiEvents";

type Section =
  | "overview" | "traffic" | "verifications" | "profiles" | "users-clients"
  | "users-creators" | "reviews" | "subscriptions" | "payments" | "wompi"
  | "rewards" | "leads" | "emails" | "settings";

const NAV: { group: string; items: { id: Section; label: string; icon: any }[] }[] = [
  {
    group: "Vista general",
    items: [
      { id: "overview", label: "Resumen general", icon: LayoutDashboard },
      { id: "traffic", label: "Tráfico del sitio", icon: TrendingUp },
      { id: "verifications", label: "Validaciones pendientes", icon: BadgeCheck },
    ],
  },
  {
    group: "Gestión",
    items: [
      { id: "profiles", label: "Perfiles", icon: UserCog },
      { id: "users-creators", label: "Creadores", icon: Crown },
      { id: "users-clients", label: "Clientes", icon: Users },
      { id: "reviews", label: "Moderar reseñas", icon: MessageSquare },
    ],
  },
  {
    group: "Finanzas",
    items: [
      { id: "subscriptions", label: "Suscripciones", icon: Crown },
      { id: "payments", label: "Pagos", icon: CreditCard },
      { id: "wompi", label: "Eventos de pago", icon: Webhook },
      { id: "rewards", label: "Top semanal", icon: Trophy },
    ],
  },
  {
    group: "Marketing",
    items: [
      { id: "leads", label: "Leads de lanzamiento", icon: Inbox },
      { id: "emails", label: "Emails enviados", icon: Mail },
    ],
  },
  {
    group: "Sistema",
    items: [
      { id: "settings", label: "Configuración global", icon: Settings },
    ],
  },
];

const TITLES: Record<Section, { title: string; subtitle: string }> = {
  overview: { title: "Resumen general", subtitle: "Métricas en tiempo real de la plataforma" },
  traffic: { title: "Tráfico del sitio", subtitle: "Cuántas personas entran a la página" },
  verifications: { title: "Validaciones pendientes", subtitle: "Compara las selfies KYC y aprueba creadores" },
  profiles: { title: "Gestión de perfiles", subtitle: "Filtra, destaca, suspende o elimina perfiles" },
  "users-clients": { title: "Clientes", subtitle: "Usuarios registrados como exploradores" },
  "users-creators": { title: "Creadores", subtitle: "Usuarios que publican contenido" },
  reviews: { title: "Moderar reseñas", subtitle: "Revisa y elimina reseñas inapropiadas" },
  subscriptions: { title: "Suscripciones", subtitle: "Estado de planes activos" },
  payments: { title: "Pagos", subtitle: "Historial de transacciones" },
  wompi: { title: "Eventos de pago", subtitle: "Webhooks recibidos del proveedor (Wompi)" },
  rewards: { title: "Top semanal", subtitle: "Premios automáticos a perfiles destacados" },
  leads: { title: "Leads de lanzamiento", subtitle: "Lista de espera capturada antes del lanzamiento" },
  emails: { title: "Emails enviados", subtitle: "Registro de envíos transaccionales y direcciones suprimidas" },
  settings: { title: "Configuración global", subtitle: "Idiomas, SEO y mantenimiento" },
};

const Admin = () => {
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("overview");

  useEffect(() => { document.title = "Panel CEO · DeseoX"; }, []);
  useEffect(() => {
    if (!loading && !isAdmin) navigate("/", { replace: true });
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando…</div>;
  }
  if (!isAdmin) return null;

  const meta = TITLES[section];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SidebarProvider>
        <div className="flex-1 flex w-full">
          <Sidebar collapsible="icon">
            <SidebarContent>
              <div className="p-4 flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow-soft">
                  <Shield className="h-4 w-4" />
                </span>
                <div className="group-data-[collapsible=icon]:hidden">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Panel CEO</p>
                  <p className="font-display font-bold text-sm leading-none">DeseoX</p>
                </div>
              </div>

              {NAV.map((g) => (
                <SidebarGroup key={g.group}>
                  <SidebarGroupLabel>{g.group}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {g.items.map((it) => {
                        const Icon = it.icon;
                        const active = section === it.id;
                        return (
                          <SidebarMenuItem key={it.id}>
                            <SidebarMenuButton
                              isActive={active}
                              onClick={() => setSection(it.id)}
                              className="gap-2"
                            >
                              <Icon className="h-4 w-4" />
                              <span>{it.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 min-w-0">
            <div className="border-b border-border/60 bg-background/60 backdrop-blur sticky top-0 z-20">
              <div className="flex items-center gap-3 px-4 sm:px-6 h-14">
                <SidebarTrigger />
                <div className="flex-1 min-w-0">
                  <h1 className="font-display text-lg font-extrabold tracking-tight truncate">{meta.title}</h1>
                  <p className="text-xs text-muted-foreground truncate">{meta.subtitle}</p>
                </div>
                <AdminNotifications />
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {section === "overview" && (
                <>
                  <AdminMetrics />
                  <AdminRecentSignups />
                  <div className="grid lg:grid-cols-2 gap-4">
                    <div className="card-glass rounded-2xl p-5">
                      <h3 className="font-display font-bold mb-3 flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-amber-400" /> Verificaciones recientes
                      </h3>
                      <AdminVerifications />
                    </div>
                    <div className="card-glass rounded-2xl p-5">
                      <h3 className="font-display font-bold mb-3 flex items-center gap-2">
                        <Crown className="h-4 w-4 text-primary" /> Suscripciones
                      </h3>
                      <AdminSubscriptions />
                    </div>
                  </div>
                </>
              )}
              {section === "traffic" && <AdminTraffic />}
              {section === "verifications" && <AdminVerifications />}
              {section === "profiles" && <AdminProfiles />}
              {section === "users-clients" && <AdminUsers filter="visitor" />}
              {section === "users-creators" && <AdminUsers filter="creator" />}
              {section === "reviews" && <AdminReviews />}
              {section === "subscriptions" && <AdminSubscriptions />}
              {section === "payments" && <AdminPayments />}
              {section === "wompi" && <AdminWompiEvents />}
              {section === "rewards" && <AdminRewards />}
              {section === "leads" && <AdminLeads />}
              {section === "emails" && <AdminEmails />}
              {section === "settings" && <AdminSettings />}
            </div>
          </main>
        </div>
      </SidebarProvider>
      <Footer />
    </div>
  );
};

export default Admin;
