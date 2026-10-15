# Atualização — Carrossel automático de banners | Fabiano Reis Imóveis

Esta atualização corrige a troca visual do carrossel e adiciona proteção contra salto de layout somente na apresentação do banner desktop/tablet, mantendo a área do banner reservada durante a troca.

Preserva catálogo, filtros, cadastro/edição/exclusão de imóveis, CRM/leads, formulários, WhatsApp, login/painel, APIs, banco e o banner mobile dedicado.

Arquivos alterados/adicionados:
- `public/index.html`
- `public/script.js`
- `public/ui.css`
- `package.json`
- `scripts/audit-release.js`
- `scripts/test-carousel.js`

Testes realizados:
- `npm run verify` — PASS
- `npm run test:carousel` — PASS (20 verificações)
- `npm run test:smoke` — PASS (56/56)
- `npm run production:gate` — PASS (10/10)
- `git diff --check` — PASS
- `npm run test:share` — não executado até conclusão porque o `database.db` do ZIP contém 0 imóveis ativos; esse teste depende de pelo menos um imóvel real ativo.

Aplicação: extraia este ZIP sobre a raiz do projeto atual. Não substitua o banco de produção.

Depois:

```bash
npm install
npm run verify
npm run test:carousel
npm run test:smoke
npm run production:gate
```

Git, executado somente pelo proprietário do projeto:

```bash
git status
git diff --check
git add public/index.html public/script.js public/ui.css package.json scripts/audit-release.js scripts/test-carousel.js
git commit -m "feat: adicionar carrossel automático de banners"
git push origin main
```

Evite `git add .` se houver alterações locais de dados, especialmente `imoveis-fabiano-reis.json`.
