const url = 'https://ulewgxrzgqpajjudbpxp.supabase.co/rest/v1/';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZXdneHJ6Z3FwYWpqdWRicHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzY3MzAsImV4cCI6MjA5MTUxMjczMH0.UvXML06cCvLtvkEgbb7dQ4z8n1dV42gGTJ3NM8TU8ek';

async function getSchema() {
  try {
    const response = await fetch(url + '?select=detalle_venta', {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Error fetching schema:', err);
      return;
    }

    const data = await response.json();
    console.log('PostgREST Data:', JSON.stringify(data, null, 2));

    // Also try OpenAPI spec if it works
    const openApiResp = await fetch(url, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      const spec = await openApiResp.json();
      console.log('Columns for detalle_venta from OpenAPI:');
      const properties = spec.definitions.detalle_venta.properties;
      console.log(Object.keys(properties));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

getSchema();
