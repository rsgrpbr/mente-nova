/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DIARY_ETAPAS } from "../config/diaryEtapas";
import {
  buildDiaryInsights,
  DIARY_SECTION_GROUPS,
} from "../lib/diaryInsights";
import type { AllStepAnswers } from "../hooks/useDiaryJournal";
import {
  Eye,
  Brain,
  Heart,
  Zap,
  Moon,
  ChevronDown,
  ChevronUp,
  Pencil,
  Sparkles,
  AlertTriangle,
  Sunrise,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DiaryReflectionPanelProps {
  respostas: AllStepAnswers;
  onEditStep: (stepIndex: number) => void;
  onContinueWriting: () => void;
}

function InsightCard({
  label,
  value,
  cor,
  icon: Icon,
}: {
  label: string;
  value: string;
  cor: string;
  icon: React.ElementType;
}) {
  if (!value.trim()) return null;
  return (
    <div
      className="p-4 rounded-xl border bg-nature-inner/60 space-y-2"
      style={{ borderColor: `${cor}33` }}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 shrink-0" style={{ color: cor }} />
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          {label}
        </span>
      </div>
      <p className="text-sm text-zinc-200 leading-relaxed font-serif whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}

export default function DiaryReflectionPanel({
  respostas,
  onEditStep,
  onContinueWriting,
}: DiaryReflectionPanelProps) {
  const insights = buildDiaryInsights(respostas);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("novo");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [showAllReminders, setShowAllReminders] = useState(true);

  const toggleGroup = (id: string) =>
    setExpandedGroup((g) => (g === id ? null : id));

  const toggleStep = (idx: number) =>
    setExpandedStep((s) => (s === idx ? null : idx));

  if (insights.etapasPreenchidas === 0) {
    return (
      <div className="text-center py-16 px-6 border border-dashed border-nature-border rounded-2xl bg-nature-card/30">
        <Eye className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
        <p className="text-sm text-zinc-400 mb-2">Ainda não há reflexões para rever.</p>
        <p className="text-xs text-zinc-600 mb-6">
          Complete pelo menos uma etapa do diário para ver o seu painel de consciência diária.
        </p>
        <button
          type="button"
          onClick={onContinueWriting}
          className="px-6 py-2.5 border border-gold text-gold rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gold/10"
        >
          Começar a escrever
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progresso + CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-nature-card border border-nature-border rounded-xl">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1C1F26" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#C5A059"
                strokeWidth="3"
                strokeDasharray={`${insights.percentual} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gold">
              {insights.percentual}%
            </span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Sunrise className="w-4 h-4 text-gold" />
              O Meu Painel de Consciência
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {insights.etapasPreenchidas} de {insights.totalEtapas} etapas com reflexão escrita
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onContinueWriting}
          className="shrink-0 px-4 py-2 text-xs border border-nature-border text-zinc-400 hover:text-gold rounded-lg cursor-pointer flex items-center gap-1.5"
        >
          <Pencil className="w-3.5 h-3.5" />
          Continuar a escrever
        </button>
      </div>

      {/* Lembretes do dia */}
      {insights.lembretesDiarios.length > 0 && (
        <section className="space-y-3">
          <button
            type="button"
            onClick={() => setShowAllReminders((v) => !v)}
            className="w-full flex items-center justify-between text-left cursor-pointer group"
          >
            <h4 className="text-sm font-semibold text-gold flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Consciência para hoje
            </h4>
            {showAllReminders ? (
              <ChevronUp className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            )}
          </button>
          <AnimatePresence>
            {showAllReminders && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-hidden"
              >
                {insights.lembretesDiarios.map((l) => (
                  <div
                    key={l.id}
                    className={`p-3 rounded-xl border text-sm leading-relaxed flex gap-2 ${
                      l.tipo === "alerta"
                        ? "bg-red-950/20 border-red-900/40 text-red-200/90"
                        : l.tipo === "entrega"
                          ? "bg-gold/5 border-gold/25 text-zinc-300"
                          : "bg-emerald-950/15 border-emerald-900/30 text-zinc-300"
                    }`}
                  >
                    {l.tipo === "alerta" ? (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    ) : (
                      <Sparkles className="w-4 h-4 shrink-0 text-gold mt-0.5" />
                    )}
                    <span>{l.texto}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Resumo: Antigo vs Novo */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-widest text-red-300/80">
            Soltar · Antigo eu
          </h4>
          <InsightCard
            label="Emoção a desmemorizar"
            value={insights.emocaoLimitante}
            cor="#B07070"
            icon={Heart}
          />
          <InsightCard
            label="Declaração de entrega"
            value={insights.declaracaoEntrega}
            cor="#AAA07A"
            icon={Moon}
          />
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-widest text-sky-300/80">
            Criar · Novo eu
          </h4>
          <InsightCard
            label="O meu ideal"
            value={insights.idealEu}
            cor="#5A8AAA"
            icon={Brain}
          />
          <div className="grid grid-cols-1 gap-2">
            <InsightCard label="Pensar" value={insights.comoPensar} cor="#5A8AAA" icon={Brain} />
            <InsightCard label="Agir" value={insights.comoAgir} cor="#5AAA7A" icon={Zap} />
            <InsightCard label="Sentir" value={insights.comoSentir} cor="#AA7A5A" icon={Heart} />
          </div>
        </div>
      </section>

      {/* Revisão noturna destacada */}
      {insights.revisaoHoje && (
        <section className="p-4 rounded-xl border border-violet-500/25 bg-violet-950/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-violet-300 flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Revisão do fim do dia
              </h4>
              <p className="text-sm text-zinc-300 mt-2 font-serif leading-relaxed whitespace-pre-wrap">
                {insights.revisaoHoje}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(9)}
              className="shrink-0 text-[10px] text-zinc-500 hover:text-gold cursor-pointer"
            >
              Editar
            </button>
          </div>
        </section>
      )}

      {/* Explorar tudo por secção */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <Eye className="w-4 h-4 text-gold" />
          Ler toda a minha reflexão
        </h4>

        {DIARY_SECTION_GROUPS.map((group) => {
          const isOpen = expandedGroup === group.id;
          const stepsInGroup = group.stepIndices.filter((i) => {
            const a = respostas[i];
            return a && Object.values(a).some((v) => String(v ?? "").trim());
          });

          if (stepsInGroup.length === 0) return null;

          return (
            <div
              key={group.id}
              className="rounded-xl border border-nature-border overflow-hidden bg-nature-card/50"
            >
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-nature-inner/50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-zinc-200">{group.titulo}</p>
                  <p className="text-[10px] text-zinc-500">{group.subtitulo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                    style={{ color: group.cor, borderColor: `${group.cor}44` }}
                  >
                    {stepsInGroup.length} etapas
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-nature-border"
                  >
                    {stepsInGroup.map((stepIdx) => {
                      const etapa = DIARY_ETAPAS[stepIdx];
                      const answers = respostas[stepIdx] ?? {};
                      const stepOpen = expandedStep === stepIdx;
                      const filled = Object.entries(answers).filter(([, v]) =>
                        String(v ?? "").trim()
                      );

                      return (
                        <div key={stepIdx} className="border-b border-nature-border/50 last:border-0">
                          <div className="flex items-center justify-between px-4 py-2.5 hover:bg-nature-inner/30">
                            <button
                              type="button"
                              onClick={() => toggleStep(stepIdx)}
                              className="flex-1 text-left text-xs text-zinc-300 cursor-pointer"
                            >
                              <span className="font-mono text-gold mr-2">{etapa.id}.</span>
                              {etapa.titulo}
                            </button>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => onEditStep(stepIdx)}
                                className="text-[10px] text-zinc-600 hover:text-gold cursor-pointer"
                              >
                                editar
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleStep(stepIdx)}
                                className="text-zinc-500 cursor-pointer p-0.5"
                                aria-label={stepOpen ? "Recolher" : "Expandir"}
                              >
                                {stepOpen ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                          {stepOpen && (
                            <div className="px-4 pb-4 space-y-3 bg-nature-bg/50">
                              {filled.map(([qIdx, val]) => (
                                <div key={qIdx} className="space-y-1">
                                  <p className="text-[11px] text-zinc-500 leading-snug">
                                    {etapa.perguntas[Number(qIdx)]}
                                  </p>
                                  <p className="text-sm text-zinc-200 font-serif leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-gold/30">
                                    {String(val)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </section>
    </div>
  );
}
