/*
  Generates a 1200x630 Open Graph PNG at client/public/icons/og-image.png
  using the Idachi logo and title text.
*/
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');

(async () => {
  try {
    const root = path.resolve(__dirname, '..');
    const outDir = path.resolve(root, 'client', 'public', 'icons');
    const outPath = path.resolve(outDir, 'og-image.png');

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const WIDTH = 1200;
    const HEIGHT = 630;

    // Background
    const bg = new Jimp(WIDTH, HEIGHT, '#0b1220'); // dark background

    // Add a subtle gradient stripe using overlay rectangles
    const primary = '#0EA5E9';
    const accent = '#7c3aed';
    const stripeHeight = 180;
    const stripe = new Jimp(WIDTH, stripeHeight, primary);
    stripe.opacity(0.18);
    bg.composite(stripe, 0, 0);

    const stripe2 = new Jimp(WIDTH, stripeHeight, accent);
    stripe2.opacity(0.12);
    bg.composite(stripe2, 0, HEIGHT - stripeHeight);

    // Load logo (prefer webp, fallback png)
  // Use PNG explicitly to avoid WebP decode issues in Jimp without plugins
  const logoPath = path.resolve(root, 'attached_assets', 'idachi1.png');

    const logo = await Jimp.read(logoPath);
    // Scale logo height to ~180px, keep aspect ratio
    const targetH = 180;
    logo.scaleToFit(300, targetH);

    const margin = 80;
    const logoY = Math.round((HEIGHT - logo.getHeight()) / 2);
    bg.composite(logo, margin, logoY, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 1,
    });

    // Load fonts
    const titleFont = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
    const subtitleFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

    const title = 'Idachi Gym Member Portal';
    const subtitle = 'Check-in cepat • Kelola membership • Jadwal & PT';

    // Text positions
    const textX = margin + logo.getWidth() + 40;

    // Draw title with shadow
    const shadowOffset = 2;
    bg.print(titleFont, textX + shadowOffset, logoY + 10 + shadowOffset, { text: title }, WIDTH - textX - margin);
    // Recolor the title to a gradient-like effect by overlaying colored text (approximation)
    const titleColor = new Jimp(WIDTH, HEIGHT);
    titleColor.opacity(0);
    bg.print(titleFont, textX, logoY + 10, { text: title }, WIDTH - textX - margin);

    // Subtitle
    bg.print(subtitleFont, textX, logoY + 90, { text: subtitle }, WIDTH - textX - margin);

    // Save output
    await bg.quality(95).writeAsync(outPath);

    console.log('OG image generated at:', outPath);
  } catch (err) {
    console.error('Failed to generate OG image:', err);
    process.exit(1);
  }
})();
