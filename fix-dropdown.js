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
      let changed = false;
      if (content.includes('<DropdownMenuTrigger asChild>')) {
        content = content.replace(/<DropdownMenuTrigger asChild>/g, '<DropdownMenuTrigger>');
        changed = true;
      }
      if (content.includes('<PopoverTrigger asChild>')) {
        content = content.replace(/<PopoverTrigger asChild>/g, '<PopoverTrigger>');
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir('./src');
console.log('Fixed DropdownMenuTrigger');
