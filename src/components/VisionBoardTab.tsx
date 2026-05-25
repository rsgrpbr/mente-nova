/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AppState } from "../types";
import {
  Plus,
  Trash2,
  X,
  Image as ImageIcon,
  AlertCircle,
  Play,
  Pause,
  Loader2,
  Upload,
  Volume2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { ImagemManifestacaoRow } from "../lib/supabaseTables";
import { getVisualizationAudioUrl } from "../config/meditationAudio";

interface VisionBoardTabProps {
  state: AppState;
  addVisionItem: (imageUrl: string, title: string, id?: string, createdAt?: string) => void;
  removeVisionItem: (id: string) => void;
}

const SLIDE_INTERVAL_SEC = 10;
const DEFAULT_SESSION_MIN = 5;

export default function VisionBoardTab({ state, addVisionItem, removeVisionItem }: VisionBoardTabProps) {
  const [newItemTitle, setNewItemTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SESSION_MIN * 60);
  const [sessionMinutes, setSessionMinutes] = useState(DEFAULT_SESSION_MIN);
  const [breathePhase, setBreathePhase] = useState<"inspire" | "hold" | "expire">("inspire");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breatheTickRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const items = state.visionBoard;
  const visualizationAudioSrc = getVisualizationAudioUrl();
  const currentItem = items[slideIndex];

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const fetchImagens = async () => {
      const { data, error } = await supabase
        .from("imagens_manifestacao")
        .select("id, url_imagem, titulo, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[VisionBoard] Erro ao carregar imagens:", error.message);
        return;
      }

      (data as ImagemManifestacaoRow[] | null)?.forEach((row) => {
        const exists = state.visionBoard.some(
          (item) => item.id === row.id || item.imageUrl === row.url_imagem
        );
        if (!exists) {
          addVisionItem(
            row.url_imagem,
            row.titulo?.trim() || "A minha visão",
            row.id,
            row.created_at
          );
        }
      });
    };

    fetchImagens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearSessionTimers = useCallback(() => {
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    sessionTimerRef.current = null;
    slideTimerRef.current = null;
  }, []);

  const closeSession = useCallback(() => {
    clearSessionTimers();
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setIsAudioPlaying(false);
    setIsSessionOpen(false);
    setSlideIndex(0);
  }, [clearSessionTimers]);

  const goToSlide = (idx: number) => {
    if (items.length === 0) return;
    setSlideIndex(((idx % items.length) + items.length) % items.length);
  };

  const startVisualizationSession = async () => {
    if (items.length === 0) return;

    setIsSessionOpen(true);
    setSlideIndex(0);
    setSecondsLeft(sessionMinutes * 60);
    breatheTickRef.current = 0;

    clearSessionTimers();

    sessionTimerRef.current = setInterval(() => {
      breatheTickRef.current += 1;
      const phase = breatheTickRef.current % 6;
      if (phase < 2) setBreathePhase("inspire");
      else if (phase < 4) setBreathePhase("hold");
      else setBreathePhase("expire");

      setSecondsLeft((prev) => {
        if (prev <= 1) {
          closeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    if (items.length > 1) {
      slideTimerRef.current = setInterval(() => {
        setSlideIndex((i) => (i + 1) % items.length);
      }, SLIDE_INTERVAL_SEC * 1000);
    }

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      try {
        await audio.play();
        setIsAudioPlaying(true);
      } catch {
        console.warn("[VisionBoard] Reprodução de áudio bloqueada ou URL inválida.");
        setIsAudioPlaying(false);
      }
    }
  };

  const toggleSessionAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
    } else {
      void audio.play().then(() => setIsAudioPlaying(true)).catch(() => {});
    }
  };

  const uploadSingleFile = async (file: File, titleFallback: string) => {
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("vision_board")
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const { data: publicData } = supabase.storage.from("vision_board").getPublicUrl(storagePath);
    const titulo = newItemTitle.trim() || titleFallback;

    const { data: inserted, error: insertError } = await supabase
      .from("imagens_manifestacao")
      .insert({ url_imagem: publicData.publicUrl, titulo })
      .select("id, url_imagem, titulo, created_at")
      .single();

    if (insertError) throw new Error(insertError.message);

    const row = inserted as ImagemManifestacaoRow;
    addVisionItem(row.url_imagem, row.titulo ?? titulo, row.id, row.created_at);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    if (!isSupabaseConfigured) {
      setErrorMessage("Supabase não configurado em .env.local.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      for (const file of Array.from(files) as File[]) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage(`"${file.name}" excede 5MB e foi ignorado.`);
          continue;
        }
        await uploadSingleFile(file, file.name.replace(/\.[^.]+$/, "") || "A minha visão");
      }
      setNewItemTitle("");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatClock = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const bentoSpan = (index: number) => {
    const pattern = ["col-span-2 row-span-2", "col-span-1 row-span-1", "col-span-1 row-span-2", "col-span-1 row-span-1"];
    return pattern[index % pattern.length];
  };

  useEffect(() => () => clearSessionTimers(), [clearSessionTimers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-nature-border pb-5">
        <div>
          <h2 className="font-sans text-2xl md:text-3xl font-light text-zinc-150 tracking-tight flex items-center gap-2">
            <ImageIcon className="text-gold w-6 h-6" />
            Quadro de Visualização
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Monte o seu quadro com as imagens do novo destino. Depois inicie a visualização com áudio e slideshow.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void startVisualizationSession()}
          disabled={items.length === 0}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            items.length > 0
              ? "bg-gold hover:bg-gold-dark text-nature-bg shadow-lg shadow-gold/20"
              : "bg-nature-inner text-zinc-500 cursor-not-allowed border border-nature-border"
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          Iniciar Visualização
        </button>
      </div>

      {/* Painel: adicionar imagens */}
      <div className="bg-nature-card border border-nature-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <Plus className="w-4 h-4 text-gold" />
          Adicionar ao quadro
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 space-y-1">
            <label htmlFor="vision-title" className="text-xs text-zinc-500">
              Legenda (opcional, aplica-se ao próximo upload)
            </label>
            <input
              id="vision-title"
              type="text"
              placeholder="Ex.: Paz, abundância, saúde plena…"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              className="w-full px-3 py-2 bg-nature-inner border border-nature-border rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="shrink-0 px-5 py-2.5 bg-gold/15 hover:bg-gold/25 border border-gold/35 text-gold rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                A enviar…
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Escolher imagens
              </>
            )}
          </button>
        </div>
        {errorMessage && (
          <p className="text-[11px] text-red-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errorMessage}
          </p>
        )}
        <p className="text-[10px] text-zinc-600">
          Pode seleccionar várias fotos de uma vez. Máximo 5MB por imagem.
        </p>
      </div>

      {/* Duração da sessão de visualização */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>Duração da visualização:</span>
          <input
            type="range"
            min={2}
            max={20}
            value={sessionMinutes}
            onChange={(e) => setSessionMinutes(Number(e.target.value))}
            className="w-32 accent-gold"
          />
          <span className="font-mono text-gold font-semibold">{sessionMinutes} min</span>
          <span className="text-zinc-650">· imagens mudam a cada {SLIDE_INTERVAL_SEC}s</span>
        </div>
      )}

      {/* Quadro montado */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          O meu quadro
          <span className="text-xs px-2 py-0.5 bg-nature-inner border border-nature-border text-zinc-400 rounded-full font-mono">
            {items.length} {items.length === 1 ? "imagem" : "imagens"}
          </span>
        </h3>

        {items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[minmax(120px,1fr)]">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`relative group rounded-xl overflow-hidden border border-nature-border bg-nature-card hover:border-gold/30 transition-all ${bentoSpan(index)} min-h-[120px]`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-nature-bg/90 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                  <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => removeVisionItem(item.id)}
                      className="p-1.5 bg-red-950/70 hover:bg-red-600 rounded-lg text-red-100 cursor-pointer"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-medium text-zinc-100 line-clamp-2 drop-shadow">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer p-16 text-center border-2 border-dashed border-nature-border rounded-2xl bg-nature-card/30 hover:border-gold/40 hover:bg-nature-card/50 transition-all"
          >
            <Upload className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 font-medium">O quadro está vazio</p>
            <p className="text-xs text-zinc-600 mt-1">Clique aqui ou em &quot;Escolher imagens&quot; para começar</p>
          </div>
        )}
      </div>

      {/* Sessão imersiva: slideshow + áudio */}
      <AnimatePresence>
        {isSessionOpen && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-nature-bg flex flex-col"
          >
            <audio
              ref={audioRef}
              src={visualizationAudioSrc}
              preload="auto"
              onEnded={() => setIsAudioPlaying(false)}
              onPlay={() => setIsAudioPlaying(true)}
              onPause={() => setIsAudioPlaying(false)}
              className="sr-only"
            />

            {/* Slideshow fullscreen */}
            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {currentItem && (
                  <motion.div
                    key={currentItem.id}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 1.4, ease: "easeInOut" }}
                    className="absolute inset-0"
                  >
                    <img
                      src={currentItem.imageUrl}
                      alt={currentItem.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-nature-bg/80 via-nature-bg/20 to-nature-bg/40" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mini quadro — thumbnails */}
              <div className="absolute bottom-24 left-0 right-0 z-20 px-4">
                <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {items.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goToSlide(idx)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        idx === slideIndex ? "border-gold scale-105 shadow-lg shadow-gold/30" : "border-white/20 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Respiração */}
              <div className="absolute bottom-8 right-6 z-20 flex flex-col items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: breathePhase === "inspire" ? 1.5 : breathePhase === "hold" ? 1.5 : 0.85,
                      opacity: breathePhase === "expire" ? 0.35 : 0.75,
                    }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-full bg-gold/40 blur-xl absolute"
                  />
                  <div className="w-14 h-14 rounded-full bg-nature-card/80 border border-gold/40 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-[9px] font-bold text-gold tracking-wider">
                      {breathePhase === "inspire" ? "INSPIRE" : breathePhase === "hold" ? "RETENHA" : "EXPIRE"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute top-6 left-6 right-6 z-20 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gold bg-gold/10 border border-gold/25 px-2 py-1 rounded-full">
                    Passo 7 · Visualização ativa
                  </span>
                  {currentItem && (
                    <p className="text-lg font-serif text-white drop-shadow-md max-w-md">{currentItem.title}</p>
                  )}
                  <p className="text-xs font-mono text-zinc-300">
                    {slideIndex + 1} / {items.length} · {formatClock(secondsLeft)} restantes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToSlide(slideIndex - 1)}
                    className="p-2 rounded-full bg-nature-card/80 border border-nature-border text-zinc-300 hover:text-white cursor-pointer backdrop-blur-sm"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToSlide(slideIndex + 1)}
                    className="p-2 rounded-full bg-nature-card/80 border border-nature-border text-zinc-300 hover:text-white cursor-pointer backdrop-blur-sm"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleSessionAudio}
                    className="p-2 rounded-full bg-nature-card/80 border border-gold/30 text-gold cursor-pointer backdrop-blur-sm"
                    title={isAudioPlaying ? "Pausar áudio" : "Retomar áudio"}
                  >
                    {isAudioPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                  <button
                    type="button"
                    onClick={closeSession}
                    className="p-2 rounded-full bg-nature-card/80 border border-nature-border text-zinc-300 hover:text-white cursor-pointer backdrop-blur-sm"
                    title="Terminar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {!visualizationAudioSrc.includes("soundhelix") && (
                <div className="absolute top-20 left-6 z-10 flex items-center gap-1.5 text-[10px] text-zinc-400 bg-nature-card/60 px-2 py-1 rounded-full backdrop-blur-sm">
                  <Volume2 className="w-3 h-3 text-gold" />
                  Meditação guiada ativa
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
