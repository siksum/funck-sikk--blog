/**
 * PWA Icon Generator
 *
 * Usage: node scripts/generate-icons.js
 *
 * Requires: sharp (npm install sharp)
 *
 * This script generates PWA icons from the source SVG file.
 * Run this script after installing sharp to generate all required icon sizes.
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('sharp not installed. Installing...');
    const { execSync } = require('child_process');
    execSync('npm install sharp --save-dev', { stdio: 'inherit' });
    sharp = require('sharp');
  }

  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const inputPath = path.join(__dirname, '../public/icons/icon.svg');
  const outputDir = path.join(__dirname, '../public/icons');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    await sharp(inputPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: icon-${size}x${size}.png`);
  }

  // Also generate favicon
  const faviconPath = path.join(__dirname, '../public/favicon.ico');
  await sharp(inputPath)
    .resize(32, 32)
    .toFile(faviconPath.replace('.ico', '.png'));
  console.log('Generated: favicon.png');

  console.log('\nAll icons generated successfully!');
  console.log('Note: favicon.ico should be converted manually or use the PNG version.');
}

generateIcons().catch(console.error);
