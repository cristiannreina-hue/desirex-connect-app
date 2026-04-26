import { NavLink } from "react-router-dom";
import { Home, Compass, Crown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/explorar", label: "Explorar", icon: Compass, end: false },
  { to: "/planes", label: "Planes", icon: Crown, end: false },
  { to: "/cuenta", label: "Perfil", icon: User, end: false, requiresAuth: true },
];

export const BottomNav = () => {
  const { user } = useAuth();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border/70 bg-background/85 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación inferior"
    >
      <ul className="grid grid-cols-4">
        {items.map(({ to, label, icon: Icon, end, requiresAuth }) => {
          const target = requiresAuth && !user ? "/auth" : to;
          return (
            <li key={to}>
              <NavLink
                to={target}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    isActive ? "text-accent" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
