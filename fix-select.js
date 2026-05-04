const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('onValueChange={set')) {
        content = content.replace(/onValueChange=\{set([A-Za-z0-9_]+)\}/g, 'onValueChange={(v) => set$1(v || "")}');
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir('./src');
console.log('Fixed onValueChange');
