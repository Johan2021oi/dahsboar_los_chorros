const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'src', 'pages');
const componentsDir = path.join(__dirname, '..', 'src', 'components');

const keywords = [
  'const', 'let', 'var', 'if', 'else', 'try', 'catch', 'finally', 'return',
  'export', 'import', 'function', 'await', 'set', 'use', 'return', 'case', 'break',
  'default', 'switch', 'for', 'while', 'do', 'yield', 'throw', 'new', 'typeof',
  'instanceof', 'void', 'delete', 'in', 'of', 'async'
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find // comments and check if code follows on the same line
  // We look for // then some text, then one of our keywords or a } or [ or ( or a setSomething call
  
  // A simple regex to find "// ... keyword"
  // This is tricky because content might be one huge line.
  
  // Better approach: find all // that are NOT followed by a newline for a long time,
  // and try to split them before certain patterns.
  
  // We'll target the common patterns we saw being merged:
  // "// ... const", "// ... let", "// ... }", "// ... ["
  
  const keywordsPattern = keywords.join('|');
  const regex = new RegExp(`(//.*?)\\s+(${keywordsPattern}|\\}|\\{|\\[|\\(|set[A-Z]|use[A-Z]|supabase|window|localStorage)`, 'g');
  
  let newContent = content;
  let changed = true;
  while(changed) {
    let prevContent = newContent;
    newContent = newContent.replace(regex, (match, comment, code) => {
      // If the comment already has a newline, don't double it (though regex shouldn't match)
      return comment + '\n' + code;
    });
    if (newContent === prevContent) changed = false;
  }
  
  // Special case for //wa.me
  newContent = newContent.replace(/(\/\/wa\.me\/[^\s`]+)([`\s])/, (match, url, end) => {
    return url + '\n' + end;
  });

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    return true;
  }
  return false;
}

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
  files.forEach(f => {
    const p = path.join(dir, f);
    if (fixFile(p)) {
      console.log(`Fixed ${p}`);
    }
  });
}

processDir(pagesDir);
processDir(componentsDir);
console.log('Finished fixing files.');
