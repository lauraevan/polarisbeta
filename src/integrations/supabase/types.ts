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
      announcements: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          posted_by: string | null
          posted_by_username: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind?: string
          posted_by?: string | null
          posted_by_username?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          posted_by?: string | null
          posted_by_username?: string | null
          title?: string
        }
        Relationships: []
      }
      ban_appeals: {
        Row: {
          ban_id: string
          created_at: string
          device_fingerprint: string | null
          id: string
          ip: string | null
          message: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          ban_id: string
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip?: string | null
          message: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          ban_id?: string
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip?: string | null
          message?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ban_appeals_ban_id_fkey"
            columns: ["ban_id"]
            isOneToOne: false
            referencedRelation: "bans"
            referencedColumns: ["id"]
          },
        ]
      }
      ban_targets: {
        Row: {
          asn: string | null
          ban_id: string
          city: string | null
          country: string | null
          created_at: string
          id: string
          is_proxy: boolean
          is_tor: boolean
          is_vpn: boolean
          latitude: number | null
          longitude: number | null
          org: string | null
          region: string | null
          scope: Database["public"]["Enums"]["ban_scope"]
          value: string
        }
        Insert: {
          asn?: string | null
          ban_id: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_proxy?: boolean
          is_tor?: boolean
          is_vpn?: boolean
          latitude?: number | null
          longitude?: number | null
          org?: string | null
          region?: string | null
          scope: Database["public"]["Enums"]["ban_scope"]
          value: string
        }
        Update: {
          asn?: string | null
          ban_id?: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_proxy?: boolean
          is_tor?: boolean
          is_vpn?: boolean
          latitude?: number | null
          longitude?: number | null
          org?: string | null
          region?: string | null
          scope?: Database["public"]["Enums"]["ban_scope"]
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "ban_targets_ban_id_fkey"
            columns: ["ban_id"]
            isOneToOne: false
            referencedRelation: "bans"
            referencedColumns: ["id"]
          },
        ]
      }
      bans: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          issued_by: string | null
          issued_by_username: string | null
          lifted_at: string | null
          lifted_by: string | null
          lifted_reason: string | null
          notes: string | null
          reason: string
          status: Database["public"]["Enums"]["ban_status"]
          type: Database["public"]["Enums"]["ban_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_by?: string | null
          issued_by_username?: string | null
          lifted_at?: string | null
          lifted_by?: string | null
          lifted_reason?: string | null
          notes?: string | null
          reason?: string
          status?: Database["public"]["Enums"]["ban_status"]
          type?: Database["public"]["Enums"]["ban_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_by?: string | null
          issued_by_username?: string | null
          lifted_at?: string | null
          lifted_by?: string | null
          lifted_reason?: string | null
          notes?: string | null
          reason?: string
          status?: Database["public"]["Enums"]["ban_status"]
          type?: Database["public"]["Enums"]["ban_type"]
          updated_at?: string
        }
        Relationships: []
      }
      chat_channel_members: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          invited_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          allowed_role: string | null
          created_at: string
          created_by: string | null
          description: string | null
          emoji: string | null
          filter_enabled: boolean
          id: string
          name: string
          slow_mode_seconds: number
          slug: string
          topic: string | null
          visibility: string
        }
        Insert: {
          allowed_role?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          filter_enabled?: boolean
          id?: string
          name: string
          slow_mode_seconds?: number
          slug: string
          topic?: string | null
          visibility?: string
        }
        Update: {
          allowed_role?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          filter_enabled?: boolean
          id?: string
          name?: string
          slow_mode_seconds?: number
          slug?: string
          topic?: string | null
          visibility?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          accent_color: string | null
          attachments: Json
          avatar_emoji: string | null
          avatar_url: string | null
          channel_id: string
          content: string | null
          created_at: string
          id: string
          reply_to: string | null
          user_id: string
          username: string
        }
        Insert: {
          accent_color?: string | null
          attachments?: Json
          avatar_emoji?: string | null
          avatar_url?: string | null
          channel_id: string
          content?: string | null
          created_at?: string
          id?: string
          reply_to?: string | null
          user_id: string
          username: string
        }
        Update: {
          accent_color?: string | null
          attachments?: Json
          avatar_emoji?: string | null
          avatar_url?: string | null
          channel_id?: string
          content?: string | null
          created_at?: string
          id?: string
          reply_to?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_transactions: {
        Row: {
          basic_credits_delta: number
          coins_delta: number
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["coin_tx_kind"]
          meta: Json
          premium_credits_delta: number
          reference: string | null
          user_id: string
        }
        Insert: {
          basic_credits_delta?: number
          coins_delta: number
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["coin_tx_kind"]
          meta?: Json
          premium_credits_delta?: number
          reference?: string | null
          user_id: string
        }
        Update: {
          basic_credits_delta?: number
          coins_delta?: number
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["coin_tx_kind"]
          meta?: Json
          premium_credits_delta?: number
          reference?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_wallpapers: {
        Row: {
          accent: string
          created_at: string
          downloads: number
          hearts: number
          id: string
          image_url: string
          name: string
          status: string
          type: string
          uploader_id: string
          uploader_username: string
        }
        Insert: {
          accent?: string
          created_at?: string
          downloads?: number
          hearts?: number
          id?: string
          image_url: string
          name: string
          status?: string
          type?: string
          uploader_id: string
          uploader_username: string
        }
        Update: {
          accent?: string
          created_at?: string
          downloads?: number
          hearts?: number
          id?: string
          image_url?: string
          name?: string
          status?: string
          type?: string
          uploader_id?: string
          uploader_username?: string
        }
        Relationships: []
      }
      device_sessions: {
        Row: {
          asn: string | null
          browser: string | null
          city: string | null
          country: string | null
          device_fingerprint: string
          device_type: string | null
          first_seen_at: string
          id: string
          ip: string | null
          is_proxy: boolean
          is_tor: boolean
          is_vpn: boolean
          last_seen_at: string
          latitude: number | null
          longitude: number | null
          org: string | null
          os: string | null
          region: string | null
          trusted: boolean
          user_agent: string | null
          user_id: string | null
          username: string | null
          visit_count: number
        }
        Insert: {
          asn?: string | null
          browser?: string | null
          city?: string | null
          country?: string | null
          device_fingerprint: string
          device_type?: string | null
          first_seen_at?: string
          id?: string
          ip?: string | null
          is_proxy?: boolean
          is_tor?: boolean
          is_vpn?: boolean
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          org?: string | null
          os?: string | null
          region?: string | null
          trusted?: boolean
          user_agent?: string | null
          user_id?: string | null
          username?: string | null
          visit_count?: number
        }
        Update: {
          asn?: string | null
          browser?: string | null
          city?: string | null
          country?: string | null
          device_fingerprint?: string
          device_type?: string | null
          first_seen_at?: string
          id?: string
          ip?: string | null
          is_proxy?: boolean
          is_tor?: boolean
          is_vpn?: boolean
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          org?: string | null
          os?: string | null
          region?: string | null
          trusted?: boolean
          user_agent?: string | null
          user_id?: string | null
          username?: string | null
          visit_count?: number
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          attachments: Json
          content: string | null
          created_at: string
          id: string
          recipient_id: string
          sender_accent_color: string | null
          sender_avatar_emoji: string | null
          sender_avatar_url: string | null
          sender_id: string
          sender_username: string
        }
        Insert: {
          attachments?: Json
          content?: string | null
          created_at?: string
          id?: string
          recipient_id: string
          sender_accent_color?: string | null
          sender_avatar_emoji?: string | null
          sender_avatar_url?: string | null
          sender_id: string
          sender_username: string
        }
        Update: {
          attachments?: Json
          content?: string | null
          created_at?: string
          id?: string
          recipient_id?: string
          sender_accent_color?: string | null
          sender_avatar_emoji?: string | null
          sender_avatar_url?: string | null
          sender_id?: string
          sender_username?: string
        }
        Relationships: []
      }
      dm_moderation_flags: {
        Row: {
          blocked_content: string
          created_at: string
          id: string
          matched_terms: string[]
          recipient_id: string
          sender_id: string
          severity: string
        }
        Insert: {
          blocked_content: string
          created_at?: string
          id?: string
          matched_terms?: string[]
          recipient_id: string
          sender_id: string
          severity?: string
        }
        Update: {
          blocked_content?: string
          created_at?: string
          id?: string
          matched_terms?: string[]
          recipient_id?: string
          sender_id?: string
          severity?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      movie_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          kind: string
          rating: number
          tmdb_id: number
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          kind: string
          rating: number
          tmdb_id: number
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          kind?: string
          rating?: number
          tmdb_id?: number
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      pro_keys: {
        Row: {
          code: string
          created_at: string
          duration_days: number | null
          expires_at: string | null
          id: string
          note: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          source: string | null
          tier: string
        }
        Insert: {
          code: string
          created_at?: string
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          note?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          source?: string | null
          tier: string
        }
        Update: {
          code?: string
          created_at?: string
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          note?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          source?: string | null
          tier?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about_me: string | null
          accent_color: string
          avatar_emoji: string | null
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          banner_color: string
          banner_url: string | null
          created_at: string
          custom_role: string | null
          description: string | null
          display_name: string | null
          fav_game_tags: string[]
          fav_genres: number[]
          force_logout_at: string | null
          id: string
          is_anonymous: boolean
          is_banned: boolean
          is_owner: boolean
          mute_reason: string | null
          muted_until: string | null
          play_history: Json
          pro_tier: string | null
          pro_until: string | null
          pronouns: string | null
          roles: string[]
          spent_coins: number
          updated_at: string
          username: string
          watch_history: Json
        }
        Insert: {
          about_me?: string | null
          accent_color?: string
          avatar_emoji?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banner_color?: string
          banner_url?: string | null
          created_at?: string
          custom_role?: string | null
          description?: string | null
          display_name?: string | null
          fav_game_tags?: string[]
          fav_genres?: number[]
          force_logout_at?: string | null
          id: string
          is_anonymous?: boolean
          is_banned?: boolean
          is_owner?: boolean
          mute_reason?: string | null
          muted_until?: string | null
          play_history?: Json
          pro_tier?: string | null
          pro_until?: string | null
          pronouns?: string | null
          roles?: string[]
          spent_coins?: number
          updated_at?: string
          username: string
          watch_history?: Json
        }
        Update: {
          about_me?: string | null
          accent_color?: string
          avatar_emoji?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banner_color?: string
          banner_url?: string | null
          created_at?: string
          custom_role?: string | null
          description?: string | null
          display_name?: string | null
          fav_game_tags?: string[]
          fav_genres?: number[]
          force_logout_at?: string | null
          id?: string
          is_anonymous?: boolean
          is_banned?: boolean
          is_owner?: boolean
          mute_reason?: string | null
          muted_until?: string | null
          play_history?: Json
          pro_tier?: string | null
          pro_until?: string | null
          pronouns?: string | null
          roles?: string[]
          spent_coins?: number
          updated_at?: string
          username?: string
          watch_history?: Json
        }
        Relationships: []
      }
      quests: {
        Row: {
          description: string
          difficulty: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["quest_kind"]
          name: string
          repeatable: boolean
          reward_coins: number
          sort_order: number
          target: Json
        }
        Insert: {
          description: string
          difficulty?: string
          id: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["quest_kind"]
          name: string
          repeatable?: boolean
          reward_coins: number
          sort_order?: number
          target?: Json
        }
        Update: {
          description?: string
          difficulty?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["quest_kind"]
          name?: string
          repeatable?: boolean
          reward_coins?: number
          sort_order?: number
          target?: Json
        }
        Relationships: []
      }
      security_events: {
        Row: {
          asn: string | null
          ban_id: string | null
          city: string | null
          country: string | null
          created_at: string
          detail: Json
          device_fingerprint: string | null
          id: string
          ip: string | null
          is_proxy: boolean
          is_tor: boolean
          is_vpn: boolean
          kind: Database["public"]["Enums"]["security_event_kind"]
          latitude: number | null
          longitude: number | null
          org: string | null
          path: string | null
          region: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          asn?: string | null
          ban_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          detail?: Json
          device_fingerprint?: string | null
          id?: string
          ip?: string | null
          is_proxy?: boolean
          is_tor?: boolean
          is_vpn?: boolean
          kind: Database["public"]["Enums"]["security_event_kind"]
          latitude?: number | null
          longitude?: number | null
          org?: string | null
          path?: string | null
          region?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          asn?: string | null
          ban_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          detail?: Json
          device_fingerprint?: string | null
          id?: string
          ip?: string | null
          is_proxy?: boolean
          is_tor?: boolean
          is_vpn?: boolean
          kind?: Database["public"]["Enums"]["security_event_kind"]
          latitude?: number | null
          longitude?: number | null
          org?: string | null
          path?: string | null
          region?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_ban_id_fkey"
            columns: ["ban_id"]
            isOneToOne: false
            referencedRelation: "bans"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          bundle_contents: string[]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["shop_item_kind"]
          name: string
          payload: Json
          price_basic_credits: number | null
          price_coins: number | null
          price_premium_credits: number | null
          sort_order: number
        }
        Insert: {
          bundle_contents?: string[]
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["shop_item_kind"]
          name: string
          payload?: Json
          price_basic_credits?: number | null
          price_coins?: number | null
          price_premium_credits?: number | null
          sort_order?: number
        }
        Update: {
          bundle_contents?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["shop_item_kind"]
          name?: string
          payload?: Json
          price_basic_credits?: number | null
          price_coins?: number | null
          price_premium_credits?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          acquired_at: string
          equipped: boolean
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          equipped?: boolean
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          equipped?: boolean
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_layouts: {
        Row: {
          created_at: string
          document: Json
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document?: Json
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document?: Json
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quest_progress: {
        Row: {
          claimed: boolean
          claimed_at: string | null
          completed: boolean
          completed_at: string | null
          id: string
          progress: Json
          quest_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed?: boolean
          claimed_at?: string | null
          completed?: boolean
          completed_at?: string | null
          id?: string
          progress?: Json
          quest_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed?: boolean
          claimed_at?: string | null
          completed?: boolean
          completed_at?: string | null
          id?: string
          progress?: Json
          quest_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallet: {
        Row: {
          basic_credits: number
          coins: number
          created_at: string
          premium_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          basic_credits?: number
          coins?: number
          created_at?: string
          premium_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          basic_credits?: number
          coins?: number
          created_at?: string
          premium_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallpaper_hearts: {
        Row: {
          created_at: string
          user_id: string
          wallpaper_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          wallpaper_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          wallpaper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallpaper_hearts_wallpaper_id_fkey"
            columns: ["wallpaper_id"]
            isOneToOne: false
            referencedRelation: "community_wallpapers"
            referencedColumns: ["id"]
          },
        ]
      }
      wallpaper_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          wallpaper_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          wallpaper_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          wallpaper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallpaper_reports_wallpaper_id_fkey"
            columns: ["wallpaper_id"]
            isOneToOne: false
            referencedRelation: "community_wallpapers"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_parties: {
        Row: {
          code: string
          created_at: string
          episode: number | null
          host_id: string
          id: string
          is_playing: boolean
          kind: string
          position_seconds: number
          provider_idx: number
          season: number | null
          state_updated_at: string
          title: string
          tmdb_id: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          episode?: number | null
          host_id: string
          id?: string
          is_playing?: boolean
          kind: string
          position_seconds?: number
          provider_idx?: number
          season?: number | null
          state_updated_at?: string
          title: string
          tmdb_id: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          episode?: number | null
          host_id?: string
          id?: string
          is_playing?: boolean
          kind?: string
          position_seconds?: number
          provider_idx?: number
          season?: number | null
          state_updated_at?: string
          title?: string
          tmdb_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      watch_party_members: {
        Row: {
          avatar_emoji: string | null
          id: string
          joined_at: string
          party_id: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_emoji?: string | null
          id?: string
          joined_at?: string
          party_id: string
          user_id: string
          username: string
        }
        Update: {
          avatar_emoji?: string | null
          id?: string
          joined_at?: string
          party_id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_party_members_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "watch_parties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_ban_status: {
        Args: { _device_fingerprint: string; _ip: string; _user_id: string }
        Returns: {
          ban_id: string
          created_at: string
          expires_at: string
          reason: string
          type: Database["public"]["Enums"]["ban_type"]
        }[]
      }
      hide_wallpaper: { Args: { _id: string }; Returns: undefined }
      is_channel_member: { Args: { _channel_id: string }; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      is_pro: { Args: { _user_id: string }; Returns: boolean }
      redeem_pro_key: { Args: { _code: string }; Returns: Json }
      toggle_wallpaper_heart: { Args: { _id: string }; Returns: Json }
    }
    Enums: {
      ban_scope: "user" | "ip" | "ip_range" | "device" | "asn" | "country"
      ban_status: "active" | "expired" | "lifted"
      ban_type: "full_site" | "chat_only" | "dm_only" | "shadow"
      coin_tx_kind:
        | "quest_reward"
        | "purchase"
        | "exchange"
        | "admin_grant"
        | "welcome"
      quest_kind:
        | "watch_movie"
        | "play_game"
        | "chat_messages"
        | "customize_profile"
        | "try_wallpaper"
        | "daily_login"
        | "shop_visit"
        | "shop_purchase"
      security_event_kind:
        | "signin"
        | "signup"
        | "signout"
        | "new_device"
        | "session_resumed"
        | "ban_issued"
        | "ban_lifted"
        | "ban_evasion_attempt"
        | "blocked_access"
        | "appeal_submitted"
        | "appeal_reviewed"
        | "suspicious_activity"
        | "admin_action"
      shop_item_kind: "theme" | "accessory" | "badge" | "icon" | "bundle"
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
      ban_scope: ["user", "ip", "ip_range", "device", "asn", "country"],
      ban_status: ["active", "expired", "lifted"],
      ban_type: ["full_site", "chat_only", "dm_only", "shadow"],
      coin_tx_kind: [
        "quest_reward",
        "purchase",
        "exchange",
        "admin_grant",
        "welcome",
      ],
      quest_kind: [
        "watch_movie",
        "play_game",
        "chat_messages",
        "customize_profile",
        "try_wallpaper",
        "daily_login",
        "shop_visit",
        "shop_purchase",
      ],
      security_event_kind: [
        "signin",
        "signup",
        "signout",
        "new_device",
        "session_resumed",
        "ban_issued",
        "ban_lifted",
        "ban_evasion_attempt",
        "blocked_access",
        "appeal_submitted",
        "appeal_reviewed",
        "suspicious_activity",
        "admin_action",
      ],
      shop_item_kind: ["theme", "accessory", "badge", "icon", "bundle"],
    },
  },
} as const
