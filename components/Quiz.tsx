"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { enviarRespostas } from "@/app/actions";
import { AREAS, PERGUNTAS, TEMPOS, type Pergunta, type Respostas } from "@/lib/questions";
import { CAMPO_ARMADILHA } from "@/lib/schema";

type Passo =
  | { tipo: "nome"; id: "nome"; bloco: string }
  | { tipo: "area"; id: "area"; bloco: string }
  | { tipo: "tempo"; id: "tempo"; bloco: string }
  | { tipo: "pergunta"; id: string; bloco: string; pergunta: Pergunta };

const PASSOS: Passo[] = [
  { tipo: "nome", id: "nome", bloco: "Sobre você" },
  { tipo: "area", id: "area", bloco: "Sobre você" },
  { tipo: "tempo", id: "tempo", bloco: "Sobre você" },
  ...PERGUNTAS.map((pergunta): Passo => ({ tipo: "pergunta", id: pergunta.id, bloco: pergunta.bloco, pergunta })),
];

const BLOCOS = ["Sobre você", "Uso", "Domínio", "Responsabilidade", "Visão"];

function Logo({ className = "h-8 w-auto self-start" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/high-horizontal-branco.svg" alt="High Media" className={className} />;
}

function Botao({
  children, onClick, variante = "primario", desabilitado, tipo = "button",
}: {
  children: React.ReactNode; onClick?: () => void; variante?: "primario" | "fantasma";
  desabilitado?: boolean; tipo?: "button" | "submit";
}) {
  const base =
    "inline-flex min-h-[52px] items-center justify-center rounded-2xl px-7 text-base font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";
  const cor =
    variante === "primario"
      ? "bg-laranja text-carvao hover:brightness-110 shadow-[0_8px_30px_-8px_rgba(255,76,33,0.7)]"
      : "border border-borda text-texto hover:border-suave";
  return (
    <button type={tipo} onClick={onClick} disabled={desabilitado} className={`${base} ${cor}`}>
      {children}
    </button>
  );
}

function Cartao({
  selecionado, onClick, children, marca = "radio",
}: { selecionado: boolean; onClick: () => void; children: React.ReactNode; marca?: "radio" | "check" }) {
  return (
    <button
      type="button"
      role={marca === "radio" ? "radio" : "checkbox"}
      aria-checked={selecionado}
      onClick={onClick}
      className={`flex min-h-[60px] w-full items-center gap-4 rounded-2xl border px-5 py-3 text-left text-base font-semibold leading-snug transition active:scale-[0.99] ${
        selecionado
          ? "border-laranja bg-laranja/15 text-texto shadow-[0_0_0_1px_#FF4C21]"
          : "border-borda bg-superficie/80 text-texto hover:border-suave"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid h-6 w-6 shrink-0 place-items-center border-2 ${marca === "radio" ? "rounded-full" : "rounded-md"} ${
          selecionado ? "border-laranja bg-laranja" : "border-suave"
        }`}
      >
        {selecionado && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-carvao" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2 6.5l2.5 2.5L10 3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span>{children}</span>
    </button>
  );
}

export default function Quiz() {
  const [etapa, setEtapa] = useState<"capa" | "form" | "enviando" | "fim">("capa");
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [nome, setNome] = useState("");
  const [area, setArea] = useState("");
  const [tempo, setTempo] = useState("");
  const [resp, setResp] = useState<Respostas>({});
  const [honeypot, setHoneypot] = useState("");
  const [erro, setErro] = useState("");
  const iniciouEm = useRef(0);
  const avancando = useRef<ReturnType<typeof setTimeout> | null>(null);

  const passo = PASSOS[i];

  const valido = useMemo(() => {
    switch (passo.tipo) {
      case "nome":
        return nome.trim().length >= 2;
      case "area":
        return area !== "";
      case "tempo":
        return tempo !== "";
      case "pergunta": {
        const p = passo.pergunta;
        const v = resp[p.id];
        if (p.tipo === "texto") return true;
        if (p.tipo === "multipla") return Array.isArray(v) && v.length > 0;
        if (p.tipo === "escala") return typeof v === "number";
        return typeof v === "string";
      }
    }
  }, [passo, nome, area, tempo, resp]);

  const enviar = useCallback(async () => {
    setEtapa("enviando");
    setErro("");
    const r = await enviarRespostas({
      nome: nome.trim(),
      area,
      tempo,
      respostas: resp,
      [CAMPO_ARMADILHA]: honeypot,
      iniciouEm: iniciouEm.current,
    }).catch(() => ({ ok: false as const, erro: "Sem conexão. Confira a internet e tente de novo." }));
    if (r.ok) {
      setEtapa("fim");
    } else {
      setErro(r.erro);
      setEtapa("form");
    }
  }, [nome, area, tempo, resp, honeypot]);

  const avancar = useCallback(() => {
    if (avancando.current) clearTimeout(avancando.current); // evita avanço duplo com o automático
    if (!valido) return;
    if (i === PASSOS.length - 1) {
      void enviar();
      return;
    }
    setDir(1);
    setI((x) => x + 1);
  }, [valido, i, enviar]);

  const voltar = useCallback(() => {
    if (avancando.current) clearTimeout(avancando.current);
    if (i === 0) {
      setEtapa("capa");
      return;
    }
    setDir(-1);
    setI((x) => x - 1);
  }, [i]);

  // seleção que avança sozinha (resposta única): dá tempo de ver o cartão marcado
  const avancarDepois = useCallback(() => {
    if (avancando.current) clearTimeout(avancando.current);
    avancando.current = setTimeout(() => {
      setDir(1);
      setI((x) => Math.min(x + 1, PASSOS.length - 1));
    }, 260);
  }, []);

  const ehUltimo = i === PASSOS.length - 1;

  useEffect(() => {
    if (etapa !== "form") return;
    const onKey = (ev: KeyboardEvent) => {
      const alvo = ev.target as HTMLElement | null;
      const emTexto = alvo?.tagName === "TEXTAREA";
      if (ev.key === "Enter" && !(emTexto && ev.shiftKey) && alvo?.tagName !== "BUTTON") {
        ev.preventDefault();
        avancar();
        return;
      }
      if (ev.key === "Enter" && alvo?.tagName === "BUTTON" && alvo.getAttribute("role") === "radio") {
        // Enter num cartão: marca (via click nativo) e o avanço acontece no próximo Enter
        return;
      }
      // atalhos numéricos nas perguntas de escolha única/escala/área/tempo
      if (alvo?.tagName === "INPUT" || emTexto) return;
      const n = Number(ev.key);
      if (!Number.isInteger(n) || n < 1) return;
      if (passo.tipo === "area" && AREAS[n - 1]) { setArea(AREAS[n - 1]); avancarDepois(); }
      else if (passo.tipo === "tempo" && TEMPOS[n - 1]) { setTempo(TEMPOS[n - 1]); avancarDepois(); }
      else if (passo.tipo === "pergunta") {
        const p = passo.pergunta;
        if (p.tipo === "unica" && p.opcoes[n - 1]) {
          setResp((r) => ({ ...r, [p.id]: p.opcoes[n - 1].texto }));
          if (!ehUltimo) avancarDepois();
        } else if (p.tipo === "escala" && n <= 5) {
          setResp((r) => ({ ...r, [p.id]: n }));
          avancarDepois();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [etapa, avancar, passo, avancarDepois, ehUltimo]);

  useEffect(() => () => { if (avancando.current) clearTimeout(avancando.current); }, []);

  const progresso = etapa === "form" ? (i / PASSOS.length) * 100 : etapa === "fim" ? 100 : 0;
  const blocoAtual = BLOCOS.indexOf(passo.bloco);

  if (etapa === "capa") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-between px-6 py-8 sm:py-12">
        <Logo />
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-laranja">Time High Media</p>
          <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
            Qual é o seu <span className="text-laranja">nível de IA?</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-suave">
            3 minutos. Responda com sinceridade, não existe resposta certa. Vamos usar isso para montar as próximas aulas de IA do time.
          </p>
          <div className="mt-10">
            <Botao
              onClick={() => {
                iniciouEm.current = Date.now();
                setEtapa("form");
              }}
            >
              Começar
            </Botao>
          </div>
        </motion.section>
        <p className="mt-10 text-sm text-suave">Suas respostas ficam só com a gestão da High.</p>
      </main>
    );
  }

  if (etapa === "enviando") {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div role="status" className="text-center">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-borda border-t-laranja" />
          <p className="text-lg font-semibold">Enviando as suas respostas…</p>
        </div>
      </main>
    );
  }

  if (etapa === "fim") {
    return <Obrigado onVoltar={() => { setEtapa("capa"); setI(0); setNome(""); setArea(""); setTempo(""); setResp({}); setHoneypot(""); setErro(""); }} />;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 pb-8 pt-6">
      <header className="mb-8">
        <div className="mb-5 flex items-center justify-between">
          <Logo className="h-6 w-auto self-start" />
          <p className="text-sm font-semibold text-suave" aria-live="polite">
            {passo.bloco} · {i + 1} de {PASSOS.length}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Progresso do formulário"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progresso)}
          className="h-1.5 overflow-hidden rounded-full bg-borda"
        >
          <motion.div
            className="h-full rounded-full bg-laranja"
            animate={{ width: `${progresso + 100 / PASSOS.length}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
        <ol className="mt-3 hidden gap-1 text-xs font-semibold text-suave sm:flex" aria-hidden="true">
          {BLOCOS.map((b, k) => (
            <li key={b} className={`flex-1 ${k === blocoAtual ? "text-laranja" : ""}`}>{b}</li>
          ))}
        </ol>
      </header>

      <div className="flex-1">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.section
            key={passo.id}
            custom={dir}
            initial={{ opacity: 0, x: 28 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 * dir }}
            transition={{ duration: 0.2 }}
          >
            <Tela
              passo={passo}
              nome={nome} setNome={setNome}
              area={area} setArea={(v) => { setArea(v); avancarDepois(); }}
              tempo={tempo} setTempo={(v) => { setTempo(v); avancarDepois(); }}
              resp={resp}
              setResp={(id, v, auto) => {
                setResp((r) => ({ ...r, [id]: v }));
                if (auto && !ehUltimo) avancarDepois();
              }}
              honeypot={honeypot} setHoneypot={setHoneypot}
            />
          </motion.section>
        </AnimatePresence>
        {erro && (
          <p role="alert" className="mt-5 rounded-xl border border-laranja bg-laranja/10 px-4 py-3 text-sm font-semibold">
            {erro}
          </p>
        )}
      </div>

      <footer className="mt-8 flex items-center justify-between gap-3">
        <Botao variante="fantasma" onClick={voltar}>Voltar</Botao>
        <Botao onClick={avancar} desabilitado={!valido}>
          {ehUltimo ? "Enviar respostas" : "Continuar"}
        </Botao>
      </footer>
      <p className="mt-4 hidden text-center text-xs text-suave sm:block">
        Enter avança · teclas 1, 2, 3… escolhem a opção
      </p>
    </main>
  );
}

function Titulo({ children, ajuda }: { children: React.ReactNode; ajuda?: string }) {
  return (
    <>
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{children}</h2>
      {ajuda && <p className="mt-2 text-suave">{ajuda}</p>}
    </>
  );
}

const campo =
  "mt-2 w-full rounded-2xl border border-borda bg-superficie px-5 py-4 text-lg font-semibold text-texto placeholder:text-[#8f8f8f] focus:border-laranja focus:outline-none";

function Tela(props: {
  passo: Passo;
  nome: string; setNome: (v: string) => void;
  area: string; setArea: (v: string) => void;
  tempo: string; setTempo: (v: string) => void;
  resp: Respostas; setResp: (id: string, v: string | string[] | number, auto: boolean) => void;
  honeypot: string; setHoneypot: (v: string) => void;
}) {
  const { passo, resp } = props;

  if (passo.tipo === "nome") {
    return (
      <div>
        <Titulo>Vamos começar. Como você se chama?</Titulo>
        <div className="mt-8 space-y-6">
          <label className="block text-sm font-bold text-suave">
            Nome
            <input
              autoFocus value={props.nome} onChange={(e) => props.setNome(e.target.value)}
              maxLength={80} autoComplete="name" placeholder="Seu nome" className={campo}
            />
          </label>
          {/* Armadilha para robô. Nome, id e rótulo sem palavra que o autopreenchimento reconheça. */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
            <label htmlFor={CAMPO_ARMADILHA}>
              Deixe em branco
              <input
                id={CAMPO_ARMADILHA} name={CAMPO_ARMADILHA} type="text" tabIndex={-1} autoComplete="off"
                data-lpignore="true" data-1p-ignore="true" data-form-type="other"
                value={props.honeypot} onChange={(e) => props.setHoneypot(e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  if (passo.tipo === "area" || passo.tipo === "tempo") {
    const lista: readonly string[] = passo.tipo === "area" ? AREAS : TEMPOS;
    const atual = passo.tipo === "area" ? props.area : props.tempo;
    const set = passo.tipo === "area" ? props.setArea : props.setTempo;
    return (
      <div>
        <Titulo>{passo.tipo === "area" ? "Em qual área você atua?" : "Há quanto tempo você está na High?"}</Titulo>
        <div role="radiogroup" className={`mt-6 grid gap-3 ${lista.length > 4 ? "sm:grid-cols-2" : ""}`}>
          {lista.map((o) => (
            <Cartao key={o} selecionado={atual === o} onClick={() => set(o)}>{o}</Cartao>
          ))}
        </div>
      </div>
    );
  }

  const p = passo.pergunta;
  const v = resp[p.id];

  if (p.tipo === "unica") {
    return (
      <div>
        <Titulo ajuda={p.ajuda}>{p.titulo}</Titulo>
        <div role="radiogroup" aria-label={p.titulo} className="mt-6 grid gap-3">
          {p.opcoes.map((o) => (
            <Cartao key={o.texto} selecionado={v === o.texto} onClick={() => props.setResp(p.id, o.texto, true)}>
              {o.texto}
            </Cartao>
          ))}
        </div>
      </div>
    );
  }

  if (p.tipo === "multipla") {
    const marcadas = Array.isArray(v) ? v : [];
    const alternar = (o: string) => {
      let prox: string[];
      if (o === p.exclusiva) prox = marcadas.includes(o) ? [] : [o];
      else {
        const sem = marcadas.filter((x) => x !== p.exclusiva);
        prox = sem.includes(o) ? sem.filter((x) => x !== o) : [...sem, o];
      }
      props.setResp(p.id, prox, false);
    };
    return (
      <div>
        <Titulo ajuda={p.ajuda}>{p.titulo}</Titulo>
        <div role="group" aria-label={p.titulo} className="mt-6 grid gap-3 sm:grid-cols-2">
          {p.opcoes.map((o) => (
            <Cartao key={o} marca="check" selecionado={marcadas.includes(o)} onClick={() => alternar(o)}>{o}</Cartao>
          ))}
        </div>
      </div>
    );
  }

  if (p.tipo === "escala") {
    return (
      <div>
        <Titulo>{p.titulo}</Titulo>
        <div role="radiogroup" aria-label={p.titulo} className="mt-8 grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n} type="button" role="radio" aria-checked={v === n} aria-label={`${n} de 5`}
              onClick={() => props.setResp(p.id, n, true)}
              className={`grid aspect-square min-h-[56px] place-items-center rounded-2xl border text-2xl font-extrabold transition active:scale-95 ${
                v === n ? "border-laranja bg-laranja text-carvao" : "border-borda bg-superficie hover:border-suave"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-between text-sm font-semibold text-suave">
          <span>{p.rotulos[0]}</span>
          <span>{p.rotulos[1]}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Titulo>{p.titulo}</Titulo>
      <textarea
        autoFocus rows={4} maxLength={600} value={typeof v === "string" ? v : ""}
        onChange={(e) => props.setResp(p.id, e.target.value, false)}
        placeholder={p.placeholder} aria-label={p.titulo}
        className={`${campo} resize-none font-medium`}
      />
      <p className="mt-2 text-sm text-suave">Pode pular se preferir. Shift+Enter quebra a linha.</p>
    </div>
  );
}

function Obrigado({ onVoltar }: { onVoltar: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-between px-6 py-8 sm:py-12">
      <Logo />
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-full bg-laranja text-carvao" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Obrigado por <span className="text-laranja">responder!</span>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-suave">
          Vamos usar as suas respostas para montar as próximas aulas de IA do time.
        </p>
        <div className="mt-10">
          <Botao variante="fantasma" onClick={onVoltar}>Voltar ao início</Botao>
        </div>
      </motion.section>
      <p className="mt-10 text-sm text-suave">Suas respostas ficam só com a gestão da High.</p>
    </main>
  );
}
