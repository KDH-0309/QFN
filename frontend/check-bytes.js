import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'components', 'PortfolioOptimizer.jsx');

// Read file as buffer to see exact bytes
const buffer = fs.readFileSync(filePath);

// Find line 95 (0-indexed: 94)
let lineNumber = 0;
let currentPos = 0;
let line95Start = -1;
let line95End = -1;

for (let i = 0; i < buffer.length; i++) {
  if (buffer[i] === 0x0A) { // \n
    lineNumber++;
    if (lineNumber === 94) {
      line95Start = currentPos;
    } else if (lineNumber === 95) {
      line95End = i;
      break;
    }
    currentPos = i + 1;
  }
}

console.log(`Line 95 position: ${line95Start} to ${line95End}`);
console.log('Line 95 content (hex):');
const line95 = buffer.slice(line95Start, line95End);
console.log(line95.toString('hex'));
console.log('\nLine 95 content (string):');
console.log(line95.toString('utf8'));

// Check for specific position (column 74)
console.log('\nCharacter at position 74:');
if (line95.length > 74) {
  const char74 = line95[74];
  console.log(`Byte: 0x${char74.toString(16)}, Char: '${String.fromCharCode(char74)}'`);
  console.log('Context around position 74:');
  console.log(line95.slice(Math.max(0, 74-10), Math.min(line95.length, 74+10)).toString('utf8'));
}
