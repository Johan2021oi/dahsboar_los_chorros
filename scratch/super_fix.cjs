const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/Clientes.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Inventario.tsx',
  'src/pages/Pagos.tsx',
  'src/pages/Ventas.tsx',
  'src/pages/Gastos.tsx',
  'src/components/DatePicker.tsx',
  'src/components/BrandingModal.tsx'
];

const subtitles = [
  "Administra tu cartera y contactos estratégicos",
  "Gestión de cartera y abonos a capital",
  "Monitorea la existencia de huevos y suministros",
  "Registra y controla las salidas de dinero",
  "Resumen del Periodo",
  "Total Recaudado",
  "Unidades Totales",
  "Total Pedido",
  "Resumen de Egresos",
  "Saldo de Cartera",
  "Deuda Pendiente",
  "Registros Recientes",
  "Últimos Abonos",
  "Flujo de Ingresos",
  "Top Movimiento",
  "Cuentas x Cobrar",
  "Utilidad Neta",
  "Ingresos Totales",
  "Egresos (Gastos)"
];

function superFix(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Fix Syntax Errors
  content = content.replace(/\/\/ Handling details: simpler approach\s+for MVP is delete and re-insert/g, "// Handling details: simpler approach for MVP is delete and re-insert");
  content = content.replace(/\/\/ Simple validation\s+for DD\/MM\/YYYY/g, "// Simple validation for DD/MM/YYYY");
  content = content.replace(/\/\/ Process details\s+for UI/g, "// Process details for UI");
  content = content.replace(/\/\/ Find product_id from\s+inventory if possible/g, "// Find product_id from inventory if possible");
  content = content.replace(/\/\/ Sync\s+internal input text with prop value/g, "// Sync internal input text with prop value");
  
  // Generic fix for "keyword on new line" after a comment that was obviously a continuation
  content = content.replace(/(\/\/.*?)\s+(for UI|for DD\/MM\/YYYY|for MVP|inventory if possible|internal input text)/g, "$1 $2");

  // Convert subtitles to lowercase
  for (const sub of subtitles) {
    // Avoid double lowercase or regex escaping issues
    const regex = new RegExp(sub, 'gi');
    content = content.replace(regex, sub.toLowerCase());
  }

  fs.writeFileSync(fullPath, content);
}

files.forEach(superFix);
console.log('Super fix applied.');
