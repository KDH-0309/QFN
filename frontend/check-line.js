import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'components', 'PortfolioOptimizer.jsx');

// Read file
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Check lines 93-97
console.log('=== Lines 93-97 ===');
for (let i = 92; i < 97; i++) {
  console.log(`Line ${i + 1}:`, JSON.stringify(lines[i]));
  
  // Check for invisible characters
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const code = line.charCodeAt(j);
    if (code > 127 || code < 32) {
      if (char !== '\r' && char !== '\n' && char !== '\t') {
        console.log(`  Position ${j}: '${char}' (code: ${code})`);
      }
    }
  }
}
