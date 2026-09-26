const fs = require('fs');

const fixFile = (path) => {
  let code = fs.readFileSync(path, 'utf8');
  
  // padding fixes
  code = code.replace(/<div className="max-w-7xl mx-auto p-8/g, '<div className="max-w-7xl mx-auto p-4 sm:p-8');
  
  // rule builder fixes
  code = code.replace(/<div className="flex space-x-2">/g, '<div className="flex flex-col sm:flex-row gap-3">');
  code = code.replace(/block w-1\/3/g, 'block w-full sm:w-1/3');
  code = code.replace(/block w-1\/4/g, 'block w-full sm:w-1/4');
  
  fs.writeFileSync(path, code);
  console.log('Fixed', path);
};

['src/app/rules/page.tsx', 'src/app/fields/page.tsx', 'src/app/batch/page.tsx'].forEach(f => {
  if (fs.existsSync(f)) fixFile(f);
});
