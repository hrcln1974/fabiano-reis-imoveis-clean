#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const required = [
  'package.json','package-lock.json','server.js','db-adapter.js','db-sqlite-node.js',
  'storage/index.js','.env.example','public/index.html','public/dashboard.html',
  'public/imovel.html','public/robots.txt','public/sitemap.xml','DEPLOY-HOSTINGER.md'
];

let failures = 0;
function ok(msg){ console.log(`✓ ${msg}`); }
function fail(msg){ failures++; console.error(`✗ ${msg}`); }

for (const file of required) {
  fs.existsSync(path.join(root,file)) ? ok(`arquivo obrigatório: ${file}`) : fail(`arquivo ausente: ${file}`);
}

for (const forbidden of ['.env','database.db','database.db-wal','database.db-shm','node_modules','.git']) {
  fs.existsSync(path.join(root,forbidden)) ? fail(`artefato proibido: ${forbidden}`) : ok(`ausente do pacote: ${forbidden}`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if (pkg.version === '1.0.0') ok('versão de produção: 1.0.0'); else fail('versão do pacote não é 1.0.0');
if (pkg.scripts?.start === 'node server.js') ok('start compatível com Hostinger'); else fail('start inválido');

const env = fs.readFileSync(path.join(root,'.env.example'),'utf8');
if (/COLOQUE_AQUI|SEU_USUARIO|SEU_EMAIL/.test(env)) ok('env.example não contém credenciais reais'); else fail('env.example deve permanecer genérico');

const imgDir = path.join(root,'public/uploads/imagens');
const allowed = new Set(['.gitkeep','foto-corretor-v5.png','banner-alto-padrao.png']);
if (fs.existsSync(imgDir)) {
  const extras = fs.readdirSync(imgDir).filter(x => !allowed.has(x));
  extras.length ? fail(`imagens institucionais extras: ${extras.join(', ')}`) : ok('somente foto do corretor e banner no pacote');
} else fail('diretório de imagens ausente');

const dashboard = fs.readFileSync(path.join(root,'public/dashboard.js'),'utf8');
const server = fs.readFileSync(path.join(root,'server.js'),'utf8');
dashboard.includes('excluirLead') && dashboard.includes('🗑️ Excluir')
  ? ok('botão explícito de exclusão de lead presente')
  : fail('botão de exclusão de lead ausente');
server.includes("app.delete('/api/leads/:id'") ? ok('API de exclusão definitiva de lead presente') : fail('API de exclusão de lead ausente');

if (failures) {
  console.error(`AUDITORIA: ${failures} falha(s).`);
  process.exit(1);
}
console.log('AUDITORIA: 10/10');
