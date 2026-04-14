const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspectSchema() {
  console.log('Inspecting "pagos" table columns...');
  const columns = ['id', 'created_at', 'cliente_id', 'monto', 'metodo_pago'];
  for (const col of columns) {
    const { error } = await supabase.from('pagos').select(col).limit(1);
    if (error) {
      console.log(`Column "${col}" check: ERROR - ${error.message}`);
    } else {
      console.log(`Column "${col}" check: OK`);
    }
  }
}

inspectSchema();
