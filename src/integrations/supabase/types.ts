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
      attachments: {
        Row: {
          created_at: string | null
          file_type: string | null
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      avatars: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: []
      }
      bedrooms: {
        Row: {
          count: number
          created_at: string | null
          display_order: number | null
          id: string
          max_occupancy: number | null
          notes: string | null
          property_id: string
          tier: string
        }
        Insert: {
          count?: number
          created_at?: string | null
          display_order?: number | null
          id?: string
          max_occupancy?: number | null
          notes?: string | null
          property_id: string
          tier: string
        }
        Update: {
          count?: number
          created_at?: string | null
          display_order?: number | null
          id?: string
          max_occupancy?: number | null
          notes?: string | null
          property_id?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "bedrooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      beo_documents: {
        Row: {
          created_at: string | null
          event_id: string
          file_name: string
          file_url: string
          id: string
          version: number | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          file_name: string
          file_url: string
          id?: string
          version?: number | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          file_name?: string
          file_url?: string
          id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "beo_documents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string | null
          date: string
          email: string
          event_id: string | null
          guests: number | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          time: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          email: string
          event_id?: string | null
          guests?: number | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          time?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          email?: string
          event_id?: string | null
          guests?: number | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          time?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      campaign_segments: {
        Row: {
          avg_spend: number | null
          campaign_id: string
          created_at: string | null
          filter_criteria: Json | null
          filters: Json | null
          id: string
          is_active: boolean | null
          member_count: number | null
          name: string | null
          segment_description: string | null
          segment_name: string
        }
        Insert: {
          avg_spend?: number | null
          campaign_id: string
          created_at?: string | null
          filter_criteria?: Json | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          member_count?: number | null
          name?: string | null
          segment_description?: string | null
          segment_name: string
        }
        Update: {
          avg_spend?: number | null
          campaign_id?: string
          created_at?: string | null
          filter_criteria?: Json | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          member_count?: number | null
          name?: string | null
          segment_description?: string | null
          segment_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_segments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          archived: boolean | null
          clicked_count: number | null
          created_at: string | null
          delivered_count: number | null
          description: string | null
          id: string
          message: string | null
          name: string
          scheduled_at: string | null
          sent_count: number | null
          status: string | null
          title: string | null
        }
        Insert: {
          archived?: boolean | null
          clicked_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          description?: string | null
          id?: string
          message?: string | null
          name: string
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string | null
          title?: string | null
        }
        Update: {
          archived?: boolean | null
          clicked_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          description?: string | null
          id?: string
          message?: string | null
          name?: string
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
      cb_enquiries: {
        Row: {
          category: string
          created_at: string
          details: Json
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          property: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          details?: Json
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          property?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          details?: Json
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          property?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cb_members: {
        Row: {
          birthday_day: number | null
          birthday_month: string | null
          consent_at: string | null
          consent_given: boolean
          created_at: string
          email: string
          first_name: string | null
          id: string
          interests: string[] | null
          last_name: string | null
          marketing_opt_in: boolean
          phone: string | null
          updated_at: string
          user_id: string
          wallet_pass_last_issued_at: string | null
          wallet_pass_revoked: boolean
          wallet_pass_serial_number: string | null
        }
        Insert: {
          birthday_day?: number | null
          birthday_month?: string | null
          consent_at?: string | null
          consent_given?: boolean
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          interests?: string[] | null
          last_name?: string | null
          marketing_opt_in?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
          wallet_pass_last_issued_at?: string | null
          wallet_pass_revoked?: boolean
          wallet_pass_serial_number?: string | null
        }
        Update: {
          birthday_day?: number | null
          birthday_month?: string | null
          consent_at?: string | null
          consent_given?: boolean
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          interests?: string[] | null
          last_name?: string | null
          marketing_opt_in?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
          wallet_pass_last_issued_at?: string | null
          wallet_pass_revoked?: boolean
          wallet_pass_serial_number?: string | null
        }
        Relationships: []
      }
      chat_members: {
        Row: {
          chat_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_group: boolean | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          name?: string | null
        }
        Relationships: []
      }
      cinema_bookings: {
        Row: {
          created_at: string | null
          guest_email: string | null
          guest_name: string | null
          id: string
          quantity: number | null
          release_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          quantity?: number | null
          release_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          quantity?: number | null
          release_id?: string
          user_id?: string | null
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
          capacity: number | null
          created_at: string | null
          description: string | null
          doors_time: string | null
          id: string
          is_active: boolean | null
          month_key: string
          poster_url: string | null
          screening_date: string | null
          screening_time: string | null
          title: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          doors_time?: string | null
          id?: string
          is_active?: boolean | null
          month_key: string
          poster_url?: string | null
          screening_date?: string | null
          screening_time?: string | null
          title: string
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          doors_time?: string | null
          id?: string
          is_active?: boolean | null
          month_key?: string
          poster_url?: string | null
          screening_date?: string | null
          screening_time?: string | null
          title?: string
        }
        Relationships: []
      }
      ck_collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "ck_collections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ck_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      ck_doc_versions: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          doc_id: string
          id: string
          version_number: number
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          doc_id: string
          id?: string
          version_number: number
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          doc_id?: string
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "ck_doc_versions_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "ck_docs"
            referencedColumns: ["id"]
          },
        ]
      }
      ck_docs: {
        Row: {
          collection_id: string | null
          content: string | null
          created_at: string | null
          id: string
          is_published: boolean | null
          slug: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          collection_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          slug?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          collection_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          slug?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ck_docs_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "ck_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      ck_files: {
        Row: {
          created_at: string | null
          doc_id: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
        }
        Insert: {
          created_at?: string | null
          doc_id: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
        }
        Update: {
          created_at?: string | null
          doc_id?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ck_files_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "ck_docs"
            referencedColumns: ["id"]
          },
        ]
      }
      ck_pins: {
        Row: {
          created_at: string | null
          doc_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          doc_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          doc_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ck_pins_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "ck_docs"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          is_from_client: boolean | null
          message: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_from_client?: boolean | null
          message: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_from_client?: boolean | null
          message?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_brand_assets: {
        Row: {
          asset_key: string | null
          asset_type: string
          asset_value: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          published: boolean | null
          url: string
        }
        Insert: {
          asset_key?: string | null
          asset_type: string
          asset_value?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          published?: boolean | null
          url: string
        }
        Update: {
          asset_key?: string | null
          asset_type?: string
          asset_value?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          published?: boolean | null
          url?: string
        }
        Relationships: []
      }
      cms_content: {
        Row: {
          content: string | null
          content_data: Json | null
          content_key: string | null
          content_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_published: boolean | null
          page: string
          published: boolean | null
          section: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_data?: Json | null
          content_key?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          page: string
          published?: boolean | null
          section: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_data?: Json | null
          content_key?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          page?: string
          published?: boolean | null
          section?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_design_tokens: {
        Row: {
          category: string | null
          created_at: string | null
          css_variable: string | null
          description: string | null
          id: string
          name: string
          published: boolean | null
          token_key: string | null
          token_type: string | null
          token_value: string | null
          value: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          css_variable?: string | null
          description?: string | null
          id?: string
          name: string
          published?: boolean | null
          token_key?: string | null
          token_type?: string | null
          token_value?: string | null
          value: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          css_variable?: string | null
          description?: string | null
          id?: string
          name?: string
          published?: boolean | null
          token_key?: string | null
          token_type?: string | null
          token_value?: string | null
          value?: string
        }
        Relationships: []
      }
      cms_faq_content: {
        Row: {
          answer: string | null
          created_at: string | null
          id: string
          page: string
          published: boolean | null
          question: string
          sort_order: number | null
        }
        Insert: {
          answer?: string | null
          created_at?: string | null
          id?: string
          page: string
          published?: boolean | null
          question: string
          sort_order?: number | null
        }
        Update: {
          answer?: string | null
          created_at?: string | null
          id?: string
          page?: string
          published?: boolean | null
          question?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      cms_global_content: {
        Row: {
          content_key: string | null
          content_type: string | null
          content_value: string | null
          created_at: string | null
          created_by: string | null
          id: string
          key: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          content_key?: string | null
          content_type?: string | null
          content_value?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          key?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          content_key?: string | null
          content_type?: string | null
          content_value?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          key?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      cms_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_url: string
          page: string
          published: boolean | null
          section: string
          sort_order: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          page: string
          published?: boolean | null
          section: string
          sort_order?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          page?: string
          published?: boolean | null
          section?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      cms_menu_items: {
        Row: {
          created_at: string | null
          description: string | null
          dietary_info: string[] | null
          id: string
          name: string
          price: number | null
          section_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dietary_info?: string[] | null
          id?: string
          name: string
          price?: number | null
          section_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dietary_info?: string[] | null
          id?: string
          name?: string
          price?: number | null
          section_id?: string
          sort_order?: number | null
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
          created_at: string | null
          id: string
          page: string
          section_name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          page: string
          section_name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          page?: string
          section_name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      cms_modal_content: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          modal_name: string
          page: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          modal_name: string
          page: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          modal_name?: string
          page?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          content: string | null
          created_at: string | null
          event_id: string | null
          id: string
          signed_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          signed_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      event_beo_versions: {
        Row: {
          content: Json | null
          created_at: string | null
          event_id: string
          id: string
          version_number: number
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          event_id: string
          id?: string
          version_number: number
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          event_id?: string
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_beo_versions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          event_id: string
          id: string
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          event_id: string
          id?: string
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          event_id?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_contacts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_equipment: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          item_name: string
          notes: string | null
          quantity: number | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          item_name: string
          notes?: string | null
          quantity?: number | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          item_name?: string
          notes?: string | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_equipment_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_menus: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          items: Json | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          items?: Json | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          items?: Json | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_menus_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_room_layouts: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          image_url: string | null
          layout_name: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          image_url?: string | null
          layout_name?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          image_url?: string | null
          layout_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_room_layouts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_schedule: {
        Row: {
          activity: string
          created_at: string | null
          end_time: string | null
          event_id: string
          id: string
          sort_order: number | null
          start_time: string | null
        }
        Insert: {
          activity: string
          created_at?: string | null
          end_time?: string | null
          event_id: string
          id?: string
          sort_order?: number | null
          start_time?: string | null
        }
        Update: {
          activity?: string
          created_at?: string | null
          end_time?: string | null
          event_id?: string
          id?: string
          sort_order?: number | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_schedule_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staffing: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          notes: string | null
          quantity: number | null
          role: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          quantity?: number | null
          role: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          quantity?: number | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_staffing_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_venue_hire: {
        Row: {
          created_at: string | null
          end_time: string | null
          event_id: string
          hire_date: string | null
          id: string
          price: number | null
          space_id: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          event_id: string
          hire_date?: string | null
          id?: string
          price?: number | null
          space_id?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          event_id?: string
          hire_date?: string | null
          id?: string
          price?: number | null
          space_id?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_venue_hire_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_venue_hire_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
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
          location: string
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
          location: string
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
          location?: string
          organizer?: string
          price?: number | null
          time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fb_venues: {
        Row: {
          capacity: number | null
          created_at: string | null
          description: string | null
          display_order: number | null
          formats: string[] | null
          id: string
          name: string
          property_id: string
          slug: string
          tone_blurb: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          formats?: string[] | null
          id?: string
          name: string
          property_id: string
          slug: string
          tone_blurb?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          formats?: string[] | null
          id?: string
          name?: string
          property_id?: string
          slug?: string
          tone_blurb?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fb_venues_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_daily_reports: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          report_date: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          report_date: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          report_date?: string
        }
        Relationships: []
      }
      feedback_submissions: {
        Row: {
          created_at: string | null
          drink_rating: number | null
          food_rating: number | null
          hospitality_rating: number | null
          id: string
          is_anonymous: boolean | null
          message: string | null
          overall_rating: number | null
          price_rating: number | null
          team_rating: number | null
          user_id: string | null
          venue_rating: number | null
        }
        Insert: {
          created_at?: string | null
          drink_rating?: number | null
          food_rating?: number | null
          hospitality_rating?: number | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          overall_rating?: number | null
          price_rating?: number | null
          team_rating?: number | null
          user_id?: string | null
          venue_rating?: number | null
        }
        Update: {
          created_at?: string | null
          drink_rating?: number | null
          food_rating?: number | null
          hospitality_rating?: number | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          overall_rating?: number | null
          price_rating?: number | null
          team_rating?: number | null
          user_id?: string | null
          venue_rating?: number | null
        }
        Relationships: []
      }
      geo_areas: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number | null
          created_at: string | null
          due_date: string | null
          event_id: string | null
          id: string
          invoice_number: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          invoice_number?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          invoice_number?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_vendor_inquiries: {
        Row: {
          created_at: string | null
          cuisine_type: string | null
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          cuisine_type?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          cuisine_type?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      lead_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          created_by: string | null
          id: string
          lead_id: string
          notes: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id: string
          notes?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activity_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget: number | null
          company: string | null
          created_at: string | null
          email: string
          event_date: string | null
          event_type: string | null
          guests: number | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget?: number | null
          company?: string | null
          created_at?: string | null
          email: string
          event_date?: string | null
          event_type?: string | null
          guests?: number | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget?: number | null
          company?: string | null
          created_at?: string | null
          email?: string
          event_date?: string | null
          event_type?: string | null
          guests?: number | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ledger_passwords: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      loyalty_cards: {
        Row: {
          card_number: string | null
          created_at: string | null
          id: string
          points: number | null
          tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_number?: string | null
          created_at?: string | null
          id?: string
          points?: number | null
          tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_number?: string | null
          created_at?: string | null
          id?: string
          points?: number | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      loyalty_entries: {
        Row: {
          card_id: string
          created_at: string | null
          description: string | null
          id: string
          points_earned: number | null
          points_redeemed: number | null
        }
        Insert: {
          card_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          points_earned?: number | null
          points_redeemed?: number | null
        }
        Update: {
          card_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          points_earned?: number | null
          points_redeemed?: number | null
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
          created_at: string | null
          date: string
          id: string
          max_orders: number | null
          orders_count: number | null
          slot_time: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          max_orders?: number | null
          orders_count?: number | null
          slot_time: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          max_orders?: number | null
          orders_count?: number | null
          slot_time?: string
        }
        Relationships: []
      }
      lunch_menu: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          name: string
          price: number | null
          sort_order: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name: string
          price?: number | null
          sort_order?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name?: string
          price?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      lunch_orders: {
        Row: {
          created_at: string | null
          id: string
          items: Json | null
          order_date: string
          status: string | null
          total_amount: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          items?: Json | null
          order_date: string
          status?: string | null
          total_amount?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json | null
          order_date?: string
          status?: string | null
          total_amount?: number | null
          user_id?: string
        }
        Relationships: []
      }
      lunch_time_slots: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          max_orders: number | null
          slot_time: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_orders?: number | null
          slot_time: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_orders?: number | null
          slot_time?: string
        }
        Relationships: []
      }
      management_event_line_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          event_id: string
          id: string
          quantity: number | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description: string
          event_id: string
          id?: string
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string
          event_id?: string
          id?: string
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
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
          client_email: string | null
          client_name: string | null
          created_at: string | null
          event_date: string | null
          event_type: string | null
          id: string
          name: string
          status: string | null
          total_budget: number | null
          updated_at: string | null
        }
        Insert: {
          client_email?: string | null
          client_name?: string | null
          created_at?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          name: string
          status?: string | null
          total_budget?: number | null
          updated_at?: string | null
        }
        Update: {
          client_email?: string | null
          client_name?: string | null
          created_at?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          name?: string
          status?: string | null
          total_budget?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      management_profiles: {
        Row: {
          created_at: string | null
          department: string | null
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean | null
          job_title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      member_check_ins: {
        Row: {
          check_in_date: string
          created_at: string | null
          entrance_slug: string | null
          id: string
          user_id: string
        }
        Insert: {
          check_in_date: string
          created_at?: string | null
          entrance_slug?: string | null
          id?: string
          user_id: string
        }
        Update: {
          check_in_date?: string
          created_at?: string | null
          entrance_slug?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      member_ledger: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          receipt_id: string | null
          transaction_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          receipt_id?: string | null
          transaction_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          receipt_id?: string | null
          transaction_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_ledger_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "member_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      member_moments: {
        Row: {
          ai_confidence_score: number | null
          ai_flags: Json | null
          caption: string | null
          created_at: string | null
          date_taken: string | null
          id: string
          image_url: string
          is_approved: boolean | null
          is_featured: boolean | null
          is_visible: boolean | null
          latitude: number | null
          location_confirmed: boolean | null
          longitude: number | null
          moderated_at: string | null
          moderation_reason: string | null
          moderation_status: string | null
          tagline: string | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_flags?: Json | null
          caption?: string | null
          created_at?: string | null
          date_taken?: string | null
          id?: string
          image_url: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_visible?: boolean | null
          latitude?: number | null
          location_confirmed?: boolean | null
          longitude?: number | null
          moderated_at?: string | null
          moderation_reason?: string | null
          moderation_status?: string | null
          tagline?: string | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          ai_flags?: Json | null
          caption?: string | null
          created_at?: string | null
          date_taken?: string | null
          id?: string
          image_url?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_visible?: boolean | null
          latitude?: number | null
          location_confirmed?: boolean | null
          longitude?: number | null
          moderated_at?: string | null
          moderation_reason?: string | null
          moderation_status?: string | null
          tagline?: string | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      member_profiles_extended: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          preferences: Json | null
          tier_badge: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          preferences?: Json | null
          tier_badge?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          preferences?: Json | null
          tier_badge?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      member_receipts: {
        Row: {
          bear_logo_confidence: number | null
          bear_logo_detected: boolean
          category: string | null
          covers: number | null
          created_at: string | null
          currency: string | null
          id: string
          image_sha256: string | null
          image_url: string | null
          items: Json | null
          merchant_name: string | null
          perceptual_hash: string | null
          processing_status: string
          raw_ocr_data: Json | null
          receipt_date: string | null
          receipt_number: string | null
          receipt_time: string | null
          rejection_reason: string | null
          screen_capture_score: number | null
          total_amount: number | null
          user_id: string
          venue_location: string | null
        }
        Insert: {
          bear_logo_confidence?: number | null
          bear_logo_detected?: boolean
          category?: string | null
          covers?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          image_sha256?: string | null
          image_url?: string | null
          items?: Json | null
          merchant_name?: string | null
          perceptual_hash?: string | null
          processing_status?: string
          raw_ocr_data?: Json | null
          receipt_date?: string | null
          receipt_number?: string | null
          receipt_time?: string | null
          rejection_reason?: string | null
          screen_capture_score?: number | null
          total_amount?: number | null
          user_id: string
          venue_location?: string | null
        }
        Update: {
          bear_logo_confidence?: number | null
          bear_logo_detected?: boolean
          category?: string | null
          covers?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          image_sha256?: string | null
          image_url?: string | null
          items?: Json | null
          merchant_name?: string | null
          perceptual_hash?: string | null
          processing_status?: string
          raw_ocr_data?: Json | null
          receipt_date?: string | null
          receipt_number?: string | null
          receipt_time?: string | null
          rejection_reason?: string | null
          screen_capture_score?: number | null
          total_amount?: number | null
          user_id?: string
          venue_location?: string | null
        }
        Relationships: []
      }
      member_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_check_in_date: string | null
          longest_streak: number | null
          total_check_ins: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_check_in_date?: string | null
          longest_streak?: number | null
          total_check_ins?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_check_in_date?: string | null
          longest_streak?: number | null
          total_check_ins?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_debug_logs: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          level: string | null
          message: string | null
          metadata: Json | null
          session_id: string | null
          step: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          level?: string | null
          message?: string | null
          metadata?: Json | null
          session_id?: string | null
          step?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          level?: string | null
          message?: string | null
          metadata?: Json | null
          session_id?: string | null
          step?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      moment_likes: {
        Row: {
          created_at: string | null
          id: string
          moment_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          moment_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      moments: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_deliveries: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          notification_id: string
          status: string | null
          subscription_id: string
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          notification_id: string
          status?: string | null
          subscription_id: string
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string
          status?: string | null
          subscription_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          archived: boolean | null
          body: string
          campaign_id: string | null
          created_at: string | null
          data: Json | null
          dry_run: boolean | null
          failed_count: number | null
          id: string
          is_broadcast: boolean | null
          is_read: boolean | null
          recipients_count: number | null
          scheduled_for: string | null
          scope: string | null
          sent_at: string | null
          status: string | null
          success_count: number | null
          title: string
          user_id: string | null
        }
        Insert: {
          archived?: boolean | null
          body: string
          campaign_id?: string | null
          created_at?: string | null
          data?: Json | null
          dry_run?: boolean | null
          failed_count?: number | null
          id?: string
          is_broadcast?: boolean | null
          is_read?: boolean | null
          recipients_count?: number | null
          scheduled_for?: string | null
          scope?: string | null
          sent_at?: string | null
          status?: string | null
          success_count?: number | null
          title: string
          user_id?: string | null
        }
        Update: {
          archived?: boolean | null
          body?: string
          campaign_id?: string | null
          created_at?: string | null
          data?: Json | null
          dry_run?: boolean | null
          failed_count?: number | null
          id?: string
          is_broadcast?: boolean | null
          is_read?: boolean | null
          recipients_count?: number | null
          scheduled_for?: string | null
          scope?: string | null
          sent_at?: string | null
          status?: string | null
          success_count?: number | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      org_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          id: string
          page_path: string | null
          session_id: string | null
          time_spent_seconds: number | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          page_path?: string | null
          session_id?: string | null
          time_spent_seconds?: number | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          page_path?: string | null
          session_id?: string | null
          time_spent_seconds?: number | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      pong_scores: {
        Row: {
          created_at: string | null
          id: string
          player_name: string | null
          score: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          player_name?: string | null
          score: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          player_name?: string | null
          score?: number
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          interests: string[] | null
          last_name: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          interests?: string[] | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          interests?: string[] | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          positioning: string | null
          signature_feel: string | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          positioning?: string | null
          signature_feel?: string | null
          slug: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          positioning?: string | null
          signature_feel?: string | null
          slug?: string
        }
        Relationships: []
      }
      proposal_pdfs: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          pdf_url: string
          version_number: number | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          pdf_url: string
          version_number?: number | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          pdf_url?: string
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_pdfs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_versions: {
        Row: {
          content: Json | null
          created_at: string | null
          event_id: string
          id: string
          version_number: number
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          event_id: string
          id?: string
          version_number: number
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          event_id?: string
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_versions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "management_events"
            referencedColumns: ["id"]
          },
        ]
      }
      push_optin_events: {
        Row: {
          created_at: string | null
          event: string | null
          event_type: string
          id: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event?: string | null
          event_type: string
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event?: string | null
          event_type?: string
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh?: string
          user_id?: string | null
        }
        Relationships: []
      }
      receipt_rejections: {
        Row: {
          ai_flags: Json | null
          created_at: string
          id: string
          image_sha256: string | null
          image_url: string | null
          reason_code: string
          reason_message: string
          user_id: string
        }
        Insert: {
          ai_flags?: Json | null
          created_at?: string
          id?: string
          image_sha256?: string | null
          image_url?: string | null
          reason_code: string
          reason_message: string
          user_id: string
        }
        Update: {
          ai_flags?: Json | null
          created_at?: string
          id?: string
          image_sha256?: string | null
          image_url?: string | null
          reason_code?: string
          reason_message?: string
          user_id?: string
        }
        Relationships: []
      }
      recent_biometric: {
        Row: {
          created_at: string | null
          device_id: string | null
          id: string
          last_used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          last_used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          last_used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      secret_kitchen_access: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          id: string
          kitchen_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          kitchen_slug: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          kitchen_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      secret_kitchen_usage: {
        Row: {
          access_id: string
          id: string
          notes: string | null
          used_at: string | null
        }
        Insert: {
          access_id: string
          id?: string
          notes?: string | null
          used_at?: string | null
        }
        Update: {
          access_id?: string
          id?: string
          notes?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secret_kitchen_usage_access_id_fkey"
            columns: ["access_id"]
            isOneToOne: false
            referencedRelation: "secret_kitchen_access"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_words: {
        Row: {
          active_date: string
          created_at: string | null
          id: string
          is_active: boolean | null
          word: string
        }
        Insert: {
          active_date: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          word: string
        }
        Update: {
          active_date?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          word?: string
        }
        Relationships: []
      }
      space_hours: {
        Row: {
          close_time: string | null
          created_at: string | null
          day_of_week: number
          id: string
          is_closed: boolean | null
          open_time: string | null
          space_id: string
        }
        Insert: {
          close_time?: string | null
          created_at?: string | null
          day_of_week: number
          id?: string
          is_closed?: boolean | null
          open_time?: string | null
          space_id: string
        }
        Update: {
          close_time?: string | null
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_closed?: boolean | null
          open_time?: string | null
          space_id?: string
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
          av_included: boolean | null
          capacity: number | null
          capacity_dining: number | null
          capacity_seated: number | null
          capacity_standing: number | null
          combinable_with: string[] | null
          created_at: string | null
          description: string | null
          display_order: number | null
          event_types: string[] | null
          exclusivity_notes: string | null
          hire_notes: string | null
          id: string
          image_url: string | null
          indoor_outdoor: string | null
          is_active: boolean | null
          layouts: string[] | null
          max_guests: number | null
          min_guests: number | null
          min_spend_notes: string | null
          music_curfew: string | null
          name: string
          property_id: string | null
          slug: string
          step_free: boolean | null
          tone_blurb: string | null
        }
        Insert: {
          av_included?: boolean | null
          capacity?: number | null
          capacity_dining?: number | null
          capacity_seated?: number | null
          capacity_standing?: number | null
          combinable_with?: string[] | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          event_types?: string[] | null
          exclusivity_notes?: string | null
          hire_notes?: string | null
          id?: string
          image_url?: string | null
          indoor_outdoor?: string | null
          is_active?: boolean | null
          layouts?: string[] | null
          max_guests?: number | null
          min_guests?: number | null
          min_spend_notes?: string | null
          music_curfew?: string | null
          name: string
          property_id?: string | null
          slug: string
          step_free?: boolean | null
          tone_blurb?: string | null
        }
        Update: {
          av_included?: boolean | null
          capacity?: number | null
          capacity_dining?: number | null
          capacity_seated?: number | null
          capacity_standing?: number | null
          combinable_with?: string[] | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          event_types?: string[] | null
          exclusivity_notes?: string | null
          hire_notes?: string | null
          id?: string
          image_url?: string | null
          indoor_outdoor?: string | null
          is_active?: boolean | null
          layouts?: string[] | null
          max_guests?: number | null
          min_guests?: number | null
          min_spend_notes?: string | null
          music_curfew?: string | null
          name?: string
          property_id?: string | null
          slug?: string
          step_free?: boolean | null
          tone_blurb?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spaces_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          consent_given: boolean | null
          consent_timestamp: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          interests: string[] | null
          is_active: boolean | null
          last_name: string | null
          name: string | null
        }
        Insert: {
          consent_given?: boolean | null
          consent_timestamp?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          last_name?: string | null
          name?: string | null
        }
        Update: {
          consent_given?: boolean | null
          consent_timestamp?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          last_name?: string | null
          name?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          additional_data: Json | null
          coordinates: Json | null
          created_at: string | null
          element_id: string | null
          element_text: string | null
          id: string
          interaction_type: string | null
          page_path: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          additional_data?: Json | null
          coordinates?: Json | null
          created_at?: string | null
          element_id?: string | null
          element_text?: string | null
          id?: string
          interaction_type?: string | null
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          additional_data?: Json | null
          coordinates?: Json | null
          created_at?: string | null
          element_id?: string | null
          element_text?: string | null
          id?: string
          interaction_type?: string | null
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_journeys: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          entry_page: string | null
          exit_page: string | null
          id: string
          pages_visited: string[] | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          pages_visited?: string[] | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          pages_visited?: string[] | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          device_info: Json | null
          ended_at: string | null
          id: string
          session_id: string
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          device_info?: Json | null
          ended_at?: string | null
          id?: string
          session_id: string
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          device_info?: Json | null
          ended_at?: string | null
          id?: string
          session_id?: string
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_lead_possible_duplicates: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          duplicate_lead_id: string
          id: string
          lead_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          duplicate_lead_id: string
          id?: string
          lead_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          duplicate_lead_id?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v_lead_possible_duplicates_duplicate_lead_id_fkey"
            columns: ["duplicate_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v_lead_possible_duplicates_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          slug: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          slug: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      walk_card_geo_areas: {
        Row: {
          created_at: string | null
          geo_area_id: string
          id: string
          walk_card_id: string
        }
        Insert: {
          created_at?: string | null
          geo_area_id: string
          id?: string
          walk_card_id: string
        }
        Update: {
          created_at?: string | null
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
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      walk_entries: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          rating: number | null
          venue_id: string | null
          visited_at: string | null
          walk_card_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          venue_id?: string | null
          visited_at?: string | null
          walk_card_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          venue_id?: string | null
          visited_at?: string | null
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
        ]
      }
      webauthn_user_links: {
        Row: {
          counter: number | null
          created_at: string | null
          credential_id: string
          device_name: string | null
          id: string
          public_key: string
          user_id: string
        }
        Insert: {
          counter?: number | null
          created_at?: string | null
          credential_id: string
          device_name?: string | null
          id?: string
          public_key: string
          user_id: string
        }
        Update: {
          counter?: number | null
          created_at?: string | null
          credential_id?: string
          device_name?: string | null
          id?: string
          public_key?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_secret_kitchen_access_status: {
        Args: { user_email: string }
        Returns: {
          granted_at: string
          has_access: boolean
          kitchen_slug: string
        }[]
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
          release_id: string
          ticket_numbers: number[]
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_cinema_status:
        | {
            Args: never
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
        | {
            Args: { p_release_id: string }
            Returns: {
              remaining_capacity: number
              total_bookings: number
              total_quantity: number
            }[]
          }
      is_email_domain_allowed: { Args: { email: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
