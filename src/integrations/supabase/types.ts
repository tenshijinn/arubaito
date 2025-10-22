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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cv_analyses: {
        Row: {
          bluechip_details: Json | null
          bluechip_score: number | null
          bluechip_verified: boolean | null
          content_score: number
          created_at: string
          experience_score: number
          feedback: string
          file_name: string
          file_path: string
          formatting_score: number
          id: string
          keywords_score: number
          overall_score: number
          scoring_details: Json | null
          structure_score: number
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          bluechip_details?: Json | null
          bluechip_score?: number | null
          bluechip_verified?: boolean | null
          content_score: number
          created_at?: string
          experience_score: number
          feedback: string
          file_name: string
          file_path: string
          formatting_score: number
          id?: string
          keywords_score: number
          overall_score: number
          scoring_details?: Json | null
          structure_score: number
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          bluechip_details?: Json | null
          bluechip_score?: number | null
          bluechip_verified?: boolean | null
          content_score?: number
          created_at?: string
          experience_score?: number
          feedback?: string
          file_name?: string
          file_path?: string
          formatting_score?: number
          id?: string
          keywords_score?: number
          overall_score?: number
          scoring_details?: Json | null
          structure_score?: number
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      rei_registry: {
        Row: {
          consent: boolean
          created_at: string
          display_name: string | null
          file_path: string
          handle: string | null
          id: string
          nft_mint_address: string | null
          nft_minted: boolean | null
          portfolio_url: string | null
          profile_image_url: string | null
          role_tags: Database["public"]["Enums"]["contributor_role"][] | null
          updated_at: string
          verified: boolean | null
          wallet_address: string
          x_user_id: string | null
        }
        Insert: {
          consent?: boolean
          created_at?: string
          display_name?: string | null
          file_path: string
          handle?: string | null
          id?: string
          nft_mint_address?: string | null
          nft_minted?: boolean | null
          portfolio_url?: string | null
          profile_image_url?: string | null
          role_tags?: Database["public"]["Enums"]["contributor_role"][] | null
          updated_at?: string
          verified?: boolean | null
          wallet_address: string
          x_user_id?: string | null
        }
        Update: {
          consent?: boolean
          created_at?: string
          display_name?: string | null
          file_path?: string
          handle?: string | null
          id?: string
          nft_mint_address?: string | null
          nft_minted?: boolean | null
          portfolio_url?: string | null
          profile_image_url?: string | null
          role_tags?: Database["public"]["Enums"]["contributor_role"][] | null
          updated_at?: string
          verified?: boolean | null
          wallet_address?: string
          x_user_id?: string | null
        }
        Relationships: []
      }
      twitter_whitelist: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          twitter_handle: string
          updated_at: string | null
          verification_type: Database["public"]["Enums"]["verification_type"]
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          twitter_handle: string
          updated_at?: string | null
          verification_type: Database["public"]["Enums"]["verification_type"]
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          twitter_handle?: string
          updated_at?: string | null
          verification_type?: Database["public"]["Enums"]["verification_type"]
          verified_by?: string | null
        }
        Relationships: []
      }
      twitter_whitelist_submissions: {
        Row: {
          display_name: string | null
          id: string
          notes: string | null
          profile_image_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          twitter_handle: string
          x_user_id: string | null
        }
        Insert: {
          display_name?: string | null
          id?: string
          notes?: string | null
          profile_image_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          twitter_handle: string
          x_user_id?: string | null
        }
        Update: {
          display_name?: string | null
          id?: string
          notes?: string | null
          profile_image_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          twitter_handle?: string
          x_user_id?: string | null
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
      contributor_role:
        | "dev"
        | "product"
        | "research"
        | "community"
        | "design"
        | "ops"
      verification_type:
        | "followed_by_web3_project"
        | "kol"
        | "thought_leader"
        | "web3_founder"
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
      contributor_role: [
        "dev",
        "product",
        "research",
        "community",
        "design",
        "ops",
      ],
      verification_type: [
        "followed_by_web3_project",
        "kol",
        "thought_leader",
        "web3_founder",
      ],
    },
  },
} as const
