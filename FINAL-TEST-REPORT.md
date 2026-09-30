# Relatório Final de Testes — Fabiano Reis Imóveis V1.1.0

Data: 29/09/2026

## Resultado

### Aprovado
- Auditoria do pacote de release: **10/10**.
- Sintaxe de `server.js`, `db-adapter.js` e `storage/index.js`: **OK**.
- Sintaxe de `public/script.js`, `public/dashboard.js` e `public/crm.js`: **OK**.
- Arquivos obrigatórios do release: **OK**.
- Banco local, WAL/SHM, `.env`, `node_modules`, `.git`, backups e coverage: **excluídos do release**.
- `llms.txt`: **OK**.
- Open Graph institucional 1200x630: **OK**.
- Favicon: **OK**.
- 404: **OK**.
- robots.txt: **OK**.
- sitemap.xml: **OK**.
- acesso administrativo discreto no rodapé: **OK**.
- CTA da primeira dobra: **OK**.
- ALT das imagens HTML verificadas: **OK**.
- preservação arquitetural de banco e MEDIA_ROOT: **OK**.

## Integridade dos dados do cliente

O arquivo de backup `imoveis-fabiano-reis.json` contém:
- **11 imóveis**;
- **276 mídias**;
- IDs preservados: `24, 23, 22, 21, 19, 18, 15, 14, 9, 8, 6`.

O `database.db` presente no ZIP de desenvolvimento não contém os imóveis do cliente. Por isso ele **não entra no pacote de produção**.

As referências das mídias dos imóveis apontam para armazenamento externo/persistente via `MEDIA_ROOT`; essas mídias não devem ser substituídas por um deploy de código.

## Smoke test de runtime

O smoke test completo **não pôde ser concluído neste ambiente de execução** porque a instalação de dependências via npm não conseguiu concluir por falhas de rede/DNS (`EAI_AGAIN` ao acessar o registry do npm). O servidor encerrou com `MODULE_NOT_FOUND: dotenv` porque o `node_modules` local ficou incompleto.

Isso é uma limitação do ambiente de teste, não uma aprovação fictícia do runtime.

### Teste obrigatório na Hostinger

Após instalar as dependências no servidor:

```bash
npm ci --omit=dev
npm run check:syntax
npm run test:smoke
```

Depois validar manualmente:

```text
/api/health
/
/sitemap.xml
/robots.txt
/llms.txt
/share/imovel/ID.jpg
/imovel/...
```

E testar:
- login;
- dashboard;
- CRM;
- imóveis existentes;
- fotos existentes;
- marca d'água;
- compartilhamento;
- WhatsApp;
- formulário de interesse;
- criação/edição de imóvel;
- exclusão de mídia;
- leads;
- logout.

## Regra de deploy

**Atualizar código não significa substituir dados.**

Antes do deploy:
1. backup do SQLite persistente;
2. backup de `MEDIA_ROOT`;
3. substituir somente o release de código;
4. reiniciar Node;
5. conferir quantidade de imóveis e mídias;
6. executar smoke test;
7. somente então liberar a versão.
