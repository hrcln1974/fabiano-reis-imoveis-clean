# Segurança — Produção 1.0.0

- JWT obrigatório em produção.
- Senhas armazenadas com bcrypt.
- Cookie de autenticação HttpOnly.
- CORS restrito ao domínio configurado.
- Cabeçalhos de segurança HTTP.
- Validação de MIME, extensão e assinatura dos uploads.
- Limites de tamanho de imagem e vídeo.
- Exclusão de mídia limitada ao imóvel autenticado.
- Exclusão de leads exige autenticação do corretor.
- Banco e mídia ficam fora da pasta pública quando configurados conforme o deploy.

Nunca coloque credenciais reais no pacote ou no repositório.
