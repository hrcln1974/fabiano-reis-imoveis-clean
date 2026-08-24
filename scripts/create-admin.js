require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../db-adapter');

function ask(question, hidden = false) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (!hidden) {
      rl.question(question, answer => { rl.close(); resolve(answer.trim()); });
      return;
    }
    const stdin = process.stdin;
    const oldRaw = stdin.isRaw;
    try { stdin.setRawMode(true); } catch (_) {}
    process.stdout.write(question);
    let value = '';
    const onData = ch => {
      ch = ch.toString();
      if (ch === '\u0003') { process.stdout.write('\n'); cleanup(); process.exit(130); }
      if (ch === '\r' || ch === '\n') { process.stdout.write('\n'); cleanup(); resolve(value); return; }
      if (ch === '\u007f') { if (value.length) { value = value.slice(0,-1); process.stdout.write('\b \b'); } return; }
      value += ch; process.stdout.write('*');
    };
    function cleanup() { stdin.off('data', onData); try { stdin.setRawMode(oldRaw); } catch (_) {} rl.close(); }
    stdin.on('data', onData);
  });
}

function strong(password) {
  return password.length >= 12 && password.length <= 200 && /[A-Z]/.test(password) && /\d/.test(password);
}

async function main() {
  let email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  let password = String(process.env.ADMIN_PASSWORD || '');
  let nome = String(process.env.ADMIN_NAME || 'Fabiano Reis').trim();

  if (!email) email = (await ask('E-mail do administrador: ')).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('E-mail inválido.');
  if (!nome || nome.length < 2) nome = await ask('Nome do administrador [Fabiano Reis]: ') || 'Fabiano Reis';
  if (!password) password = await ask('Nova senha (mín. 12, 1 maiúscula e 1 número): ', true);
  if (!strong(password)) throw new Error('Senha inválida: use 12+ caracteres, 1 letra maiúscula e 1 número.');

  console.log(`Banco: SQLite persistente (${db.databaseFile || 'configurado'}).`);
  await db.ready;

  await new Promise((resolve, reject) => db.run(
    `CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, email TEXT UNIQUE NOT NULL, senha TEXT NOT NULL, tipo TEXT DEFAULT 'cliente', ativo INTEGER DEFAULT 1, criado_em DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    err => err ? reject(err) : resolve()
  ));

  const hash = bcrypt.hashSync(password, 12);
  const existing = await new Promise((resolve, reject) => db.get('SELECT id FROM usuarios WHERE email = ?', [email], (err,row) => err ? reject(err) : resolve(row)));

  if (existing) {
    await new Promise((resolve,reject) => db.run('UPDATE usuarios SET nome=?, senha=?, tipo=?, ativo=1 WHERE id=?', [nome,hash,'corretor',existing.id], err => err ? reject(err) : resolve()));
    console.log(`Administrador atualizado com sucesso: ${email}`);
  } else {
    await new Promise((resolve,reject) => db.run('INSERT INTO usuarios (nome,email,senha,tipo,ativo) VALUES (?,?,?,?,1)', [nome,email,hash,'corretor'], err => err ? reject(err) : resolve()));
    console.log(`Administrador criado com sucesso: ${email}`);
  }
  console.log('Agora faça login usando exatamente esse e-mail e a senha definida neste comando.');
}

main().catch(err => { console.error('Falha ao provisionar administrador:', err.message); process.exitCode=1; });
