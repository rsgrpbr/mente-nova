/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppState, DiaryDeconstruction, DiaryNewDestiny } from "../types";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Send,
  Loader2,
  Eye,
  Pencil,
  Cloud,
  CloudOff,
  Loader2 as Loader2Icon,
} from "lucide-react";
import { isSupabaseConfigured } from "../lib/supabase";
import DiaryReflectionPanel from "./DiaryReflectionPanel";
import { hasAnyDiaryContent } from "../lib/diaryInsights";
import { motion, AnimatePresence } from "motion/react";
import { DIARY_ETAPAS } from "../config/diaryEtapas";
import { useDiaryJournal, mapStepToLegacy } from "../hooks/useDiaryJournal";
import { sendDiaryChat, isDiaryAiAvailable, type DiaryChatMessage } from "../lib/diaryAi";

interface DiaryTabProps {
  state: AppState;
  updateDeconstruction: (data: Partial<DiaryDeconstruction>) => void;
  updateNewDestiny: (data: Partial<DiaryNewDestiny>) => void;
}

export default function DiaryTab({
  updateDeconstruction,
  updateNewDestiny,
}: DiaryTabProps) {
  const {
    persisted,
    respostasEtapa,
    salvarResposta,
    setModo,
    setEtapaAtual,
    iniciarProcesso,
    proximaEtapa,
    etapaConcluida,
    syncStatus,
    syncErrorDetail,
  } = useDiaryJournal();

  const [chat, setChat] = useState<DiaryChatMessage[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [abaPrincipal, setAbaPrincipal] = useState<"painel" | "escrever">(() =>
    hasAnyDiaryContent(persisted.respostas) ? "painel" : "escrever"
  );
  const chatRef = useRef<HTMLDivElement>(null);
  const temConteudoSalvo = hasAnyDiaryContent(persisted.respostas);

  const etapa = DIARY_ETAPAS[persisted.etapaAtual];
  const corAtual = etapa?.cor ?? "#C8A87A";
  const temRespostas = Object.values(respostasEtapa).some((v) => String(v ?? "").trim());

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, carregando]);

  const syncLegacyFields = useCallback(
    (stepId: number) => {
      const answers = persisted.respostas[stepId] ?? respostasEtapa;
      const mapped = mapStepToLegacy(stepId, answers);
      if (mapped.emotionToUnmemorize !== undefined || mapped.whoIHaveBeen !== undefined) {
        updateDeconstruction(mapped as Partial<DiaryDeconstruction>);
      }
      if (mapped.howToThink !== undefined || mapped.frontalLobeWhoAmI !== undefined) {
        updateNewDestiny(mapped as Partial<DiaryNewDestiny>);
      }
      if (Object.keys(mapped).length > 0) {
        setSyncNote("Progresso sincronizado com o restante do app.");
        setTimeout(() => setSyncNote(null), 2500);
      }
    },
    [persisted.respostas, respostasEtapa, updateDeconstruction, updateNewDestiny]
  );

  const buildRespostasTexto = () =>
    Object.entries(respostasEtapa)
      .filter(([, val]) => String(val ?? "").trim())
      .map(([idx, val]) => `**Pergunta:** ${etapa.perguntas[Number(idx)]}\n**Resposta:** ${val}`)
      .join("\n\n");

  const iniciarConversa = async () => {
    const texto = buildRespostasTexto();
    if (!texto.trim()) return;

    if (!isDiaryAiAvailable()) {
      setChat([
        {
          role: "assistant",
          content:
            "Para usar o aprofundamento com IA, adicione VITE_GEMINI_API_KEY no ficheiro .env.local (raiz do projeto) e reinicie o servidor.",
        },
      ]);
      setModo("conversa");
      return;
    }

    setModo("conversa");
    setCarregando(true);
    setChat([]);

    const promptInicial = `O utilizador está na Etapa ${etapa.id}: "${etapa.titulo}" (${etapa.subtitulo}).

Reflexões escritas:

${texto}

Responda de forma profunda e específica. Faça 1-2 perguntas que aprofundem a reflexão. Conecte com os princípios de Dispenza relevantes.`;

    const historico: DiaryChatMessage[] = [{ role: "user", content: promptInicial }];

    try {
      const resposta = await sendDiaryChat(historico);
      setChat([
        { role: "user", content: "Partilhei as minhas reflexões desta etapa." },
        { role: "assistant", content: resposta },
      ]);
    } catch (e) {
      setChat([
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Erro ao conectar. Tente novamente.",
        },
      ]);
    }
    setCarregando(false);
  };

  const enviarMensagem = async () => {
    if (!mensagem.trim() || carregando) return;

    const userMsg: DiaryChatMessage = { role: "user", content: mensagem.trim() };
    const novoChat = [...chat, userMsg];
    setChat(novoChat);
    setMensagem("");
    setCarregando(true);

    try {
      const resposta = await sendDiaryChat(novoChat);
      setChat((prev) => [...prev, { role: "assistant", content: resposta }]);
    } catch (e) {
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Erro ao conectar.",
        },
      ]);
    }
    setCarregando(false);
  };

  const handleProximaEtapa = () => {
    syncLegacyFields(etapa.id);
    proximaEtapa();
    setChat([]);
    setModo("escrita");
  };

  const irParaEtapa = (idx: number) => {
    setAbaPrincipal("escrever");
    setEtapaAtual(idx);
    setChat([]);
    setModo("escrita");
  };

  const irParaEscrever = () => {
    setAbaPrincipal("escrever");
    if (persisted.modo === "inicio" && !persisted.started) iniciarProcesso();
    else if (persisted.modo === "inicio") setModo("escrita");
  };

  const syncLabel =
    syncStatus === "loading" || syncStatus === "syncing"
      ? "A sincronizar…"
      : syncStatus === "error"
        ? "Erro na nuvem"
        : syncStatus === "offline" || !isSupabaseConfigured
          ? "Só neste dispositivo"
          : "Guardado na nuvem";

  const syncTooltip =
    syncStatus === "error" && syncErrorDetail
      ? `${syncLabel}: ${syncErrorDetail} (Os textos continuam guardados neste browser.)`
      : syncLabel;

  const syncBadge = (
    <span
      className={`text-[9px] font-mono flex items-center gap-1 px-2 py-0.5 rounded-full border max-w-[220px] sm:max-w-xs ${
        syncStatus === "error"
          ? "border-red-900/50 text-red-400"
          : syncStatus === "synced"
            ? "border-gold/30 text-gold/80"
            : "border-nature-border text-zinc-600"
      }`}
      title={syncTooltip}
    >
      {syncStatus === "loading" || syncStatus === "syncing" ? (
        <Loader2Icon className="w-3 h-3 animate-spin" />
      ) : isSupabaseConfigured && syncStatus !== "offline" ? (
        <Cloud className="w-3 h-3" />
      ) : (
        <CloudOff className="w-3 h-3" />
      )}
      {syncLabel}
    </span>
  );

  const navDiario = (
    <div className="flex gap-1 p-1 bg-nature-inner rounded-xl border border-nature-border w-fit">
      <button
        type="button"
        onClick={() => setAbaPrincipal("painel")}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
          abaPrincipal === "painel"
            ? "bg-gold/15 text-gold border border-gold/30"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <Eye className="w-3.5 h-3.5" />
        O Meu Painel
      </button>
      <button
        type="button"
        onClick={irParaEscrever}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
          abaPrincipal === "escrever"
            ? "bg-gold/15 text-gold border border-gold/30"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <Pencil className="w-3.5 h-3.5" />
        Escrever
      </button>
    </div>
  );

  if (abaPrincipal === "painel") {
    return (
      <div className="space-y-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-nature-border pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gold" />
            <div>
              <h2 className="text-lg font-semibold text-zinc-150">Diário Escrito</h2>
              <p className="text-[10px] text-zinc-500 font-mono">Rever · Consciência · Dia a dia</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {syncBadge}
            {navDiario}
          </div>
        </div>
        <DiaryReflectionPanel
          respostas={persisted.respostas}
          onEditStep={irParaEtapa}
          onContinueWriting={irParaEscrever}
        />
        <div className="h-4 shrink-0" aria-hidden />
      </div>
    );
  }

  // ——— TELA INÍCIO ———
  if (persisted.modo === "inicio") {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {navDiario}
        </div>
      <div className="relative min-h-[70vh] flex flex-col items-center justify-center py-12 px-4 overflow-hidden rounded-2xl border border-nature-border bg-nature-card/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(197,160,89,0.08)_0%,transparent_50%)] pointer-events-none" />

        <div className="relative z-10 text-center max-w-lg space-y-6">
          <div className="w-16 h-px bg-gold/50 mx-auto" />
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-gold/80">
            Dr. Joe Dispenza · Quebrando o Hábito de Ser Você Mesmo
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-zinc-100 font-light leading-tight">
            Diário de <em className="text-gold not-italic">Transformação</em>
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Um processo de escrita profunda em {DIARY_ETAPAS.length} etapas — do antigo eu ao novo destino.
          </p>
          <p className="text-xs text-zinc-600 italic">&quot;Nova personalidade, nova realidade pessoal.&quot;</p>

          <div className="flex justify-center gap-1.5 flex-wrap">
            {DIARY_ETAPAS.map((e, i) => (
              <div
                key={e.id}
                className={`w-2 h-2 rounded-full border transition-colors ${
                  etapaConcluida(i)
                    ? "bg-gold border-gold"
                    : i === 0
                      ? "border-gold bg-gold/30"
                      : "border-nature-border bg-nature-inner"
                }`}
                title={e.titulo}
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={iniciarProcesso}
              className="px-8 py-3 border border-gold text-gold hover:bg-gold/10 rounded-lg text-xs font-mono uppercase tracking-[0.2em] cursor-pointer transition-colors"
            >
              Começar o processo
            </button>
            {temConteudoSalvo && (
              <button
                type="button"
                onClick={() => setAbaPrincipal("painel")}
                className="px-8 py-3 border border-nature-border text-zinc-400 hover:text-gold hover:border-gold/30 rounded-lg text-xs font-mono uppercase tracking-[0.2em] cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Ver minha reflexão
              </button>
            )}
          </div>
          <div className="w-16 h-px bg-gold/30 mx-auto" />
        </div>
      </div>
      <div className="h-4 shrink-0" aria-hidden />
      </div>
    );
  }

  // ——— TELA CONVERSA IA ———
  if (persisted.modo === "conversa") {
    return (
      <div className="space-y-4">
        {navDiario}
      <div className="flex flex-col min-h-[70vh] rounded-2xl border border-nature-border bg-nature-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-nature-border bg-nature-inner/80">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: corAtual }}>
              Etapa {etapa.id} — {etapa.titulo}
            </span>
            <p className="text-xs text-zinc-500 mt-0.5">Aprofundamento com IA</p>
          </div>
          <button
            type="button"
            onClick={() => setModo("escrita")}
            className="text-xs text-zinc-500 hover:text-gold border border-nature-border px-3 py-1.5 rounded-lg cursor-pointer"
          >
            ← Voltar à escrita
          </button>
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[50vh] min-h-[280px]">
          {chat.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-gold/15 border border-gold/25 text-zinc-200"
                    : "bg-nature-inner border border-nature-border text-zinc-300"
                }`}
              >
                {msg.role === "assistant" && (
                  <span
                    className="text-[9px] font-mono uppercase tracking-widest block mb-1.5 opacity-70"
                    style={{ color: corAtual }}
                  >
                    Reflexão
                  </span>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {carregando && (
            <div className="flex gap-1.5 px-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-gold animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-nature-border bg-nature-inner/60 space-y-3">
          <div className="flex gap-2 items-end">
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void enviarMensagem();
                }
              }}
              placeholder="Continue a sua reflexão…"
              rows={2}
              className="flex-1 px-3 py-2 bg-nature-bg border border-nature-border rounded-lg text-sm text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <button
              type="button"
              onClick={() => void enviarMensagem()}
              disabled={carregando || !mensagem.trim()}
              className="p-3 bg-gold hover:bg-gold-dark text-nature-bg rounded-lg disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {persisted.etapaAtual < DIARY_ETAPAS.length - 1 && (
            <button
              type="button"
              onClick={handleProximaEtapa}
              className="text-xs text-zinc-500 hover:text-gold cursor-pointer flex items-center gap-1"
            >
              Próxima etapa <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="h-4 shrink-0" aria-hidden />
      </div>
    );
  }

  // ——— TELA ESCRITA (etapas) ———
  return (
    <div className="space-y-4 pb-4">
      {/* Header fixo do diário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-nature-border pb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-gold" />
          <div>
            <h2 className="text-lg font-semibold text-zinc-150">Diário Escrito</h2>
            <p className="text-[10px] text-zinc-500 font-mono">
              Etapa {etapa.id} de {DIARY_ETAPAS.length}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {syncBadge}
          {navDiario}
          <button
            type="button"
            onClick={() => setModo("inicio")}
            className="text-xs text-zinc-500 hover:text-gold cursor-pointer"
          >
            ← Visão geral
          </button>
        </div>
      </div>

      <AnimatePresence>
        {syncNote && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs text-gold bg-gold/10 border border-gold/25 px-3 py-2 rounded-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            {syncNote}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de progresso etapas */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin">
        {DIARY_ETAPAS.map((e, i) => (
          <button
            key={e.id}
            type="button"
            onClick={() => irParaEtapa(i)}
            title={e.titulo}
            className={`shrink-0 w-8 h-8 rounded-full text-[10px] font-mono font-bold border transition-all cursor-pointer ${
              i === persisted.etapaAtual
                ? "border-gold text-nature-bg scale-110"
                : etapaConcluida(i)
                  ? "border-gold/50 text-gold bg-gold/10"
                  : "border-nature-border text-zinc-600 bg-nature-inner hover:border-gold/30"
            }`}
            style={i === persisted.etapaAtual ? { backgroundColor: corAtual } : undefined}
          >
            {e.id}
          </button>
        ))}
      </div>

      <motion.div
        key={etapa.id}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-5"
      >
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] mb-1" style={{ color: corAtual }}>
            {etapa.subtitulo}
          </p>
          <h3 className="font-serif text-2xl text-zinc-100 font-light">{etapa.titulo}</h3>
          <p className="text-sm text-zinc-500 mt-2 leading-relaxed border-l-2 pl-4" style={{ borderColor: `${corAtual}44` }}>
            {etapa.descricao}
          </p>
        </div>

        <div
          className="p-4 rounded-xl text-sm text-zinc-400 italic leading-relaxed border"
          style={{ backgroundColor: `${corAtual}08`, borderColor: `${corAtual}33` }}
        >
          {etapa.instrucao}
        </div>

        <div className="space-y-5">
          {etapa.perguntas.map((pergunta, idx) => (
            <div key={idx} className="space-y-2">
              <label className="block text-sm text-zinc-300 leading-relaxed">
                <span className="font-mono mr-2 opacity-60" style={{ color: corAtual }}>
                  {idx + 1}.
                </span>
                {pergunta}
              </label>
              <textarea
                value={respostasEtapa[idx] ?? ""}
                onChange={(e) => salvarResposta(idx, e.target.value)}
                placeholder="Escreva com honestidade e sem pressa…"
                rows={3}
                className="w-full px-4 py-3 bg-nature-inner border rounded-lg text-sm text-zinc-200 leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-gold font-serif"
                style={{
                  borderColor: respostasEtapa[idx]?.trim() ? `${corAtual}55` : undefined,
                }}
              />
            </div>
          ))}
        </div>

        <div
          className="flex flex-wrap gap-3 pt-4 pb-2 border-t border-nature-border"
          style={{ scrollMarginBottom: "var(--bottom-nav-clearance)" }}
        >
          <button
            type="button"
            onClick={() => void iniciarConversa()}
            disabled={!temRespostas}
            className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all border ${
              temRespostas
                ? "border-gold/40 text-gold bg-gold/10 hover:bg-gold/20"
                : "border-nature-border text-zinc-600 cursor-not-allowed"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Aprofundar com IA
            {!isDiaryAiAvailable() && (
              <span className="text-[9px] normal-case opacity-70">(requer API key)</span>
            )}
          </button>

          {persisted.etapaAtual > 0 && (
            <button
              type="button"
              onClick={() => irParaEtapa(persisted.etapaAtual - 1)}
              className="px-4 py-3 border border-nature-border text-zinc-500 rounded-xl text-xs cursor-pointer hover:text-gold flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
          )}

          {persisted.etapaAtual < DIARY_ETAPAS.length - 1 ? (
            <button
              type="button"
              onClick={handleProximaEtapa}
              className="px-5 py-3 border border-nature-border text-zinc-400 hover:text-gold hover:border-gold/30 rounded-xl text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1"
            >
              Próxima etapa <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                syncLegacyFields(etapa.id);
                setAbaPrincipal("painel");
              }}
              className="px-5 py-3 bg-gold/15 border border-gold/35 text-gold rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Ver o meu painel
            </button>
          )}
        </div>

        {!isDiaryAiAvailable() && (
          <p className="text-[10px] text-zinc-600 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-gold/70" />
            Para IA: adicione <code className="text-gold">VITE_GEMINI_API_KEY</code> em .env.local e reinicie{" "}
            <code className="text-zinc-500">npm run dev</code>.
          </p>
        )}

        {/* Espaço extra para os botões não ficarem sob a barra inferior */}
        <div className="h-8 shrink-0" aria-hidden />
      </motion.div>
    </div>
  );
}
