# Job de resumos de IA (VPS)

Roda a cada 15 min como o usuário `formia`. Lê `respostas`, gera resumos com o Claude Code CLI
(sem ferramentas) e grava em `resumos_ia`. O segredo (`DATABASE_URL`) fica só em
`/etc/formulario-ia/db.env` (600, dono formia) e nunca entra neste repositório.

- Código: `/opt/formulario-ia/` (venv em `/opt/formulario-ia/venv`)
- Claude: `/opt/formia-claude` (`@anthropic-ai/claude-code@2.1.263`), login do `formia` em `/var/lib/formia`
- Log: `/var/log/formulario-ia.log`
- Teste sem login nem banco: `python3 -m unittest -v test_formia.py`
