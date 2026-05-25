/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useDiaryReminders } from "../hooks/useDiaryReminders";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  Sparkles,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Cloud,
  CloudOff,
} from "lucide-react";
import { motion } from "motion/react";

interface DailyRemindersWidgetProps {
  onOpenDiary: () => void;
}

export default function DailyRemindersWidget({ onOpenDiary }: DailyRemindersWidgetProps) {
  const { lembretes, hasContent, loading } = useDiaryReminders();

  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-nature-border bg-nature-card/60 animate-pulse h-28" />
    );
  }

  if (!hasContent) {
    return (
      <button
        type="button"
        onClick={onOpenDiary}
        className="w-full text-left p-4 rounded-xl border border-dashed border-gold/30 bg-gold/5 hover:bg-gold/10 transition-colors cursor-pointer group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">Consciência do dia</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Escreva no diário para ver os seus 3 lembretes aqui
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gold opacity-60 group-hover:opacity-100" />
        </div>
      </button>
    );
  }

  return (
    <section className="rounded-xl border border-gold/25 bg-gradient-to-br from-gold/8 via-nature-card to-nature-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold/15">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          <h3 className="text-sm font-semibold text-gold">Consciência de hoje</h3>
        </div>
        <div className="flex items-center gap-2">
          {isSupabaseConfigured ? (
            <span className="text-[9px] font-mono text-zinc-600 flex items-center gap-1" title="Diário sincronizado na nuvem">
              <Cloud className="w-3 h-3" />
              nuvem
            </span>
          ) : (
            <span className="text-[9px] font-mono text-zinc-600 flex items-center gap-1">
              <CloudOff className="w-3 h-3" />
              local
            </span>
          )}
          <button
            type="button"
            onClick={onOpenDiary}
            className="text-[10px] text-zinc-500 hover:text-gold flex items-center gap-0.5 cursor-pointer"
          >
            Diário <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {lembretes.map((l, i) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`p-3 rounded-lg border text-xs leading-relaxed ${
              l.tipo === "alerta"
                ? "bg-red-950/25 border-red-900/40 text-red-100/90"
                : l.tipo === "entrega"
                  ? "bg-gold/10 border-gold/20 text-zinc-300"
                  : "bg-emerald-950/20 border-emerald-900/25 text-zinc-300"
            }`}
          >
            <div className="flex gap-1.5 mb-1.5">
              {l.tipo === "alerta" ? (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-gold" />
              )}
              <span className="text-[9px] font-mono uppercase tracking-wider opacity-70">
                {l.tipo === "alerta" ? "Soltar" : l.tipo === "entrega" ? "Entrega" : "Criar"}
              </span>
            </div>
            <p>{l.texto}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
