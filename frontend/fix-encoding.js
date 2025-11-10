import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'components', 'PortfolioOptimizer.jsx');

// Read file with UTF-8 encoding
let content = fs.readFileSync(filePath, 'utf8');

// Replace all hardcoded Tailwind classes with CSS variable-based classes
const replacements = [
  [/className="([^"]*)\bbg-white\b([^"]*)"/g, 'className="$1bg-card$2"'],
  [/className="([^"]*)\btext-gray-900\b([^"]*)"/g, 'className="$1text-card-foreground$2"'],
  [/className="([^"]*)\btext-gray-700\b([^"]*)"/g, 'className="$1text-muted-foreground$2"'],
  [/className="([^"]*)\btext-gray-600\b([^"]*)"/g, 'className="$1text-muted-foreground$2"'],
  [/className="([^"]*)\bbg-gray-50\b([^"]*)"/g, 'className="$1bg-muted$2"'],
  [/className="([^"]*)\bbg-gray-100\b([^"]*)"/g, 'className="$1bg-muted$2"'],
  [/className="([^"]*)\bborder-gray-300\b([^"]*)"/g, 'className="$1border-input$2"'],
  [/className="([^"]*)\bborder-gray-200\b([^"]*)"/g, 'className="$1border-border$2"'],
];

// Apply all replacements
replacements.forEach(([pattern, replacement]) => {
  content = content.replace(pattern, replacement);
});

// Fix common corrupted strings
const fixes = [
  ['컴포?�트 마운????마이?�이지?�서 ?�달받�? 종목 로드', 'Load stocks from MyPage on component mount'],
  ['같�? 종목???�치�?(?�균 매수가 계산)', 'Merge duplicate stocks (calculate average purchase price)'],
  ['?��? 존재?�는 종목 - ?�량�?금액 ?�산', 'Update quantities and investment amounts for existing stocks'],
  ['?�로??종목 추�?', 'Add new stock'],
  ['객체�?배열�?변??', 'Convert object to array'],
  ['?�� 종목 ?�치�??�료:', 'Loaded stocks from MyPage:'],
  ['주식 가�??�동 ?�데?�트', 'Update stock prices automatically'],
  ['30초마??주�? ?�동 ?�데?�트', 'Auto-update every 30 seconds'],
  ['초기 ?�데?�트', 'Initial update'],
  ['30초마???�데?�트', 'Update every 30 seconds'],
  ['stocks.length�??�존?�으�??�정', 'Depends on stocks.length only'],
  ['주식 ?�택 ?�들??', 'Handle stock selection'],
  ['?�트?�리??최적??', '포트폴리오 최적화'],
  ['주식??추�??�고 AI�??�트?�리?��? 최적?�하?�요', '주식을 추가하고 AI로 포트폴리오를 최적화하세요'],
];

fixes.forEach(([corrupted, fixed]) => {
  content = content.replace(new RegExp(corrupted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fixed);
});

// Write back with UTF-8 encoding
fs.writeFileSync(filePath, content, 'utf8');

console.log('File fixed successfully!');
console.log('Applied replacements:', replacements.length);
console.log('Applied fixes:', fixes.length);
