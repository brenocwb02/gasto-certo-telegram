export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          banco: string | null
          categoria: string | null
          created_at: string
          family_id: string
          id: string
          limite: number | null
          nome: string
          saldo_atual: number
          saldo_inicial: number
          status: boolean
          tipo: Database["public"]["Enums"]["account_type"]
          vencimento_fatura: string | null
        }
        Insert: {
          banco?: string | null
          categoria?: string | null
          created_at?: string
          family_id: string
          id?: string
          limite?: number | null
          nome: string
          saldo_atual?: number
          saldo_inicial?: number
          status?: boolean
          tipo: Database["public"]["Enums"]["account_type"]
          vencimento_fatura?: string | null
        }
        Update: {
          banco?: string | null
          categoria?: string | null
          created_at?: string
          family_id?: string
          id?: string
          limite?: number | null
          nome?: string
          saldo_atual?: number
          saldo_inicial?: number
          status?: boolean
          tipo?: Database["public"]["Enums"]["account_type"]
          vencimento_fatura?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          family_id: string
          id: string
          nome: string
          palavra_chave: string[]
          subcategorias: Json
          tipo: Database["public"]["Enums"]["category_type"]
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          nome: string
          palavra_chave?: string[]
          subcategorias?: Json
          tipo: Database["public"]["Enums"]["category_type"]
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          nome?: string
          palavra_chave?: string[]
          subcategorias?: Json
          tipo?: Database["public"]["Enums"]["category_type"]
        }
        Relationships: [
          {
            foreignKeyName: "categories_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          id: string
          nome: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          owner_id?: string | null
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          family_id: string
          id: string
          role: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          role?: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          role?: Database["public"]["Enums"]["family_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string | null
          telegram_id: string | null
          tipo: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          telegram_id?: string | null
          tipo?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          telegram_id?: string | null
          tipo?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      transactions: {
        Row: {
          categoria_id: string | null
          conta_destino_id: string | null
          conta_origem_id: string | null
          criado_em: string
          data: string
          descricao: string | null
          family_id: string
          id: string
          metodo_pagamento: string | null
          parcela_atual: number
          parcelas: number
          status: Database["public"]["Enums"]["transaction_status"]
          subcategoria: string | null
          tipo: Database["public"]["Enums"]["transaction_type"]
          usuario_id: string
          valor: number
          vencimento: string | null
        }
        Insert: {
          categoria_id?: string | null
          conta_destino_id?: string | null
          conta_origem_id?: string | null
          criado_em?: string
          data?: string
          descricao?: string | null
          family_id: string
          id?: string
          metodo_pagamento?: string | null
          parcela_atual?: number
          parcelas?: number
          status?: Database["public"]["Enums"]["transaction_status"]
          subcategoria?: string | null
          tipo: Database["public"]["Enums"]["transaction_type"]
          usuario_id: string
          valor: number
          vencimento?: string | null
        }
        Update: {
          categoria_id?: string | null
          conta_destino_id?: string | null
          conta_origem_id?: string | null
          criado_em?: string
          data?: string
          descricao?: string | null
          family_id?: string
          id?: string
          metodo_pagamento?: string | null
          parcela_atual?: number
          parcelas?: number
          status?: Database["public"]["Enums"]["transaction_status"]
          subcategoria?: string | null
          tipo?: Database["public"]["Enums"]["transaction_type"]
          usuario_id?: string
          valor?: number
          vencimento?: string | null
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
            foreignKeyName: "transactions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_family_admin: {
        Args: { _family_id: string; _user_id?: string }
        Returns: boolean
      }
      is_family_member: {
        Args: { _family_id: string; _user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "banco" | "carteira" | "cartao"
      category_type: "entrada" | "saida" | "transferencia"
      family_role: "admin" | "usuario"
      transaction_status: "pendente" | "confirmado" | "cancelado"
      transaction_type: "entrada" | "saida" | "transferencia"
      user_type: "admin" | "usuario"
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
      account_type: ["banco", "carteira", "cartao"],
      category_type: ["entrada", "saida", "transferencia"],
      family_role: ["admin", "usuario"],
      transaction_status: ["pendente", "confirmado", "cancelado"],
      transaction_type: ["entrada", "saida", "transferencia"],
      user_type: ["admin", "usuario"],
    },
  },
} as const
