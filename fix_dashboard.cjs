
const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\Users\\Casa\\Documents\\BoasContas_06012026\\gasto-certo-telegram\\src\\pages\\Dashboard.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Keep lines 1 to 432 (index 0 to 431)
// In line 431 (index), check if it ends with }; 
// Line 432 is index 431.

const keptLines = lines.slice(0, 432);

console.log('Last kept line:', keptLines[keptLines.length - 1]);

// Append export default
const fixedContent = keptLines.join('\n') + '\n\nexport default Dashboard;\n';

fs.writeFileSync(filePath, fixedContent);
console.log('Dashboard.tsx fixed.');
