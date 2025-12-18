import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ivpdwamxmizfievyfgmt.supabase.co';
const supabaseAnonKey = 'sb_publishable_V_-J8pWadDwSGsmkRPflRg_BGMimaZk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);