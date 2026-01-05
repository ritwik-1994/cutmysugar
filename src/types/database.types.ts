export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          dietary_preferences: Json | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          dietary_preferences?: Json | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          dietary_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      meals: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string | null
          photo_url: string | null
          glycemic_index: number | null
          glycemic_load: number | null
          analysis_data: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name?: string | null
          photo_url?: string | null
          glycemic_index?: number | null
          glycemic_load?: number | null
          analysis_data?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string | null
          photo_url?: string | null
          glycemic_index?: number | null
          glycemic_load?: number | null
          analysis_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_: string]: never
    }
    Functions: {
      [_: string]: never
    }
    Enums: {
      [_: string]: never
    }
    CompositeTypes: {
      [_: string]: never
    }
  }
}
