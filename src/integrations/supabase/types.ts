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
      api_rate_limiter: {
        Row: {
          hits: number
          key: string
          window_starts_at: string
        }
        Insert: {
          hits?: number
          key: string
          window_starts_at?: string
        }
        Update: {
          hits?: number
          key?: string
          window_starts_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_ts: string
          event_id: string | null
          existing_rank: number | null
          hold_type: Database["public"]["Enums"]["hold_type"] | null
          id: string
          lead_id: string | null
          setup_min: number | null
          space_id: string
          start_ts: string
          status: string
          teardown_min: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_ts: string
          event_id?: string | null
          existing_rank?: number | null
          hold_type?: Database["public"]["Enums"]["hold_type"] | null
          id?: string
          lead_id?: string | null
          setup_min?: number | null
          space_id: string
          start_ts: string
          status?: string
          teardown_min?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_ts?: string
          event_id?: string | null
          existing_rank?: number | null
          hold_type?: Database["public"]["Enums"]["hold_type"] | null
          id?: string
          lead_id?: string | null
          setup_min?: number | null
          space_id?: string
          start_ts?: string
          status?: string
          teardown_min?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_lead_possible_duplicates"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_lead_possible_duplicates"
            referencedColumns: ["possible_duplicate_id"]
          },
          {
            foreignKeyName: "bookings_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_analytics: {
        Row: {
          campaign_id: string
          created_at: string
          event_timestamp: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          event_timestamp?: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          event_timestamp?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_segments: {
        Row: {
          avg_spend: number | null
          created_at: string
          created_by: string
          description: string | null
          filters: Json
          id: string
          is_active: boolean
          member_count: number | null
          name: string
          updated_at: string
        }
        Insert: {
          avg_spend?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          filters?: Json
          id?: string
          is_active?: boolean
          member_count?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          avg_spend?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          filters?: Json
          id?: string
          is_active?: boolean
          member_count?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          archived: boolean
          clicked_count: number | null
          created_at: string
          created_by: string
          delivered_count: number | null
          estimated_reach: number | null
          id: string
          message: string
          opened_count: number | null
          personalize: boolean
          schedule_type: string
          scheduled_date: string | null
          scheduled_time: string | null
          segment_filters: Json | null
          segment_id: string | null
          sent_at: string | null
          sent_count: number | null
          status: string
          template_id: string | null
          test_mode: boolean
          title: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          clicked_count?: number | null
          created_at?: string
          created_by: string
          delivered_count?: number | null
          estimated_reach?: number | null
          id?: string
          message: string
          opened_count?: number | null
          personalize?: boolean
          schedule_type?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          segment_filters?: Json | null
          segment_id?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          template_id?: string | null
          test_mode?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          clicked_count?: number | null
          created_at?: string
          created_by?: string
          delivered_count?: number | null
          estimated_reach?: number | null
          id?: string
          message?: string
          opened_count?: number | null
          personalize?: boolean
          schedule_type?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          segment_filters?: Json | null
          segment_id?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          template_id?: string | null
          test_mode?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "campaign_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      cinema_bookings: {
        Row: {
          created_at: string
          email: string
          guest_name: string | null
          id: string
          primary_name: string
          quantity: number
          release_id: string
          ticket_numbers: number[]
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          guest_name?: string | null
          id?: string
          primary_name: string
          quantity: number
          release_id: string
          ticket_numbers: number[]
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          guest_name?: string | null
          id?: string
          primary_name?: string
          quantity?: number
          release_id?: string
          ticket_numbers?: number[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cinema_bookings_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "cinema_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      cinema_releases: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          doors_time: string
          id: string
          is_active: boolean
          month_key: string
          poster_url: string | null
          screening_date: string
          screening_time: string
          title: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          description?: string | null
          doors_time?: string
          id?: string
          is_active?: boolean
          month_key: string
          poster_url?: string | null
          screening_date: string
          screening_time?: string
          title?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          doors_time?: string
          id?: string
          is_active?: boolean
          month_key?: string
          poster_url?: string | null
          screening_date?: string
          screening_time?: string
          title?: string | null
        }
        Relationships: []
      }
      cms_brand_assets: {
        Row: {
          asset_key: string
          asset_type: string
          asset_value: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          published: boolean
          updated_at: string
        }
        Insert: {
          asset_key: string
          asset_type: string
          asset_value: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          published?: boolean
          updated_at?: string
        }
        Update: {
          asset_key?: string
          asset_type?: string
          asset_value?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          published?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      cms_content: {
        Row: {
          content_data: Json
          content_key: string
          content_type: Database["public"]["Enums"]["cms_content_type"]
          created_at: string
          created_by: string | null
          id: string
          page: string
          published: boolean
          section: string
          updated_at: string
          version: number
        }
        Insert: {
          content_data: Json
          content_key: string
          content_type?: Database["public"]["Enums"]["cms_content_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          page: string
          published?: boolean
          section: string
          updated_at?: string
          version?: number
        }
        Update: {
          content_data?: Json
          content_key?: string
          content_type?: Database["public"]["Enums"]["cms_content_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          page?: string
          published?: boolean
          section?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      cms_design_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          css_variable: string | null
          description: string | null
          id: string
          published: boolean
          token_key: string
          token_type: string
          token_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          css_variable?: string | null
          description?: string | null
          id?: string
          published?: boolean
          token_key: string
          token_type: string
          token_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          css_variable?: string | null
          description?: string | null
          id?: string
          published?: boolean
          token_key?: string
          token_type?: string
          token_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_faq_content: {
        Row: {
          answer: string
          created_at: string
          created_by: string | null
          id: string
          page: string
          published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          created_by?: string | null
          id?: string
          page: string
          published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          created_by?: string | null
          id?: string
          page?: string
          published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      cms_global_content: {
        Row: {
          content_data: Json | null
          content_key: string
          content_type: string
          content_value: string
          created_at: string
          created_by: string | null
          id: string
          published: boolean
          updated_at: string
        }
        Insert: {
          content_data?: Json | null
          content_key: string
          content_type: string
          content_value: string
          created_at?: string
          created_by?: string | null
          id?: string
          published?: boolean
          updated_at?: string
        }
        Update: {
          content_data?: Json | null
          content_key?: string
          content_type?: string
          content_value?: string
          created_at?: string
          created_by?: string | null
          id?: string
          published?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      cms_images: {
        Row: {
          alt_text: string | null
          asset_type: Database["public"]["Enums"]["cms_asset_type"]
          carousel_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string
          metadata: Json | null
          page: string | null
          published: boolean
          sort_order: number | null
          title: string | null
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          asset_type: Database["public"]["Enums"]["cms_asset_type"]
          carousel_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url: string
          metadata?: Json | null
          page?: string | null
          published?: boolean
          sort_order?: number | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          asset_type?: Database["public"]["Enums"]["cms_asset_type"]
          carousel_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string
          metadata?: Json | null
          page?: string | null
          published?: boolean
          sort_order?: number | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cms_menu_items: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_email: boolean
          is_link: boolean
          item_name: string
          link_url: string | null
          price: string | null
          published: boolean
          section_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_email?: boolean
          is_link?: boolean
          item_name: string
          link_url?: string | null
          price?: string | null
          published?: boolean
          section_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_email?: boolean
          is_link?: boolean
          item_name?: string
          link_url?: string | null
          price?: string | null
          published?: boolean
          section_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_menu_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "cms_menu_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_menu_sections: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          page: string
          published: boolean
          section_name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          page: string
          published?: boolean
          section_name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          page?: string
          published?: boolean
          section_name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      cms_modal_content: {
        Row: {
          content_data: Json | null
          content_key: string
          content_section: string
          content_value: string
          created_at: string
          created_by: string | null
          id: string
          modal_type: string
          published: boolean
          updated_at: string
        }
        Insert: {
          content_data?: Json | null
          content_key: string
          content_section: string
          content_value: string
          created_at?: string
          created_by?: string | null
          id?: string
          modal_type: string
          published?: boolean
          updated_at?: string
        }
        Update: {
          content_data?: Json | null
          content_key?: string
          content_section?: string
          content_value?: string
          created_at?: string
          created_by?: string | null
          id?: string
          modal_type?: string
          published?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      common_good_messages: {
        Row: {
          amount_cents: number
          currency: string
          id: string
          message: string
          posted_at: string
          stripe_session_id: string
        }
        Insert: {
          amount_cents: number
          currency?: string
          id?: string
          message: string
          posted_at?: string
          stripe_session_id: string
        }
        Update: {
          amount_cents?: number
          currency?: string
          id?: string
          message?: string
          posted_at?: string
          stripe_session_id?: string
        }
        Relationships: []
      }
      conflicts: {
        Row: {
          booking_id_1: string
          booking_id_2: string
          conflict_details: Json | null
          conflict_type: string
          created_at: string
          existing_rank: number | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_id_1: string
          booking_id_2: string
          conflict_details?: Json | null
          conflict_type?: string
          created_at?: string
          existing_rank?: number | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id_1?: string
          booking_id_2?: string
          conflict_details?: Json | null
          conflict_type?: string
          created_at?: string
          existing_rank?: number | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          content: string
          created_at: string | null
          event_id: string
          id: string
          is_immutable: boolean | null
          is_signed: boolean | null
          pdf_url: string | null
          signature_data: Json | null
          signed_at: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          event_id: string
          id?: string
          is_immutable?: boolean | null
          is_signed?: boolean | null
          pdf_url?: string | null
          signature_data?: Json | null
          signed_at?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          event_id?: string
          id?: string
          is_immutable?: boolean | null
          is_signed?: boolean | null
          pdf_url?: string | null
          signature_data?: Json | null
          signed_at?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_line_items: {
        Row: {
          created_at: string | null
          description: string
          event_id: string
          id: string
          per_person: boolean | null
          qty: number | null
          sort_order: number | null
          tax_rate_pct: number | null
          type: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          event_id: string
          id?: string
          per_person?: boolean | null
          qty?: number | null
          sort_order?: number | null
          tax_rate_pct?: number | null
          type: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          event_id?: string
          id?: string
          per_person?: boolean | null
          qty?: number | null
          sort_order?: number | null
          tax_rate_pct?: number | null
          type?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_line_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
          service_charge_pct: number | null
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
          service_charge_pct?: number | null
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
          service_charge_pct?: number | null
          time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback_submissions: {
        Row: {
          created_at: string
          drink_rating: number | null
          email: string | null
          food_rating: number | null
          hospitality_rating: number | null
          id: string
          is_anonymous: boolean
          message: string
          name: string | null
          overall_rating: number | null
          price_rating: number | null
          source_page: string | null
          team_rating: number | null
          updated_at: string
          user_id: string | null
          venue_rating: number | null
        }
        Insert: {
          created_at?: string
          drink_rating?: number | null
          email?: string | null
          food_rating?: number | null
          hospitality_rating?: number | null
          id?: string
          is_anonymous?: boolean
          message: string
          name?: string | null
          overall_rating?: number | null
          price_rating?: number | null
          source_page?: string | null
          team_rating?: number | null
          updated_at?: string
          user_id?: string | null
          venue_rating?: number | null
        }
        Update: {
          created_at?: string
          drink_rating?: number | null
          email?: string | null
          food_rating?: number | null
          hospitality_rating?: number | null
          id?: string
          is_anonymous?: boolean
          message?: string
          name?: string | null
          overall_rating?: number | null
          price_rating?: number | null
          source_page?: string | null
          team_rating?: number | null
          updated_at?: string
          user_id?: string | null
          venue_rating?: number | null
        }
        Relationships: []
      }
      geo_areas: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          balance_due: number | null
          created_at: string | null
          due_date: string | null
          event_id: string
          id: string
          number: string | null
          status: string
          stripe_payment_intent_id: string | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          balance_due?: number | null
          created_at?: string | null
          due_date?: string | null
          event_id: string
          id?: string
          number?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          balance_due?: number | null
          created_at?: string | null
          due_date?: string | null
          event_id?: string
          id?: string
          number?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_vendor_inquiries: {
        Row: {
          business_name: string
          business_type: string
          contact_name: string
          created_at: string
          cuisine_style: string | null
          current_location: string | null
          daily_covers_target: number | null
          email: string
          id: string
          phone: string
          previous_food_hall_experience: boolean
          questions_comments: string | null
          social_media_handles: string | null
          submitted_by_user_id: string | null
          team_size: number | null
          unique_selling_point: string | null
          years_experience: number | null
        }
        Insert: {
          business_name: string
          business_type: string
          contact_name: string
          created_at?: string
          cuisine_style?: string | null
          current_location?: string | null
          daily_covers_target?: number | null
          email: string
          id?: string
          phone: string
          previous_food_hall_experience?: boolean
          questions_comments?: string | null
          social_media_handles?: string | null
          submitted_by_user_id?: string | null
          team_size?: number | null
          unique_selling_point?: string | null
          years_experience?: number | null
        }
        Update: {
          business_name?: string
          business_type?: string
          contact_name?: string
          created_at?: string
          cuisine_style?: string | null
          current_location?: string | null
          daily_covers_target?: number | null
          email?: string
          id?: string
          phone?: string
          previous_food_hall_experience?: boolean
          questions_comments?: string | null
          social_media_handles?: string | null
          submitted_by_user_id?: string | null
          team_size?: number | null
          unique_selling_point?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      lead_activity: {
        Row: {
          author_id: string | null
          body: string | null
          created_at: string | null
          id: string
          lead_id: string
          meta: Json | null
          type: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          meta?: Json | null
          type: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          meta?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activity_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activity_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activity_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_lead_possible_duplicates"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_activity_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_lead_possible_duplicates"
            referencedColumns: ["possible_duplicate_id"]
          },
        ]
      }
      leads: {
        Row: {
          budget_high: number | null
          budget_low: number | null
          consent_marketing: boolean | null
          created_at: string | null
          date_flexible: boolean | null
          email: string
          event_type: string | null
          first_name: string
          headcount: number | null
          id: string
          last_name: string
          message: string | null
          owner_id: string | null
          phone: string | null
          preferred_date: string | null
          preferred_space: string | null
          privacy_accepted_at: string | null
          search_tsv: unknown | null
          source: string | null
          status: string
          updated_at: string | null
          utm: Json | null
        }
        Insert: {
          budget_high?: number | null
          budget_low?: number | null
          consent_marketing?: boolean | null
          created_at?: string | null
          date_flexible?: boolean | null
          email: string
          event_type?: string | null
          first_name: string
          headcount?: number | null
          id?: string
          last_name: string
          message?: string | null
          owner_id?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_space?: string | null
          privacy_accepted_at?: string | null
          search_tsv?: unknown | null
          source?: string | null
          status?: string
          updated_at?: string | null
          utm?: Json | null
        }
        Update: {
          budget_high?: number | null
          budget_low?: number | null
          consent_marketing?: boolean | null
          created_at?: string | null
          date_flexible?: boolean | null
          email?: string
          event_type?: string | null
          first_name?: string
          headcount?: number | null
          id?: string
          last_name?: string
          message?: string | null
          owner_id?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_space?: string | null
          privacy_accepted_at?: string | null
          search_tsv?: unknown | null
          source?: string | null
          status?: string
          updated_at?: string | null
          utm?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_preferred_space_fkey"
            columns: ["preferred_space"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      ledger_passwords: {
        Row: {
          created_at: string
          failed_attempts: number | null
          id: string
          last_accessed: string | null
          locked_until: string | null
          password_hash: string
          salt: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          failed_attempts?: number | null
          id?: string
          last_accessed?: string | null
          locked_until?: string | null
          password_hash: string
          salt: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          failed_attempts?: number | null
          id?: string
          last_accessed?: string | null
          locked_until?: string | null
          password_hash?: string
          salt?: string
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
      lunch_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          is_active: boolean
          max_orders: number
          orders_count: number
          slot_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_active?: boolean
          max_orders?: number
          orders_count?: number
          slot_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_active?: boolean
          max_orders?: number
          orders_count?: number
          slot_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      lunch_menu: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      lunch_orders: {
        Row: {
          collection_slot_id: string | null
          collection_time: string
          created_at: string
          id: string
          items: Json
          member_name: string
          member_phone: string
          notes: string | null
          order_date: string
          payment_status: string
          status: string
          stripe_session_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          collection_slot_id?: string | null
          collection_time: string
          created_at?: string
          id?: string
          items?: Json
          member_name: string
          member_phone: string
          notes?: string | null
          order_date: string
          payment_status?: string
          status?: string
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          collection_slot_id?: string | null
          collection_time?: string
          created_at?: string
          id?: string
          items?: Json
          member_name?: string
          member_phone?: string
          notes?: string | null
          order_date?: string
          payment_status?: string
          status?: string
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lunch_time_slots: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_orders: number
          slot_time: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_orders?: number
          slot_time: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_orders?: number
          slot_time?: string
        }
        Relationships: []
      }
      mailchimp_sync_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_details: Json | null
          failed_count: number | null
          id: string
          job_type: string
          processed_count: number | null
          started_at: string
          status: string
          success_count: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          failed_count?: number | null
          id?: string
          job_type: string
          processed_count?: number | null
          started_at?: string
          status?: string
          success_count?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          failed_count?: number | null
          id?: string
          job_type?: string
          processed_count?: number | null
          started_at?: string
          status?: string
          success_count?: number | null
        }
        Relationships: []
      }
      management_event_line_items: {
        Row: {
          created_at: string | null
          description: string
          event_id: string
          id: string
          per_person: boolean | null
          qty: number | null
          sort_order: number | null
          tax_rate_pct: number | null
          type: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          event_id: string
          id?: string
          per_person?: boolean | null
          qty?: number | null
          sort_order?: number | null
          tax_rate_pct?: number | null
          type: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          event_id?: string
          id?: string
          per_person?: boolean | null
          qty?: number | null
          sort_order?: number | null
          tax_rate_pct?: number | null
          type?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_event_line_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
        ]
      }
      management_events: {
        Row: {
          budget: number | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          code: string | null
          created_at: string | null
          event_type: string | null
          headcount: number | null
          id: string
          late_close_approved_by: string | null
          late_close_reason: string | null
          late_close_requested: boolean | null
          lead_id: string | null
          notes: string | null
          owner_id: string | null
          primary_date: string | null
          service_charge_pct: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          code?: string | null
          created_at?: string | null
          event_type?: string | null
          headcount?: number | null
          id?: string
          late_close_approved_by?: string | null
          late_close_reason?: string | null
          late_close_requested?: boolean | null
          lead_id?: string | null
          notes?: string | null
          owner_id?: string | null
          primary_date?: string | null
          service_charge_pct?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          code?: string | null
          created_at?: string | null
          event_type?: string | null
          headcount?: number | null
          id?: string
          late_close_approved_by?: string | null
          late_close_reason?: string | null
          late_close_requested?: boolean | null
          lead_id?: string | null
          notes?: string | null
          owner_id?: string | null
          primary_date?: string | null
          service_charge_pct?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_lead_possible_duplicates"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "management_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_lead_possible_duplicates"
            referencedColumns: ["possible_duplicate_id"]
          },
        ]
      }
      member_check_ins: {
        Row: {
          check_in_date: string
          check_in_timestamp: string
          created_at: string
          entrance_slug: string
          id: string
          streak_day: number
          user_id: string
        }
        Insert: {
          check_in_date?: string
          check_in_timestamp?: string
          created_at?: string
          entrance_slug: string
          id?: string
          streak_day?: number
          user_id: string
        }
        Update: {
          check_in_date?: string
          check_in_timestamp?: string
          created_at?: string
          entrance_slug?: string
          id?: string
          streak_day?: number
          user_id?: string
        }
        Relationships: []
      }
      member_ledger: {
        Row: {
          activity_date: string
          activity_timestamp: string
          activity_type: string
          amount: number | null
          category: string | null
          created_at: string
          currency: string | null
          description: string
          id: string
          location_data: Json | null
          metadata: Json | null
          notes: string | null
          payment_method: string | null
          related_id: string | null
          subcategory: string | null
          tags: string[] | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          activity_date: string
          activity_timestamp?: string
          activity_type: string
          amount?: number | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description: string
          id?: string
          location_data?: Json | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          related_id?: string | null
          subcategory?: string | null
          tags?: string[] | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_timestamp?: string
          activity_type?: string
          amount?: number | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string
          id?: string
          location_data?: Json | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          related_id?: string | null
          subcategory?: string | null
          tags?: string[] | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      member_moments: {
        Row: {
          ai_confidence_score: number | null
          ai_flags: Json | null
          date_taken: string
          id: string
          image_url: string
          is_featured: boolean
          is_visible: boolean
          latitude: number | null
          location_confirmed: boolean
          longitude: number | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          moderation_status: string
          tagline: string
          tags: string[] | null
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_flags?: Json | null
          date_taken: string
          id?: string
          image_url: string
          is_featured?: boolean
          is_visible?: boolean
          latitude?: number | null
          location_confirmed?: boolean
          longitude?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          tagline: string
          tags?: string[] | null
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          ai_flags?: Json | null
          date_taken?: string
          id?: string
          image_url?: string
          is_featured?: boolean
          is_visible?: boolean
          latitude?: number | null
          location_confirmed?: boolean
          longitude?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          tagline?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      member_profiles_extended: {
        Row: {
          auto_insights: Json | null
          avatar_url: string | null
          beer_style_preferences: string[] | null
          created_at: string
          dietary_notes: string | null
          display_name: string | null
          favorite_drink: string | null
          favorite_venue: string | null
          hide_from_leaderboards: boolean
          id: string
          join_date: string
          preferences: Json | null
          tier_badge: string | null
          updated_at: string
          user_id: string
          visit_time_preference: string | null
        }
        Insert: {
          auto_insights?: Json | null
          avatar_url?: string | null
          beer_style_preferences?: string[] | null
          created_at?: string
          dietary_notes?: string | null
          display_name?: string | null
          favorite_drink?: string | null
          favorite_venue?: string | null
          hide_from_leaderboards?: boolean
          id?: string
          join_date?: string
          preferences?: Json | null
          tier_badge?: string | null
          updated_at?: string
          user_id: string
          visit_time_preference?: string | null
        }
        Update: {
          auto_insights?: Json | null
          avatar_url?: string | null
          beer_style_preferences?: string[] | null
          created_at?: string
          dietary_notes?: string | null
          display_name?: string | null
          favorite_drink?: string | null
          favorite_venue?: string | null
          hide_from_leaderboards?: boolean
          id?: string
          join_date?: string
          preferences?: Json | null
          tier_badge?: string | null
          updated_at?: string
          user_id?: string
          visit_time_preference?: string | null
        }
        Relationships: []
      }
      member_receipts: {
        Row: {
          covers: number | null
          created_at: string
          currency: string
          id: string
          items: Json | null
          processing_status: string
          raw_ocr_data: Json | null
          receipt_date: string
          receipt_image_url: string
          receipt_number: string | null
          receipt_time: string | null
          total_amount: number
          updated_at: string
          user_id: string
          venue_location: string | null
        }
        Insert: {
          covers?: number | null
          created_at?: string
          currency?: string
          id?: string
          items?: Json | null
          processing_status?: string
          raw_ocr_data?: Json | null
          receipt_date: string
          receipt_image_url: string
          receipt_number?: string | null
          receipt_time?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
          venue_location?: string | null
        }
        Update: {
          covers?: number | null
          created_at?: string
          currency?: string
          id?: string
          items?: Json | null
          processing_status?: string
          raw_ocr_data?: Json | null
          receipt_date?: string
          receipt_image_url?: string
          receipt_number?: string | null
          receipt_time?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
          venue_location?: string | null
        }
        Relationships: []
      }
      member_streaks: {
        Row: {
          available_grace_weeks: number | null
          created_at: string
          current_reward_tier: number | null
          current_set_number: number | null
          current_set_progress: number | null
          current_streak: number
          current_week_receipts: number | null
          current_week_start_date: string | null
          id: string
          last_check_in_date: string | null
          longest_consecutive_weeks: number | null
          longest_streak: number
          streak_rewards_earned: Json | null
          total_check_ins: number
          total_sets_completed: number | null
          total_weeks_completed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_grace_weeks?: number | null
          created_at?: string
          current_reward_tier?: number | null
          current_set_number?: number | null
          current_set_progress?: number | null
          current_streak?: number
          current_week_receipts?: number | null
          current_week_start_date?: string | null
          id?: string
          last_check_in_date?: string | null
          longest_consecutive_weeks?: number | null
          longest_streak?: number
          streak_rewards_earned?: Json | null
          total_check_ins?: number
          total_sets_completed?: number | null
          total_weeks_completed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_grace_weeks?: number | null
          created_at?: string
          current_reward_tier?: number | null
          current_set_number?: number | null
          current_set_progress?: number | null
          current_streak?: number
          current_week_receipts?: number | null
          current_week_start_date?: string | null
          id?: string
          last_check_in_date?: string | null
          longest_consecutive_weeks?: number | null
          longest_streak?: number
          streak_rewards_earned?: Json | null
          total_check_ins?: number
          total_sets_completed?: number | null
          total_weeks_completed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      membership_codes: {
        Row: {
          code: string
          consumed: boolean
          created_at: string
          email: string
          expires_at: string
          id: string
          user_handle: string
        }
        Insert: {
          code: string
          consumed?: boolean
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          user_handle: string
        }
        Update: {
          code?: string
          consumed?: boolean
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          user_handle?: string
        }
        Relationships: []
      }
      membership_links: {
        Row: {
          created_at: string
          email: string
          id: string
          is_verified: boolean
          user_handle: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_verified?: boolean
          user_handle: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_verified?: boolean
          user_handle?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      mobile_debug_logs: {
        Row: {
          created_at: string
          data: Json | null
          error_message: string | null
          id: string
          platform: string | null
          session_id: string
          step: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          error_message?: string | null
          id?: string
          platform?: string | null
          session_id: string
          step: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          error_message?: string | null
          id?: string
          platform?: string | null
          session_id?: string
          step?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      moment_likes: {
        Row: {
          created_at: string
          id: string
          moment_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          moment_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          moment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moment_likes_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "member_moments"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          click_token: string | null
          clicked_at: string | null
          created_at: string
          endpoint: string
          error: string | null
          id: string
          notification_id: string
          sent_at: string
          status: Database["public"]["Enums"]["delivery_status"]
          subscription_id: string | null
        }
        Insert: {
          click_token?: string | null
          clicked_at?: string | null
          created_at?: string
          endpoint: string
          error?: string | null
          id?: string
          notification_id: string
          sent_at?: string
          status: Database["public"]["Enums"]["delivery_status"]
          subscription_id?: string | null
        }
        Update: {
          click_token?: string | null
          clicked_at?: string | null
          created_at?: string
          endpoint?: string
          error?: string | null
          id?: string
          notification_id?: string
          sent_at?: string
          status?: Database["public"]["Enums"]["delivery_status"]
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          archived: boolean
          badge: string | null
          banner_message: string | null
          body: string
          campaign_id: string | null
          created_at: string
          created_by: string | null
          created_by_email: string | null
          display_mode: string | null
          dry_run: boolean
          failed_count: number
          icon: string | null
          id: string
          occurrences_limit: number | null
          parent_id: string | null
          recipients_count: number
          repeat_rule: Json | null
          repeat_until: string | null
          schedule_timezone: string | null
          scheduled_for: string | null
          scope: Database["public"]["Enums"]["notification_scope"]
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          success_count: number
          times_sent: number
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          archived?: boolean
          badge?: string | null
          banner_message?: string | null
          body: string
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          display_mode?: string | null
          dry_run?: boolean
          failed_count?: number
          icon?: string | null
          id?: string
          occurrences_limit?: number | null
          parent_id?: string | null
          recipients_count?: number
          repeat_rule?: Json | null
          repeat_until?: string | null
          schedule_timezone?: string | null
          scheduled_for?: string | null
          scope?: Database["public"]["Enums"]["notification_scope"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          success_count?: number
          times_sent?: number
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          archived?: boolean
          badge?: string | null
          banner_message?: string | null
          body?: string
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          display_mode?: string | null
          dry_run?: boolean
          failed_count?: number
          icon?: string | null
          id?: string
          occurrences_limit?: number | null
          parent_id?: string | null
          recipients_count?: number
          repeat_rule?: Json | null
          repeat_until?: string | null
          schedule_timezone?: string | null
          scheduled_for?: string | null
          scope?: Database["public"]["Enums"]["notification_scope"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          success_count?: number
          times_sent?: number
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          is_bounce: boolean | null
          page_path: string
          page_title: string | null
          referrer: string | null
          scroll_depth_percent: number | null
          session_id: string
          time_spent_seconds: number | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_bounce?: boolean | null
          page_path: string
          page_title?: string | null
          referrer?: string | null
          scroll_depth_percent?: number | null
          session_id: string
          time_spent_seconds?: number | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_bounce?: boolean | null
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          scroll_depth_percent?: number | null
          session_id?: string
          time_spent_seconds?: number | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string
          method: string
          received_at: string | null
          stripe_charge_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id: string
          method: string
          received_at?: string | null
          stripe_charge_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          method?: string
          received_at?: string | null
          stripe_charge_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_banners: {
        Row: {
          banner_message: string | null
          body: string
          created_at: string
          icon: string | null
          id: string
          notification_token: string
          processed: boolean
          processed_at: string | null
          title: string
          url: string | null
        }
        Insert: {
          banner_message?: string | null
          body: string
          created_at?: string
          icon?: string | null
          id?: string
          notification_token: string
          processed?: boolean
          processed_at?: string | null
          title: string
          url?: string | null
        }
        Update: {
          banner_message?: string | null
          body?: string
          created_at?: string
          icon?: string | null
          id?: string
          notification_token?: string
          processed?: boolean
          processed_at?: string | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      pnls: {
        Row: {
          created_at: string
          effective_from: string
          id: string
          json_forecast: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          id?: string
          json_forecast?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          id?: string
          json_forecast?: Json
          updated_at?: string
        }
        Relationships: []
      }
      pong_scores: {
        Row: {
          created_at: string
          game_duration: number
          id: string
          player_name: string
          score: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          game_duration?: number
          id?: string
          player_name: string
          score: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          game_duration?: number
          id?: string
          player_name?: string
          score?: number
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birthday: string | null
          communication_preferences: Json | null
          created_at: string
          dietary_preferences: string[] | null
          first_name: string | null
          id: string
          interests: string[] | null
          last_name: string | null
          member_since: string
          membership_number: string | null
          phone_number: string | null
          secret_kitchens_access: boolean | null
          square_customer_id: string | null
          updated_at: string
          user_id: string
          user_type: string | null
          wallet_pass_last_issued_at: string | null
          wallet_pass_revoked: boolean | null
          wallet_pass_serial_number: string | null
          wallet_pass_url: string | null
        }
        Insert: {
          birthday?: string | null
          communication_preferences?: Json | null
          created_at?: string
          dietary_preferences?: string[] | null
          first_name?: string | null
          id?: string
          interests?: string[] | null
          last_name?: string | null
          member_since?: string
          membership_number?: string | null
          phone_number?: string | null
          secret_kitchens_access?: boolean | null
          square_customer_id?: string | null
          updated_at?: string
          user_id: string
          user_type?: string | null
          wallet_pass_last_issued_at?: string | null
          wallet_pass_revoked?: boolean | null
          wallet_pass_serial_number?: string | null
          wallet_pass_url?: string | null
        }
        Update: {
          birthday?: string | null
          communication_preferences?: Json | null
          created_at?: string
          dietary_preferences?: string[] | null
          first_name?: string | null
          id?: string
          interests?: string[] | null
          last_name?: string | null
          member_since?: string
          membership_number?: string | null
          phone_number?: string | null
          secret_kitchens_access?: boolean | null
          square_customer_id?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
          wallet_pass_last_issued_at?: string | null
          wallet_pass_revoked?: boolean | null
          wallet_pass_serial_number?: string | null
          wallet_pass_url?: string | null
        }
        Relationships: []
      }
      push_optin_events: {
        Row: {
          created_at: string
          details: Json | null
          endpoint: string | null
          event: string
          id: string
          platform: string | null
          subscription_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          event: string
          id?: string
          platform?: string | null
          subscription_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          event?: string
          id?: string
          platform?: string | null
          subscription_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_optin_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          is_active: boolean
          last_seen: string | null
          p256dh: string
          platform: string | null
          user_agent: string | null
          user_email: string | null
          user_full_name: string | null
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean
          last_seen?: string | null
          p256dh: string
          platform?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_full_name?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          last_seen?: string | null
          p256dh?: string
          platform?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_full_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      secret_kitchen_access: {
        Row: {
          access_expires_at: string | null
          application_date: string | null
          application_id: string | null
          business_name: string
          calendly_booked: boolean | null
          calendly_booking_date: string | null
          created_at: string
          created_by: string | null
          email: string
          first_access_at: string | null
          has_applied: boolean | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          access_expires_at?: string | null
          application_date?: string | null
          application_id?: string | null
          business_name: string
          calendly_booked?: boolean | null
          calendly_booking_date?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          first_access_at?: string | null
          has_applied?: boolean | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          access_expires_at?: string | null
          application_date?: string | null
          application_id?: string | null
          business_name?: string
          calendly_booked?: boolean | null
          calendly_booking_date?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          first_access_at?: string | null
          has_applied?: boolean | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_kitchen_access_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "kitchen_vendor_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_kitchen_email_log: {
        Row: {
          access_expires_at: string
          created_at: string
          email_type: string
          id: string
          sent_at: string
          user_email: string
        }
        Insert: {
          access_expires_at: string
          created_at?: string
          email_type: string
          id?: string
          sent_at?: string
          user_email: string
        }
        Update: {
          access_expires_at?: string
          created_at?: string
          email_type?: string
          id?: string
          sent_at?: string
          user_email?: string
        }
        Relationships: []
      }
      secret_kitchen_usage: {
        Row: {
          accessed_at: string
          email: string
          id: string
          ip_address: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          email: string
          id?: string
          ip_address?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      secret_kitchens_otp_codes: {
        Row: {
          code: string
          consumed: boolean
          created_at: string
          email: string
          expires_at: string
          id: string
        }
        Insert: {
          code: string
          consumed?: boolean
          created_at?: string
          email: string
          expires_at?: string
          id?: string
        }
        Update: {
          code?: string
          consumed?: boolean
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
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
      segment_member_previews: {
        Row: {
          created_at: string
          id: string
          segment_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          segment_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          segment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "segment_member_previews_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "campaign_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      space_hours: {
        Row: {
          buffer_after_min: number | null
          buffer_before_min: number | null
          close_time: string | null
          created_at: string
          day_of_week: number
          id: string
          late_close_allowed: boolean | null
          open_time: string | null
          space_id: string
          updated_at: string
        }
        Insert: {
          buffer_after_min?: number | null
          buffer_before_min?: number | null
          close_time?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          late_close_allowed?: boolean | null
          open_time?: string | null
          space_id: string
          updated_at?: string
        }
        Update: {
          buffer_after_min?: number | null
          buffer_before_min?: number | null
          close_time?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          late_close_allowed?: boolean | null
          open_time?: string | null
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_hours_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          capacity_seated: number | null
          capacity_standing: number | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          capacity_seated?: number | null
          capacity_standing?: number | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          capacity_seated?: number | null
          capacity_standing?: number | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      streak_badges: {
        Row: {
          badge_description: string | null
          badge_icon: string | null
          badge_name: string
          badge_type: string
          created_at: string
          earned_date: string
          id: string
          milestone_value: number | null
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name: string
          badge_type: string
          created_at?: string
          earned_date?: string
          id?: string
          milestone_value?: number | null
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name?: string
          badge_type?: string
          created_at?: string
          earned_date?: string
          id?: string
          milestone_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      streak_grace_periods: {
        Row: {
          created_at: string
          expires_date: string
          grace_type: string
          id: string
          is_used: boolean
          used_date: string | null
          user_id: string
          week_applied_to: string | null
          week_start_date: string
        }
        Insert: {
          created_at?: string
          expires_date: string
          grace_type: string
          id?: string
          is_used?: boolean
          used_date?: string | null
          user_id: string
          week_applied_to?: string | null
          week_start_date: string
        }
        Update: {
          created_at?: string
          expires_date?: string
          grace_type?: string
          id?: string
          is_used?: boolean
          used_date?: string | null
          user_id?: string
          week_applied_to?: string | null
          week_start_date?: string
        }
        Relationships: []
      }
      streak_rewards: {
        Row: {
          claimed_date: string | null
          created_at: string
          discount_percentage: number
          earned_date: string
          expires_date: string
          id: string
          is_active: boolean
          reward_tier: number
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          claimed_date?: string | null
          created_at?: string
          discount_percentage: number
          earned_date?: string
          expires_date?: string
          id?: string
          is_active?: boolean
          reward_tier: number
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          claimed_date?: string | null
          created_at?: string
          discount_percentage?: number
          earned_date?: string
          expires_date?: string
          id?: string
          is_active?: boolean
          reward_tier?: number
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      streak_sets: {
        Row: {
          completed_at: string | null
          completed_weeks: number
          created_at: string
          end_week_date: string
          id: string
          is_complete: boolean
          reward_tier: number | null
          set_number: number
          start_week_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_weeks?: number
          created_at?: string
          end_week_date: string
          id?: string
          is_complete?: boolean
          reward_tier?: number | null
          set_number: number
          start_week_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_weeks?: number
          created_at?: string
          end_week_date?: string
          id?: string
          is_complete?: boolean
          reward_tier?: number | null
          set_number?: number
          start_week_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      streak_weeks: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_complete: boolean
          receipt_count: number
          updated_at: string
          user_id: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_complete?: boolean
          receipt_count?: number
          updated_at?: string
          user_id: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_complete?: boolean
          receipt_count?: number
          updated_at?: string
          user_id?: string
          week_end_date?: string
          week_start_date?: string
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
          last_mailchimp_sync_at: string | null
          mailchimp_member_id: string | null
          mailchimp_sync_status: string | null
          name: string | null
          preferences: Json | null
          subscription_date: string
          sync_error: string | null
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
          last_mailchimp_sync_at?: string | null
          mailchimp_member_id?: string | null
          mailchimp_sync_status?: string | null
          name?: string | null
          preferences?: Json | null
          subscription_date?: string
          sync_error?: string | null
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
          last_mailchimp_sync_at?: string | null
          mailchimp_member_id?: string | null
          mailchimp_sync_status?: string | null
          name?: string | null
          preferences?: Json | null
          subscription_date?: string
          sync_error?: string | null
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          additional_data: Json | null
          coordinates: Json | null
          created_at: string
          element_class: string | null
          element_id: string | null
          element_text: string | null
          id: string
          interaction_type: string
          occurred_at: string
          page_path: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          additional_data?: Json | null
          coordinates?: Json | null
          created_at?: string
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          id?: string
          interaction_type: string
          occurred_at?: string
          page_path: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          additional_data?: Json | null
          coordinates?: Json | null
          created_at?: string
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          id?: string
          interaction_type?: string
          occurred_at?: string
          page_path?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_journeys: {
        Row: {
          created_at: string
          from_page: string | null
          id: string
          occurred_at: string
          session_id: string
          to_page: string
          transition_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          from_page?: string | null
          id?: string
          occurred_at?: string
          session_id: string
          to_page: string
          transition_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          from_page?: string | null
          id?: string
          occurred_at?: string
          session_id?: string
          to_page?: string
          transition_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["management_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["management_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["management_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          ended_at: string | null
          id: string
          ip_address: unknown | null
          is_authenticated: boolean | null
          os: string | null
          referrer: string | null
          session_id: string
          started_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_authenticated?: boolean | null
          os?: string | null
          referrer?: string | null
          session_id: string
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_authenticated?: boolean | null
          os?: string | null
          referrer?: string | null
          session_id?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string | null
          created_at: string
          geo_area_id: string
          id: string
          is_active: boolean
          max_capacity: number | null
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          geo_area_id: string
          id?: string
          is_active?: boolean
          max_capacity?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          geo_area_id?: string
          id?: string
          is_active?: boolean
          max_capacity?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_geo_area_id_fkey"
            columns: ["geo_area_id"]
            isOneToOne: false
            referencedRelation: "geo_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      walk_card_geo_areas: {
        Row: {
          created_at: string
          geo_area_id: string
          id: string
          walk_card_id: string
        }
        Insert: {
          created_at?: string
          geo_area_id: string
          id?: string
          walk_card_id: string
        }
        Update: {
          created_at?: string
          geo_area_id?: string
          id?: string
          walk_card_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "walk_card_geo_areas_geo_area_id_fkey"
            columns: ["geo_area_id"]
            isOneToOne: false
            referencedRelation: "geo_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_card_geo_areas_walk_card_id_fkey"
            columns: ["walk_card_id"]
            isOneToOne: false
            referencedRelation: "walk_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      walk_cards: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by_user_id: string
          croft_zones: string[]
          date: string
          id: string
          started_at: string | null
          status: Database["public"]["Enums"]["walk_card_status_enum"]
          time_block: Database["public"]["Enums"]["time_block_enum"]
          title: string
          updated_at: string
          weather_notes: string | null
          weather_preset: Database["public"]["Enums"]["weather_preset_enum"]
          weather_temp_c: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by_user_id: string
          croft_zones?: string[]
          date: string
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["walk_card_status_enum"]
          time_block: Database["public"]["Enums"]["time_block_enum"]
          title: string
          updated_at?: string
          weather_notes?: string | null
          weather_preset: Database["public"]["Enums"]["weather_preset_enum"]
          weather_temp_c?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string
          croft_zones?: string[]
          date?: string
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["walk_card_status_enum"]
          time_block?: Database["public"]["Enums"]["time_block_enum"]
          title?: string
          updated_at?: string
          weather_notes?: string | null
          weather_preset?: Database["public"]["Enums"]["weather_preset_enum"]
          weather_temp_c?: number | null
        }
        Relationships: []
      }
      walk_entries: {
        Row: {
          capacity_percentage: number | null
          created_at: string
          flag_anomaly: boolean
          id: string
          is_closed: boolean
          laptop_count: number
          notes: string | null
          people_count: number
          photo_url: string | null
          recorded_at: string
          updated_at: string
          venue_id: string
          visit_number: number
          walk_card_id: string
        }
        Insert: {
          capacity_percentage?: number | null
          created_at?: string
          flag_anomaly?: boolean
          id?: string
          is_closed?: boolean
          laptop_count?: number
          notes?: string | null
          people_count?: number
          photo_url?: string | null
          recorded_at?: string
          updated_at?: string
          venue_id: string
          visit_number?: number
          walk_card_id: string
        }
        Update: {
          capacity_percentage?: number | null
          created_at?: string
          flag_anomaly?: boolean
          id?: string
          is_closed?: boolean
          laptop_count?: number
          notes?: string | null
          people_count?: number
          photo_url?: string | null
          recorded_at?: string
          updated_at?: string
          venue_id?: string
          visit_number?: number
          walk_card_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "walk_entries_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_entries_walk_card_id_fkey"
            columns: ["walk_card_id"]
            isOneToOne: false
            referencedRelation: "walk_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          type: string
          user_handle: string
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at?: string
          id?: string
          type: string
          user_handle: string
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          type?: string
          user_handle?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          backed_up: boolean | null
          counter: number
          created_at: string
          credential_id: string
          device_type: string | null
          id: string
          last_used_at: string | null
          public_key: string
          rp_id: string | null
          transports: string[] | null
          user_handle: string
        }
        Insert: {
          backed_up?: boolean | null
          counter?: number
          created_at?: string
          credential_id: string
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          rp_id?: string | null
          transports?: string[] | null
          user_handle: string
        }
        Update: {
          backed_up?: boolean | null
          counter?: number
          created_at?: string
          credential_id?: string
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          rp_id?: string | null
          transports?: string[] | null
          user_handle?: string
        }
        Relationships: [
          {
            foreignKeyName: "webauthn_credentials_user_handle_fkey"
            columns: ["user_handle"]
            isOneToOne: false
            referencedRelation: "webauthn_users"
            referencedColumns: ["user_handle"]
          },
        ]
      }
      webauthn_user_links: {
        Row: {
          created_at: string
          id: string
          last_used_at: string | null
          user_handle: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          user_handle: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          user_handle?: string
          user_id?: string
        }
        Relationships: []
      }
      webauthn_users: {
        Row: {
          created_at: string
          display_name: string | null
          user_handle: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          user_handle: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          user_handle?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_member_analytics: {
        Row: {
          active_days: number | null
          active_months: number | null
          avg_transaction: number | null
          categories: string[] | null
          currency: string | null
          current_month_spend: number | null
          current_month_transactions: number | null
          current_week_spend: number | null
          display_name: string | null
          first_name: string | null
          first_transaction_date: string | null
          last_name: string | null
          last_transaction_date: string | null
          payment_methods: string[] | null
          total_spend: number | null
          total_transactions: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_booking_priority: {
        Row: {
          rank: number | null
          status: string | null
        }
        Relationships: []
      }
      v_lead_possible_duplicates: {
        Row: {
          lead_id: string | null
          possible_duplicate_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_lead_note: {
        Args: { lead_id_param: string; note_body: string }
        Returns: string
      }
      approve_late_close: {
        Args: { p_event: string }
        Returns: undefined
      }
      bump_rate_key: {
        Args: { max_hits: number; p_key: string; window_seconds: number }
        Returns: boolean
      }
      calculate_booking_rank: {
        Args: { p_created_at: string; p_start_ts: string; p_status: string }
        Returns: number
      }
      calculate_member_streak: {
        Args: { user_id_input: string }
        Returns: {
          current_streak: number
          longest_streak: number
          total_check_ins: number
        }[]
      }
      check_secret_kitchen_access_status: {
        Args: { user_email: string }
        Returns: {
          access_expires_at: string
          first_access_at: string
          has_access: boolean
          is_expired: boolean
          time_remaining_seconds: number
        }[]
      }
      cleanup_expired_otp_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_secret_kitchens_otp_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_webauthn_challenges: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clear_webauthn_data_for_handle: {
        Args: { user_handle_input: string }
        Returns: undefined
      }
      create_cinema_booking: {
        Args: {
          _email: string
          _guest_name: string
          _primary_name: string
          _quantity: number
          _user_id: string
        }
        Returns: {
          booking_id: string
          release_id: string
          ticket_numbers: number[]
          tickets_left: number
        }[]
      }
      create_hold: {
        Args: { payload: Json }
        Returns: string
      }
      create_invoice: {
        Args: { p_amount: number; p_due_date: string; p_event_id: string }
        Returns: string
      }
      create_lead: {
        Args: { client_ip?: string; payload: Json } | { payload: Json }
        Returns: string
      }
      create_management_event: {
        Args:
          | {
              p_budget?: number
              p_client_email?: string
              p_client_name?: string
              p_client_phone?: string
              p_event_type: string
              p_headcount: number
              p_lead_id?: string
              p_notes?: string
              p_start_date?: string
              p_start_time?: string
            }
          | {
              p_budget?: number
              p_client_email?: string
              p_client_name?: string
              p_client_phone?: string
              p_event_type: string
              p_headcount: number
              p_lead_id?: string
              p_notes?: string
              p_start_date?: string
              p_start_time?: string
            }
          | { payload: Json }
        Returns: string
      }
      create_proposal: {
        Args:
          | { p_event_id: string; p_items: Json }
          | {
              p_event_id: string
              p_line_items: Json
              p_service_charge_pct?: number
            }
        Returns: {
          line_items_created: number
          proposal_id: string
        }[]
      }
      detect_booking_conflicts: {
        Args: {
          p_end_ts: string
          p_exclude_booking_id?: string
          p_space_id: string
          p_start_ts: string
        }
        Returns: {
          conflict_type: string
          conflicting_booking_id: string
          conflicting_end: string
          conflicting_start: string
          conflicting_title: string
        }[]
      }
      ensure_membership_number: {
        Args: { user_id_input: string }
        Returns: string
      }
      generate_contract: {
        Args: { p_event_id: string }
        Returns: string
      }
      generate_membership_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_advanced_member_analytics: {
        Args: {
          p_activity_logic?: string
          p_avg_spend_per_visit?: string
          p_behavior_logic?: string
          p_date_end?: string
          p_date_start?: string
          p_demographics_logic?: string
          p_has_uploaded_receipts?: boolean
          p_interests?: string[]
          p_interests_logic?: string
          p_loyalty_engagement?: string
          p_master_logic?: string
          p_max_age?: number
          p_max_spend?: number
          p_member_status_logic?: string
          p_min_age?: number
          p_min_spend?: number
          p_preferred_visit_days?: string[]
          p_push_notifications_enabled?: boolean
          p_receipt_activity_period?: string
          p_recent_activity?: string
          p_tier_badges?: string[]
          p_venue_logic?: string
          p_venue_slugs?: string[]
          p_visit_frequency?: string
          p_visit_timing?: string[]
        }
        Returns: {
          active_days: number
          active_months: number
          age: number
          avg_transaction: number
          categories: string[]
          currency: string
          current_month_spend: number
          current_month_transactions: number
          current_week_spend: number
          display_name: string
          favorite_venues: string[]
          first_name: string
          first_transaction_date: string
          interests: string[]
          last_name: string
          last_transaction_date: string
          last_visit_date: string
          lifetime_value: number
          payment_methods: string[]
          preferred_visit_times: string[]
          retention_risk_score: number
          tier_badge: string
          total_spend: number
          total_transactions: number
          user_id: string
          visit_frequency: number
        }[]
      }
      get_advanced_member_analytics_v2: {
        Args: {
          p_activity_logic?: string
          p_avg_spend_per_visit?: string
          p_behavior_logic?: string
          p_date_end?: string
          p_date_start?: string
          p_demographics_logic?: string
          p_has_uploaded_receipts?: boolean
          p_interests?: string[]
          p_interests_logic?: string
          p_loyalty_engagement?: string
          p_master_logic?: string
          p_max_age?: number
          p_max_spend?: number
          p_member_status_logic?: string
          p_min_age?: number
          p_min_spend?: number
          p_preferred_visit_days?: string[]
          p_push_notifications_enabled?: boolean
          p_receipt_activity_period?: string
          p_recent_activity?: string
          p_tier_badges?: string[]
          p_venue_logic?: string
          p_venue_slugs?: string[]
          p_visit_frequency?: string
          p_visit_timing?: string[]
        }
        Returns: {
          total_spend: number
          user_id: string
        }[]
      }
      get_app_setting: {
        Args: { setting_key: string }
        Returns: string
      }
      get_campaign_metrics: {
        Args: { p_campaign_id: string }
        Returns: {
          click_rate: number
          clicked_count: number
          delivered_count: number
          delivery_rate: number
          open_rate: number
          opened_count: number
          sent_count: number
        }[]
      }
      get_cinema_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          capacity: number
          description: string
          doors_time: string
          is_sold_out: boolean
          month_key: string
          poster_url: string
          release_id: string
          screening_date: string
          screening_time: string
          tickets_left: number
          tickets_sold: number
          title: string
        }[]
      }
      get_current_week_boundaries: {
        Args: Record<PropertyKey, never>
        Returns: {
          week_end: string
          week_start: string
        }[]
      }
      get_last_thursday: {
        Args: { month_start: string }
        Returns: string
      }
      get_member_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_days: number
          active_months: number
          avg_transaction: number
          categories: string[]
          currency: string
          current_month_spend: number
          current_month_transactions: number
          current_week_spend: number
          display_name: string
          first_name: string
          first_transaction_date: string
          last_name: string
          last_transaction_date: string
          payment_methods: string[]
          total_spend: number
          total_transactions: number
          user_id: string
        }[]
      }
      get_member_deep_dive: {
        Args: { p_user_id: string }
        Returns: {
          engagement_metrics: Json
          individual_items: Json
          predictive_insights: Json
          profile_data: Json
          recent_activity: Json[]
          spend_breakdown: Json
          user_id: string
          visit_patterns: Json
        }[]
      }
      get_member_segments: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_spend: number
          criteria: Json
          member_count: number
          segment_description: string
          segment_name: string
        }[]
      }
      get_membership_card_details: {
        Args: { user_id_input: string }
        Returns: {
          display_name: string
          first_name: string
          last_name: string
          member_since: string
          membership_number: string
          wallet_pass_last_issued_at: string
          wallet_pass_revoked: boolean
          wallet_pass_url: string
        }[]
      }
      get_or_create_current_release: {
        Args: Record<PropertyKey, never>
        Returns: {
          capacity: number
          created_at: string
          description: string | null
          doors_time: string
          id: string
          is_active: boolean
          month_key: string
          poster_url: string | null
          screening_date: string
          screening_time: string
          title: string | null
        }
      }
      get_push_subscribers: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          device_count: number
          email: string
          first_name: string
          last_name: string
          last_seen: string
          platform: string
          subscriber_name: string
          user_id: string
        }[]
      }
      get_representative_item_name: {
        Args: { names: string[] }
        Returns: string
      }
      get_subscriber_for_unsubscribe: {
        Args: { token_input: string }
        Returns: {
          email: string
          subscriber_id: string
        }[]
      }
      get_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_management_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["management_role"]
      }
      get_user_type: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_week_end_date: {
        Args: { input_date: string }
        Returns: string
      }
      get_week_start_date: {
        Args: { input_date: string }
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_management_role: {
        Args: {
          _role: Database["public"]["Enums"]["management_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_email_domain_allowed: {
        Args: { email: string }
        Returns: boolean
      }
      is_secret_kitchen_access_expired: {
        Args: { email_input: string }
        Returns: boolean
      }
      is_secret_kitchens_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_within_venue_bounds: {
        Args: { lat: number; lng: number }
        Returns: boolean
      }
      log_audit_entry: {
        Args:
          | {
              _action: string
              _diff?: Json
              _entity: string
              _entity_id: string
            }
          | {
              p_action: string
              p_actor_id: string
              p_diff?: Json
              p_entity: string
              p_entity_id: string
            }
        Returns: string
      }
      normalize_item_name: {
        Args: { item_name: string }
        Returns: string
      }
      promote_hold: {
        Args: { p_booking: string; p_new_status: string }
        Returns: undefined
      }
      reassign_lead: {
        Args: { lead_id_param: string; new_owner_id: string }
        Returns: undefined
      }
      recalculate_all_capacity_percentages: {
        Args: Record<PropertyKey, never>
        Returns: {
          updated_count: number
        }[]
      }
      request_late_close: {
        Args: { p_event: string; p_reason: string }
        Returns: undefined
      }
      set_ledger_password: {
        Args: { password_input: string; user_id_input: string }
        Returns: boolean
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      slugify: {
        Args: { src: string }
        Returns: string
      }
      update_lead: {
        Args: { lead_id_param: string; patch: Json }
        Returns: undefined
      }
      update_management_event: {
        Args: { p_id: string; patch: Json }
        Returns: undefined
      }
      update_meeting_status: {
        Args: {
          booking_date?: string
          booking_status: boolean
          user_email: string
        }
        Returns: boolean
      }
      update_secret_kitchen_first_access: {
        Args: { user_email: string }
        Returns: {
          access_expires_at: string
          first_access_at: string
        }[]
      }
      validate_ledger_password: {
        Args: { password_input: string; user_id_input: string }
        Returns: {
          locked: boolean
          locked_until: string
          valid: boolean
        }[]
      }
      validate_secret_kitchen_user: {
        Args: { user_email: string }
        Returns: {
          has_access: boolean
          is_verified: boolean
          user_type: string
        }[]
      }
      verify_event_management_token: {
        Args: { event_id_input: string; token_input: string }
        Returns: boolean
      }
      verify_unsubscribe_token: {
        Args: { token_input: string }
        Returns: boolean
      }
    }
    Enums: {
      cms_asset_type: "logo" | "icon" | "hero_image" | "carousel_image"
      cms_content_type: "text" | "richtext" | "json"
      delivery_status: "sent" | "failed" | "deactivated" | "logged"
      hold_type: "soft_hold" | "hard_hold" | "option" | "tentative"
      loyalty_card_type: "regular" | "lucky7"
      management_role: "admin" | "sales" | "ops" | "finance" | "readonly"
      notification_scope: "all" | "self"
      notification_status: "draft" | "queued" | "sending" | "sent" | "failed"
      time_block_enum:
        | "EarlyMorning"
        | "MidMorning"
        | "Lunch"
        | "MidAfternoon"
        | "EarlyEvening"
        | "Evening"
        | "Late"
      walk_card_status_enum: "Draft" | "Active" | "Completed"
      weather_preset_enum:
        | "Sunny"
        | "Overcast"
        | "Rain"
        | "Mixed"
        | "ColdSnap"
        | "Heatwave"
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
      cms_asset_type: ["logo", "icon", "hero_image", "carousel_image"],
      cms_content_type: ["text", "richtext", "json"],
      delivery_status: ["sent", "failed", "deactivated", "logged"],
      hold_type: ["soft_hold", "hard_hold", "option", "tentative"],
      loyalty_card_type: ["regular", "lucky7"],
      management_role: ["admin", "sales", "ops", "finance", "readonly"],
      notification_scope: ["all", "self"],
      notification_status: ["draft", "queued", "sending", "sent", "failed"],
      time_block_enum: [
        "EarlyMorning",
        "MidMorning",
        "Lunch",
        "MidAfternoon",
        "EarlyEvening",
        "Evening",
        "Late",
      ],
      walk_card_status_enum: ["Draft", "Active", "Completed"],
      weather_preset_enum: [
        "Sunny",
        "Overcast",
        "Rain",
        "Mixed",
        "ColdSnap",
        "Heatwave",
      ],
    },
  },
} as const
