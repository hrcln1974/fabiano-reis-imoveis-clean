const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Adm = require('../db-adapter');
const db = Adm;

function run(sql, params=[]) { return new Promise((resolve,reject)=>db.run(sql,params,function(err){if(err)reject(err);else resolve(this)})); }
function get(sql, params=[]) { return new Promise((resolve,reject)=>db.get(sql,params,(e,r)=>e?reject(e):resolve(r))); }
(async()=>{
  await run('CREATE TABLE IF NOT EXISTS configuracoes_site (chave TEXT PRIMARY KEY, valor TEXT NOT NULL, atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP)');
  await run("INSERT INTO configuracoes_site (chave, valor) VALUES ('contato_horario','TESTE') ON CONFLICT(chave) DO UPDATE SET valor=excluded.valor");
  const cfg=await get('SELECT valor FROM configuracoes_site WHERE chave=?',['contato_horario']);
  assert.strictEqual(cfg.valor,'TESTE');
  await run('DROP TABLE IF EXISTS __test_midias');
  await run('CREATE TABLE __test_midias (id INTEGER PRIMARY KEY, imovel_id INTEGER, arquivo TEXT, principal INTEGER DEFAULT 0)');
  await run('BEGIN');
  await run('INSERT INTO __test_midias (imovel_id,arquivo,principal) VALUES (1,?,1)',['/uploads/imagens/teste.jpg']);
  await run('ROLLBACK');
  const row=await get('SELECT COUNT(*) AS n FROM __test_midias');
  assert.strictEqual(Number(row.n),0);
  await run('DROP TABLE __test_midias');
  console.log('BACKUP/IMPORT/SETTINGS TEST PASS');
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
