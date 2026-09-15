#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const assert = require('node:assert/strict');


const projectRoot = path.resolve(__dirname, '..');
const releaseRoot = path.join(projectRoot, 'release');

let failures = 0;

function ok(msg) {
  console.log(`✓ ${msg}`);
}

function fail(msg) {
  failures++;
  console.error(`✗ ${msg}`);
}

// Garante que o pacote de produção esteja atualizado antes da auditoria.
const build = spawnSync(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'build:release'],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  }
);

if (build.status !== 0) {
  fail('falha ao preparar o pacote release');
  process.exit(1);
}

if (!fs.existsSync(releaseRoot)) {
  fail('diretório release ausente');
  process.exit(1);
}

ok('pacote release preparado');

// A partir daqui, TODA a auditoria é feita sobre o pacote que será entregue.
const root = releaseRoot;

const required = [
  'package.json',
  'package-lock.json',
  'server.js',
  'db-adapter.js',
  'db-sqlite-node.js',
  'storage/index.js',
  '.env.example',
  'public/index.html',
  'public/dashboard.html',
  'public/imovel-template.html',
  'public/robots.txt',
  'public/sitemap.xml',
  'DEPLOY-HOSTINGER.md'
];

for (const file of required) {
  fs.existsSync(path.join(root, file))
    ? ok(`arquivo obrigatório: ${file}`)
    : fail(`arquivo ausente: ${file}`);
}

// Artefatos que NUNCA podem entrar no pacote de produção.
const forbidden = [
  '.env',
  'database.db',
  'database.db-wal',
  'database.db-shm',
  'node_modules',
  '.git',
  'backups',
  'coverage'
];

for (const name of forbidden) {
  fs.existsSync(path.join(root, name))
    ? fail(`artefato proibido: ${name}`)
    : ok(`ausente do pacote: ${name}`);
}

const pkg = JSON.parse(
  fs.readFileSync(path.join(root, 'package.json'), 'utf8')
);

if (pkg.version === '1.0.0') {
  ok('versão de produção: 1.0.0');
} else {
  fail('versão do pacote não é 1.0.0');
}

if (pkg.scripts?.start === 'node server.js') {
  ok('start compatível com Hostinger');
} else {
  fail('start inválido');
}

const env = fs.readFileSync(
  path.join(root, '.env.example'),
  'utf8'
);

if (/COLOQUE_AQUI|SEU_USUARIO|SEU_EMAIL/.test(env)) {
  ok('env.example não contém credenciais reais');
} else {
  fail('env.example deve permanecer genérico');
}

const imgDir = path.join(root, 'public/uploads/imagens');

const allowed = new Set([
  '.gitkeep',
  'foto-corretor-v5.png',
  'banner-alto-padrao.png',
  'fabiano.png'
]);

if (fs.existsSync(imgDir)) {
  const extras = fs
    .readdirSync(imgDir)
    .filter(name => !allowed.has(name));

  if (extras.length) {
    fail(`imagens institucionais extras: ${extras.join(', ')}`);
  } else {
    ok('somente imagens institucionais permitidas no pacote');
  }
} else {
  fail('diretório de imagens ausente');
}

const dashboardPath = path.join(root, 'public/dashboard.js');
const serverPath = path.join(root, 'server.js');

if (!fs.existsSync(dashboardPath)) {
  fail('public/dashboard.js ausente');
} else {
  const dashboard = fs.readFileSync(dashboardPath, 'utf8');

  dashboard.includes('excluirLead') &&
  dashboard.includes('🗑️ Excluir')
    ? ok('botão explícito de exclusão de lead presente')
    : fail('botão de exclusão de lead ausente');
}

const server = fs.readFileSync(serverPath, 'utf8');

server.includes("app.delete('/api/leads/:id'")
  ? ok('API de exclusão definitiva de lead presente')
  : fail('API de exclusão de lead ausente');

server.includes("app.get('/api/admin/imoveis/export.json'")
  ? ok('API de exportação JSON de imóveis presente')
  : fail('API de exportação JSON de imóveis ausente');

server.includes("app.post('/api/admin/imoveis/import.json'")
  ? ok('API de importação JSON de imóveis presente')
  : fail('API de importação JSON de imóveis ausente');

server.includes("db.exec('BEGIN')") &&
server.includes("db.exec('ROLLBACK')")
  ? ok('Importação usa transação com rollback')
  : fail('Importação sem proteção transacional');

if (failures) {
  console.error(`AUDITORIA: ${failures} falha(s).`);
  process.exit(1);
}


const serverSource = fs.readFileSync(
  path.join(releaseRoot, 'server.js'),
  'utf8'
);

const htmlSource = fs.readFileSync(
  path.join(releaseRoot, 'public', 'imovel-template.html'),
  'utf8'
);

assert(
  serverSource.includes("app.get('/share/imovel/:id.jpg'"),
  'rota pública de imagem OG presente'
);

assert(
  serverSource.includes('gerarImagemCompartilhamento'),
  'gerador de imagem OG presente'
);

assert(
  serverSource.includes('OG_IMAGE_WIDTH = 1200'),
  'largura OG 1200 configurada'
);

assert(
  serverSource.includes('OG_IMAGE_HEIGHT = 630'),
  'altura OG 630 configurada'
);

assert(
  htmlSource.includes('og:image:secure_url'),
  'og:image:secure_url presente'
);

assert(
  htmlSource.includes('og:image:type'),
  'og:image:type presente'
);

assert(
  htmlSource.includes('og:image:width'),
  'og:image:width presente'
);

assert(
  htmlSource.includes('og:image:height'),
  'og:image:height presente'
);

assert(
  htmlSource.includes('twitter:card'),
  'Twitter Card summary_large_image presente'
);
console.log('AUDITORIA: 10/10');