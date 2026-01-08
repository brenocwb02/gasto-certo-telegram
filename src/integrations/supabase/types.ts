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
          auto_pagamento_ativo: boolean
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
          visibility: string | null
        }
        Insert: {
          ativo?: boolean
          auto_pagamento_ativo?: boolean
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
          visibility?: string | null
        }
        Update: {
          ativo?: boolean
          auto_pagamento_ativo?: boolean
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
          visibility?: string | null
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
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          affected_user_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          query_details: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          affected_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          query_details?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          affected_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          query_details?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          created_at: string
          feature_type: string
          id: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_type: string
          id?: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          feature_type?: string
          id?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          group_id: string | null
          id: string
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category_id: string
          created_at?: string
          group_id?: string | null
          id?: string
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          group_id?: string | null
          id?: string
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
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
      credit_card_settings: {
        Row: {
          account_id: string
          allow_partial_payment: boolean | null
          auto_payment: boolean | null
          created_at: string | null
          default_payment_account_id: string | null
          id: string
          min_balance_warning: number | null
          reminder_days_before: number | null
          send_reminder: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          allow_partial_payment?: boolean | null
          auto_payment?: boolean | null
          created_at?: string | null
          default_payment_account_id?: string | null
          id?: string
          min_balance_warning?: number | null
          reminder_days_before?: number | null
          send_reminder?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          allow_partial_payment?: boolean | null
          auto_payment?: boolean | null
          created_at?: string | null
          default_payment_account_id?: string | null
          id?: string
          min_balance_warning?: number | null
          reminder_days_before?: number | null
          send_reminder?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_settings_default_payment_account_id_fkey"
            columns: ["default_payment_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      data_deletion_requests: {
        Row: {
          deletion_details: Json | null
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          deletion_details?: Json | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          deletion_details?: Json | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      default_budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          group_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category_id: string
          created_at?: string
          group_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          group_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "default_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "default_budgets_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      family_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
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
          recommendations: Json | null
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
          recommendations?: Json | null
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
          recommendations?: Json | null
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
      notification_logs: {
        Row: {
          created_at: string | null
          id: string
          key: string
          metadata: Json | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          metadata?: Json | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          metadata?: Json | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          bill_reminders: boolean
          budget_alerts: boolean
          created_at: string
          daily_summary: boolean
          email_enabled: boolean
          goal_reminders: boolean
          id: string
          monthly_summary: boolean
          preferred_time: string
          spending_alerts: boolean
          telegram_enabled: boolean
          updated_at: string
          user_id: string
          weekly_summary: boolean
        }
        Insert: {
          bill_reminders?: boolean
          budget_alerts?: boolean
          created_at?: string
          daily_summary?: boolean
          email_enabled?: boolean
          goal_reminders?: boolean
          id?: string
          monthly_summary?: boolean
          preferred_time?: string
          spending_alerts?: boolean
          telegram_enabled?: boolean
          updated_at?: string
          user_id: string
          weekly_summary?: boolean
        }
        Update: {
          bill_reminders?: boolean
          budget_alerts?: boolean
          created_at?: string
          daily_summary?: boolean
          email_enabled?: boolean
          goal_reminders?: boolean
          id?: string
          monthly_summary?: boolean
          preferred_time?: string
          spending_alerts?: boolean
          telegram_enabled?: boolean
          updated_at?: string
          user_id?: string
          weekly_summary?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_group_id: string | null
          id: string
          lgpd_consent_date: string | null
          lgpd_consent_version: string | null
          nome: string
          onboarding_completed: boolean
          privacy_settings: Json | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          telefone: string | null
          telegram_chat_id: number | null
          telegram_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_group_id?: string | null
          id?: string
          lgpd_consent_date?: string | null
          lgpd_consent_version?: string | null
          nome: string
          onboarding_completed?: boolean
          privacy_settings?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          telefone?: string | null
          telegram_chat_id?: number | null
          telegram_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_group_id?: string | null
          id?: string
          lgpd_consent_date?: string | null
          lgpd_consent_version?: string | null
          nome?: string
          onboarding_completed?: boolean
          privacy_settings?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          telefone?: string | null
          telegram_chat_id?: number | null
          telegram_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_group_id_fkey"
            columns: ["current_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          request_count: number | null
          telegram_id: number
          updated_at: string
          window_start: string
        }
        Insert: {
          created_at?: string
          request_count?: number | null
          telegram_id: number
          updated_at?: string
          window_start?: string
        }
        Update: {
          created_at?: string
          request_count?: number | null
          telegram_id?: number
          updated_at?: string
          window_start?: string
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
          gerar_pendente: boolean
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
          gerar_pendente?: boolean
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
          gerar_pendente?: boolean
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
          alert_at_80_percent: boolean | null
          alert_at_90_percent: boolean | null
          created_at: string
          default_context: string | null
          id: string
          show_context_confirmation: boolean | null
          telegram_chat_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_at_80_percent?: boolean | null
          alert_at_90_percent?: boolean | null
          created_at?: string
          default_context?: string | null
          id?: string
          show_context_confirmation?: boolean | null
          telegram_chat_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_at_80_percent?: boolean | null
          alert_at_90_percent?: boolean | null
          created_at?: string
          default_context?: string | null
          id?: string
          show_context_confirmation?: boolean | null
          telegram_chat_id?: number
          updated_at?: string | null
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
          efetivada: boolean
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
          efetivada?: boolean
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
          efetivada?: boolean
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_family_invite:
        | { Args: { invite_token: string; p_user_id?: string }; Returns: Json }
        | { Args: { p_invite_code: string }; Returns: string }
      admin_update_license: {
        Args: {
          p_data_expiracao?: string
          p_plano: string
          p_status?: string
          p_tipo?: string
          p_user_id: string
        }
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
      check_personal_account_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_plan_limits: {
        Args: { p_resource_type: string; p_user_id: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_limit?: number
          p_telegram_id: number
          p_window_seconds?: number
        }
        Returns: {
          allowed: boolean
          current_count: number
          remaining: number
          reset_at: string
        }[]
      }
      check_transaction_limit: { Args: { user_id: string }; Returns: Json }
      clean_old_notification_logs: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      count_admin_users: {
        Args: { p_plano?: string; p_search?: string; p_status?: string }
        Returns: number
      }
      count_personal_data: { Args: never; Returns: Json }
      create_family_group:
        | {
            Args: { group_description?: string; group_name: string }
            Returns: Json
          }
        | { Args: { p_group_name: string }; Returns: string }
        | { Args: { p_group_name: string; p_user_id: string }; Returns: string }
      create_onboarding_column_if_not_exists: {
        Args: never
        Returns: undefined
      }
      create_recurring_transaction:
        | {
            Args: {
              p_account_id?: string
              p_amount: number
              p_category_id?: string
              p_day_of_month?: number
              p_day_of_week?: number
              p_description?: string
              p_end_date?: string
              p_frequency: string
              p_gerar_pendente?: boolean
              p_group_id?: string
              p_start_date: string
              p_title: string
              p_type: string
            }
            Returns: Json
          }
        | {
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
      create_recurring_transaction_v2: {
        Args: {
          p_account_id?: string
          p_amount: number
          p_category_id?: string
          p_day_of_month?: number
          p_day_of_week?: number
          p_description?: string
          p_end_date?: string
          p_frequency: string
          p_gerar_pendente?: boolean
          p_group_id?: string
          p_start_date: string
          p_title: string
          p_type: string
        }
        Returns: Json
      }
      delete_all_categories: { Args: never; Returns: undefined }
      delete_family_group: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: string
      }
      dissolve_family_group: { Args: { p_group_id: string }; Returns: Json }
      generate_activation_code: { Args: { user_uuid: string }; Returns: string }
      generate_recurring_transactions: { Args: never; Returns: Json }
      get_admin_stats: { Args: never; Returns: Json }
      get_admin_users: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_plano?: string
          p_search?: string
          p_status?: string
        }
        Returns: {
          created_at: string
          email: string
          license_expiracao: string
          license_plano: string
          license_status: string
          license_tipo: string
          nome: string
          telegram_connected: boolean
          user_id: string
        }[]
      }
      get_audit_summary: {
        Args: { p_days_back?: number }
        Returns: {
          action: string
          count: number
          last_occurrence: string
        }[]
      }
      get_budgets_with_defaults: {
        Args: { p_group_id?: string; p_month: string }
        Returns: {
          amount: number
          category_color: string
          category_id: string
          category_name: string
          created_at: string
          default_amount: number
          id: string
          is_default: boolean
          month: string
          spent: number
          updated_at: string
          user_id: string
        }[]
      }
      get_budgets_with_spent:
        | {
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
        | {
            Args: { p_group_id?: string; p_month: string }
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
        Args: never
        Returns: {
          monthly_expenses: number
          monthly_income: number
          monthly_savings: number
          total_balance: number
        }[]
      }
      get_pending_invoices: {
        Args: { p_user_id: string }
        Returns: {
          account_id: string
          account_name: string
          days_until_due: number
          due_date: number
          has_auto_payment: boolean
          has_sufficient_balance: boolean
          invoice_amount: number
          payment_account_name: string
        }[]
      }
      get_telegram_context: {
        Args: { p_user_id: string }
        Returns: {
          alert_at_80_percent: boolean
          alert_at_90_percent: boolean
          current_group_id: string
          current_group_name: string
          default_context: string
          show_context_confirmation: boolean
        }[]
      }
      get_user_group_id: { Args: never; Returns: string }
      get_user_license_plan: {
        Args: { target_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      import_default_categories: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      invite_family_member: {
        Args: { p_group_id: string; p_name: string; p_role?: string }
        Returns: Json
      }
      is_family_group_admin: { Args: { group_uuid: string }; Returns: boolean }
      is_family_group_owner: { Args: { group_uuid: string }; Returns: boolean }
      is_family_member: { Args: { target_user_id: string }; Returns: boolean }
      is_in_family_group: { Args: { group_uuid: string }; Returns: boolean }
      log_admin_access: {
        Args: {
          p_action: string
          p_affected_user_id?: string
          p_query_details?: Json
          p_record_id?: string
          p_table_name?: string
        }
        Returns: string
      }
      migrate_personal_data_to_group: {
        Args: { p_group_id: string }
        Returns: Json
      }
      process_data_deletion: { Args: { p_request_id: string }; Returns: Json }
      process_invoice_payment: {
        Args: {
          p_amount?: number
          p_card_account_id: string
          p_payment_account_id: string
        }
        Returns: Json
      }
      request_data_deletion: { Args: never; Returns: string }
      seed_default_categories: { Args: { p_user_id: string }; Returns: Json }
      set_telegram_context: {
        Args: { p_context: string; p_user_id: string }
        Returns: boolean
      }
      update_telegram_settings: {
        Args: {
          p_alert_at_80_percent?: boolean
          p_alert_at_90_percent?: boolean
          p_show_context_confirmation?: boolean
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
      asset_type: ["acao", "fii", "etf", "renda_fixa", "cripto"],
    },
  },
} as const
