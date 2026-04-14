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

function standardize(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Structural Symmetry
  content = content.replace(/h-\[400px\]/g, 'h-[480px]');
  content = content.replace(/rounded-3xl/g, 'rounded-[2.5rem]');
  content = content.replace(/p-6 rounded-\[2.5rem\]/g, 'p-8 rounded-[2.5rem]');
  content = content.replace(/p-6 rounded-3xl/g, 'p-8 rounded-[2.5rem]');
  content = content.replace(/gap-6/g, 'gap-8'); // Main gaps
  content = content.replace(/gap-4/g, 'gap-6'); // Grid internal gaps
  
  // 2. Typography Normalization
  // Headers (already 3xl usually but ensuring font-black and uppercase)
  content = content.replace(/text-2xl font-black text-gray-900 tracking-tight/g, 'text-3xl font-black text-gray-900 tracking-tight uppercase');
  
  // HUD Summaries metadata
  content = content.replace(/text-\[11px\] font-black text-gray-400 uppercase tracking-wider/g, 'text-[11px] font-black text-gray-400 uppercase tracking-widest');
  content = content.replace(/font-semibold text-gray-400 uppercase tracking-widest/g, 'font-black text-gray-400 uppercase tracking-widest');
  
  // Table Headers
  content = content.replace(/text-xs font-bold border-b/g, 'text-[10px] font-black uppercase tracking-widest border-b');
  content = content.replace(/text-\[10px\] font-black border-b/g, 'text-[10px] font-black uppercase tracking-widest border-b');

  // 3. Spacing consistency
  content = content.replace(/space-y-4/g, 'space-y-8'); // Main vertical flow
  content = content.replace(/space-y-6/g, 'space-y-8'); // Main vertical flow
  
  // 4. Modal consistency
  content = content.replace(/rounded-3xl w-full max-w-md/g, 'rounded-[2.5rem] w-full max-w-md p-8');

  fs.writeFileSync(fullPath, content);
}

files.forEach(standardize);
console.log('Symmetry and Typography standardization script completed.');
