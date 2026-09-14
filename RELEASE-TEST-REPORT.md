# FABIANO REIS IMÓVEIS — RELEASE TEST REPORT

## Versão

1.0.0 — pacote final com Backup/Importação JSON, restauração de vínculos de mídia e configuração de horário.

## Alterações validadas

- Open Graph dinâmico por imóvel preservado.
- Foto principal usada em `og:image` e Twitter/X preservada.
- Exportação JSON de imóveis preservada.
- Importação JSON com modos `atualizar` e `adicionar` preservada.
- Importação de JSON agora restaura/vincula referências de `imovel_midias` quando o arquivo físico local ou URL externa está disponível.
- Mídias existentes não são apagadas durante importação.
- Duplicatas de vínculo de mídia não são criadas.
- Operação permanece transacional com rollback.
- Nova área Dashboard > Configurações > Horário de atendimento.
- Horário salvo em tabela persistente `configuracoes_site`.
- `CONTATO_HORARIO` permanece como fallback compatível.
- `/api/corretor` passa a refletir o horário salvo no painel.
- Site público atualiza o horário através de `/api/corretor`.

## Bateria de testes

### PASS

- `node --check server.js`
- `node --check public/dashboard.js`
- `node --check public/script.js`
- `node --check db-adapter.js`
- `node --check storage/index.js`
- `npm run check`
- `npm run check:syntax`
- `npm run audit:release` — AUDITORIA 10/10
- Teste isolado de configuração persistente.
- Teste isolado de transação/rollback.
- Teste de integração HTTP com login, configuração de horário, exportação JSON, importação de imóvel, vínculo de mídia, atualização do mesmo imóvel e prevenção de duplicação de mídia — PASS.

### Limitação de ambiente

O smoke test completo de upload de imagem não foi usado como critério de aprovação final porque o ambiente de execução disponível possui os binários do Sharp incompatíveis com Linux x64 (o pacote original contém módulos nativos de outra plataforma). O problema é do ambiente de teste, não uma alteração introduzida neste release. A validação de sintaxe, preflight, auditoria e a integração das funcionalidades novas foram executadas separadamente.

## Integridade de produção

- `database.db`, WAL/SHM e `.env` não fazem parte do ZIP final.
- `node_modules` não faz parte do ZIP final; a Hostinger executa `npm install` durante o deploy.
- Nenhuma mídia existente foi removida pelo processo de edição.
- Nenhuma funcionalidade atual foi deliberadamente removida.

## Resultado

**APROVADO PARA DEPLOY CONTROLADO NA HOSTINGER.**

Recomendação operacional: fazer backup JSON dos imóveis antes do primeiro deploy e não substituir o banco persistente da produção.
