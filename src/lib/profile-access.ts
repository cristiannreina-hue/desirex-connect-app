import { supabase } from "@/integrations/supabase/client";

export type AccountType = "visitor" | "creator" | null;

export const normalizeAccountType = (value?: string | null): AccountType => {
  if (value === "creator") return "creator";
  if (value === "visitor") return "visitor";
  return null;
};

export const fetchProfileAccountType = async (userId: string): Promise<AccountType> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return normalizeAccountType(data?.account_type);
};