const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/Clientes.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Inventario.tsx',
  'src/pages/Pagos.tsx',
  'src/pages/Ventas.tsx',
  'src/pages/Gastos.tsx'
];

const restoreMap = {
  "administra tu cartera y contactos estratégicos": "ADMINISTRA TU CARTERA Y CONTACTOS ESTRATÉGICOS",
  "gestión de cartera y abonos a capital": "GESTIÓN DE CARTERA Y ABONOS A CAPITAL",
  "monitorea la existencia de huevos y suministros": "MONITOREA LA EXISTENCIA DE HUEVOS Y SUMINISTROS",
  "registra y controla las salidas de dinero": "REGISTRA Y CONTROLA LAS SALIDAS DE DINERO",
  "resumen del periodo": "RESUMEN DEL PERIODO",
  "total recaudado": "TOTAL RECAUDADO",
  "unidades totales": "UNIDADES TOTALES",
  "total pedido": "TOTAL PEDIDO",
  "resumen de egresos": "RESUMEN DE EGRESOS",
  "saldo de cartera": "SALDO DE CARTERA",
  "deuda pendiente": "DEUDA PENDIENTE",
  "registros recientes": "REGISTROS RECIENTES",
  "últimos abonos": "ÚLTIMOS ABONOS",
  "flujo de ingresos": "FLUJO DE INGRESOS",
  "top movimiento": "TOP MOVIMIENTO",
  "cuentas x cobrar": "CUENTAS X COBRAR",
  "utilidad neta": "UTILIDAD NETA",
  "ingresos totales": "INGRESOS TOTALES",
  "egresos (gastos)": "EGRESOS (GASTOS)",
  "gestión de clientes": "GESTIÓN DE CLIENTES",
  "dashboard general": "DASHBOARD GENERAL",
  "historial reciente": "HISTORIAL RECIENTE",
  "gestiona el despacho de productos": "GESTIONA EL DESPACHO DE PRODUCTOS",
  "ajusta los detalles del despacho": "AJUSTA LOS DETALLES DEL DESPACHO"
};

function restore(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // 1. Restore Case
  for (const [lower, upper] of Object.entries(restoreMap)) {
    const regex = new RegExp(lower, 'g');
    content = content.replace(regex, upper);
  }
  
  // 2. Restore Weight font-medium -> font-black for titles
  // Only for those in header or card titles
  content = content.replace(/className="text-\[11px\] font-medium text-gray-400 mt-1 leading-none"/g, 'className="text-[11px] font-black text-gray-400 uppercase tracking-wider mt-1 leading-none"');
  content = content.replace(/text-\[10px\] font-semibold text-gray-400 mb-1\.5/g, 'text-[10px] font-black text-gray-400 uppercase tracking-widest');
  
  // Restore Dashboard specific titles
  content = content.replace(/text-xl font-black text-gray-800 tracking-tight/g, 'text-xl font-black text-gray-800 tracking-tight uppercase');

  fs.writeFileSync(fullPath, content);
}

files.forEach(restore);
console.log('Fonts and Case restored to Elite style globally.');
