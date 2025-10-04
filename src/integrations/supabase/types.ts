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
      accounts: {
        Row: {
          ativo: boolean
          banco: string | null
          closing_day: number | null
          cor: string | null
          created_at: string
          debt_type: string | null
          dia_fechamento: number | null
          dia_vencimento: number | null
          due_day: number | null
          id: string
          is_primary: boolean | null
          limite_credito: number | null
          monthly_payment: number | null
          nome: string
          parent_account_id: string | null
          remaining_installments: number | null
          saldo_atual: number
          saldo_inicial: number
          tipo: string
          total_installments: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          banco?: string | null
          closing_day?: number | null
          cor?: string | null
          created_at?: string
          debt_type?: string | null
          dia_fechamento?: number | null
          dia_vencimento?: number | null
          due_day?: number | null
          id?: string
          is_primary?: boolean | null
          limite_credito?: number | null
          monthly_payment?: number | null
          nome: string
          parent_account_id?: string | null
          remaining_installments?: number | null
          saldo_atual?: number
          saldo_inicial?: number
          tipo: string
          total_installments?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          banco?: string | null
          closing_day?: number | null
          cor?: string | null
          created_at?: string
          debt_type?: string | null
          dia_fechamento?: number | null
          dia_vencimento?: number | null
          due_day?: number | null
          id?: string
          is_primary?: boolean | null
          limite_credito?: number | null
          monthly_payment?: number | null
          nome?: string
          parent_account_id?: string | null
          remaining_installments?: number | null
          saldo_atual?: number
          saldo_inicial?: number
          tipo?: string
          total_installments?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          id: string
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category_id: string
          created_at?: string
          id?: string
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          id?: string
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          cor: string | null
          created_at: string
          icone: string | null
          id: string
          keywords: string[] | null
          nome: string
          parent_id: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          keywords?: string[] | null
          nome: string
          parent_id?: string | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          keywords?: string[] | null
          nome?: string
          parent_id?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      family_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          can_manage_members: boolean
          created_at: string
          group_id: string
          id: string
          member_id: string
          role: string
          updated_at: string
        }
        Insert: {
          can_manage_members?: boolean
          created_at?: string
          group_id: string
          id?: string
          member_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          can_manage_members?: boolean
          created_at?: string
          group_id?: string
          id?: string
          member_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_profile: {
        Row: {
          budget_control: string
          completed_at: string
          created_at: string
          debt_situation: string
          emergency_fund: string
          financial_goals: string
          financial_health_score: number
          id: string
          insurance_coverage: string
          investment_knowledge: string
          recommendations: Json
          retirement_planning: string
          savings_rate: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_control: string
          completed_at?: string
          created_at?: string
          debt_situation: string
          emergency_fund: string
          financial_goals: string
          financial_health_score?: number
          id?: string
          insurance_coverage: string
          investment_knowledge: string
          recommendations?: Json
          retirement_planning: string
          savings_rate: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_control?: string
          completed_at?: string
          created_at?: string
          debt_situation?: string
          emergency_fund?: string
          financial_goals?: string
          financial_health_score?: number
          id?: string
          insurance_coverage?: string
          investment_knowledge?: string
          recommendations?: Json
          retirement_planning?: string
          savings_rate?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          categoria_id: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          status: string
          tipo_periodo: string
          titulo: string
          updated_at: string
          user_id: string
          valor_atual: number
          valor_meta: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          status?: string
          tipo_periodo: string
          titulo: string
          updated_at?: string
          user_id: string
          valor_atual?: number
          valor_meta: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          status?: string
          tipo_periodo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
          valor_atual?: number
          valor_meta?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_transactions: {
        Row: {
          created_at: string
          id: string
          investment_id: string | null
          notes: string | null
          price: number | null
          quantity: number | null
          ticker: string
          total_value: number
          transaction_date: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          investment_id?: string | null
          notes?: string | null
          price?: number | null
          quantity?: number | null
          ticker: string
          total_value: number
          transaction_date?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          investment_id?: string | null
          notes?: string | null
          price?: number | null
          quantity?: number | null
          ticker?: string
          total_value?: number
          transaction_date?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          average_price: number | null
          created_at: string
          current_price: number | null
          id: string
          last_price_update: string | null
          quantity: number | null
          ticker: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          average_price?: number | null
          created_at?: string
          current_price?: number | null
          id?: string
          last_price_update?: string | null
          quantity?: number | null
          ticker: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          average_price?: number | null
          created_at?: string
          current_price?: number | null
          id?: string
          last_price_update?: string | null
          quantity?: number | null
          ticker?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      licenses: {
        Row: {
          codigo: string
          created_at: string
          data_ativacao: string | null
          data_expiracao: string | null
          id: string
          plano: string
          status: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          codigo: string
          created_at?: string
          data_ativacao?: string | null
          data_expiracao?: string | null
          id?: string
          plano?: string
          status?: string
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          codigo?: string
          created_at?: string
          data_ativacao?: string | null
          data_expiracao?: string | null
          id?: string
          plano?: string
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nome: string
          onboarding_completed: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          telefone: string | null
          telegram_bot_token: string | null
          telegram_chat_id: number | null
          telegram_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nome: string
          onboarding_completed?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          telefone?: string | null
          telegram_bot_token?: string | null
          telegram_chat_id?: number | null
          telegram_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nome?: string
          onboarding_completed?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          telefone?: string | null
          telegram_bot_token?: string | null
          telegram_chat_id?: number | null
          telegram_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          created_at: string
          id: string
          message_content: string
          notification_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_content: string
          notification_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_content?: string
          notification_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_bot_configs: {
        Row: {
          bot_token: string
          bot_username: string | null
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          bot_token: string
          bot_username?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          bot_token?: string
          bot_username?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      telegram_integration: {
        Row: {
          created_at: string
          id: string
          telegram_chat_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          telegram_chat_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          telegram_chat_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_sessions: {
        Row: {
          chat_id: string
          contexto: Json | null
          created_at: string
          id: string
          status: string
          telegram_id: string
          ultimo_comando: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id: string
          contexto?: Json | null
          created_at?: string
          id?: string
          status?: string
          telegram_id: string
          ultimo_comando?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          contexto?: Json | null
          created_at?: string
          id?: string
          status?: string
          telegram_id?: string
          ultimo_comando?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          anexos: Json | null
          categoria_id: string | null
          conta_destino_id: string | null
          conta_origem_id: string | null
          created_at: string
          data_transacao: string
          data_vencimento: string | null
          descricao: string
          id: string
          installment_number: number | null
          installment_total: number | null
          observacoes: string | null
          origem: string | null
          parent_transaction_id: string | null
          tags: string[] | null
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          anexos?: Json | null
          categoria_id?: string | null
          conta_destino_id?: string | null
          conta_origem_id?: string | null
          created_at?: string
          data_transacao?: string
          data_vencimento?: string | null
          descricao: string
          id?: string
          installment_number?: number | null
          installment_total?: number | null
          observacoes?: string | null
          origem?: string | null
          parent_transaction_id?: string | null
          tags?: string[] | null
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          anexos?: Json | null
          categoria_id?: string | null
          conta_destino_id?: string | null
          conta_origem_id?: string | null
          created_at?: string
          data_transacao?: string
          data_vencimento?: string | null
          descricao?: string
          id?: string
          installment_number?: number | null
          installment_total?: number | null
          observacoes?: string | null
          origem?: string | null
          parent_transaction_id?: string | null
          tags?: string[] | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_conta_destino_id_fkey"
            columns: ["conta_destino_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_conta_origem_id_fkey"
            columns: ["conta_origem_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_learn_category: {
        Args: {
          p_category_id: string
          p_new_keyword: string
          p_user_id: string
        }
        Returns: undefined
      }
      calcular_vencimento_cartao: {
        Args: {
          data_transacao: string
          dia_fechamento: number
          dia_vencimento: number
        }
        Returns: string
      }
      generate_activation_code: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_budgets_with_spent: {
        Args: { p_month: string }
        Returns: {
          amount: number
          category_color: string
          category_id: string
          category_name: string
          created_at: string
          id: string
          month: string
          spent: number
          updated_at: string
          user_id: string
        }[]
      }
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          monthly_expenses: number
          monthly_income: number
          monthly_savings: number
          total_balance: number
        }[]
      }
      get_user_group_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_license_plan: {
        Args: { target_user_id: string }
        Returns: string
      }
      is_family_member: {
        Args: { target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      asset_type: "acao" | "fii" | "etf" | "renda_fixa" | "cripto"
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
      asset_type: ["acao", "fii", "etf", "renda_fixa", "cripto"],
    },
  },
} as const
