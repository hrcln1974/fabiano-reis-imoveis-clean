const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const LOGO_PATH = process.env.WATERMARK_LOGO_PATH
  ? path.resolve(process.env.WATERMARK_LOGO_PATH)
  : path.join(__dirname, '..', 'public', 'img', 'fabiano-reis-watermark.png');

const PUBLIC_PREFIX = '/uploads/imagens/';

function uniqueName(originalName) {
  const ext = path.extname(String(originalName || '')).toLowerCase();
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-wm${safeExt === '.jpeg' ? '.jpg' : safeExt}`;
}

async function watermarkBuffer(inputBuffer) {
  if (!Buffer.isBuffer(inputBuffer) || !inputBuffer.length) {
    throw new Error('Imagem inválida para marca d\'água.');
  }

  if (!fs.existsSync(LOGO_PATH)) {
    throw new Error('Logo de marca d\'água não encontrada.');
  }

  const image = sharp(inputBuffer, { failOn: 'warning' });
  const metadata = await image.metadata();
  const width = Number(metadata.width || 0);
  const height = Number(metadata.height || 0);

  if (!width || !height) throw new Error('Não foi possível identificar as dimensões da imagem.');

  // A logo ocupa no máximo ~30% da largura da foto e é reduzida
  // proporcionalmente para funcionar em fotos horizontais/verticais.
  const logoWidth = Math.max(180, Math.min(Math.round(width * 0.30), 760));
  const logo = await sharp(LOGO_PATH)
    .resize({ width: logoWidth, withoutEnlargement: false })
    .ensureAlpha()
    .png()
    .toBuffer();

  const logoMeta = await sharp(logo).metadata();
  const lw = Number(logoMeta.width || logoWidth);
  const lh = Number(logoMeta.height || Math.round(logoWidth * 0.67));

  // Três posições discretas e parcialmente sobrepostas ao conteúdo
  // dificultam a remoção por simples corte, sem transformar a foto
  // em um cartaz de marca d'água.
  const opacity = 0.26;
  const positions = [
    { x: Math.max(16, Math.round((width - lw) / 2)), y: Math.max(16, Math.round((height - lh) / 2)) },
    { x: Math.max(16, Math.round(width * 0.06)), y: Math.max(16, Math.round(height * 0.08)) },
    { x: Math.max(16, Math.round(width - lw - width * 0.06)), y: Math.max(16, Math.round(height - lh - height * 0.08)) }
  ];

  // Renderiza a logo em SVG para controlar a transparência de forma
  // independente do alpha original do PNG.
  const logoData = logo.toString('base64');
  const overlays = positions.map(({ x, y }) => ({
    input: Buffer.from(
      `<svg width="${lw}" height="${lh}" xmlns="http://www.w3.org/2000/svg">` +
      `<image href="data:image/png;base64,${logoData}" width="${lw}" height="${lh}" opacity="${opacity}"/>` +
      `</svg>`
    ),
    left: x,
    top: y,
    blend: 'over'
  }));

  return image
    .rotate()
    .composite(overlays)
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

async function processImageFile(filePath, originalName) {
  const input = await fs.promises.readFile(filePath);
  const output = await watermarkBuffer(input);
  const targetName = uniqueName(originalName);
  const targetPath = path.join(path.dirname(filePath), targetName);

  await fs.promises.writeFile(targetPath, output);

  // Só remove o arquivo recebido depois que a versão protegida existe.
  await fs.promises.unlink(filePath).catch(() => {});

  return {
    filename: targetName,
    path: targetPath,
    url: `${PUBLIC_PREFIX}${targetName}`,
    contentType: 'image/jpeg'
  };
}

async function processImageBuffer(buffer, originalName, targetDir) {
  const output = await watermarkBuffer(buffer);
  const targetName = uniqueName(originalName);
  const targetPath = path.join(targetDir, targetName);
  await fs.promises.mkdir(targetDir, { recursive: true });
  await fs.promises.writeFile(targetPath, output);

  return {
    filename: targetName,
    path: targetPath,
    url: `${PUBLIC_PREFIX}${targetName}`,
    contentType: 'image/jpeg'
  };
}

module.exports = {
  LOGO_PATH,
  watermarkBuffer,
  processImageFile,
  processImageBuffer
};
