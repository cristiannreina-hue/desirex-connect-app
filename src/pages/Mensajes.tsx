import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface ProfileLite {
  id: string;
  display_name: string | null;
  user_number: number;
  photos: string[] | null;
}

interface Conversation {
  partnerId: string;
  partner?: ProfileLite;
  lastMessage: MessageRow;
  unread: number;
}

const Mensajes = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    document.title = "Mensajes · DeseoX";
    supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setMessages((data ?? []) as MessageRow[]));

    const channel = supabase
      .channel("mensajes-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(200)
          .then(({ data }) => setMessages((data ?? []) as MessageRow[]));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Agrupar por conversación
  const conversations = useMemo<Conversation[]>(() => {
    if (!user) return [];
    const map = new Map<string, Conversation>();
    for (const m of messages) {
      const partnerId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      if (!map.has(partnerId)) {
        map.set(partnerId, { partnerId, lastMessage: m, unread: 0 });
      }
      const conv = map.get(partnerId)!;
      if (m.recipient_id === user.id && !m.read_at) conv.unread += 1;
    }
    return Array.from(map.values());
  }, [messages, user]);

  // Cargar info de los partners
  useEffect(() => {
    const ids = conversations.map((c) => c.partnerId).filter((id) => !profiles[id]);
    if (!ids.length) return;
    supabase
      .from("profiles")
      .select("id, display_name, user_number, photos")
      .in("id", ids)
      .then(({ data }) => {
        const next = { ...profiles };
        for (const p of data ?? []) next[p.id] = p as ProfileLite;
        setProfiles(next);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  return (
    <div className="min-h-screen flex flex-col pb-bottom-nav">
      <Header />
      <main className="container flex-1 py-8 max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold mb-6">Mensajes</h1>

        {conversations.length === 0 ? (
          <div className="card-glass rounded-3xl p-12 text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="font-display text-xl font-bold">Aún no tienes mensajes</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Explora perfiles y empieza una conversación.
            </p>
            <Button asChild variant="hero" className="mt-5 rounded-full">
              <Link to="/">Explorar perfiles</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {conversations.map((c) => {
              const p = profiles[c.partnerId];
              const photo = p?.photos?.[0];
              const isMine = c.lastMessage.sender_id === user?.id;
              return (
                <li key={c.partnerId}>
                  <Link
                    to={p?.user_number ? `/perfil/${p.user_number}` : "#"}
                    className="flex items-center gap-3 rounded-2xl bg-card hover:bg-secondary/60 ring-1 ring-border/60 p-3 transition-colors"
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt={p?.display_name ?? ""}
                        className="h-12 w-12 rounded-full object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-bold truncate">
                          {p?.display_name ?? "Usuario"}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {new Date(c.lastMessage.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {isMine && "Tú: "}
                        {c.lastMessage.content}
                      </p>
                    </div>
                    {c.unread > 0 && (
                      <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-[11px] font-bold px-1.5">
                        {c.unread}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Mensajes;
