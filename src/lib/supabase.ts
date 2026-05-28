import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente injetadas pelo Vite para o Supabase (com casting any para conformidade TypeScript)
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Validação de configuração ativa para chaveamento inteligente das chamadas
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
