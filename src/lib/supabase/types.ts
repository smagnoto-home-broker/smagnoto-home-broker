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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          app_name: string | null
          created_at: string
          id: string
          super_admin_emails: string[]
          system_settings: Json | null
          updated_at: string
        }
        Insert: {
          app_name?: string | null
          created_at?: string
          id?: string
          super_admin_emails?: string[]
          system_settings?: Json | null
          updated_at?: string
        }
        Update: {
          app_name?: string | null
          created_at?: string
          id?: string
          super_admin_emails?: string[]
          system_settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      commission: {
        Row: {
          company_id: string
          corretor_id: string
          corretor_nome: string | null
          created_at: string
          date: string
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status_enum"]
          percentage: number | null
          property_id: string | null
          proposal_id: string | null
          updated_at: string
          value: number
        }
        Insert: {
          company_id: string
          corretor_id: string
          corretor_nome?: string | null
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          percentage?: number | null
          property_id?: string | null
          proposal_id?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          company_id?: string
          corretor_id?: string
          corretor_nome?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          percentage?: number | null
          property_id?: string | null
          proposal_id?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "company_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposal"
            referencedColumns: ["id"]
          },
        ]
      }
      company: {
        Row: {
          cnpj: string | null
          cor_primaria: string | null
          created_at: string
          creci: string | null
          email: string | null
          endereco: Json | null
          id: string
          logo_url: string | null
          name: string
          owner_email: string | null
          owner_nome: string | null
          owner_telefone: string | null
          plano: Database["public"]["Enums"]["plano_enum"]
          settings: Json
          slug: string | null
          status: Database["public"]["Enums"]["company_status_enum"]
          telefone: string | null
          trial_ate: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          cor_primaria?: string | null
          created_at?: string
          creci?: string | null
          email?: string | null
          endereco?: Json | null
          id?: string
          logo_url?: string | null
          name: string
          owner_email?: string | null
          owner_nome?: string | null
          owner_telefone?: string | null
          plano?: Database["public"]["Enums"]["plano_enum"]
          settings?: Json
          slug?: string | null
          status?: Database["public"]["Enums"]["company_status_enum"]
          telefone?: string | null
          trial_ate?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          cor_primaria?: string | null
          created_at?: string
          creci?: string | null
          email?: string | null
          endereco?: Json | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_email?: string | null
          owner_nome?: string | null
          owner_telefone?: string | null
          plano?: Database["public"]["Enums"]["plano_enum"]
          settings?: Json
          slug?: string | null
          status?: Database["public"]["Enums"]["company_status_enum"]
          telefone?: string | null
          trial_ate?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_user: {
        Row: {
          ativo: boolean
          comissao_pct: number
          company_id: string
          created_at: string
          creci: string | null
          email: string
          id: string
          must_change_password: boolean
          nome: string | null
          role: Database["public"]["Enums"]["user_role_enum"]
          ultimo_login: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          comissao_pct?: number
          company_id: string
          created_at?: string
          creci?: string | null
          email: string
          id?: string
          must_change_password?: boolean
          nome?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"]
          ultimo_login?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          comissao_pct?: number
          company_id?: string
          created_at?: string
          creci?: string | null
          email?: string
          id?: string
          must_change_password?: boolean
          nome?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"]
          ultimo_login?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_user_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      lead: {
        Row: {
          assigned_to: string | null
          bedrooms_min: number | null
          budget_max: number | null
          company_id: string
          created_at: string
          email: string | null
          id: string
          interest_property_id: string | null
          interest_type: Database["public"]["Enums"]["transaction_enum"] | null
          lost_reason: string | null
          name: string
          neighborhoods: string[] | null
          notes: string | null
          phone: string
          source: Database["public"]["Enums"]["lead_source_enum"]
          status: Database["public"]["Enums"]["lead_status_enum"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          bedrooms_min?: number | null
          budget_max?: number | null
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          interest_property_id?: string | null
          interest_type?: Database["public"]["Enums"]["transaction_enum"] | null
          lost_reason?: string | null
          name: string
          neighborhoods?: string[] | null
          notes?: string | null
          phone: string
          source?: Database["public"]["Enums"]["lead_source_enum"]
          status?: Database["public"]["Enums"]["lead_status_enum"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          bedrooms_min?: number | null
          budget_max?: number | null
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          interest_property_id?: string | null
          interest_type?: Database["public"]["Enums"]["transaction_enum"] | null
          lost_reason?: string | null
          name?: string
          neighborhoods?: string[] | null
          notes?: string | null
          phone?: string
          source?: Database["public"]["Enums"]["lead_source_enum"]
          status?: Database["public"]["Enums"]["lead_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "company_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interest_property_id_fkey"
            columns: ["interest_property_id"]
            isOneToOne: false
            referencedRelation: "property"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_cost: {
        Row: {
          amount: number
          category: string | null
          company_id: string
          created_at: string
          date: string
          description: string
          id: string
          payment_status: Database["public"]["Enums"]["payment_status_enum"]
          recurring: boolean
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          company_id: string
          created_at?: string
          date: string
          description: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          recurring?: boolean
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          recurring?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_cost_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      property: {
        Row: {
          address: Json
          area_total: number | null
          area_useful: number | null
          bathrooms: number | null
          bedrooms: number | null
          captado_por: string | null
          city: string | null
          code: string | null
          company_id: string
          condo_fee: number | null
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          iptu: number | null
          listed_at: string | null
          model_3d_url: string | null
          neighborhood: string | null
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
          panorama_url: string | null
          parking: number | null
          photos: string[] | null
          price: number
          slug: string | null
          state: string | null
          status: Database["public"]["Enums"]["property_status_enum"]
          suites: number | null
          title: string
          tour_360_url: string | null
          transaction: Database["public"]["Enums"]["transaction_enum"]
          type: Database["public"]["Enums"]["property_type_enum"]
          updated_at: string
          video_url: string | null
          zip_code: string | null
        }
        Insert: {
          address: Json
          area_total?: number | null
          area_useful?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          captado_por?: string | null
          city?: string | null
          code?: string | null
          company_id: string
          condo_fee?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          iptu?: number | null
          listed_at?: string | null
          model_3d_url?: string | null
          neighborhood?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          panorama_url?: string | null
          parking?: number | null
          photos?: string[] | null
          price: number
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["property_status_enum"]
          suites?: number | null
          title: string
          tour_360_url?: string | null
          transaction: Database["public"]["Enums"]["transaction_enum"]
          type: Database["public"]["Enums"]["property_type_enum"]
          updated_at?: string
          video_url?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: Json
          area_total?: number | null
          area_useful?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          captado_por?: string | null
          city?: string | null
          code?: string | null
          company_id?: string
          condo_fee?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          iptu?: number | null
          listed_at?: string | null
          model_3d_url?: string | null
          neighborhood?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          panorama_url?: string | null
          parking?: number | null
          photos?: string[] | null
          price?: number
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["property_status_enum"]
          suites?: number | null
          title?: string
          tour_360_url?: string | null
          transaction?: Database["public"]["Enums"]["transaction_enum"]
          type?: Database["public"]["Enums"]["property_type_enum"]
          updated_at?: string
          video_url?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal: {
        Row: {
          company_id: string
          contract_url: string | null
          corretor_id: string | null
          created_at: string
          id: string
          lead_id: string
          lead_name: string | null
          observations: string | null
          payment_terms: string | null
          property_id: string
          property_title: string | null
          status: Database["public"]["Enums"]["proposal_status_enum"]
          updated_at: string
          value: number
        }
        Insert: {
          company_id: string
          contract_url?: string | null
          corretor_id?: string | null
          created_at?: string
          id?: string
          lead_id: string
          lead_name?: string | null
          observations?: string | null
          payment_terms?: string | null
          property_id: string
          property_title?: string | null
          status?: Database["public"]["Enums"]["proposal_status_enum"]
          updated_at?: string
          value: number
        }
        Update: {
          company_id?: string
          contract_url?: string | null
          corretor_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          lead_name?: string | null
          observations?: string | null
          payment_terms?: string | null
          property_id?: string
          property_title?: string | null
          status?: Database["public"]["Enums"]["proposal_status_enum"]
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "company_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_payment: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          id: string
          paid_at: string
          provider_id: string
          reference_month: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          id?: string
          paid_at?: string
          provider_id: string
          reference_month: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          id?: string
          paid_at?: string
          provider_id?: string
          reference_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_payment_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payment_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_provider"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue: {
        Row: {
          amount: number
          category: string | null
          company_id: string
          created_at: string
          date: string
          description: string
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status_enum"]
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          company_id: string
          created_at?: string
          date: string
          description: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          updated_at?: string
        }
        Relationships: []
      }
      service_provider: {
        Row: {
          category: string
          company_id: string
          created_at: string
          description: string | null
          document: string | null
          due_day: number
          email: string | null
          id: string
          monthly_fee: number
          name: string
          paid_until: string | null
          phone: string | null
          service_area: string | null
          subscription_status: Database["public"]["Enums"]["provider_sub_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          description?: string | null
          document?: string | null
          due_day?: number
          email?: string | null
          id?: string
          monthly_fee?: number
          name: string
          paid_until?: string | null
          phone?: string | null
          service_area?: string | null
          subscription_status?: Database["public"]["Enums"]["provider_sub_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          document?: string | null
          due_day?: number
          email?: string | null
          id?: string
          monthly_fee?: number
          name?: string
          paid_until?: string | null
          phone?: string | null
          service_area?: string | null
          subscription_status?: Database["public"]["Enums"]["provider_sub_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      service_request: {
        Row: {
          address: string | null
          category: string | null
          client_email: string | null
          client_name: string
          client_phone: string
          company_id: string
          created_at: string
          description: string
          id: string
          provider_id: string | null
          status: Database["public"]["Enums"]["service_request_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          client_email?: string | null
          client_name: string
          client_phone: string
          company_id: string
          created_at?: string
          description: string
          id?: string
          provider_id?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          provider_id?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_request_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_provider"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["global_role_enum"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["global_role_enum"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["global_role_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      visit: {
        Row: {
          company_id: string
          corretor_id: string | null
          corretor_nome: string | null
          created_at: string
          feedback: string | null
          id: string
          lead_id: string | null
          lead_name: string | null
          lead_phone: string | null
          notes: string | null
          property_id: string
          property_title: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["visit_status_enum"]
          updated_at: string
        }
        Insert: {
          company_id: string
          corretor_id?: string | null
          corretor_nome?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          notes?: string | null
          property_id: string
          property_title?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["visit_status_enum"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          corretor_id?: string | null
          corretor_nome?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          notes?: string | null
          property_id?: string
          property_title?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["visit_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "company_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property"
            referencedColumns: ["id"]
          },
        ]
      }
      zone: {
        Row: {
          city: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          state: string | null
        }
        Insert: {
          city?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          state?: string | null
        }
        Update: {
          city?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          state?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_company_id: { Args: never; Returns: string }
      has_company_role:
        | {
            Args: {
              _company_id: string
              _roles: Database["public"]["Enums"]["user_role_enum"][]
            }
            Returns: boolean
          }
        | {
            Args: { _roles: Database["public"]["Enums"]["user_role_enum"][] }
            Returns: boolean
          }
      has_global_role: {
        Args: { _role: Database["public"]["Enums"]["global_role_enum"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      company_status_enum: "active" | "trial" | "blocked"
      global_role_enum:
        | "super_admin"
        | "admin"
        | "corretor"
        | "captador"
        | "financeiro"
        | "demo"
      lead_source_enum:
        | "site"
        | "instagram"
        | "facebook"
        | "google"
        | "indicacao"
        | "whatsapp"
        | "outro"
      lead_status_enum:
        | "novo"
        | "em_atendimento"
        | "qualificado"
        | "visita_marcada"
        | "proposta"
        | "fechado"
        | "perdido"
      payment_status_enum: "pendente" | "pago"
      plano_enum: "starter" | "pro" | "enterprise"
      property_status_enum:
        | "disponivel"
        | "reservado"
        | "vendido"
        | "alugado"
        | "inativo"
      property_type_enum:
        | "casa"
        | "apartamento"
        | "terreno"
        | "comercial"
        | "rural"
      proposal_status_enum:
        | "em_analise"
        | "aceita"
        | "recusada"
        | "contra_proposta"
      provider_sub_status: "ativo" | "pendente" | "inadimplente" | "cancelado"
      service_request_status:
        | "novo"
        | "em_contato"
        | "agendado"
        | "concluido"
        | "cancelado"
      transaction_enum: "venda" | "aluguel" | "temporada"
      user_role_enum: "owner" | "admin" | "corretor" | "captador" | "financeiro"
      visit_status_enum: "agendada" | "realizada" | "cancelada" | "no_show"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      company_status_enum: ["active", "trial", "blocked"],
      global_role_enum: [
        "super_admin",
        "admin",
        "corretor",
        "captador",
        "financeiro",
        "demo",
      ],
      lead_source_enum: [
        "site",
        "instagram",
        "facebook",
        "google",
        "indicacao",
        "whatsapp",
        "outro",
      ],
      lead_status_enum: [
        "novo",
        "em_atendimento",
        "qualificado",
        "visita_marcada",
        "proposta",
        "fechado",
        "perdido",
      ],
      payment_status_enum: ["pendente", "pago"],
      plano_enum: ["starter", "pro", "enterprise"],
      property_status_enum: [
        "disponivel",
        "reservado",
        "vendido",
        "alugado",
        "inativo",
      ],
      property_type_enum: [
        "casa",
        "apartamento",
        "terreno",
        "comercial",
        "rural",
      ],
      proposal_status_enum: [
        "em_analise",
        "aceita",
        "recusada",
        "contra_proposta",
      ],
      provider_sub_status: ["ativo", "pendente", "inadimplente", "cancelado"],
      service_request_status: [
        "novo",
        "em_contato",
        "agendado",
        "concluido",
        "cancelado",
      ],
      transaction_enum: ["venda", "aluguel", "temporada"],
      user_role_enum: ["owner", "admin", "corretor", "captador", "financeiro"],
      visit_status_enum: ["agendada", "realizada", "cancelada", "no_show"],
    },
  },
} as const
