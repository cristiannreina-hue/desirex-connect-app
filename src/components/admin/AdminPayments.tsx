import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  user_id: string;
  tier: string;
  amount_cents: number;
  currency: string;
  status: string;
  reference: string;
  created_at: string;
  paid_at: string | null;
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export const AdminPayments = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setRows((data as any) ?? []);
        setLoading(false);
      });
  }, []);

  const totals = rows
    .filter((r) => r.status === "APPROVED")
    .reduce((acc, r) => acc + r.amount_cents, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Total cobrado" value={formatCOP(totals / 100)} />
        <Stat label="Aprobados" value={String(rows.filter((r) => r.status === "APPROVED").length)} />
        <Stat label="Pendientes" value={String(rows.filter((r) => r.status === "PENDING").length)} />
      </div>

      <div className="card-glass rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <CreditCard className="h-6 w-6 mx-auto mb-2 opacity-50" />
            Aún no hay pagos registrados.
            <p className="mt-2 text-xs">Wompi se activará cuando configures las credenciales.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((r) => (
              <li key={r.id} className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[180px]">
                  <p className="font-mono text-xs">{r.reference}</p>
                  <p className="text-xs text-muted-foreground">
                    Plan {r.tier.toUpperCase()} · {new Date(r.created_at).toLocaleString("es-CO")}
                  </p>
                </div>
                <p className="font-display font-bold">{formatCOP(r.amount_cents / 100)}</p>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold",
                    r.status === "APPROVED" && "bg-success/20 text-success",
                    r.status === "PENDING" && "bg-warning/20 text-warning",
                    r.status === "DECLINED" && "bg-destructive/20 text-destructive",
                  )}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="card-glass rounded-2xl p-4">
    <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-xl font-extrabold">{value}</p>
  </div>
);
