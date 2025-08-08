export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      allowed_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string
          contact_email: string
          created_at: string
          date: string
          description: string
          id: string
          image_url: string | null
          is_sold_out: boolean
          location: string
          management_email: string
          management_token: string
          organizer: string
          price: number | null
          time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          contact_email: string
          created_at?: string
          date: string
          description: string
          id?: string
          image_url?: string | null
          is_sold_out?: boolean
          location: string
          management_email: string
          management_token: string
          organizer: string
          price?: number | null
          time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          contact_email?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          image_url?: string | null
          is_sold_out?: boolean
          location?: string
          management_email?: string
          management_token?: string
          organizer?: string
          price?: number | null
          time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_cards: {
        Row: {
          card_type: Database["public"]["Enums"]["loyalty_card_type"]
          created_at: string
          id: string
          is_complete: boolean
          punches_count: number
          punches_required: number
          rewards_count: number
          rewards_required: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_type?: Database["public"]["Enums"]["loyalty_card_type"]
          created_at?: string
          id?: string
          is_complete?: boolean
          punches_count?: number
          punches_required?: number
          rewards_count?: number
          rewards_required?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_type?: Database["public"]["Enums"]["loyalty_card_type"]
          created_at?: string
          id?: string
          is_complete?: boolean
          punches_count?: number
          punches_required?: number
          rewards_count?: number
          rewards_required?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_entries: {
        Row: {
          card_id: string
          created_at: string
          id: string
          image_url: string
          index: number
          kind: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          image_url: string
          index: number
          kind: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          image_url?: string
          index?: number
          kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_entries_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_words: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          word?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          consent_given: boolean
          consent_timestamp: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string | null
          preferences: Json | null
          subscription_date: string
          unsubscribe_token: string
          updated_at: string
        }
        Insert: {
          consent_given?: boolean
          consent_timestamp?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          preferences?: Json | null
          subscription_date?: string
          unsubscribe_token?: string
          updated_at?: string
        }
        Update: {
          consent_given?: boolean
          consent_timestamp?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          preferences?: Json | null
          subscription_date?: string
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_email_domain_allowed: {
        Args: { email: string }
        Returns: boolean
      }
      verify_event_management_token: {
        Args: { token_input: string; event_id_input: string }
        Returns: boolean
      }
    }
    Enums: {
      loyalty_card_type: "regular" | "lucky7"
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
      loyalty_card_type: ["regular", "lucky7"],
    },
  },
} as const
