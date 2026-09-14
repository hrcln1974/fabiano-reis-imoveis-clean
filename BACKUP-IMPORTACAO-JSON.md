# Backup e Importação de Imóveis — Fabiano Reis Imóveis

## Objetivo

Esta release adiciona uma rotina segura de exportação e importação dos cadastros de imóveis sem substituir o banco persistente da Hostinger.

## Exportação

No painel do corretor, em **Imóveis → Backup e importação segura**, use **Exportar backup JSON**. O arquivo contém:

- dados dos imóveis ativos e inativos;
- características normalizadas;
- referências/metadados das mídias;
- versão e data do backup.

Os arquivos físicos de fotos e vídeos continuam no storage persistente. O JSON não incorpora os binários das mídias.

## Importação

Existem dois modos:

1. **Atualizar existentes** — usa o `id` do JSON quando encontrado. Se o ID não existir, cria um novo imóvel.
2. **Adicionar como novos** — sempre cria novos registros e não reutiliza os IDs do arquivo.

A operação é validada antes de começar e executada em transação. Em caso de erro, a operação é revertida. A importação normal não exclui imóveis nem mídias existentes.

## Recomendação operacional

Antes de uma atualização do sistema:

1. abra o Dashboard;
2. exporte o backup JSON;
3. confirme que o download foi concluído;
4. somente depois faça o deploy;
5. se necessário, importe o JSON no modo **Atualizar existentes**.

A aplicação em produção usa um banco SQLite persistente fora do diretório descartável do build quando `NODE_ENV=production`. Assim, o deploy do código não deve substituir o banco persistente.
