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
          created_at: string
          currency: string | null
          description: string
          id: string
          metadata: Json | null
          related_id: string | null
          user_id: string
        }
        Insert: {
          activity_date: string
          activity_timestamp?: string
          activity_type: string
          amount?: number | null
          created_at?: string
          currency?: string | null
          description: string
          id?: string
          metadata?: Json | null
          related_id?: string | null
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_timestamp?: string
          activity_type?: string
          amount?: number | null
          created_at?: string
          currency?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          related_id?: string | null
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
          created_at: string
          currency: string
          id: string
          items: Json | null
          processing_status: string
          raw_ocr_data: Json | null
          receipt_date: string
          receipt_image_url: string
          total_amount: number
          updated_at: string
          user_id: string
          venue_location: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          items?: Json | null
          processing_status?: string
          raw_ocr_data?: Json | null
          receipt_date: string
          receipt_image_url: string
          total_amount: number
          updated_at?: string
          user_id: string
          venue_location?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          items?: Json | null
          processing_status?: string
          raw_ocr_data?: Json | null
          receipt_date?: string
          receipt_image_url?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          venue_location?: string | null
        }
        Relationships: []
      }
      member_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_check_in_date: string | null
          longest_streak: number
          streak_rewards_earned: Json | null
          total_check_ins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_check_in_date?: string | null
          longest_streak?: number
          streak_rewards_earned?: Json | null
          total_check_ins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_check_in_date?: string | null
          longest_streak?: number
          streak_rewards_earned?: Json | null
          total_check_ins?: number
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
            foreignKeyName: "notifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
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
          phone_number: string | null
          updated_at: string
          user_id: string
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
          phone_number?: string | null
          updated_at?: string
          user_id: string
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
          phone_number?: string | null
          updated_at?: string
          user_id?: string
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
      [_ in never]: never
    }
    Functions: {
      calculate_member_streak: {
        Args: { user_id_input: string }
        Returns: {
          current_streak: number
          longest_streak: number
          total_check_ins: number
        }[]
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
      get_app_setting: {
        Args: { setting_key: string }
        Returns: string
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
      get_last_thursday: {
        Args: { month_start: string }
        Returns: string
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
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_email_domain_allowed: {
        Args: { email: string }
        Returns: boolean
      }
      is_within_venue_bounds: {
        Args: { lat: number; lng: number }
        Returns: boolean
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
      loyalty_card_type: "regular" | "lucky7"
      notification_scope: "all" | "self"
      notification_status: "draft" | "queued" | "sending" | "sent" | "failed"
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
      loyalty_card_type: ["regular", "lucky7"],
      notification_scope: ["all", "self"],
      notification_status: ["draft", "queued", "sending", "sent", "failed"],
    },
  },
} as const
