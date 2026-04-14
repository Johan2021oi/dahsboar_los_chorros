const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'src', 'pages');
const compDir = path.join(__dirname, '..', 'src', 'components');

function replaceFontsInDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Original metadata exact match
    content = content.replace(/className="text-\[11px\] font-black text-gray-400 uppercase tracking-wider/g, 'className="text-[11px] font-medium text-gray-400 uppercase tracking-wider');
    
    // Other metadata variants: text-[10px] font-black text-gray-400 uppercase
    content = content.replace(/text-\[10px\] font-black text-gray-400 uppercase/g, 'text-[10px] font-semibold text-gray-400 uppercase');
    
    // text-[11px] font-black text-gray-400 uppercase
    content = content.replace(/text-\[11px\] font-black text-gray-400 uppercase/g, 'text-[11px] font-semibold text-gray-400 uppercase');
    
    // Fallback specific
    content = content.replace(/text-\[10px\] font-black uppercase text-gray-400/g, 'text-[10px] font-semibold uppercase text-gray-400');
    
    fs.writeFileSync(filePath, content);
  }
}

replaceFontsInDir(pagesDir);
replaceFontsInDir(compDir);
console.log('Fonts updated successfully.');
