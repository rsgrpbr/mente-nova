/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppState, WeekProgress } from "../types";
import { Play, Pause, Lock, Flame, CheckCircle, AlertCircle, Zap, History, Trash2, Bell, Music2, Waves, Clock, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import {
  SOUNDSCAPE_OPTIONS,
  SOUNDSCAPE_CATEGORIES,
  TIBETAN_BELL_OPTIONS,
} from "../config/soundscapes";
import type { TibetanBellId } from "../lib/tibetanBells";
import {
  getAvailableMeditationTracks,
  getMeditationTrackById,
} from "../config/meditationAudio";
import { useMeditationPlayer } from "../hooks/useMeditationPlayer";
import DailyRemindersWidget from "./DailyRemindersWidget";

interface PlayerTabProps {
  state: AppState;
  completeMeditation: (weekNum: number, durationMin: number) => void;
  addIntercept: (context?: string) => void;
  removeIntercept: (id: string) => void;
  setCurrentWeekManual: (weekNum: number) => void;
  devModeOverride: boolean;
  setDevModeOverride: (val: boolean) => void;
  onOpenDiary?: () => void;
}

// Full specifications of the 4 weeks program from Dr. Joe Dispenza's book
const WEEKS_METADATA: WeekProgress[] = [
  {
    weekNum: 1,
    title: "Semana 1: Indução Corpórea",
    subtitle: "Treinamento em Foco e Presença",
    meditationTitle: "Indução por Partes do Corpo e Volume de Água",
    audioDurationMin: 20,
    unlocked: true,
    completionsRequired: 7,
    completionsCount: 0, // dynamic
    description: "Dissociar a atividade neural frentética do neocórtex e desacelerar as ondas cerebrais de Beta para Alfa. Foque no espaço que o seu corpo ocupa no vácuo.",
  },
  {
    weekNum: 2,
    title: "Semana 2: Desmemorizar e Soltar",
    subtitle: "Reconhecer, Admitir e Entar em Entrega",
    meditationTitle: "Indução + Admitir e Soltar o Velho Eu",
    audioDurationMin: 25,
    unlocked: false, // validated dynamically
    completionsRequired: 7,
    completionsCount: 0,
    description: "Reconheça as vibrações das suas emoções habituais e admita-as perante si mesmo. Enuncie a declaração de entrega sincera ao campo de possibilidades.",
  },
  {
    weekNum: 3,
    title: "Semana 3: Observação e Interceptação",
    subtitle: "Flagrando Pensamentos Inconscientes",
    meditationTitle: "Indução + Admitir + Paralisar Programação",
    audioDurationMin: 30,
    unlocked: false,
    completionsRequired: 7,
    completionsCount: 0,
    description: "Aprenda a flagrar a reatividade biológica do seu corpo físico antes que ela tome conta do seu dia. Adiciona a capacidade de paralisar as velhas programações.",
  },
  {
    weekNum: 4,
    title: "Semana 4: Criação do Novo Destino",
    subtitle: "Ensaio Mental de Uma Nova Realidade",
    meditationTitle: "Prática Completa Dr. Joe Dispenza",
    audioDurationMin: 35,
    unlocked: false,
    completionsRequired: 7,
    completionsCount: 0,
    description: "Com o cérebro em perfeita coerência, instile as novas programações: como você quer Pensar, Agir e Sentir. Sintonize as emoções elevadas adiantadamente.",
  }
];

export default function PlayerTab({
  state,
  completeMeditation,
  addIntercept,
  removeIntercept,
  setCurrentWeekManual,
  devModeOverride,
  setDevModeOverride,
  onOpenDiary,
}: PlayerTabProps) {
  const meditationTracks = getAvailableMeditationTracks();
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(state.currentWeek);
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    () => meditationTracks[0]?.id ?? "hans-zimmer-inception-time"
  );
  const [interceptInput, setInterceptInput] = useState<string>("");
  const [soundscapeId, setSoundscapeId] = useState<string>("guided-week");
  const [soundscapeCategory, setSoundscapeCategory] = useState<string>("guiada");
  const [sessionDurationMin, setSessionDurationMin] = useState(20);
  const [bellScheduleMinutes, setBellScheduleMinutes] = useState<number[]>([10]);
  const [bellAtEnd, setBellAtEnd] = useState(true);
  const [bellType, setBellType] = useState<TibetanBellId>("sequence");
  const [newBellMinute, setNewBellMinute] = useState("");
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [semana1RegistosSupabase, setSemana1RegistosSupabase] = useState(0);

  const activeWeekInfo = WEEKS_METADATA.find(w => w.weekNum === selectedWeekNum) || WEEKS_METADATA[0];
  const selectedTrack = getMeditationTrackById(selectedTrackId) ?? meditationTracks[0];
  const usesGuidedTrack =
    soundscapeId === "guided-week" ||
    SOUNDSCAPE_OPTIONS.some(
      (s) =>
        s.id === soundscapeId &&
        (s.engine === "guided-mp3" || s.engine === "guided-plus-ambient")
    );

  useEffect(() => {
    const mins = activeWeekInfo.audioDurationMin;
    setSessionDurationMin(mins);
    setBellScheduleMinutes([Math.floor(mins / 2)]);
  }, [selectedWeekNum, activeWeekInfo.audioDurationMin]);

  const addBellMinute = () => {
    const v = parseInt(newBellMinute, 10);
    if (!Number.isFinite(v) || v <= 0 || v >= sessionDurationMin) return;
    setBellScheduleMinutes((prev) => [...new Set([...prev, v])].sort((a, b) => a - b));
    setNewBellMinute("");
  };

  const removeBellMinute = (min: number) => {
    setBellScheduleMinutes((prev) => prev.filter((m) => m !== min));
  };

  // Compute completions per week dynamically from state database
  const completionsPerWeek = (wNo: number) => {
    return state.meditationLogs.filter(log => log.week === wNo).length;
  };

  const fetchSemana1Count = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    const { count, error } = await supabase
      .from("progresso_diario")
      .select("*", { count: "exact", head: true })
      .eq("semana", 1)
      .eq("pratica_concluida", true);

    if (error) {
      console.error("[Player] Erro ao contar progresso Semana 1:", error.message);
      return;
    }

    setSemana1RegistosSupabase(count ?? 0);
  }, []);

  useEffect(() => {
    fetchSemana1Count();
  }, [fetchSemana1Count]);

  const isWeekUnlocked = (wNo: number) => {
    if (wNo === 1) return true;
    if (devModeOverride) return true;

    const completedPrev = completionsPerWeek(wNo - 1);
    const requiredPrev = WEEKS_METADATA[wNo - 2].completionsRequired;

    if (wNo === 2) {
      const supabaseUnlock = semana1RegistosSupabase >= 7;
      const localUnlock = completedPrev >= requiredPrev && state.streakDays >= 3;
      return supabaseUnlock || localUnlock;
    }
    if (wNo === 3) {
      return completedPrev >= requiredPrev && state.streakDays >= 5;
    }
    if (wNo === 4) {
      return completedPrev >= requiredPrev && state.streakDays >= 7;
    }
    return false;
  };

  const salvarProgressoDiario = async (semana: number) => {
    if (!isSupabaseConfigured) {
      console.warn("[Player] Supabase não configurado — progresso só em localStorage.");
      return;
    }

    setIsSavingProgress(true);
    const { error } = await supabase.from("progresso_diario").insert({
      semana,
      pratica_concluida: true,
    });

    setIsSavingProgress(false);

    if (error) {
      console.error("[Player] Erro ao guardar progresso_diario:", error.message);
      throw new Error(error.message);
    }

    if (semana === 1) {
      await fetchSemana1Count();
    }
  };

  const onSessionComplete = useCallback(async () => {
    try {
      await salvarProgressoDiario(selectedWeekNum);
      completeMeditation(selectedWeekNum, sessionDurationMin);

      if (selectedWeekNum === 1 && isSupabaseConfigured) {
        const { count } = await supabase
          .from("progresso_diario")
          .select("*", { count: "exact", head: true })
          .eq("semana", 1)
          .eq("pratica_concluida", true);

        const total = count ?? 0;
        setSemana1RegistosSupabase(total);
        if (total >= 7) setCurrentWeekManual(2);
      }
    } catch {
      alert("Meditação concluída localmente, mas falhou o registo no Supabase.");
      completeMeditation(selectedWeekNum, sessionDurationMin);
    }
  }, [selectedWeekNum, sessionDurationMin, completeMeditation, setCurrentWeekManual]);

  const player = useMeditationPlayer({
    guidedTrackId: selectedTrackId,
    durationMinutes: sessionDurationMin,
    soundscapeId,
    bells: { scheduleMinutes: bellScheduleMinutes, atEnd: bellAtEnd, bellType },
    onSessionComplete,
  });

  const selectWeek = (wNo: number) => {
    if (isWeekUnlocked(wNo)) {
      setSelectedWeekNum(wNo);
      player.stopAllAudio();
    }
  };

  const filteredSoundscapes = SOUNDSCAPE_OPTIONS.filter(
    (s) => s.category === soundscapeCategory
  );

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Generate chart data for thought intercepts ("MUDE!") in the last 7 days inclusive 
  const getInterceptChartData = () => {
    const daysAbr = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    const today = new Date();
    // Map past 7 days
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() - i);
      const targetDateStr = targetDate.toISOString().split("T")[0];
      
      // JavaScript day: 0=Sunday, 1=Monday ... 6=Saturday
      // Let's align: Monday=0, Sunday=6
      const jsDay = targetDate.getDay(); 
      const alignedIdx = jsDay === 0 ? 6 : jsDay - 1;

      // Filter state logs matching this date
      const matches = state.intercepts.filter(log => log.date === targetDateStr);
      counts[alignedIdx] += matches.length;
    }

    return daysAbr.map((day, idx) => ({
      day,
      count: counts[idx] || 0
    }));
  };

  const chartData = getInterceptChartData();
  const maxChartCount = Math.max(...chartData.map(d => d.count), 4); // avoid division by zero & maintain scaling minimal heights

  const submitIntercept = () => {
    addIntercept(interceptInput.trim() || undefined);
    setInterceptInput("");
  };

  return (
    <div className="space-y-6">

      {onOpenDiary && <DailyRemindersWidget onOpenDiary={onOpenDiary} />}
      
      {/* Tracker Banner: Streaks and Daily consistency highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-nature-card border border-nature-border p-4 rounded-xl items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Flame className="w-6 h-6 text-gold fill-current animate-pulse" />
          </div>
          <div>
            <p className="text-zinc-500 text-[11px] font-mono uppercase tracking-wide">Constância Física</p>
            <p className="text-lg font-bold text-zinc-150 flex items-baseline gap-1">
              <span>{state.streakDays} Dias</span>
              <span className="text-xs text-gold font-light font-mono">atleta mental</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-x border-nature-border/40 py-3 md:py-0 md:px-4">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-gold" />
          </div>
          <div>
            <p className="text-zinc-500 text-[11px] font-mono uppercase tracking-wide">Total de Práticas</p>
            <p className="text-lg font-bold text-zinc-150">
              {state.meditationLogs.length} Concluídas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-gold fill-current" />
          </div>
          <div>
            <p className="text-zinc-500 text-[11px] font-mono uppercase tracking-wide">Etapa do Neuroship</p>
            <p className="text-lg font-bold text-zinc-150">
              Semana {state.currentWeek} <span className="text-xs font-normal text-zinc-400">Ativa</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Panel: left values is Player, right values is Interception Chart & widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Premium meditation player and week selector */}
        <div className="space-y-6">
          
          {/* Week list navigation with locking signals */}
          <div className="bg-nature-card border border-nature-border rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-mono font-semibold tracking-widest text-zinc-400 uppercase">
              Selecione o Nível do Ensaio Mental
            </h3>

            <div className="space-y-2">
              {WEEKS_METADATA.map((week) => {
                const unlocked = isWeekUnlocked(week.weekNum);
                const isSelected = selectedWeekNum === week.weekNum;
                const completedCount = completionsPerWeek(week.weekNum);
                const prevCompletedCount = week.weekNum > 1 ? completionsPerWeek(week.weekNum - 1) : 0;
                const prevRequired = week.weekNum > 1 ? WEEKS_METADATA[week.weekNum - 2].completionsRequired : 0;
                const streakRequired = week.weekNum === 2 ? 3 : week.weekNum === 3 ? 5 : week.weekNum === 4 ? 7 : 0;

                return (
                  <div key={week.weekNum} className="space-y-1">
                    <button
                      onClick={() => unlocked && selectWeek(week.weekNum)}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-300 flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-gold/10 border-gold text-zinc-100 shadow-md shadow-gold/5"
                          : unlocked
                          ? "bg-nature-inner border-nature-border hover:border-gold/30 text-zinc-300 cursor-pointer"
                          : "bg-nature-inner/30 border-nature-border/40 text-zinc-650 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          {!unlocked ? (
                            <Lock className="w-4 h-4 text-red-400" />
                          ) : isSelected ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-gold animate-ping"></div>
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-650"></div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold">{week.title}</span>
                            {completedCount >= week.completionsRequired && (
                              <span className="text-[10px] bg-gold/15 text-gold px-1.5 py-0.5 rounded font-mono border border-gold/30">
                                Mestre
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500">{week.subtitle}</p>
                        </div>
                      </div>

                      <div className="text-right text-[11px] font-mono text-zinc-450">
                        <span>{completedCount}/{week.completionsRequired} dias</span>
                      </div>
                    </button>
                    {!unlocked && (
                      <div className="px-3 text-[10px] text-zinc-500 font-mono leading-normal flex flex-wrap gap-1 items-center">
                        <span className="text-red-400">🔒 Requer:</span>
                        {week.weekNum === 2 ? (
                          <span>7 práticas Semana 1 no Supabase ({semana1RegistosSupabase}/7)</span>
                        ) : (
                          <>
                            <span>Semana {week.weekNum - 1} ({prevCompletedCount}/{prevRequired} concluída)</span>
                            <span className="text-zinc-650">•</span>
                            <span>Sequência ({state.streakDays}/{streakRequired} dias {state.streakDays >= streakRequired ? "✅" : "❌"})</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dev bypass information */}
            <div className="text-[11px] text-zinc-400 bg-nature-inner border border-nature-border p-2.5 rounded-lg flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 font-mono">
                <AlertCircle className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>Desbloqueio Inteligente</span>
              </span>
              <button
                id="toggle-bypass-mode"
                onClick={() => setDevModeOverride(!devModeOverride)}
                className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded transition-all border cursor-pointer ${
                  devModeOverride
                    ? "bg-gold/15 text-gold border-gold/35 hover:bg-gold/25"
                    : "bg-nature-card text-zinc-500 border-nature-border hover:bg-zinc-800"
                }`}
              >
                {devModeOverride ? "Ativo (Livre)" : "Inativo (Estrito)"}
              </button>
            </div>
          </div>

          {/* Áudio guiado — escolha livre (sempre visível) */}
          <div className="bg-nature-card border border-gold/25 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-mono font-semibold text-gold uppercase flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5 text-gold" />
              Áudio guiado
            </h3>
            <p className="text-[10px] text-zinc-500">
              Escolhe a música — {meditationTracks.length} faixas disponíveis.
            </p>
            <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1">
              {meditationTracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      setSelectedTrackId(track.id);
                      if (track.durationMin) {
                        setSessionDurationMin(track.durationMin);
                        setBellScheduleMinutes([Math.floor(track.durationMin / 2)]);
                      }
                      player.stopAllAudio();
                    }}
                    className={`text-left px-2.5 py-2 rounded-lg border text-[10px] cursor-pointer transition-all ${
                      selectedTrackId === track.id
                        ? "bg-gold/15 border-gold text-gold"
                        : "bg-nature-inner border-nature-border text-zinc-400 hover:border-gold/30"
                    }`}
                  >
                    <p className="font-semibold leading-tight">{track.label}</p>
                    <p className="opacity-70 line-clamp-2 mt-0.5">{track.description}</p>
                    {track.durationMin ? (
                      <p className="opacity-50 mt-0.5 font-mono">{track.durationMin} min sugeridos</p>
                    ) : null}
                  </button>
                ))}
            </div>
          </div>

          {/* Paisagem sonora + sinos tibetanos */}
          <div className="bg-nature-card border border-nature-border rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5 text-gold" />
              Paisagem sonora
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {SOUNDSCAPE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSoundscapeCategory(cat.id);
                    const first = SOUNDSCAPE_OPTIONS.find((s) => s.category === cat.id);
                    if (first) setSoundscapeId(first.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer transition-colors ${
                    soundscapeCategory === cat.id
                      ? "bg-gold/15 border-gold/40 text-gold"
                      : "bg-nature-inner border-nature-border text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {filteredSoundscapes.map((scape) => (
                <button
                  key={scape.id}
                  type="button"
                  onClick={() => {
                    setSoundscapeId(scape.id);
                    player.stopAllAudio();
                  }}
                  className={`text-left px-2.5 py-2 rounded-lg border text-[10px] cursor-pointer transition-all ${
                    soundscapeId === scape.id
                      ? "bg-gold/15 border-gold text-gold"
                      : "bg-nature-inner border-nature-border text-zinc-400 hover:border-gold/30"
                  }`}
                >
                  <p className="font-semibold leading-tight">{scape.label}</p>
                  <p className="opacity-70 line-clamp-2 mt-0.5">{scape.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-nature-card border border-nature-border rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gold" />
              Duração da meditação
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="range"
                min={5}
                max={90}
                step={1}
                value={sessionDurationMin}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setSessionDurationMin(next);
                  setBellScheduleMinutes((prev) =>
                    prev.filter((m) => m > 0 && m < next)
                  );
                  player.stopAllAudio();
                }}
                className="flex-1 min-w-[120px] h-1.5 accent-gold cursor-pointer"
              />
              <span className="text-lg font-mono font-bold text-gold w-16 text-right">
                {sessionDurationMin} min
              </span>
              <button
                type="button"
                onClick={() => {
                  setSessionDurationMin(activeWeekInfo.audioDurationMin);
                  setBellScheduleMinutes([Math.floor(activeWeekInfo.audioDurationMin / 2)]);
                  player.stopAllAudio();
                }}
                className="text-[10px] px-2 py-1 rounded border border-nature-border text-zinc-500 hover:text-gold cursor-pointer"
              >
                Padrão semana ({activeWeekInfo.audioDurationMin} min)
              </button>
            </div>
            <p className="text-[10px] text-zinc-600">
              A sessão termina aos {sessionDurationMin} min. A música repete em loop até lá chegar.
            </p>
          </div>

          <div className="bg-nature-card border border-nature-border rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-gold" />
              Sinos tibetanos — minuto exato
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TIBETAN_BELL_OPTIONS.map((bell) => (
                <button
                  key={bell.id}
                  type="button"
                  onClick={() => setBellType(bell.id)}
                  className={`text-left p-2.5 rounded-lg border text-[10px] cursor-pointer ${
                    bellType === bell.id
                      ? "bg-gold/15 border-gold text-gold"
                      : "bg-nature-inner border-nature-border text-zinc-400"
                  }`}
                >
                  <p className="font-bold">{bell.label}</p>
                  <p className="opacity-70 mt-0.5">{bell.desc}</p>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-zinc-500">Tocar o sino no minuto:</p>
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="number"
                  min={1}
                  max={sessionDurationMin - 1}
                  placeholder="Ex: 10"
                  value={newBellMinute}
                  onChange={(e) => setNewBellMinute(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addBellMinute()}
                  className="w-20 px-2 py-1.5 bg-nature-inner border border-nature-border rounded-lg text-xs text-zinc-200"
                />
                <button
                  type="button"
                  onClick={addBellMinute}
                  className="px-2.5 py-1.5 bg-gold/15 border border-gold/30 text-gold rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBellScheduleMinutes([Math.floor(sessionDurationMin / 2)])
                  }
                  className="px-2 py-1.5 text-[10px] border border-nature-border rounded-lg text-zinc-500 hover:text-gold cursor-pointer"
                >
                  Meio ({Math.floor(sessionDurationMin / 2)} min)
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {bellScheduleMinutes.length === 0 ? (
                  <span className="text-[10px] text-zinc-600 italic">Nenhum sino intermédio</span>
                ) : (
                  bellScheduleMinutes.map((min) => (
                    <span
                      key={min}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gold/10 border border-gold/25 text-gold rounded-full text-[10px] font-mono"
                    >
                      {min} min
                      <button
                        type="button"
                        onClick={() => removeBellMinute(min)}
                        className="hover:text-white cursor-pointer"
                        aria-label={`Remover sino aos ${min} minutos`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-400">
              <input
                type="checkbox"
                checked={bellAtEnd}
                onChange={(e) => setBellAtEnd(e.target.checked)}
                className="accent-gold"
              />
              Sino também ao concluir ({sessionDurationMin} min)
            </label>
          </div>

          {/* Player HTML5 + ambiente */}
          <div className="bg-nature-inner border border-nature-border rounded-xl p-6 relative overflow-hidden flex flex-col items-center space-y-5">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-gold/5 to-transparent blur-3xl pointer-events-none" />

            {player.mainSrc ? (
              <audio
                ref={player.mainAudioRef}
                src={player.mainSrc}
                preload="metadata"
                loop={player.usesGuidedAudio}
                onTimeUpdate={player.handleTimeUpdate}
                onLoadedMetadata={player.handleLoadedMetadata}
                onEnded={player.handleMainEnded}
                className="sr-only"
              />
            ) : null}
            {player.streamSrc ? (
              <audio
                ref={player.streamAudioRef}
                src={player.streamSrc}
                preload="metadata"
                loop
                onTimeUpdate={player.handleStreamTimeUpdate}
                className="sr-only"
              />
            ) : null}

            <div className="text-center z-10 space-y-1 w-full">
              <span className="text-[10px] font-mono tracking-widest text-gold uppercase">
                {activeWeekInfo.title}
              </span>
              <h2 className="text-lg font-semibold text-zinc-150 tracking-tight font-serif italic">
                {usesGuidedTrack && selectedTrack
                  ? selectedTrack.label
                  : activeWeekInfo.meditationTitle}
              </h2>
              <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
                <Waves className="w-3 h-3 text-gold" />
                {player.soundscape.label}
              </p>
            </div>

            <div className="w-full max-w-sm space-y-4 z-10">
              <div className="flex justify-center items-center gap-1 h-8">
                {Array.from({ length: 11 }).map((_, i) => (
                  <motion.div
                    key={`bar-${i}`}
                    animate={{
                      height: player.isPlaying ? [6, 14 + Math.sin(i) * 10, 6] : 6,
                    }}
                    transition={{ duration: 0.6 + i * 0.04, repeat: Infinity, ease: "easeInOut" }}
                    className="w-1 bg-gold rounded-full"
                  />
                ))}
              </div>

              <div className="text-center font-mono">
                <span className="text-2xl font-bold text-zinc-100">
                  {formatTime(player.currentTime)}
                </span>
                <span className="text-zinc-500 text-sm">
                  {" "}/ {formatTime(player.effectiveDuration)}
                </span>
              </div>

              <div className="space-y-1">
                <div className="h-2 w-full bg-nature-bg rounded-full overflow-hidden border border-nature-border">
                  <div
                    className="h-full bg-gradient-to-r from-gold-dark to-gold transition-all duration-150"
                    style={{ width: `${player.progressPercent}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={player.effectiveDuration || 0}
                  step={0.1}
                  value={player.currentTime}
                  onChange={player.handleProgressSeek}
                  disabled={!player.effectiveDuration}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none"
                  style={{
                    background: `linear-gradient(to right, #C5A059 0%, #C5A059 ${player.progressPercent}%, #0F1116 ${player.progressPercent}%, #0F1116 100%)`,
                  }}
                  aria-label="Progresso da meditação"
                />
                <p className="text-[9px] text-zinc-600 text-center font-mono">
                  {bellScheduleMinutes.length > 0 &&
                    `🔔 Sinos: min ${bellScheduleMinutes.join(", ")}`}
                  {bellScheduleMinutes.length > 0 && bellAtEnd && " · "}
                  {bellAtEnd && `🔔 Final (${sessionDurationMin} min)`}
                </p>
              </div>

              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={player.handleRestart}
                  className="p-2 border border-nature-border bg-nature-card hover:bg-nature-inner rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Reiniciar"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void player.handlePlayPause()}
                  disabled={isSavingProgress}
                  className="p-5 bg-gold hover:bg-gold-dark rounded-full text-nature-bg shadow-lg shadow-gold/15 transform active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
                  style={{ width: "64px", height: "64px" }}
                >
                  {player.isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="w-full border-t border-nature-border pt-3 space-y-2 text-center z-10">
              <p className="text-[10px] text-zinc-500 font-mono">
                Supabase Semana 1: <span className="text-gold font-bold">{semana1RegistosSupabase}/7</span>
                {semana1RegistosSupabase >= 7 && (
                  <span className="ml-2 text-emerald-400">— Semana 2 desbloqueada</span>
                )}
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: MUDE! thought interceptor & consistency visual charts */}
        <div className="space-y-6">
          
          {/* Action Widget MUDE! */}
          <div className="bg-nature-card border border-nature-border p-5 rounded-xl space-y-4">
            
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 bg-gold/15 border border-gold/25 text-gold rounded-full font-bold uppercase">
                  Passo 6: Paralisar Velhas Redes Neurais
                </span>
                <h3 className="text-base font-semibold text-zinc-150 flex items-center gap-1.5 mt-1">
                  O Botão de Interceptação Diária
                </h3>
                <p className="text-xs text-zinc-400 leading-normal">
                  Sempre que detectar a si mesmo agindo apressadamente, pensando de maneira limitante ou sentindo a velha emoção habitual durante o dia, proclame em voz alta: <strong>"MUDE!"</strong> e registre aqui.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                id="intercept-input-box"
                type="text"
                placeholder="Especifique o contexto (ex: impaciência com trânsito)"
                value={interceptInput}
                onChange={(e) => setInterceptInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitIntercept()}
                className="flex-1 px-3 py-2 bg-nature-inner border border-nature-border rounded-lg text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-gold"
              />
              <button
                id="btn-trigger-mude"
                onClick={submitIntercept}
                className="px-4 py-2 bg-gradient-to-r from-gold-dark to-gold hover:from-gold hover:to-gold-dark text-nature-bg rounded-lg text-xs font-black tracking-widest cursor-pointer shadow-lg shadow-gold/20 flex items-center gap-1 group"
              >
                MUDE!
                <Zap className="w-3.5 h-3.5 fill-current animate-bounce shrink-0 text-nature-bg" />
              </button>
            </div>

            {/* Quick Context Chips for Single Click trigger action */}
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-550 font-mono tracking-wider uppercase">Gatilhos Rápidos de Interceptação:</p>
              <div className="flex flex-wrap gap-1.5">
                {["Ansiedade no trabalho", "Culpa por estar à toa", "Mania de julgar alguém", "Medo do futuro"].map(lbl => (
                  <button
                    key={lbl}
                    onClick={() => addIntercept(lbl)}
                    className="px-2.5 py-1 bg-nature-inner hover:bg-nature-card text-zinc-400 hover:text-gold border border-nature-border hover:border-gold/30 text-[10px] rounded-full transition-colors cursor-pointer"
                  >
                    + {lbl}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Chart of Successful Interceptions */}
          <div className="bg-nature-card border border-nature-border p-5 rounded-xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-nature-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">
                  Interceptações bem-sucedidas nesta Semana
                </h3>
                <p className="text-xs text-zinc-550">Sua habilidade de neutralizar as velhas sinapses em tempo real.</p>
              </div>
              <span className="text-lg font-mono font-bold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                {state.intercepts.length}
              </span>
            </div>

            {/* Elegant Custom Reactive SVG Bar Chart representation */}
            <div className="relative h-44 flex items-end justify-between pt-6 px-4 border-b border-nature-border pb-1">
              {/* Backing structural guidelines lines */}
              <div className="absolute left-0 right-0 top-6 border-t border-dashed border-nature-border/50 pointer-events-none" />
              <div className="absolute left-0 right-0 top-20 border-t border-dashed border-nature-border/50 pointer-events-none" />
              <div className="absolute left-0 right-0 top-32 border-t border-dashed border-nature-border/50 pointer-events-none" />

              {chartData.map((d, index) => {
                const heightPercentage = Math.round((d.count / maxChartCount) * 100);
                
                return (
                  <div key={d.day} className="flex flex-col items-center gap-2 w-10 group relative z-10">
                    
                    {/* Tooltip detail info */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-nature-inner border border-nature-border px-1.5 py-0.5 rounded text-[9px] font-mono font-medium text-gold transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                      {d.count} vezes
                    </div>

                    {/* Bar representation */}
                    <div className="w-4 bg-nature-inner rounded-t-full h-24 flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercentage}%` }}
                        transition={{ duration: 0.6, delay: index * 0.05 }}
                        className="w-full bg-gradient-to-t from-gold-dark to-gold rounded-t-full relative"
                      >
                        {/* Glow tip if has values */}
                        {d.count > 0 && (
                          <div className="absolute top-0 inset-x-0 h-1 bg-white rounded-full opacity-60"></div>
                        )}
                      </motion.div>
                    </div>

                    <span className="text-[10px] text-zinc-550 font-mono font-semibold">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* List of Recent logs */}
            <div className="space-y-2">
              <p className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-zinc-450" />
                Histórico de Alertas Recentes
              </p>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {state.intercepts.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="flex justify-between items-center bg-nature-inner p-2 border border-nature-border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></div>
                      <span className="text-[11px] text-zinc-300 truncate max-w-[160px] md:max-w-[240px]">
                        {log.thoughtContext || "Pensamento habitualmente repetido"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {log.date.split("-")[2]}/{log.date.split("-")[1]} às {log.time}
                      </span>
                      <button
                        onClick={() => removeIntercept(log.id)}
                        className="text-zinc-650 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer"
                        title="Remover log"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {state.intercepts.length === 0 && (
                  <p className="text-[10px] text-zinc-600 italic text-center py-2.5">
                    Nenhum pensamento interceptado registrado hoje.
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
