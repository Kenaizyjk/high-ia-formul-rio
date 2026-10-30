// Perguntas e pontuação. Importado pelo cliente (telas) e pelo servidor (recálculo).
// A pontuação nunca é confiada ao navegador: o servidor recalcula a partir das respostas.

export type Dimensao = "uso" | "dominio" | "responsabilidade" | "visao";

export const DIMENSOES: { id: Dimensao; nome: string; max: number }[] = [
  { id: "uso", nome: "Uso", max: 9 },
  { id: "dominio", nome: "Domínio", max: 12 },
  { id: "responsabilidade", nome: "Responsabilidade", max: 6 },
  { id: "visao", nome: "Visão", max: 6 },
];

export const AREAS = [
  "Tráfego pago",
  "Atendimento/Account",
  "Criação e design",
  "Edição de vídeo",
  "Social media",
  "Comercial",
  "Gestão",
  "Operações e financeiro",
  "Outra",
] as const;

export const TEMPOS = ["Menos de 6 meses", "6 a 12 meses", "1 a 2 anos", "Mais de 2 anos"] as const;

export const FERRAMENTAS = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Copilot",
  "Meta AI",
  "Perplexity",
  "NotebookLM",
  "Canva IA/Adobe Firefly",
  "CapCut IA",
  "Gerador de imagem (Midjourney etc.)",
  "Automação (n8n, Make, Zapier)",
  "Nenhuma",
] as const;

export const USOS = [
  "Escrever textos e copies",
  "Responder clientes",
  "Analisar números e relatórios",
  "Planilhas e fórmulas",
  "Ideias de criativos e roteiros",
  "Criar ou editar imagens",
  "Editar vídeo",
  "Pesquisar concorrentes e mercado",
  "Automatizar tarefas repetitivas",
  "Aprender algo novo",
  "Não uso",
] as const;

export const TRAVAS = [
  "Falta de tempo para aprender",
  "Não sei por onde começar",
  "Não confio nas respostas",
  "Medo de errar com cliente",
  "Ferramentas pagas",
  "Não vejo utilidade na minha função",
  "Nada me trava",
] as const;

export const TREINAMENTO = ["Sim", "Talvez", "Não"] as const;

export type Opcao = { texto: string; pontos?: number };

type Base = { id: string; bloco: string; titulo: string; ajuda?: string };
export type Pergunta =
  | (Base & { tipo: "unica"; opcoes: Opcao[]; dimensao?: Dimensao })
  | (Base & { tipo: "multipla"; opcoes: string[]; exclusiva?: string; dimensao?: Dimensao })
  | (Base & { tipo: "escala"; rotulos: [string, string]; dimensao?: Dimensao })
  | (Base & { tipo: "texto"; opcional: true; placeholder: string });

// q1..q15 seguem a numeração da spec. A identificação (nome, e-mail, área, tempo) fica fora daqui.
export const PERGUNTAS: Pergunta[] = [
  {
    id: "q1", bloco: "Uso", dimensao: "uso", tipo: "unica",
    titulo: "Com que frequência você usa IA no trabalho?",
    opcoes: [
      { texto: "Nunca", pontos: 0 },
      { texto: "Algumas vezes por mês", pontos: 1 },
      { texto: "Algumas vezes por semana", pontos: 2 },
      { texto: "Todos os dias", pontos: 3 },
    ],
  },
  {
    id: "q2", bloco: "Uso", dimensao: "uso", tipo: "multipla", exclusiva: "Nenhuma",
    titulo: "Quais ferramentas você já usou?", ajuda: "Marque quantas quiser.",
    opcoes: [...FERRAMENTAS],
  },
  {
    id: "q3", bloco: "Uso", dimensao: "uso", tipo: "multipla", exclusiva: "Não uso",
    titulo: "Para que você usa?", ajuda: "Marque quantas quiser.",
    opcoes: [...USOS],
  },
  {
    id: "q4", bloco: "Domínio", dimensao: "dominio", tipo: "escala",
    titulo: "De 1 a 5, quanto você entende de IA?", rotulos: ["Quase nada", "Entendo bem"],
  },
  {
    id: "q5", bloco: "Domínio", dimensao: "dominio", tipo: "unica",
    titulo: "Quando pede algo para a IA, normalmente você:",
    opcoes: [
      { texto: "Escreve uma frase curta e usa a primeira resposta", pontos: 0 },
      { texto: "Reformula até ficar bom", pontos: 1 },
      { texto: "Dá contexto, exemplo e o formato que espera", pontos: 2 },
      { texto: "Tem modelos de pedido salvos e reaproveita", pontos: 3 },
    ],
  },
  {
    id: "q6", bloco: "Domínio", dimensao: "dominio", tipo: "unica",
    titulo: "A IA te dá um número (ex.: “o CPM médio de moda é R$ 15”). O que você faz?",
    opcoes: [
      { texto: "Uso direto", pontos: 0 },
      { texto: "Uso se parecer certo", pontos: 1 },
      { texto: "Confiro em outra fonte antes de usar", pontos: 3 },
      { texto: "Não uso IA para isso", pontos: 1 },
    ],
  },
  {
    id: "q7", bloco: "Domínio", dimensao: "dominio", tipo: "unica",
    titulo: "Você sabe o que é “alucinação” de IA?",
    opcoes: [
      { texto: "Nunca ouvi falar", pontos: 0 },
      { texto: "Já ouvi, mas não sei explicar", pontos: 1 },
      { texto: "Sei e já vi acontecer", pontos: 3 },
    ],
  },
  {
    id: "q8", bloco: "Responsabilidade", dimensao: "responsabilidade", tipo: "unica",
    titulo: "Você colaria dados de um cliente (faturamento, planilha, conversas) numa IA?",
    opcoes: [
      { texto: "Sim, qualquer dado", pontos: 0 },
      { texto: "Sim, mas tiro nomes e dados sensíveis antes", pontos: 3 },
      { texto: "Só numa ferramenta aprovada pela empresa", pontos: 3 },
      { texto: "Nunca pensei nisso", pontos: 0 },
    ],
  },
  {
    id: "q9", bloco: "Responsabilidade", dimensao: "responsabilidade", tipo: "unica",
    titulo: "Você sabe se as ferramentas que usa guardam ou treinam com o que você digita?",
    opcoes: [
      { texto: "Não sei", pontos: 0 },
      { texto: "Acho que sim ou que não", pontos: 1 },
      { texto: "Sei e ajusto isso nas configurações", pontos: 3 },
    ],
  },
  {
    id: "q10", bloco: "Visão", dimensao: "visao", tipo: "unica",
    titulo: "Quanto tempo a IA te economiza por semana hoje?",
    opcoes: [
      { texto: "Nada", pontos: 0 },
      { texto: "Até 1 hora", pontos: 1 },
      { texto: "De 1 a 3 horas", pontos: 2 },
      { texto: "Mais de 3 horas", pontos: 3 },
    ],
  },
  {
    id: "q11", bloco: "Visão", dimensao: "visao", tipo: "unica",
    titulo: "Você já criou alguma automação, GPT personalizado, Gem, projeto ou agente?",
    opcoes: [
      { texto: "Não", pontos: 0 },
      { texto: "Já tentei", pontos: 1 },
      { texto: "Sim, e uso no dia a dia", pontos: 3 },
    ],
  },
  {
    id: "q12", bloco: "Visão", tipo: "escala",
    titulo: "De 1 a 5, quanto a IA vai mudar o seu trabalho nos próximos 12 meses?",
    rotulos: ["Quase nada", "Muito"],
  },
  {
    id: "q13", bloco: "Visão", tipo: "multipla", exclusiva: "Nada me trava",
    titulo: "O que mais te trava para usar mais IA?", ajuda: "Marque quantas quiser.",
    opcoes: [...TRAVAS],
  },
  {
    id: "q14", bloco: "Visão", tipo: "texto", opcional: true,
    titulo: "Qual tarefa do seu dia você mais gostaria que a IA fizesse por você?",
    placeholder: "Opcional. Ex.: montar o relatório semanal do cliente",
  },
  {
    id: "q15", bloco: "Visão", tipo: "unica",
    titulo: "Topa participar de um treinamento interno de IA?",
    opcoes: TREINAMENTO.map((texto) => ({ texto })),
  },
];

export type Respostas = Record<string, string | string[] | number | undefined>;

export type Pontuacao = {
  total: number;
  dimensoes: Record<Dimensao, number>;
  nivel: 1 | 2 | 3 | 4;
};

function pontosMultipla(id: string, marcadas: string[]): number {
  const n = marcadas.length;
  if (id === "q2") {
    if (marcadas.includes("Nenhuma") || n === 0) return 0;
    return n === 1 ? 1 : n <= 3 ? 2 : 3;
  }
  if (id === "q3") {
    if (marcadas.includes("Não uso") || n === 0) return 0;
    return n <= 2 ? 1 : n <= 4 ? 2 : 3;
  }
  return 0;
}

export function pontosDaPergunta(p: Pergunta, resp: Respostas): number {
  const v = resp[p.id];
  if (p.tipo === "unica") return p.opcoes.find((o) => o.texto === v)?.pontos ?? 0;
  if (p.tipo === "multipla") return pontosMultipla(p.id, Array.isArray(v) ? v : []);
  if (p.tipo === "escala" && p.id === "q4") {
    const n = Number(v);
    return n <= 1 ? 0 : n === 2 ? 1 : n === 3 ? 2 : 3;
  }
  return 0;
}

export function nivelDoTotal(total: number): 1 | 2 | 3 | 4 {
  return total <= 8 ? 1 : total <= 17 ? 2 : total <= 25 ? 3 : 4;
}

export function pontuar(resp: Respostas): Pontuacao {
  const dimensoes: Record<Dimensao, number> = { uso: 0, dominio: 0, responsabilidade: 0, visao: 0 };
  for (const p of PERGUNTAS) {
    if ("dimensao" in p && p.dimensao) dimensoes[p.dimensao] += pontosDaPergunta(p, resp);
  }
  const total = dimensoes.uso + dimensoes.dominio + dimensoes.responsabilidade + dimensoes.visao;
  return { total, dimensoes, nivel: nivelDoTotal(total) };
}

export const NIVEIS: Record<1 | 2 | 3 | 4, { nome: string; descricao: string }> = {
  1: { nome: "Curioso", descricao: "Você está no começo: a IA ainda é novidade no seu dia, e cada teste pequeno já rende aprendizado." },
  2: { nome: "Explorador", descricao: "Você já testa e acerta de vez em quando; falta transformar o que funciona em hábito e método." },
  3: { nome: "Praticante", descricao: "A IA já faz parte da sua rotina e você sabe pedir, conferir e proteger os dados do cliente." },
  4: { nome: "Estrategista", descricao: "Você usa IA com método, cria processos e automações, e pode ensinar o resto do time." },
};

export const DICAS: Record<Dimensao, [string, string]> = {
  uso: [
    "Escolha uma tarefa repetida da semana (legenda, relatório, resposta ao cliente) e faça ela com IA por 7 dias seguidos.",
    "Teste mais de uma ferramenta na mesma tarefa, como ChatGPT, Claude e Gemini, e fique com a que entrega melhor para você.",
  ],
  dominio: [
    "Peça sempre com contexto, exemplo e formato: quem é o cliente, o objetivo e como você quer a resposta (tabela, lista, texto curto).",
    "Guarde seus melhores pedidos num documento de modelos e confira todo número que a IA devolver antes de mandar para o cliente.",
  ],
  responsabilidade: [
    "Antes de colar qualquer coisa, tire nome do cliente, CNPJ, telefone e valores reais; troque por exemplos.",
    "Abra as configurações da ferramenta e desligue o uso das suas conversas para treinar o modelo; pergunte à gestão quais ferramentas são aprovadas.",
  ],
  visao: [
    "Meça: anote quanto tempo a tarefa levava antes e depois da IA. Número de horas ganhas convence a agência a investir.",
    "Crie um GPT, Gem ou projeto para uma tarefa fixa (ex.: briefing de campanha) e compartilhe com o time.",
  ],
};
