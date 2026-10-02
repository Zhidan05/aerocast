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
      flight_prices: {
        Row: {
          id: number
          airline: string
          flight: string | null
          source_city: string
          departure_time: string | null
          stops: string | null
          arrival_time: string | null
          destination_city: string
          class: string
          duration: number | null
          days_left: number
          price: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['flight_prices']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['flight_prices']['Insert']>
      }
      simulations: {
        Row: {
          id: string
          source_city: string
          destination_city: string
          class: string
          days_left: number
          days_tolerance: number
          iteration_count: number
          historical_sample_count: number | null
          seed: number | null
          mean_price: number | null
          median_price: number | null
          p25: number | null
          p75: number | null
          minimum_price: number | null
          maximum_price: number | null
          std_deviation: number | null
          interval_95_low: number | null
          interval_95_high: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['simulations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['simulations']['Insert']>
      }
      simulation_buckets: {
        Row: {
          id: number
          simulation_id: string
          bucket_order: number
          price_min: number
          price_max: number
          frequency: number
          probability: number
          cumulative_probability: number
          random_min: number | null
          random_max: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['simulation_buckets']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['simulation_buckets']['Insert']>
      }
      simulation_samples: {
        Row: {
          id: number
          simulation_id: string
          iteration: number
          random_number: number
          price_range_min: number | null
          price_range_max: number | null
          sampled_price: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['simulation_samples']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['simulation_samples']['Insert']>
      }
      accuracy_tests: {
        Row: {
          id: string
          simulation_id: string | null
          train_ratio: number
          test_ratio: number
          train_samples: number | null
          test_samples: number | null
          mae: number | null
          mape: number | null
          rmse: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['accuracy_tests']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['accuracy_tests']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Domain Types
export type FlightPrice = Database['public']['Tables']['flight_prices']['Row'];
export type Simulation = Database['public']['Tables']['simulations']['Row'];
export type SimulationBucket = Database['public']['Tables']['simulation_buckets']['Row'];
export type SimulationSample = Database['public']['Tables']['simulation_samples']['Row'];
export type AccuracyTest = Database['public']['Tables']['accuracy_tests']['Row'];
