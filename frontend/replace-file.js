import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcPath = path.join(__dirname, 'src', 'components', 'PortfolioOptimizer_new.jsx');
const destPath = path.join(__dirname, 'src', 'components', 'PortfolioOptimizer.jsx');

// Delete old file
try {
  if (fs.existsSync(destPath)) {
    fs.unlinkSync(destPath);
    console.log('Deleted old PortfolioOptimizer.jsx');
  }
} catch (error) {
  console.error('Error deleting old file:', error.message);
}

// Copy new file
try {
  fs.copyFileSync(srcPath, destPath);
  console.log('Successfully copied PortfolioOptimizer_new.jsx to PortfolioOptimizer.jsx');
} catch (error) {
  console.error('Error copying file:', error.message);
  process.exit(1);
}

// Update App.jsx to use the correct import
const appPath = path.join(__dirname, 'src', 'App.jsx');
try {
  let appContent = fs.readFileSync(appPath, 'utf8');
  appContent = appContent.replace(
    "import PortfolioOptimizer from './components/PortfolioOptimizer_new';",
    "import PortfolioOptimizer from './components/PortfolioOptimizer';"
  );
  fs.writeFileSync(appPath, appContent, 'utf8');
  console.log('Updated App.jsx import');
} catch (error) {
  console.error('Error updating App.jsx:', error.message);
}

console.log('✅ File replacement complete!');
