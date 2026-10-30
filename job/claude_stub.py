#!/usr/bin/env python3
"""Dublê do `claude` para provar o job sem login. Devolve JSON fixo no envelope do `--output-format json`.

  STUB_LOGADO=0   -> `auth status` diz que não está logado
  STUB_FALHA=1    -> toda chamada -p sai com erro (prova que falha não apaga o resumo antigo)
"""
import json
import os
import sys

args = sys.argv[1:]

if args[:2] == ["auth", "status"]:
    logado = os.environ.get("STUB_LOGADO", "1") != "0"
    print(json.dumps({"loggedIn": logado, "authMethod": "stub" if logado else "none"}))
    sys.exit(0)

entrada = sys.stdin.read()
if os.environ.get("STUB_FALHA") == "1":
    print("stub: falha simulada", file=sys.stderr)
    sys.exit(1)

if "TIPO: geral" in entrada:
    conteudo = {
        "retrato": "[STUB] Retrato fixo do time para provar o job.",
        "lacunas": ["[STUB] Lacuna de teste"],
        "proxima_aula": [{"tema": "[STUB] Tema de teste", "porque": "Texto fixo do dublê, sem base nas respostas."}],
        "grupos": [{"nome": "[STUB] Grupo de teste", "pessoas": ["Pessoa de teste"], "precisam": "Conteúdo de teste."}],
        "riscos": ["[STUB] Risco de teste"],
    }
else:
    conteudo = {
        "pontos_fortes": ["[STUB] Ponto forte de teste"],
        "lacunas": ["[STUB] Lacuna de teste"],
        "aprender_a_seguir": ["[STUB] Aprender X"],
        "cuidado": None,
    }

print(json.dumps({
    "type": "result", "subtype": "success", "is_error": False,
    "result": json.dumps(conteudo, ensure_ascii=False),
    "modelUsage": {"stub-model": {}},
}))
