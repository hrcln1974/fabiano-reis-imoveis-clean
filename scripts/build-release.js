const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'release');

// Arquivos que nunca devem seguir para um pacote de produção.
const skipNames = new Set([
  'node_modules', '.git', '.env', 'release', 'backups', 'coverage',
  'database.db', 'database.db-wal', 'database.db-shm', '-type', '-print'
]);
const skipFile = name => (
  skipNames.has(name) ||
  name.endsWith('.log') ||
  name.endsWith('.db') ||
  name.endsWith('.sqlite') ||
  name.endsWith('.sqlite3') ||
  name.endsWith('.shm') ||
  name.endsWith('.wal') ||
  name.endsWith('.dump') ||
  name.endsWith('.sql.gz')
);

function copy(src, dst) {
  const st = fs.statSync(src);
  const name = path.basename(src);
  if (st.isDirectory()) {
    if (skipNames.has(name)) return;
    fs.mkdirSync(dst, { recursive: true });
    for (const child of fs.readdirSync(src)) copy(path.join(src, child), path.join(dst, child));
    return;
  }
  if (skipFile(name)) return;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const name of fs.readdirSync(root)) {
  if (name === 'release') continue;
  copy(path.join(root, name), path.join(out, name));
}
console.log(`Release limpo preparado em: ${out}`);
console.log('Não inclui node_modules, .env, bancos locais, WAL/SHM, backups ou artefatos temporários.');
