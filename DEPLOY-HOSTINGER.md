# Deploy seguro — Hostinger

## 1. Runtime
Use Node.js 22.x ou outra versão compatível com o `package.json`.

## 2. Variáveis obrigatórias
```env
NODE_ENV=production
PORT=3000
SITE_URL=https://fabianoreisimoveis.com.br
CORS_ORIGIN=https://fabianoreisimoveis.com.br
TRUST_PROXY=1
JWT_SECRET=GERAR_UM_SEGREDO_FORTE
SQLITE_FILE=/home/SEU_USUARIO/fabiano-reis-data/database.db
MEDIA_ROOT=/home/SEU_USUARIO/fabiano-reis-media
STORAGE_PROVIDER=local
WHATSAPP_NUMBER=5521991822134
CONTATO_EMAIL=SEU_EMAIL
```

Não use caminhos de builds, releases ou diretórios temporários para banco ou mídias.

## 3. Regra crítica de atualização
**Nunca envie `database.db`, `database.db-wal`, `database.db-shm` ou a pasta de mídias do cliente junto com uma atualização de código.**

O pacote `release/` é destinado ao código da aplicação. O banco e as mídias permanecem nos caminhos persistentes configurados acima.

Antes de substituir o código, faça backup no servidor:

```bash
cp "$SQLITE_FILE" "$SQLITE_FILE.backup-$(date +%Y%m%d-%H%M%S)" 2>/dev/null || true

tar -czf "$HOME/fabiano-reis-media-backup-$(date +%Y%m%d-%H%M%S).tar.gz" \
  -C "$(dirname "$MEDIA_ROOT")" "$(basename "$MEDIA_ROOT")"
```

## 4. Instalação/validação
```bash
npm ci --omit=dev
npm run check:syntax
npm run audit:release
```

O `npm run production:gate` também executa o smoke test completo quando todas as dependências estão instaladas no servidor.

## 5. Persistência
O banco fica fora da pasta do build em `fabiano-reis-data` e as mídias em `fabiano-reis-media`.

O ZIP de atualização **não deve substituir esses diretórios**.

## 6. Conta administrativa
`npm run admin:create` só deve ser executado quando for necessário criar ou atualizar explicitamente a conta administrativa.

A atualização normal do site não deve recriar o administrador.

## 7. Checklist pós-atualização
1. Confirmar quantidade de imóveis antes/depois.
2. Confirmar fotos principais e galerias.
3. Abrir pelo menos 3 páginas individuais de imóveis existentes.
4. Confirmar marca d'água nas imagens.
5. Testar compartilhar imóvel.
6. Testar WhatsApp.
7. Testar busca e filtros.
8. Testar formulário de interesse.
9. Testar login administrativo.
10. Testar dashboard e CRM.
11. Testar logout.
12. Abrir `/robots.txt`, `/sitemap.xml` e `/llms.txt`.
13. Testar `/share/imovel/ID.jpg` de um imóvel existente.
14. Verificar `/api/health`.
15. Conferir logs do Node no hPanel.

## 8. Recuperação
Se uma atualização falhar:

```text
parar/reiniciar aplicação
        ↓
restaurar somente o código anterior
        ↓
manter banco e MEDIA_ROOT intactos
        ↓
reiniciar Node
        ↓
validar /api/health
        ↓
validar imóveis e mídias
```

Só restaurar banco/mídias se o backup comprovar que esses dados foram realmente afetados.
