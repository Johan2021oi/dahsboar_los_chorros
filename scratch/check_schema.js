const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ulewgxrzgqpajjudbpxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZXdneHJ6Z3FwYWpqdWRicHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzY3MzAsImV4cCI6MjA5MTUxMjczMH0.UvXML06cCvLtvkEgbb7dQ4z8n1dV42gGTJ3NM8TU8ek';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('Checking columns for detalle_venta...');
  const { data, error } = await supabase
    .from('detalle_venta')
    .select()
    .limit(1);

  if (error) {
    console.error('Error selecting:', error.message);
  } else {
    console.log('Sample row columns:', Object.keys(data[0] || {}));
  }
}

checkColumns();
