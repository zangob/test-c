import fs from 'fs';
import path from 'path';

const filePath = 'c:/Users/EElgezany/Desktop/open-claude-code/src/utils/model/configs.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Add lmstudio to ModelConfig type if it's not there (it is, but just in case)
// Replace configs
content = content.replace(/openrouter: '(.*?)',(\s+)}/g, "openrouter: '$1',$2  lmstudio: '$1',\n$2}");

fs.writeFileSync(filePath, content);
console.log('Updated configs.ts');
