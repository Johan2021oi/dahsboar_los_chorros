const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'src', 'pages');
const compDir = path.join(__dirname, '..', 'src', 'components');

function removeUppercase(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove uppercase and tracking from the changed strings earlier
    
    // 1. main subtitles tracking-wider
    content = content.replace(/uppercase\s+tracking-wider/g, '');
    
    // 2. small metadata tracking-widest
    content = content.replace(/uppercase\s+tracking-widest/g, '');
    
    // 3. stray uppercase tags
    content = content.replace(/font-semibold\s+uppercase/g, 'font-semibold');
    content = content.replace(/font-semibold\s+text-gray-400\s+uppercase/g, 'font-semibold text-gray-400');
    
    // 4. Cleanup any double spaces resulting from replaces
    content = content.replace(/\s{2,}/g, ' ');
    // Make sure we didn't screw up any React className double quotes
    content = content.replace(/className="\s+/g, 'className="');
    content = content.replace(/\s+"/g, '"');
    
    fs.writeFileSync(filePath, content);
  }
}

removeUppercase(pagesDir);
removeUppercase(compDir);
console.log('Uppercase enforcement removed.');
