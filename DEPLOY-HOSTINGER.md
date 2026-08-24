# Deploy — Hostinger

## 1. Node
Use Node.js 22.x ou superior compatível com o `package.json`.

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

Não use caminhos de builds, releases ou diretórios temporários.

## 3. Instalação
```bash
npm ci --omit=dev
npm run check:syntax
npm run production:gate
npm run admin:create
```

## 4. Persistência
O banco fica fora da pasta do build em `fabiano-reis-data` e as mídias em `fabiano-reis-media`.

## 5. Teste
Antes do domínio definitivo, valide home, busca, detalhe, login, criação de imóvel, upload, exclusão de mídia, leads, exclusão de lead, WhatsApp e logout.
