import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type OcrResult = {
  id: string;
  user_id: string;
  image_url: string;
  extracted_text: string;
  language: string;
  confidence: number;
  status: 'pending' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  processed_at?: string;
};
