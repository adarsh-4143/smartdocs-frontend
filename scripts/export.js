const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'out');
const appDir = path.join(rootDir, '.next', 'server', 'app');
const staticDir = path.join(rootDir, '.next', 'static');
const publicDir = path.join(rootDir, 'public');

if (fs.existsSync(outDir)) {
  try {
    fs.rmSync(outDir, { recursive: true, force: true });
  } catch (err) {
    console.warn('Warning removing out dir:', err.message);
  }
}

fs.mkdirSync(outDir, { recursive: true });

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else if (exists) {
    try {
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
      }
      fs.copyFileSync(src, dest);
    } catch (err) {
      // Ignore copy error if file is locked or already present
    }
  }
}

if (fs.existsSync(appDir)) {
  copyRecursiveSync(appDir, outDir);
}
if (fs.existsSync(staticDir)) {
  copyRecursiveSync(staticDir, path.join(outDir, '_next', 'static'));
}
if (fs.existsSync(publicDir)) {
  copyRecursiveSync(publicDir, outDir);
}

if (fs.existsSync(path.join(outDir, 'page.html'))) {
  try {
    fs.copyFileSync(path.join(outDir, 'page.html'), path.join(outDir, 'index.html'));
  } catch (e) {}
}

console.log('Successfully generated out/ folder in root directory!');
