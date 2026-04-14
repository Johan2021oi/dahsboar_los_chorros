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

const exactReplacements = {
  "Administra tu cartera y contactos estratégicos": "administra tu cartera y contactos estratégicos",
  "Gestión de cartera y abonos a capital": "gestión de cartera y abonos a capital",
  "Monitorea la existencia de huevos y suministros": "monitorea la existencia de huevos y suministros",
  "Registra y controla las salidas de dinero": "registra y controla las salidas de dinero",
  "Resumen del periodo": "resumen del periodo",
  "Resumen del Periodo": "resumen del periodo",
  "Total recaudado": "total recaudado",
  "Total Recaudado": "total recaudado",
  "Unidades totales": "unidades totales",
  "Unidades Totales": "unidades totales",
  "Total pedido": "total pedido",
  "Total Pedido": "total pedido",
  "Resumen de egresos": "resumen de egresos",
  "Resumen de Egresos": "resumen de egresos",
  "Saldo de cartera": "saldo de cartera",
  "Saldo de Cartera": "saldo de cartera",
  "Deuda pendiente": "deuda pendiente",
  "Deuda Pendiente": "deuda pendiente",
  "Registros recientes": "registros recientes",
  "Registros Recientes": "registros recientes",
  "Últimos abonos": "últimos abonos",
  "Últimos Abonos": "últimos abonos",
  "Flujo de ingresos": "flujo de ingresos",
  "Flujo de Ingresos": "flujo de ingresos",
  "Top movimiento": "top movimiento",
  "Top Movimiento": "top movimiento",
  "Cuentas x cobrar": "cuentas x cobrar",
  "Cuentas x Cobrar": "cuentas x cobrar",
  "Utilidad neta": "utilidad neta",
  "Utilidad Neta": "utilidad neta",
  "Ingresos totales": "ingresos totales",
  "Ingresos Totales": "ingresos totales",
  "Egresos (Gastos)": "egresos (gastos)",
  "Egresos (gastos)": "egresos (gastos)",
  "Gestión de Clientes": "gestión de clientes",
  "Dashboard General": "dashboard general",
  "Historial Reciente": "historial reciente",
  "Resumen de Egreso": "resumen de egresos",
  "Sin datos para este periodo": "sin datos para este periodo"
};

function finalize(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Apply lowercase replacements
  for (const [key, val] of Object.entries(exactReplacements)) {
    // Escape regex special chars if needed, although these are mostly plain text
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!//\\s*)${escapedKey}`, 'g'); // Only replace if not part of a comment (simple check)
    content = content.replace(regex, val);
  }
  
  // Re-verify specific comment-joined fragments one last time
  content = content.replace(/\/\/ Handling details: simpler approach for MVP is delete and re-insert(?!\n)[\s\r\n]+for MVP is delete and re-insert/g, "// Handling details: simpler approach for MVP is delete and re-insert");
  content = content.replace(/\/\/ Handling details: simpler approach for MVP is delete and re-insert[\s\r\n]+for MVP is delete and re-insert/g, "// Handling details: simpler approach for MVP is delete and re-insert");

  fs.writeFileSync(fullPath, content);
}

files.forEach(finalize);
console.log('Final lowercase and cleanup applied.');
