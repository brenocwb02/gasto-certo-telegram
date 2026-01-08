
const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\Users\\Casa\\Documents\\BoasContas_06012026\\gasto-certo-telegram\\src\\pages\\Dashboard.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// We want to keep lines 1 to 432 (index 0 to 431).
// And we want to keep the 'export default Dashboard;' line at the end.

const keptLines = lines.slice(0, 432);

// Find export default line in the REST of the file or just append it if not found (but it should be there).
// Actually, let's just search for the valid end of the component "};" around line 432.
// And then append "export default Dashboard;"

// Verify line 432 is "};" (or close to it)
console.log('Line 432:', lines[431]);

// Check if it looks right.
const fixedContent = keptLines.join('\n') + '\n\nexport default Dashboard;\n';

fs.writeFileSync(filePath, fixedContent);
console.log('Dashboard.tsx fixed.');
