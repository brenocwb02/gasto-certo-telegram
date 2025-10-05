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
          group_id: string | null
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
          group_id?: string | null
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
          group_id?: string | null
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
            foreignKeyName: "accounts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
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
          group_id: string | null
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
          group_id?: string | null
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
          group_id?: string | null
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
            foreignKeyName: "categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
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
      family_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          group_id: string
          id: string
          invited_by: string
          role: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          group_id: string
          id?: string
          invited_by: string
          role?: string
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          group_id?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          can_manage_members: boolean
          created_at: string
          group_id: string
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          member_id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          can_manage_members?: boolean
          created_at?: string
          group_id: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          member_id: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          can_manage_members?: boolean
          created_at?: string
          group_id?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          member_id?: string
          role?: string
          status?: string
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
      goals: {
        Row: {
          categoria_id: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          group_id: string | null
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
          group_id?: string | null
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
          group_id?: string | null
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
          {
            foreignKeyName: "goals_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_transactions: {
        Row: {
          created_at: string
          group_id: string | null
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
          group_id?: string | null
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
          group_id?: string | null
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
            foreignKeyName: "investment_transactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
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
          group_id: string | null
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
          group_id?: string | null
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
          group_id?: string | null
          id?: string
          last_price_update?: string | null
          quantity?: number | null
          ticker?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
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
      recurring_generation_log: {
        Row: {
          created_at: string
          error_message: string | null
          generated_date: string
          id: string
          recurring_id: string
          status: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          generated_date: string
          id?: string
          recurring_id: string
          status: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          generated_date?: string
          id?: string
          recurring_id?: string
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_generation_log_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_generation_log_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          description: string | null
          end_date: string | null
          frequency: string
          group_id: string | null
          id: string
          is_active: boolean
          last_generated: string | null
          next_due_date: string | null
          start_date: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          end_date?: string | null
          frequency: string
          group_id?: string | null
          id?: string
          is_active?: boolean
          last_generated?: string | null
          next_due_date?: string | null
          start_date: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          end_date?: string | null
          frequency?: string
          group_id?: string | null
          id?: string
          is_active?: boolean
          last_generated?: string | null
          next_due_date?: string | null
          start_date?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
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
          group_id: string | null
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
          group_id?: string | null
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
          group_id?: string | null
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
            foreignKeyName: "transactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
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
      accept_family_invite: {
        Args: { invite_token: string }
        Returns: Json
      }
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
      create_family_group: {
        Args: { group_description?: string; group_name: string }
        Returns: Json
      }
      create_onboarding_column_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_recurring_transaction: {
        Args: {
          p_account_id?: string
          p_amount: number
          p_category_id?: string
          p_day_of_month?: number
          p_day_of_week?: number
          p_description: string
          p_end_date?: string
          p_frequency: string
          p_group_id?: string
          p_start_date: string
          p_title: string
          p_type: string
        }
        Returns: Json
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
      invite_family_member: {
        Args: { email: string; group_id: string; role?: string }
        Returns: Json
      }
      is_family_group_admin: {
        Args: { group_uuid: string }
        Returns: boolean
      }
      is_family_group_owner: {
        Args: { group_uuid: string }
        Returns: boolean
      }
      is_family_member: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      is_in_family_group: {
        Args: { group_uuid: string }
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
