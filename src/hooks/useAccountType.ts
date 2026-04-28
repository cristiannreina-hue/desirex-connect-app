import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchProfileAccountType,
  normalizeAccountType,
  type AccountType,
} from "@/lib/profile-access";

export const useAccountType = (userId?: string) => {
  const { pathname } = useLocation();
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    let active = true;

    if (!userId) {
      setAccountType(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    fetchProfileAccountType(userId)
      .then((nextAccountType) => {
        if (!active) return;
        setAccountType(nextAccountType);
      })
      .catch(() => {
        if (!active) return;
        setAccountType(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pathname, userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`profile-account-type-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setAccountType(null);
          } else {
            setAccountType(
              normalizeAccountType((payload.new as { account_type?: string | null })?.account_type),
            );
          }
          setLoading(false);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { accountType, loading };
};