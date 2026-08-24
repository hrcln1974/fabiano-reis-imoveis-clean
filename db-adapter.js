const path = require('path');
const fs = require('fs');

// produção — Hostinger-first.
// Em produção o banco fica em uma pasta persistente fora do diretório
// descartável de cada build da Hostinger.
function resolveDatabaseFile() {
  if (process.env.SQLITE_FILE) return path.resolve(process.env.SQLITE_FILE);
  if (process.env.NODE_ENV === 'production') {
    const home = process.env.HOME || process.env.USERPROFILE;
    if (!home) throw new Error('HOME não disponível. Defina SQLITE_FILE para um caminho persistente.');
    return path.join(home, 'fabiano-reis-data', 'database.db');
  }
  return path.join(__dirname, 'database.db');
}

const databaseFile = resolveDatabaseFile();
fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

let db;
try {
  // Node 22.5+ — não exige compilação nativa nem dependência externa.
  const NodeSqliteCompat = require('./db-sqlite-node');
  db = new NodeSqliteCompat(databaseFile);
} catch (err) {
  throw new Error(
    'SQLite nativo indisponível. Esta aplicação requer Node.js 22.5+ (Hostinger Node 22). ' +
    `Detalhe: ${err.message}`
  );
}

db.mode = 'sqlite';
db.driver = 'node:sqlite';
db.databaseFile = databaseFile;

module.exports = db;
