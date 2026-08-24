# Fabiano Reis Imóveis — Produção 1.0.0

Projeto independente para produção na Hostinger. Esta versão não depende de bancos, uploads, builds, backups ou diretórios de versões anteriores.

## Recursos
- catálogo público de imóveis;
- busca e filtros;
- página individual do imóvel;
- painel administrativo protegido;
- cadastro, edição e exclusão de imóveis;
- fotos e vídeos, incluindo YouTube/Vimeo;
- foto principal e galeria;
- leads com atualização de status e exclusão definitiva;
- CRM básico;
- WhatsApp, e-mail e exportação de leads;
- SEO, sitemap, robots.txt e Schema.org;
- responsividade e acessibilidade;
- armazenamento persistente local para Hostinger.

## Dados novos
O banco é criado automaticamente no caminho definido por `SQLITE_FILE`. A mídia é criada automaticamente em `MEDIA_ROOT`. Nenhum banco ou mídia de versões anteriores é incluído neste pacote.

## Primeiro acesso
1. Configure as variáveis do `.env` na Hostinger.
2. Gere um `JWT_SECRET` forte.
3. Execute `npm run admin:create` para criar o administrador.
4. Inicie o Node.js pela configuração de aplicação da Hostinger.
5. Faça os testes públicos e administrativos antes de apontar o domínio definitivo.

## Imagens incluídas
Somente a foto do corretor e o banner institucional são preservados no pacote. Imagens de imóveis devem ser cadastradas pelo painel.
