const fs = require('fs');
const path = require('path');

const fixes = {
  'src/pages/Clientes.tsx': [
    ['// Cache simple fuera del componente para persistencia instantánea let', '// Cache simple fuera del componente para persistencia instantánea\nlet'],
    ['// Cache simple fuera del componente para persistencia instantánea const', '// Cache simple fuera del componente para persistencia instantánea\nconst'],
    ['// DESCARGA PARALELA ACTIVADA const', '// DESCARGA PARALELA ACTIVADA\nconst'],
    ['// ALGORITMO DE MAPAS O(n) - Ultra eficiente const', '// ALGORITMO DE MAPAS O(n) - Ultra eficiente\nconst'],
    ['// Guardar en caché } }', '// Guardar en caché\n} }'],
    ['// SKELETON LOADERS [', '// SKELETON LOADERS\n[']
  ],
  'src/pages/Dashboard.tsx': [
    ['// Estados para Edición Inline const', '// Estados para Edición Inline\nconst'],
    ['// Ventas en el rango const', '// Ventas en el rango\nconst'],
    ['// Gastos en el rango const', '// Gastos en el rango\nconst'],
    ['// Por Cobrar (Total histórico) const', '// Por Cobrar (Total histórico)\nconst'],
    ['// Clientes const', '// Clientes\nconst'],
    ['// Data gráfica ventas (rellenar todos los días del mes) const', '// Data gráfica ventas (rellenar todos los días del mes)\nconst'],
    ['// Data productos (Top Movimiento con Dinero Real) const', '// Data productos (Top Movimiento con Dinero Real)\nconst'],
    ['// Check low stock const', '// Check low stock\nconst'],
  ],
  'src/pages/Inventario.tsx': [
    ['// Estados para el Selector Premium const', '// Estados para el Selector Premium\nconst'],
    ['// Cerrar el selector si se hace clic fuera use', '// Cerrar el selector si se hace clic fuera\nuse'],
    ['// Remove precio_unidad as the DB column might be different // Wait, looking at line 130: i.precio_unidad or i.precio_unitario const', '// Remove precio_unidad as the DB column might be different\n// Wait, looking at line 130: i.precio_unidad or i.precio_unitario\nconst'],
    ['// Remove precio_unidad as the DB column might be different const', '// Remove precio_unidad as the DB column might be different\nconst'],
    ['// Wait, looking at line 130: i.precio_unidad or i.precio_unitario const', '// Wait, looking at line 130: i.precio_unidad or i.precio_unitario\nconst']
  ],
  'src/pages/Pagos.tsx': [
    ['// Estados para el Selector Premium const', '// Estados para el Selector Premium\nconst'],
    ['// Cerrar el selector si se hace clic fuera use', '// Cerrar el selector si se hace clic fuera\nuse'],
    ['// Dar foco al monto al cambiar de cliente if', '// Dar foco al monto al cambiar de cliente\nif'],
    ['// Mantener foco siempre setTime', '// Mantener foco siempre\nsetTime']
  ],
  'src/pages/Ventas.tsx': [
    ['// To track stock changes const', '// To track stock changes\nconst'],
    ['// Process details for UI const', '// Process details for UI\nconst'],
    ['// Find product_id from inventory if possible const', '// Find product_id from inventory if possible\nconst'],
    ['// Deep copy setFech', '// Deep copy\nsetFech'],
    ['// Deleting details first due to FK await', '// Deleting details first due to FK\nawait'],
    ['// UPDATE MODE const', '// UPDATE MODE\nconst'],
    ['// Handling details: simpler approach for MVP is delete and re-insert // But we MUST handle stock correction before deleting // 1. Revert old stock for', '// Handling details: simpler approach for MVP is delete and re-insert\n// But we MUST handle stock correction before deleting\n// 1. Revert old stock\nfor'],
    ['// Handling details: simpler approach for MVP is delete and re-insert //', '// Handling details: simpler approach for MVP is delete and re-insert\n//'],
    ['// But we MUST handle stock correction before deleting //', '// But we MUST handle stock correction before deleting\n//'],
    ['// 1. Revert old stock for', '// 1. Revert old stock\nfor'],
    ['// 2. Delete old details await', '// 2. Delete old details\nawait'],
    ['// INSERT MODE const', '// INSERT MODE\nconst'],
    ['// INSERT DETAILS (for both new and edited) const', '// INSERT DETAILS (for both new and edited)\nconst'],
    ['// 3. APPLY NEW STOCK (for both new and edited) // Refetch inventory to have latest (since we reverted stock above) const', '// 3. APPLY NEW STOCK (for both new and edited)\n// Refetch inventory to have latest (since we reverted stock above)\nconst'],
    ['// 3. APPLY NEW STOCK (for both new and edited) //', '// 3. APPLY NEW STOCK (for both new and edited)\n//'],
    ['// Refetch inventory to have latest (since we reverted stock above) const', '// Refetch inventory to have latest (since we reverted stock above)\nconst'],
    ['// Update inventory local state supa', '// Update inventory local state\nsupa']
  ],
  'src/components/DatePicker.tsx': [
    ['// Sync internal input text with prop value useE', '// Sync internal input text with prop value\nuseE'],
    ['// Simple validation for DD/MM/YYYY if', '// Simple validation for DD/MM/YYYY\nif']
  ]
};

for (const [file, tuples] of Object.entries(fixes)) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of tuples) {
    if (content.includes(search)) {
      content = content.replace(search, replace);
    }
  }
  
  fs.writeFileSync(filePath, content);
}

console.log('AST comments fixed!');
