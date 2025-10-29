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
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_type: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_type?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_type?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_submissions: {
        Row: {
          compensation: string | null
          created_at: string | null
          description: string
          duplicate_of: string | null
          id: string
          link: string
          og_image: string | null
          points_awarded: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_tags: string[] | null
          status: string | null
          submission_type: string
          submitter_wallet: string
          submitter_x_user_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          compensation?: string | null
          created_at?: string | null
          description: string
          duplicate_of?: string | null
          id?: string
          link: string
          og_image?: string | null
          points_awarded?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_tags?: string[] | null
          status?: string | null
          submission_type: string
          submitter_wallet: string
          submitter_x_user_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          compensation?: string | null
          created_at?: string | null
          description?: string
          duplicate_of?: string | null
          id?: string
          link?: string
          og_image?: string | null
          points_awarded?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_tags?: string[] | null
          status?: string | null
          submission_type?: string
          submitter_wallet?: string
          submitter_x_user_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
      job_sources: {
        Row: {
          config: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          company_name: string | null
          compensation: string | null
          created_at: string | null
          deadline: string | null
          description: string
          employer_wallet: string
          external_id: string | null
          id: string
          link: string | null
          og_image: string | null
          payment_tx_signature: string
          requirements: string | null
          role_tags: string[] | null
          solana_pay_reference: string | null
          source: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          compensation?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          employer_wallet: string
          external_id?: string | null
          id?: string
          link?: string | null
          og_image?: string | null
          payment_tx_signature: string
          requirements?: string | null
          role_tags?: string[] | null
          solana_pay_reference?: string | null
          source?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          compensation?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          employer_wallet?: string
          external_id?: string | null
          id?: string
          link?: string | null
          og_image?: string | null
          payment_tx_signature?: string
          requirements?: string | null
          role_tags?: string[] | null
          solana_pay_reference?: string | null
          source?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          created_at: string | null
          id: string
          payment_token_amount: number | null
          payment_token_mint: string | null
          points: number
          sol_amount: number | null
          solana_pay_reference: string | null
          submission_id: string | null
          transaction_type: string
          tx_signature: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_token_amount?: number | null
          payment_token_mint?: string | null
          points: number
          sol_amount?: number | null
          solana_pay_reference?: string | null
          submission_id?: string | null
          transaction_type: string
          tx_signature?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_token_amount?: number | null
          payment_token_mint?: string | null
          points?: number
          sol_amount?: number | null
          solana_pay_reference?: string | null
          submission_id?: string | null
          transaction_type?: string
          tx_signature?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "community_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      rei_registry: {
        Row: {
          analysis_summary: string | null
          bio: string | null
          consent: boolean
          created_at: string
          display_name: string | null
          file_path: string
          handle: string | null
          id: string
          nft_mint_address: string | null
          nft_minted: boolean | null
          portfolio_links: string | null
          portfolio_url: string | null
          profile_analysis: Json | null
          profile_image_url: string | null
          profile_score: number | null
          role_tags: Database["public"]["Enums"]["contributor_role"][] | null
          skills: Json | null
          updated_at: string
          verified: boolean | null
          wallet_address: string
          work_experience: Json | null
          x_user_id: string | null
        }
        Insert: {
          analysis_summary?: string | null
          bio?: string | null
          consent?: boolean
          created_at?: string
          display_name?: string | null
          file_path: string
          handle?: string | null
          id?: string
          nft_mint_address?: string | null
          nft_minted?: boolean | null
          portfolio_links?: string | null
          portfolio_url?: string | null
          profile_analysis?: Json | null
          profile_image_url?: string | null
          profile_score?: number | null
          role_tags?: Database["public"]["Enums"]["contributor_role"][] | null
          skills?: Json | null
          updated_at?: string
          verified?: boolean | null
          wallet_address: string
          work_experience?: Json | null
          x_user_id?: string | null
        }
        Update: {
          analysis_summary?: string | null
          bio?: string | null
          consent?: boolean
          created_at?: string
          display_name?: string | null
          file_path?: string
          handle?: string | null
          id?: string
          nft_mint_address?: string | null
          nft_minted?: boolean | null
          portfolio_links?: string | null
          portfolio_url?: string | null
          profile_analysis?: Json | null
          profile_image_url?: string | null
          profile_score?: number | null
          role_tags?: Database["public"]["Enums"]["contributor_role"][] | null
          skills?: Json | null
          updated_at?: string
          verified?: boolean | null
          wallet_address?: string
          work_experience?: Json | null
          x_user_id?: string | null
        }
        Relationships: []
      }
      rei_treasury_wallet: {
        Row: {
          balance_sol: number | null
          id: string
          last_updated_at: string | null
          total_distributed: number | null
          wallet_address: string
        }
        Insert: {
          balance_sol?: number | null
          id?: string
          last_updated_at?: string | null
          total_distributed?: number | null
          wallet_address: string
        }
        Update: {
          balance_sol?: number | null
          id?: string
          last_updated_at?: string | null
          total_distributed?: number | null
          wallet_address?: string
        }
        Relationships: []
      }
      talent_views: {
        Row: {
          employer_wallet: string
          id: string
          payment_tx_signature: string
          talent_x_user_id: string
          viewed_at: string | null
        }
        Insert: {
          employer_wallet: string
          id?: string
          payment_tx_signature: string
          talent_x_user_id: string
          viewed_at?: string | null
        }
        Update: {
          employer_wallet?: string
          id?: string
          payment_tx_signature?: string
          talent_x_user_id?: string
          viewed_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          company_name: string | null
          compensation: string | null
          created_at: string | null
          description: string
          employer_wallet: string
          end_date: string | null
          external_id: string | null
          id: string
          link: string
          og_image: string | null
          payment_tx_signature: string
          role_tags: string[] | null
          solana_pay_reference: string | null
          source: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          compensation?: string | null
          created_at?: string | null
          description: string
          employer_wallet: string
          end_date?: string | null
          external_id?: string | null
          id?: string
          link: string
          og_image?: string | null
          payment_tx_signature: string
          role_tags?: string[] | null
          solana_pay_reference?: string | null
          source?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          compensation?: string | null
          created_at?: string | null
          description?: string
          employer_wallet?: string
          end_date?: string | null
          external_id?: string | null
          id?: string
          link?: string
          og_image?: string | null
          payment_tx_signature?: string
          role_tags?: string[] | null
          solana_pay_reference?: string | null
          source?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
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
          welcome_dm_sent: boolean | null
          welcome_dm_sent_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          twitter_handle: string
          updated_at?: string | null
          verification_type: Database["public"]["Enums"]["verification_type"]
          verified_by?: string | null
          welcome_dm_sent?: boolean | null
          welcome_dm_sent_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          twitter_handle?: string
          updated_at?: string | null
          verification_type?: Database["public"]["Enums"]["verification_type"]
          verified_by?: string | null
          welcome_dm_sent?: boolean | null
          welcome_dm_sent_at?: string | null
        }
        Relationships: []
      }
      twitter_whitelist_submissions: {
        Row: {
          display_name: string | null
          dm_sent: boolean | null
          dm_sent_at: string | null
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
          dm_sent?: boolean | null
          dm_sent_at?: string | null
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
          dm_sent?: boolean | null
          dm_sent_at?: string | null
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
      user_points: {
        Row: {
          created_at: string | null
          id: string
          lifetime_earnings_sol: number | null
          points_pending: number | null
          total_points: number | null
          updated_at: string | null
          wallet_address: string
          x_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lifetime_earnings_sol?: number | null
          points_pending?: number | null
          total_points?: number | null
          updated_at?: string | null
          wallet_address: string
          x_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lifetime_earnings_sol?: number | null
          points_pending?: number | null
          total_points?: number | null
          updated_at?: string | null
          wallet_address?: string
          x_user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
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
