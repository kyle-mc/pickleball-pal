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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          player_name: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          player_name?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          player_name?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          date: string
          description: string | null
          host_ids: string[] | null
          id: string
          location: string
          max_players: number | null
          min_players: number | null
          owner_id: string | null
          recurrence_interval: number | null
          recurrence_type: string | null
          time: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          host_ids?: string[] | null
          id?: string
          location: string
          max_players?: number | null
          min_players?: number | null
          owner_id?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          time: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          host_ids?: string[] | null
          id?: string
          location?: string
          max_players?: number | null
          min_players?: number | null
          owner_id?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          time?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          created_at: string
          date: string
          event_id: string | null
          game_number: number
          group_id: string | null
          id: string
          mmr_after: number
          mmr_before: number
          mmr_change: number
          player: string
          rd_after: number | null
          result: string
          score: string | null
          season: number
          team_mmr: number
          team_mmr_diff: number
          victory_type: string | null
          volatility_after: number | null
        }
        Insert: {
          created_at?: string
          date: string
          event_id?: string | null
          game_number: number
          group_id?: string | null
          id?: string
          mmr_after: number
          mmr_before: number
          mmr_change: number
          player: string
          rd_after?: number | null
          result: string
          score?: string | null
          season?: number
          team_mmr?: number
          team_mmr_diff?: number
          victory_type?: string | null
          volatility_after?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          event_id?: string | null
          game_number?: number
          group_id?: string | null
          id?: string
          mmr_after?: number
          mmr_before?: number
          mmr_change?: number
          player?: string
          rd_after?: number | null
          result?: string
          score?: string | null
          season?: number
          team_mmr?: number
          team_mmr_diff?: number
          victory_type?: string | null
          volatility_after?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "games_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          player_id: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          player_id?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          player_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invite_code: string
          name: string
          owner_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          name: string
          owner_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      player_season_stats: {
        Row: {
          created_at: string
          ending_mmr: number | null
          ending_rd: number | null
          games_played: number
          group_id: string | null
          id: string
          losses: number
          player: string
          season: number
          starting_mmr: number
          starting_rd: number
          starting_volatility: number
          updated_at: string
          wins: number
        }
        Insert: {
          created_at?: string
          ending_mmr?: number | null
          ending_rd?: number | null
          games_played?: number
          group_id?: string | null
          id?: string
          losses?: number
          player: string
          season: number
          starting_mmr?: number
          starting_rd?: number
          starting_volatility?: number
          updated_at?: string
          wins?: number
        }
        Update: {
          created_at?: string
          ending_mmr?: number | null
          ending_rd?: number | null
          games_played?: number
          group_id?: string | null
          id?: string
          losses?: number
          player?: string
          season?: number
          starting_mmr?: number
          starting_rd?: number
          starting_volatility?: number
          updated_at?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_season_stats_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_group_id: string | null
          avatar_url: string | null
          awards: string[] | null
          bio: string | null
          birth_year: number | null
          city: string | null
          created_at: string
          discord_username: string | null
          display_name: string | null
          dupr_profile_url: string | null
          dupr_rating: number | null
          groupme_url: string | null
          handedness: Database["public"]["Enums"]["handedness"] | null
          id: string
          linked_player_id: string | null
          paddles: string[] | null
          profile_complete: boolean | null
          state: string | null
          typical_play_location: string | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          active_group_id?: string | null
          avatar_url?: string | null
          awards?: string[] | null
          bio?: string | null
          birth_year?: number | null
          city?: string | null
          created_at?: string
          discord_username?: string | null
          display_name?: string | null
          dupr_profile_url?: string | null
          dupr_rating?: number | null
          groupme_url?: string | null
          handedness?: Database["public"]["Enums"]["handedness"] | null
          id?: string
          linked_player_id?: string | null
          paddles?: string[] | null
          profile_complete?: boolean | null
          state?: string | null
          typical_play_location?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          active_group_id?: string | null
          avatar_url?: string | null
          awards?: string[] | null
          bio?: string | null
          birth_year?: number | null
          city?: string | null
          created_at?: string
          discord_username?: string | null
          display_name?: string | null
          dupr_profile_url?: string | null
          dupr_rating?: number | null
          groupme_url?: string | null
          handedness?: Database["public"]["Enums"]["handedness"] | null
          id?: string
          linked_player_id?: string | null
          paddles?: string[] | null
          profile_complete?: boolean | null
          state?: string | null
          typical_play_location?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_group_id_fkey"
            columns: ["active_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_linked_player_id_fkey"
            columns: ["linked_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      video_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          session_id: string | null
          updated_at: string
          user_id: string | null
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          user_id: string | null
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          description: string | null
          duration: string | null
          game_id: string | null
          group_id: string | null
          id: string
          players: string[] | null
          thumbnail_url: string | null
          title: string
          video_date: string | null
          video_type: string | null
          views: number | null
          youtube_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: string | null
          game_id?: string | null
          group_id?: string | null
          id?: string
          players?: string[] | null
          thumbnail_url?: string | null
          title: string
          video_date?: string | null
          video_type?: string | null
          views?: number | null
          youtube_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string | null
          game_id?: string | null
          group_id?: string | null
          id?: string
          players?: string[] | null
          thumbnail_url?: string | null
          title?: string
          video_date?: string | null
          video_type?: string | null
          views?: number | null
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_group_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      update_player_season_stats: {
        Args: {
          p_ending_mmr: number
          p_ending_rd: number
          p_group_id: string
          p_is_win: boolean
          p_player: string
          p_season: number
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      handedness: "left" | "right" | "ambidextrous"
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
      app_role: ["admin", "moderator", "user"],
      handedness: ["left", "right", "ambidextrous"],
    },
  },
} as const
