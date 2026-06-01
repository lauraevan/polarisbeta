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
      chat_channels: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          emoji: string | null
          id: string
          name: string
          slug: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          name: string
          slug: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          name?: string
          slug?: string
          topic?: string | null
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
      profiles: {
        Row: {
          about_me: string | null
          accent_color: string
          avatar_emoji: string | null
          avatar_url: string | null
          banner_color: string
          created_at: string
          custom_role: string | null
          description: string | null
          display_name: string | null
          fav_game_tags: string[]
          fav_genres: number[]
          id: string
          play_history: Json
          pronouns: string | null
          roles: string[]
          updated_at: string
          username: string
          watch_history: Json
        }
        Insert: {
          about_me?: string | null
          accent_color?: string
          avatar_emoji?: string | null
          avatar_url?: string | null
          banner_color?: string
          created_at?: string
          custom_role?: string | null
          description?: string | null
          display_name?: string | null
          fav_game_tags?: string[]
          fav_genres?: number[]
          id: string
          play_history?: Json
          pronouns?: string | null
          roles?: string[]
          updated_at?: string
          username: string
          watch_history?: Json
        }
        Update: {
          about_me?: string | null
          accent_color?: string
          avatar_emoji?: string | null
          avatar_url?: string | null
          banner_color?: string
          created_at?: string
          custom_role?: string | null
          description?: string | null
          display_name?: string | null
          fav_game_tags?: string[]
          fav_genres?: number[]
          id?: string
          play_history?: Json
          pronouns?: string | null
          roles?: string[]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
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
      shop_item_kind: ["theme", "accessory", "badge", "icon", "bundle"],
    },
  },
} as const
