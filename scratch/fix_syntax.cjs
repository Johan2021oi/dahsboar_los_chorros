const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/pages/Clientes.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Inventario.tsx',
  'src/pages/Pagos.tsx',
  'src/pages/Ventas.tsx',
  'src/components/DatePicker.tsx'
];

function fix(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return;
  let lines = fs.readFileSync(fullPath, 'utf8').split('\n');
  let newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let currentLine = lines[i];
    let prevLine = newLines[newLines.length - 1];
    
    // If current line looks like a broken comment fragment
    // e.g. starts with a word that is not a valid start of a statement in this context,
    // and the previous line ended with a comment.
    
    if (prevLine && prevLine.trim().startsWith('//')) {
      // Check if current line is likely a continuation of the comment
      // Common fragments: "for UI", "inventory if possible", "internal input text...", "input text with prop value"
      const trimmed = currentLine.trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('import') && !trimmed.startsWith('export') && !trimmed.startsWith('const') && !trimmed.startsWith('let')) {
         // Join it
         newLines[newLines.length - 1] = prevLine.replace(/\r?\n?$/, '') + ' ' + trimmed;
         continue;
      }
    }
    newLines.push(currentLine);
  }
  
  fs.writeFileSync(fullPath, newLines.join('\n'));
}

filesToFix.forEach(fix);
console.log('Fines fixed tentatively.');
