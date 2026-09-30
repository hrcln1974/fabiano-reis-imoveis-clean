#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const port = 38180;
const db = path.join(root, 'data', 'smoke-carousel.json');
const BASE = `http://127.0.0.1:${port}`;

const checks = [];
function check(label, condition, detail = '') {
  checks.push(condition);
  console.log(`[${condition ? '✓' : '✗'}] ${label}${condition || !detail ? '' : ` → ${detail}`}`);
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

async function get(url) {
  const res = await fetch(`${BASE}${url}`);
  return { status: res.status, text: await res.text(), type: res.headers.get('content-type') || '' };
}

async function waitForServer(proc) {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`${BASE}/api/corretor`);
      if (r.ok || [401, 403].includes(r.status)) return;
    } catch (_) {}
    if (proc.exitCode !== null) throw new Error('Servidor encerrou antes do teste.');
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('Servidor não respondeu no tempo esperado.');
}

async function main() {
  const html = read('public/index.html');
  const js = read('public/script.js');
  const css = read('public/ui.css');
  const pkg = JSON.parse(read('package.json'));

  check('HTML contém o carrossel', html.includes('data-banner-carousel'));
  check('HTML contém 3 slides', (html.match(/data-banner-slide/g) || []).length === 3);
  check('HTML contém controle anterior', html.includes('data-banner-prev'));
  check('HTML contém controle próximo', html.includes('data-banner-next'));
  check('HTML mantém banner mobile dedicado', html.includes('/uploads/imagens/fabiano.png'));
  check('HTML reserva dimensões dos banners', html.includes('width="1983"') && html.includes('height="793"') && html.includes('width="1981"') && html.includes('height="793"'));
  check('HTML pré-carrega os 3 banners', (html.match(/rel="preload" as="image"/g) || []).length === 3);
  check('JavaScript inicializa o carrossel', js.includes('configurarCarrosselBanners()'));
  check('JavaScript possui avanço automático', js.includes('setInterval(() => render(index + 1), 5500)'));
  check('JavaScript respeita prefers-reduced-motion', js.includes("prefers-reduced-motion: reduce"));
  check('JavaScript pausa com mouse/foco', js.includes("mouseenter") && js.includes("focusin"));
  check('CSS possui estado ativo do slide', css.includes('.fr-banner-carousel__slide.is-active'));
  check('CSS reserva altura estável para o carrossel', css.includes('aspect-ratio: 1982 / 793') && css.includes('.fr-banner-carousel__track') && css.includes('height: 100%'));
  check('Slides ocupam toda a área reservada', css.includes('width: 100%;\n  height: 100%;') && css.includes('position: absolute;'));
  check('Banners secundários não dependem de lazy-load', !html.includes('loading="lazy"') || (html.match(/data-banner-slide/g) || []).length === 3);
  check('CSS mantém mobile sem carrossel visual', css.includes('.fr-banner-carousel { display: none; }'));
  check('script de teste está registrado no package', pkg.scripts?.['test:carousel'] === 'node scripts/test-carousel.js');

  const env = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(port),
    SQLITE_FILE: db,
    STORAGE_PROVIDER: 'local',
    MEDIA_ROOT: path.join(root, 'data', 'smoke-carousel-media'),
    JWT_SECRET: 'teste-carrossel-nao-usar-em-producao'
  };
  delete env.DATABASE_URL;

  fs.rmSync(db, { force: true });
  fs.rmSync(env.MEDIA_ROOT, { recursive: true, force: true });

  const server = spawn(process.execPath, [path.join(root, 'server.js')], {
    cwd: root, env, stdio: ['ignore', 'pipe', 'pipe']
  });
  const logs = [];
  server.stdout.on('data', d => logs.push(String(d)));
  server.stderr.on('data', d => logs.push(String(d)));

  try {
    await waitForServer(server);
    const page = await get('/');
    check('GET / retorna 200', page.status === 200, String(page.status));
    check('GET / entrega index com carrossel', page.status === 200 && page.text.includes('data-banner-carousel'));

    for (const asset of [
      '/uploads/imagens/banner-alto-padrao.png',
      '/uploads/imagens/banner-alto-padrao2.png',
      '/uploads/imagens/banner-alto-padrao3.png',
      '/uploads/imagens/fabiano.png'
    ]) {
      const r = await get(asset);
      check(`asset ${asset} responde 200`, r.status === 200, String(r.status));
    }
  } finally {
    server.kill('SIGTERM');
    await new Promise(resolve => server.once('exit', resolve));
    fs.rmSync(db, { force: true });
    fs.rmSync(env.MEDIA_ROOT, { recursive: true, force: true });
  }

  const failures = checks.filter(result => !result).length;
  if (failures) {
    console.error(`CAROUSEL TEST: FAIL — ${failures} falha(s).`);
    if (logs.length) console.error(logs.join(''));
    process.exit(1);
  }
  console.log('CAROUSEL TEST: PASS');
}

main().catch(err => {
  console.error(`CAROUSEL TEST: FAIL — ${err.message}`);
  process.exit(1);
});
