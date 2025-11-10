import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'components', 'PortfolioOptimizer.jsx');

// Read and rewrite to normalize
const content = fs.readFileSync(filePath, 'utf8');
fs.writeFileSync(filePath, content, 'utf8');

console.log('File normalized successfully!');
