export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          reference: string
          status: Database["public"]["Enums"]["payment_status"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
          wompi_payment_method: string | null
          wompi_transaction_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          reference: string
          status?: Database["public"]["Enums"]["payment_status"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
          wompi_payment_method?: string | null
          wompi_transaction_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
          wompi_payment_method?: string | null
          wompi_transaction_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          age: number | null
          birth_date: string | null
          birth_place: string | null
          category: string | null
          city: string | null
          created_at: string
          department: string | null
          description: string | null
          display_name: string | null
          exclusive_photos: string[]
          exclusive_videos: string[]
          gender: Database["public"]["Enums"]["gender_category"]
          hair_color: string | null
          height: number | null
          id: string
          is_featured: boolean
          is_suspended: boolean
          is_verified: boolean
          last_active_at: string
          measurements: string | null
          nickname: string | null
          photos: string[] | null
          preferred_language: string
          public_photos: string[]
          rate_full_day: number | null
          rate_one_hour: number | null
          rate_short: number | null
          rate_two_hours: number | null
          rating_avg: number
          rating_count: number
          service_type: string | null
          services: string[] | null
          telegram: string | null
          updated_at: string
          user_number: number
          verification_id_url: string | null
          verification_selfie_face_url: string | null
          verification_selfie_id_url: string | null
          verification_selfie_url: string | null
          verification_status: string
          verification_submitted_at: string | null
          view_count: number
          weight: number | null
          whatsapp: string | null
          work_zone: string | null
        }
        Insert: {
          account_type?: string
          age?: number | null
          birth_date?: string | null
          birth_place?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          display_name?: string | null
          exclusive_photos?: string[]
          exclusive_videos?: string[]
          gender?: Database["public"]["Enums"]["gender_category"]
          hair_color?: string | null
          height?: number | null
          id: string
          is_featured?: boolean
          is_suspended?: boolean
          is_verified?: boolean
          last_active_at?: string
          measurements?: string | null
          nickname?: string | null
          photos?: string[] | null
          preferred_language?: string
          public_photos?: string[]
          rate_full_day?: number | null
          rate_one_hour?: number | null
          rate_short?: number | null
          rate_two_hours?: number | null
          rating_avg?: number
          rating_count?: number
          service_type?: string | null
          services?: string[] | null
          telegram?: string | null
          updated_at?: string
          user_number?: number
          verification_id_url?: string | null
          verification_selfie_face_url?: string | null
          verification_selfie_id_url?: string | null
          verification_selfie_url?: string | null
          verification_status?: string
          verification_submitted_at?: string | null
          view_count?: number
          weight?: number | null
          whatsapp?: string | null
          work_zone?: string | null
        }
        Update: {
          account_type?: string
          age?: number | null
          birth_date?: string | null
          birth_place?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          display_name?: string | null
          exclusive_photos?: string[]
          exclusive_videos?: string[]
          gender?: Database["public"]["Enums"]["gender_category"]
          hair_color?: string | null
          height?: number | null
          id?: string
          is_featured?: boolean
          is_suspended?: boolean
          is_verified?: boolean
          last_active_at?: string
          measurements?: string | null
          nickname?: string | null
          photos?: string[] | null
          preferred_language?: string
          public_photos?: string[]
          rate_full_day?: number | null
          rate_one_hour?: number | null
          rate_short?: number | null
          rate_two_hours?: number | null
          rating_avg?: number
          rating_count?: number
          service_type?: string | null
          services?: string[] | null
          telegram?: string | null
          updated_at?: string
          user_number?: number
          verification_id_url?: string | null
          verification_selfie_face_url?: string | null
          verification_selfie_id_url?: string | null
          verification_selfie_url?: string | null
          verification_status?: string
          verification_submitted_at?: string | null
          view_count?: number
          weight?: number | null
          whatsapp?: string | null
          work_zone?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_id: string
          comment: string | null
          created_at: string
          id: string
          profile_id: string
          stars: number
          updated_at: string
        }
        Insert: {
          author_id: string
          comment?: string | null
          created_at?: string
          id?: string
          profile_id: string
          stars: number
          updated_at?: string
        }
        Update: {
          author_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          stars?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          created_at: string
          id: string
          photo_url_id: string
          photo_url_selfie: string
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url_id: string
          photo_url_selfie: string
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_url_id?: string
          photo_url_selfie?: string
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_rewards: {
        Row: {
          bonus_month: boolean
          created_at: string
          days_awarded: number
          id: string
          position: number
          user_id: string
          week_start: string
        }
        Insert: {
          bonus_month?: boolean
          created_at?: string
          days_awarded: number
          id?: string
          position: number
          user_id: string
          week_start: string
        }
        Update: {
          bonus_month?: boolean
          created_at?: string
          days_awarded?: number
          id?: string
          position?: number
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      wompi_events: {
        Row: {
          created_at: string
          error: string | null
          event_id: string | null
          event_type: string | null
          id: string
          processed: boolean
          raw: Json
          reference: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_id?: string | null
          event_type?: string | null
          id?: string
          processed?: boolean
          raw: Json
          reference?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_id?: string | null
          event_type?: string | null
          id?: string
          processed?: boolean
          raw?: Json
          reference?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_verification_and_purge: {
        Args: { _user_id: string }
        Returns: undefined
      }
      approve_verification_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      award_weekly_top: { Args: never; Returns: undefined }
      extend_subscription: {
        Args: {
          _days: number
          _tier: Database["public"]["Enums"]["subscription_tier"]
          _user_id: string
        }
        Returns: undefined
      }
      get_active_subscription: {
        Args: { _user_id: string }
        Returns: {
          expires_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["subscription_tier"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_pending_verifications: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          id: string
          photo_url_id: string
          photo_url_selfie: string
          status: string
          user_id: string
          user_number: number
        }[]
      }
      reject_verification: {
        Args: { _reason?: string; _user_id: string }
        Returns: undefined
      }
      reject_verification_request: {
        Args: { _reason?: string; _request_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "provider" | "viewer"
      gender_category: "mujeres" | "hombres" | "trans"
      payment_status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR"
      subscription_status: "trial" | "active" | "expired" | "cancelled"
      subscription_tier: "starter" | "boost" | "elite" | "vip"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "provider", "viewer"],
      gender_category: ["mujeres", "hombres", "trans"],
      payment_status: ["PENDING", "APPROVED", "DECLINED", "VOIDED", "ERROR"],
      subscription_status: ["trial", "active", "expired", "cancelled"],
      subscription_tier: ["starter", "boost", "elite", "vip"],
    },
  },
} as const
