import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: d1, error: e1 } = await supabase.from('detalle_venta').select('*').limit(1);
  console.log('detalle_venta row:', d1 ? Object.keys(d1[0] || {}) : e1);

  const { data: d2, error: e2 } = await supabase.from('clientes').select('*').limit(1);
  console.log('clientes row:', d2 ? Object.keys(d2[0] || {}) : e2);
}
run();
