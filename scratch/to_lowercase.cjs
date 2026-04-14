const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'src', 'pages');

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
  "Sin datos para este periodo",
  "Saldo de Cartera",
  "Deuda Pendiente",
  "Registros Recientes",
  "Últimos Abonos"
];

function toLower(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    for (const sub of subtitles) {
      const lower = sub.toLowerCase();
      // Replace case insensitively but only if it's the exact phrase
      const regex = new RegExp(sub, 'gi');
      content = content.replace(regex, lower);
    }
    
    // Also fix any remaining syntax issues manually if possible
    // Ventas.tsx: "// Find product_id from\ninventory if possible"
    content = content.replace(/\/\/ Find product_id from\s+inventory if possible/g, "// Find product_id from inventory if possible");
    
    // DatePicker.tsx: "// Sync\ninternal input text with prop value"
    content = content.replace(/\/\/ Sync\s+internal input text with prop value/g, "// Sync internal input text with prop value");
    
    fs.writeFileSync(filePath, content);
  }
}

toLower(pagesDir);
toLower(path.join(__dirname, '..', 'src', 'components'));
console.log('Subtitles converted to lowercase and syntax fixed.');
