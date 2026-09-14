#!/usr/bin/env node

const http = require('http');
const https = require('https');
const assert = require('node:assert/strict');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_IMOVEL_ID = process.env.TEST_IMOVEL_ID || '';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const client = target.protocol === 'https:' ? https : http;

    const req = client.request(
      target,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: options.timeout || 15000,
      },
      (res) => {
        const chunks = [];

        res.on('data', (chunk) => chunks.push(chunk));

        res.on('end', () => {
          const body = Buffer.concat(chunks);

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error(`Timeout ao acessar ${url}`));
    });

    req.on('error', reject);
    req.end();
  });
}

function getText(response) {
  return response.body.toString('utf8');
}

function extractIdsFromApi(data) {
  const candidates = [
    data?.imoveis,
    data?.data,
    data?.items,
    Array.isArray(data) ? data : null,
  ];

  for (const list of candidates) {
    if (!Array.isArray(list)) continue;

    const ids = list
      .map((item) => Number(item?.id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (ids.length) return ids;
  }

  return [];
}

async function localizarImovel() {
  if (TEST_IMOVEL_ID) {
    const id = Number(TEST_IMOVEL_ID);

    assert(
      Number.isInteger(id) && id > 0,
      `TEST_IMOVEL_ID inválido: ${TEST_IMOVEL_ID}`
    );

    return id;
  }

  const endpoints = [
    '/api/imoveis?limite=20',
    '/api/imoveis?limit=20',
    '/api/imoveis',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await request(`${BASE_URL}${endpoint}`);

      if (response.statusCode !== 200) continue;

      const data = JSON.parse(getText(response));
      const ids = extractIdsFromApi(data);

      if (ids.length) {
        return ids[0];
      }
    } catch (_) {
      // Tenta o próximo endpoint.
    }
  }

  throw new Error(
    'Nenhum imóvel ativo foi encontrado pela API. ' +
    'Cadastre/ative pelo menos um imóvel ou use TEST_IMOVEL_ID.'
  );
}

function extrairMeta(html, property, attribute = 'property') {
  const regex = new RegExp(
    `<meta[^>]+${attribute}=["']${property}["'][^>]+content=["']([^"']*)["'][^>]*>`,
    'i'
  );

  const match = html.match(regex);

  if (match) return match[1];

  const reverseRegex = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+${attribute}=["']${property}["'][^>]*>`,
    'i'
  );

  const reverseMatch = html.match(reverseRegex);

  return reverseMatch ? reverseMatch[1] : '';
}

async function main() {
  console.log('');
  console.log('==============================================');
  console.log(' FABIANO REIS — SHARE PREVIEW TEST');
  console.log('==============================================');
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log('');

  console.log('[1/5] Localizando imóvel ativo pela API...');

  const id = await localizarImovel();

  console.log(`✓ imóvel encontrado: ID ${id}`);
  console.log('');

  console.log('[2/5] Testando página do imóvel...');

  const propertyUrl = `${BASE_URL}/imovel/${id}`;
  const propertyResponse = await request(propertyUrl);

  assert.equal(
    propertyResponse.statusCode,
    200,
    `Página do imóvel retornou HTTP ${propertyResponse.statusCode}`
  );

  const html = getText(propertyResponse);

  console.log(`✓ página HTTP ${propertyResponse.statusCode}`);
  console.log('');

  console.log('[3/5] Validando metatags Open Graph...');

  const ogImage = extrairMeta(html, 'og:image');
  const ogSecureImage = extrairMeta(html, 'og:image:secure_url');
  const ogImageType = extrairMeta(html, 'og:image:type');
  const ogImageWidth = extrairMeta(html, 'og:image:width');
  const ogImageHeight = extrairMeta(html, 'og:image:height');

  assert(ogImage, 'og:image não encontrado');
  assert(
    /^https:\/\//i.test(ogImage),
    `og:image não é HTTPS: ${ogImage}`
  );

  assert(
    /\/share\/imovel\/\d+\.jpg(?:[?#].*)?$/i.test(ogImage),
    `og:image não aponta para /share/imovel/:id.jpg: ${ogImage}`
  );

  assert.equal(
    ogSecureImage,
    ogImage,
    'og:image:secure_url deveria ser igual ao og:image'
  );

  assert.equal(
    ogImageType,
    'image/jpeg',
    `og:image:type esperado image/jpeg, recebido ${ogImageType}`
  );

  assert.equal(
    ogImageWidth,
    '1200',
    `og:image:width esperado 1200, recebido ${ogImageWidth}`
  );

  assert.equal(
    ogImageHeight,
    '630',
    `og:image:height esperado 630, recebido ${ogImageHeight}`
  );

  console.log(`✓ og:image: ${ogImage}`);
  console.log('✓ og:image:secure_url');
  console.log('✓ image/jpeg');
  console.log('✓ 1200x630');
  console.log('');

  console.log('[4/5] Testando imagem real de compartilhamento...');

  const imageResponse = await request(ogImage, {
    headers: {
      Accept: 'image/jpeg,image/*',
    },
    timeout: 30000,
  });

  assert.equal(
    imageResponse.statusCode,
    200,
    `Imagem de compartilhamento retornou HTTP ${imageResponse.statusCode}`
  );

  const contentType = String(imageResponse.headers['content-type'] || '');

  assert(
    /^image\/jpeg\b/i.test(contentType),
    `Content-Type esperado image/jpeg, recebido ${contentType}`
  );

  assert(
    imageResponse.body.length > 10000,
    `Imagem muito pequena: ${imageResponse.body.length} bytes`
  );

  const isJpeg =
    imageResponse.body[0] === 0xff &&
    imageResponse.body[1] === 0xd8 &&
    imageResponse.body[2] === 0xff;

  assert(isJpeg, 'Arquivo retornado não possui assinatura JPEG válida');

  console.log(`✓ HTTP ${imageResponse.statusCode}`);
  console.log(`✓ Content-Type: ${contentType}`);
  console.log(`✓ tamanho: ${imageResponse.body.length} bytes`);
  console.log('✓ assinatura JPEG válida');
  console.log('');

  console.log('[5/5] Resultado final...');
  console.log('');
  console.log('==============================================');
  console.log(' SHARE PREVIEW TEST: PASS');
  console.log('==============================================');
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('==============================================');
  console.error(' SHARE PREVIEW TEST: FAIL');
  console.error('==============================================');
  console.error(`Erro: ${error.message}`);
  console.error('');

  process.exit(1);
});
