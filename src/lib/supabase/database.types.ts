export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["activity_log_entity_type"]
          id: string
          space_id: string
          work_order_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: Database["public"]["Enums"]["activity_log_entity_type"]
          id?: string
          space_id: string
          work_order_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["activity_log_entity_type"]
          id?: string
          space_id?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      archive_activity_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          archive_folder_id: string | null
          archived_work_order_id: string | null
          created_at: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          archive_folder_id?: string | null
          archived_work_order_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          archive_folder_id?: string | null
          archived_work_order_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "archive_activity_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archive_activity_logs_archive_folder_id_fkey"
            columns: ["archive_folder_id"]
            isOneToOne: false
            referencedRelation: "archive_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archive_activity_logs_archived_work_order_id_fkey"
            columns: ["archived_work_order_id"]
            isOneToOne: false
            referencedRelation: "archived_work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      archive_folders: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          id: string
          is_system_default: boolean
          name: string
          owner_user_id: string | null
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_system_default?: boolean
          name: string
          owner_user_id?: string | null
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_system_default?: boolean
          name?: string
          owner_user_id?: string | null
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "archive_folders_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archive_folders_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archive_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "archive_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      archived_work_orders: {
        Row: {
          archive_folder_id: string
          archived_at: string
          archived_by_user_id: string | null
          created_at: string
          id: string
          immutable: boolean
          original_work_order_id: string
          owner_user_id: string
          space_id: string
          status_snapshot: Database["public"]["Enums"]["work_order_status"]
          title_snapshot: string
          updated_at: string
        }
        Insert: {
          archive_folder_id: string
          archived_at?: string
          archived_by_user_id?: string | null
          created_at?: string
          id?: string
          immutable?: boolean
          original_work_order_id: string
          owner_user_id: string
          space_id: string
          status_snapshot: Database["public"]["Enums"]["work_order_status"]
          title_snapshot: string
          updated_at?: string
        }
        Update: {
          archive_folder_id?: string
          archived_at?: string
          archived_by_user_id?: string | null
          created_at?: string
          id?: string
          immutable?: boolean
          original_work_order_id?: string
          owner_user_id?: string
          space_id?: string
          status_snapshot?: Database["public"]["Enums"]["work_order_status"]
          title_snapshot?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "archived_work_orders_archive_folder_id_fkey"
            columns: ["archive_folder_id"]
            isOneToOne: false
            referencedRelation: "archive_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archived_work_orders_archived_by_user_id_fkey"
            columns: ["archived_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archived_work_orders_original_work_order_id_fkey"
            columns: ["original_work_order_id"]
            isOneToOne: true
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archived_work_orders_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archived_work_orders_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folders: {
        Row: {
          created_at: string
          created_by_user_id: string
          id: string
          name: string
          parent_folder_id: string | null
          sort_order: number
          space_id: string
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          id?: string
          name: string
          parent_folder_id?: string | null
          sort_order?: number
          space_id: string
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          id?: string
          name?: string
          parent_folder_id?: string | null
          sort_order?: number
          space_id?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          chat_message_id: string | null
          created_at: string
          document_kind: string
          external_url: string | null
          file_name: string
          file_size_bytes: number | null
          folder_id: string | null
          id: string
          is_archived: boolean
          mime_type: string | null
          source: string
          source_sent_at: string | null
          space_id: string
          storage_path: string | null
          title: string
          updated_at: string
          uploaded_by_user_id: string
          work_order_id: string | null
        }
        Insert: {
          chat_message_id?: string | null
          created_at?: string
          document_kind?: string
          external_url?: string | null
          file_name: string
          file_size_bytes?: number | null
          folder_id?: string | null
          id?: string
          is_archived?: boolean
          mime_type?: string | null
          source?: string
          source_sent_at?: string | null
          space_id: string
          storage_path?: string | null
          title: string
          updated_at?: string
          uploaded_by_user_id: string
          work_order_id?: string | null
        }
        Update: {
          chat_message_id?: string | null
          created_at?: string
          document_kind?: string
          external_url?: string | null
          file_name?: string
          file_size_bytes?: number | null
          folder_id?: string | null
          id?: string
          is_archived?: boolean
          mime_type?: string | null
          source?: string
          source_sent_at?: string | null
          space_id?: string
          storage_path?: string | null
          title?: string
          updated_at?: string
          uploaded_by_user_id?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_chat_message_id_fkey"
            columns: ["chat_message_id"]
            isOneToOne: false
            referencedRelation: "work_order_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          accepted_by_user_id: string | null
          assigned_work_order_ids: string[]
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invite_code: string | null
          invited_by_user_id: string
          message: string | null
          method: Database["public"]["Enums"]["invite_method"]
          role: Database["public"]["Enums"]["app_role"]
          space_id: string
          status: Database["public"]["Enums"]["invite_status"]
          target_user_id: string | null
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          assigned_work_order_ids?: string[]
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          invite_code?: string | null
          invited_by_user_id: string
          message?: string | null
          method?: Database["public"]["Enums"]["invite_method"]
          role: Database["public"]["Enums"]["app_role"]
          space_id: string
          status?: Database["public"]["Enums"]["invite_status"]
          target_user_id?: string | null
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          assigned_work_order_ids?: string[]
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invite_code?: string | null
          invited_by_user_id?: string
          message?: string | null
          method?: Database["public"]["Enums"]["invite_method"]
          role?: Database["public"]["Enums"]["app_role"]
          space_id?: string
          status?: Database["public"]["Enums"]["invite_status"]
          target_user_id?: string | null
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_accepted_by_user_id_fkey"
            columns: ["accepted_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_invited_by_user_id_fkey"
            columns: ["invited_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_market_posts: {
        Row: {
          closed_at: string | null
          created_at: string
          description_snapshot: string | null
          id: string
          location_label: string | null
          posted_at: string
          space_id: string
          status: Database["public"]["Enums"]["job_market_post_status"]
          title_snapshot: string
          updated_at: string
          work_order_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          description_snapshot?: string | null
          id?: string
          location_label?: string | null
          posted_at?: string
          space_id: string
          status?: Database["public"]["Enums"]["job_market_post_status"]
          title_snapshot: string
          updated_at?: string
          work_order_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          description_snapshot?: string | null
          id?: string
          location_label?: string | null
          posted_at?: string
          space_id?: string
          status?: Database["public"]["Enums"]["job_market_post_status"]
          title_snapshot?: string
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_market_posts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_market_posts_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: true
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_definitions: {
        Row: {
          created_at: string
          default_admin: boolean
          default_contractor: boolean
          default_manager: boolean
          default_member: boolean
          description: string
          is_system_locked: boolean
          key: string
          scope: Database["public"]["Enums"]["permission_scope"]
        }
        Insert: {
          created_at?: string
          default_admin?: boolean
          default_contractor?: boolean
          default_manager?: boolean
          default_member?: boolean
          description: string
          is_system_locked?: boolean
          key: string
          scope: Database["public"]["Enums"]["permission_scope"]
        }
        Update: {
          created_at?: string
          default_admin?: boolean
          default_contractor?: boolean
          default_manager?: boolean
          default_member?: boolean
          description?: string
          is_system_locked?: boolean
          key?: string
          scope?: Database["public"]["Enums"]["permission_scope"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          additional_emails: string[]
          avatar_file_name: string | null
          avatar_path: string | null
          company_address: string | null
          company_email: string | null
          company_facebook_url: string | null
          company_instagram_url: string | null
          company_name: string | null
          company_website: string | null
          company_x_url: string | null
          contact_info: string | null
          created_at: string
          date_format: string
          default_landing_page: string
          display_name: string | null
          email: string
          email_notifications_enabled: boolean
          email_verified_at: string | null
          full_name: string
          id: string
          in_app_notifications_enabled: boolean
          mentions_only_mode: boolean
          represents_company: boolean
          theme_preference: string
          timezone: string
          updated_at: string
          user_tag: string | null
        }
        Insert: {
          additional_emails?: string[]
          avatar_file_name?: string | null
          avatar_path?: string | null
          company_address?: string | null
          company_email?: string | null
          company_facebook_url?: string | null
          company_instagram_url?: string | null
          company_name?: string | null
          company_website?: string | null
          company_x_url?: string | null
          contact_info?: string | null
          created_at?: string
          date_format?: string
          default_landing_page?: string
          display_name?: string | null
          email: string
          email_notifications_enabled?: boolean
          email_verified_at?: string | null
          full_name: string
          id: string
          in_app_notifications_enabled?: boolean
          mentions_only_mode?: boolean
          represents_company?: boolean
          theme_preference?: string
          timezone?: string
          updated_at?: string
          user_tag?: string | null
        }
        Update: {
          additional_emails?: string[]
          avatar_file_name?: string | null
          avatar_path?: string | null
          company_address?: string | null
          company_email?: string | null
          company_facebook_url?: string | null
          company_instagram_url?: string | null
          company_name?: string | null
          company_website?: string | null
          company_x_url?: string | null
          contact_info?: string | null
          created_at?: string
          date_format?: string
          default_landing_page?: string
          display_name?: string | null
          email?: string
          email_notifications_enabled?: boolean
          email_verified_at?: string | null
          full_name?: string
          id?: string
          in_app_notifications_enabled?: boolean
          mentions_only_mode?: boolean
          represents_company?: boolean
          theme_preference?: string
          timezone?: string
          updated_at?: string
          user_tag?: string | null
        }
        Relationships: []
      }
      space_memberships: {
        Row: {
          created_at: string
          id: string
          invited_by_user_id: string | null
          removed_at: string | null
          removed_by_user_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          space_id: string
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by_user_id?: string | null
          removed_at?: string | null
          removed_by_user_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          space_id: string
          status?: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by_user_id?: string | null
          removed_at?: string | null
          removed_by_user_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          space_id?: string
          status?: Database["public"]["Enums"]["membership_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_memberships_invited_by_user_id_fkey"
            columns: ["invited_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_memberships_removed_by_user_id_fkey"
            columns: ["removed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_memberships_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      space_role_permissions: {
        Row: {
          created_at: string
          id: string
          is_allowed: boolean
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          space_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_allowed?: boolean
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          space_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_allowed?: boolean
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permission_definitions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "space_role_permissions_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          address: string | null
          created_at: string
          created_by_user_id: string
          id: string
          invite_code: string | null
          invite_token: string | null
          name: string
          photo_file_name: string | null
          photo_path: string | null
          space_type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by_user_id: string
          id?: string
          invite_code?: string | null
          invite_token?: string | null
          name: string
          photo_file_name?: string | null
          photo_path?: string | null
          space_type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by_user_id?: string
          id?: string
          invite_code?: string | null
          invite_token?: string | null
          name?: string
          photo_file_name?: string | null
          photo_path?: string | null
          space_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_memberships: {
        Row: {
          assigned_by_user_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          work_order_id: string
        }
        Insert: {
          assigned_by_user_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          work_order_id: string
        }
        Update: {
          assigned_by_user_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_memberships_assigned_by_user_id_fkey"
            columns: ["assigned_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_memberships_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_message_attachments: {
        Row: {
          created_at: string
          document_id: string | null
          file_name: string
          file_size_bytes: number | null
          id: string
          message_id: string
          mime_type: string | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          file_name: string
          file_size_bytes?: number | null
          id?: string
          message_id: string
          mime_type?: string | null
          storage_path: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          message_id?: string
          mime_type?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_message_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "work_order_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_user_id: string
          updated_at: string
          work_order_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_user_id: string
          updated_at?: string
          work_order_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_user_id?: string
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_messages_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_permission_definitions: {
        Row: {
          created_at: string
          default_admin: boolean
          default_manager: boolean
          default_member: boolean
          description: string | null
          group_name: string
          is_sensitive: boolean
          key: string
          label: string
        }
        Insert: {
          created_at?: string
          default_admin?: boolean
          default_manager?: boolean
          default_member?: boolean
          description?: string | null
          group_name: string
          is_sensitive?: boolean
          key: string
          label: string
        }
        Update: {
          created_at?: string
          default_admin?: boolean
          default_manager?: boolean
          default_member?: boolean
          description?: string | null
          group_name?: string
          is_sensitive?: boolean
          key?: string
          label?: string
        }
        Relationships: []
      }
      work_order_role_permissions: {
        Row: {
          created_at: string
          id: string
          is_allowed: boolean
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          work_order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_allowed?: boolean
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          work_order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_allowed?: boolean
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "work_order_permission_definitions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "work_order_role_permissions_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          allow_document_deletion_in_progress: boolean
          auto_save_chat_attachments: boolean
          created_at: string
          created_by_user_id: string
          description: string | null
          due_date: string | null
          expiration_at: string | null
          id: string
          is_posted_to_job_market: boolean
          location_label: string | null
          lock_documents_on_completed: boolean
          owner_user_id: string
          priority: string
          space_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["work_order_status"]
          subject: string | null
          subject_type: string
          title: string
          unit_label: string | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          allow_document_deletion_in_progress?: boolean
          auto_save_chat_attachments?: boolean
          created_at?: string
          created_by_user_id: string
          description?: string | null
          due_date?: string | null
          expiration_at?: string | null
          id?: string
          is_posted_to_job_market?: boolean
          location_label?: string | null
          lock_documents_on_completed?: boolean
          owner_user_id: string
          priority?: string
          space_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          subject?: string | null
          subject_type?: string
          title: string
          unit_label?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          allow_document_deletion_in_progress?: boolean
          auto_save_chat_attachments?: boolean
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          due_date?: string | null
          expiration_at?: string | null
          id?: string
          is_posted_to_job_market?: boolean
          location_label?: string | null
          lock_documents_on_completed?: boolean
          owner_user_id?: string
          priority?: string
          space_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          subject?: string | null
          subject_type?: string
          title?: string
          unit_label?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_space_invite_code: {
        Args: { input_code: string }
        Returns: string
      }
      accept_space_invite_token: {
        Args: { input_token: string }
        Returns: string
      }
      can_access_archive: { Args: never; Returns: boolean }
      can_access_archive_folder: {
        Args: { target_folder_id: string }
        Returns: boolean
      }
      can_access_archived_work_order: {
        Args: { target_archived_work_order_id: string }
        Returns: boolean
      }
      can_access_profile_avatar: {
        Args: { object_name: string }
        Returns: boolean
      }
      can_access_storage_object: {
        Args: { object_name: string }
        Returns: boolean
      }
      can_access_work_order: {
        Args: { target_work_order_id: string }
        Returns: boolean
      }
      can_collaborate_on_work_order: {
        Args: { target_work_order_id: string }
        Returns: boolean
      }
      can_edit_work_order: {
        Args: { target_work_order_id: string }
        Returns: boolean
      }
      can_manage_work_order: {
        Args: { target_work_order_id: string }
        Returns: boolean
      }
      can_update_work_order: {
        Args: { target_work_order_id: string }
        Returns: boolean
      }
      can_upload_work_order_document: {
        Args: { target_work_order_id: string }
        Returns: boolean
      }
      can_upload_work_order_message_file: {
        Args: { target_work_order_id: string }
        Returns: boolean
      }
      can_write_storage_object: {
        Args: { object_name: string }
        Returns: boolean
      }
      find_profile_by_user_tag: {
        Args: { input_user_tag: string }
        Returns: {
          avatar_path: string
          email: string
          email_verified_at: string
          full_name: string
          id: string
          user_tag: string
        }[]
      }
      find_space_by_invite_code: {
        Args: { input_code: string }
        Returns: {
          id: string
          invite_code: string
          name: string
        }[]
      }
      find_space_by_invite_token: {
        Args: { input_token: string }
        Returns: {
          id: string
          invite_code: string
          name: string
        }[]
      }
      generate_space_invite_code: { Args: never; Returns: string }
      generate_space_invite_token: { Args: never; Returns: string }
      has_space_role: {
        Args: {
          allowed_roles: Database["public"]["Enums"]["app_role"][]
          target_space_id: string
        }
        Returns: boolean
      }
      has_work_order_permission: {
        Args: { target_permission_key: string; target_work_order_id: string }
        Returns: boolean
      }
      is_space_member: { Args: { target_space_id: string }; Returns: boolean }
      seed_default_role_permissions: {
        Args: { target_space_id: string }
        Returns: undefined
      }
      seed_default_work_order_role_permissions: {
        Args: { target_work_order_id: string }
        Returns: undefined
      }
      shares_space_with_profile: {
        Args: { target_profile_id: string }
        Returns: boolean
      }
      storage_object_category: {
        Args: { object_name: string }
        Returns: string
      }
      storage_object_profile_owner_id: {
        Args: { object_name: string }
        Returns: string
      }
      storage_object_space_id: {
        Args: { object_name: string }
        Returns: string
      }
      storage_object_work_order_id: {
        Args: { object_name: string }
        Returns: string
      }
    }
    Enums: {
      activity_log_entity_type:
        | "space"
        | "space_membership"
        | "work_order"
        | "work_order_membership"
        | "job_market_post"
        | "document_folder"
        | "document"
        | "message"
        | "invite"
      app_role:
        | "admin"
        | "operations_manager"
        | "manager"
        | "officer_coordinator"
        | "field_lead_superintendent"
        | "helper"
        | "contractor"
        | "worker"
      invite_method: "email" | "link" | "code"
      invite_status: "pending" | "accepted" | "revoked" | "expired"
      job_market_post_status: "active" | "closed" | "withdrawn"
      membership_status: "active" | "removed"
      permission_scope:
        | "space"
        | "membership"
        | "work_order"
        | "document"
        | "job_market"
        | "invite"
      work_order_status:
        | "open"
        | "in_progress"
        | "completed"
        | "archived"
        | "on_hold"
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
      activity_log_entity_type: [
        "space",
        "space_membership",
        "work_order",
        "work_order_membership",
        "job_market_post",
        "document_folder",
        "document",
        "message",
        "invite",
      ],
      app_role: [
        "admin",
        "operations_manager",
        "manager",
        "officer_coordinator",
        "field_lead_superintendent",
        "helper",
        "contractor",
        "worker",
      ],
      invite_method: ["email", "link", "code"],
      invite_status: ["pending", "accepted", "revoked", "expired"],
      job_market_post_status: ["active", "closed", "withdrawn"],
      membership_status: ["active", "removed"],
      permission_scope: [
        "space",
        "membership",
        "work_order",
        "document",
        "job_market",
        "invite",
      ],
      work_order_status: [
        "open",
        "in_progress",
        "completed",
        "archived",
        "on_hold",
      ],
    },
  },
} as const
