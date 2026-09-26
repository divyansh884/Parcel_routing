const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('http://localhost:3001')) {
    // 1. replace single quotes 'http://localhost:3001/api/...' -> `${API_BASE_URL}/api/...`
    content = content.replace(/'http:\/\/localhost:3001([^']*)'/g, '`${API_BASE_URL}$1`');
    
    // 2. replace backticks `http://localhost:3001/api/...` -> `${API_BASE_URL}/api/...`
    content = content.replace(/`http:\/\/localhost:3001([^`]*)`/g, '`${API_BASE_URL}$1`');
    
    // 3. Add import if not present
    if (!content.includes('API_BASE_URL')) {
      // Find the last import statement or the top of the file
      const importStatement = `import { API_BASE_URL } from '@/config/api';\n`;
      // We can just put it after the first 'use client'; or at the top
      if (content.includes("'use client';")) {
        content = content.replace("'use client';", "'use client';\n" + importStatement);
      } else {
        content = importStatement + content;
      }
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
    changedCount++;
  }
});

console.log('Total files changed:', changedCount);
