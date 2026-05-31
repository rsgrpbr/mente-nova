import { useState, useRef, useEffect, useCallback, type ChangeEvent } from "react";
import { getMeditationTrackUrl } from "../config/meditationAudio";
import { getSoundscapeById } from "../config/soundscapes";
import type { TibetanBellId } from "../lib/tibetanBells";
import { playTibetanBell } from "../lib/tibetanBells";
import { startAmbient, stopAmbient } from "../lib/ambientEngine";

export interface BellSettings {
  bellType: TibetanBellId;
  /** Minutos desde o início em que o sino toca (ex.: [10, 25]) */
  scheduleMinutes: number[];
  /** Sino ao concluir a sessão */
  atEnd: boolean;
}

interface UseMeditationPlayerOptions {
  guidedTrackId: string;
  durationMinutes: number;
  soundscapeId: string;
  bells: BellSettings;
  onSessionComplete: () => Promise<void>;
}

export function useMeditationPlayer({
  guidedTrackId,
  durationMinutes,
  soundscapeId,
  bells,
  onSessionComplete,
}: UseMeditationPlayerOptions) {
  const mainAudioRef = useRef<HTMLAudioElement>(null);
  const streamAudioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedBellMinutesRef = useRef<Set<number>>(new Set());
  const completingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const soundscape = getSoundscapeById(soundscapeId);
  const targetDurationSec = durationMinutes * 60;
  const usesTimer =
    soundscape.engine === "ambient" ||
    (soundscape.engine === "stream" && !soundscape.streamUrl);

  const guidedSrc = getMeditationTrackUrl(guidedTrackId);
  const mainSrc =
    soundscape.engine === "guided-mp3" || soundscape.engine === "guided-plus-ambient"
      ? guidedSrc
      : soundscape.engine === "stream" && soundscape.streamUrl
        ? soundscape.streamUrl
        : "";

  const effectiveDuration = usesTimer ? targetDurationSec : duration || targetDurationSec;
  const progressPercent =
    effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopAllAudio = useCallback(() => {
    stopTimer();
    stopAmbient();
    mainAudioRef.current?.pause();
    streamAudioRef.current?.pause();
    if (mainAudioRef.current) mainAudioRef.current.currentTime = 0;
    if (streamAudioRef.current) streamAudioRef.current.currentTime = 0;
  }, [stopTimer]);

  const triggerEndBell = useCallback(async () => {
    if (!bells.atEnd) return;
    await playTibetanBell(bells.bellType);
  }, [bells.atEnd, bells.bellType]);

  const resetFiredBellsFromTime = useCallback((timeSec: number) => {
    const passedMinute = Math.floor(timeSec / 60);
    for (const m of [...firedBellMinutesRef.current]) {
      if (m > passedMinute) firedBellMinutesRef.current.delete(m);
    }
  }, []);

  const checkScheduledBells = useCallback(
    (timeSec: number) => {
      const maxMin = Math.ceil(targetDurationSec / 60);
      for (const minute of bells.scheduleMinutes) {
        if (minute <= 0 || minute >= maxMin) continue;
        if (timeSec >= minute * 60 && !firedBellMinutesRef.current.has(minute)) {
          firedBellMinutesRef.current.add(minute);
          void playTibetanBell(bells.bellType);
        }
      }
    },
    [bells.scheduleMinutes, bells.bellType, targetDurationSec]
  );

  const finishSession = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;
    setIsPlaying(false);
    stopAllAudio();
    try {
      await triggerEndBell();
      await onSessionComplete();
    } finally {
      completingRef.current = false;
    }
  }, [stopAllAudio, triggerEndBell, onSessionComplete]);

  const startAmbientLayers = useCallback(() => {
    if (soundscape.engine === "ambient" && soundscape.ambientPreset) {
      startAmbient(soundscape.ambientPreset, 0.09);
    } else if (soundscape.engine === "guided-plus-ambient" && soundscape.ambientUnderlay) {
      startAmbient(soundscape.ambientUnderlay, soundscape.ambientVolume ?? 0.06);
    }
  }, [soundscape]);

  const startTimerPlayback = useCallback(() => {
    stopTimer();
    startAmbientLayers();
    timerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const next = Math.min(prev + 1, targetDurationSec);
        checkScheduledBells(next);
        if (next >= targetDurationSec) {
          stopTimer();
          void finishSession();
        }
        return next;
      });
    }, 1000);
  }, [stopTimer, startAmbientLayers, checkScheduledBells, targetDurationSec, finishSession]);

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopTimer();
      stopAmbient();
      mainAudioRef.current?.pause();
      streamAudioRef.current?.pause();
      return;
    }

    firedBellMinutesRef.current.clear();
    completingRef.current = false;

    if (usesTimer) {
      setIsPlaying(true);
      if (currentTime === 0) startAmbientLayers();
      startTimerPlayback();
      return;
    }

    const main = mainAudioRef.current;
    const stream = streamAudioRef.current;

    if (soundscape.engine === "guided-plus-ambient") {
      startAmbientLayers();
    }

    if (soundscape.engine === "stream" && stream && soundscape.streamUrl) {
      stream.loop = true;
      try {
        await stream.play();
      } catch {
        alert("Não foi possível reproduzir o som de natureza. Configure VITE_SOUND_* ou use preset sintético.");
        return;
      }
    }

    if (main && mainSrc) {
      try {
        await main.play();
        setIsPlaying(true);
      } catch {
        alert("Não foi possível reproduzir o áudio. Configure URLs no catálogo (meditationAudio.ts ou VITE_MEDITATION_TRACKS).");
      }
    } else if (stream?.paused === false) {
      setIsPlaying(true);
    }
  }, [
    isPlaying,
    usesTimer,
    currentTime,
    startAmbientLayers,
    startTimerPlayback,
    soundscape,
    mainSrc,
    stopTimer,
  ]);

  const handleRestart = useCallback(() => {
    firedBellMinutesRef.current.clear();
    completingRef.current = false;
    setCurrentTime(0);
    setIsPlaying(false);
    stopAllAudio();
    if (usesTimer) setDuration(targetDurationSec);
    else {
      if (mainAudioRef.current) mainAudioRef.current.currentTime = 0;
      if (streamAudioRef.current) streamAudioRef.current.currentTime = 0;
    }
  }, [stopAllAudio, usesTimer, targetDurationSec]);

  const handleTimeUpdate = useCallback(() => {
    const main = mainAudioRef.current;
    if (!main || usesTimer) return;
    const t = main.currentTime;
    const audioDur = Number.isFinite(main.duration) ? main.duration : targetDurationSec;
    const d = Math.min(audioDur, targetDurationSec);
    setCurrentTime(t);
    setDuration(d);
    checkScheduledBells(t);
    if (t >= targetDurationSec) {
      main.pause();
      void finishSession();
    }
  }, [usesTimer, targetDurationSec, checkScheduledBells, finishSession]);

  const handleStreamTimeUpdate = useCallback(() => {
    const stream = streamAudioRef.current;
    const main = mainAudioRef.current;
    if (!stream || usesTimer) return;
    const t = main?.currentTime ?? stream.currentTime;
    const audioDur = main && Number.isFinite(main.duration) ? main.duration : targetDurationSec;
    const d = Math.min(audioDur, targetDurationSec);
    setCurrentTime(t);
    setDuration(d);
    checkScheduledBells(t);
    if (t >= targetDurationSec) {
      main?.pause();
      stream.pause();
      void finishSession();
    }
  }, [usesTimer, targetDurationSec, checkScheduledBells, finishSession]);

  const handleLoadedMetadata = useCallback(() => {
    const main = mainAudioRef.current;
    if (main && Number.isFinite(main.duration)) {
      setDuration(main.duration);
    } else if (usesTimer) {
      setDuration(targetDurationSec);
    }
  }, [usesTimer, targetDurationSec]);

  const handleMainEnded = useCallback(() => {
    if (usesTimer) return;
    void finishSession();
  }, [usesTimer, finishSession]);

  const handleProgressSeek = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const next = Number(e.target.value);
      if (usesTimer) {
        setCurrentTime(next);
        resetFiredBellsFromTime(next);
        return;
      }
      if (mainAudioRef.current) mainAudioRef.current.currentTime = next;
      setCurrentTime(next);
      resetFiredBellsFromTime(next);
    },
    [usesTimer, resetFiredBellsFromTime]
  );

  useEffect(() => {
    stopAllAudio();
    setIsPlaying(false);
    setCurrentTime(0);
    firedBellMinutesRef.current.clear();
    completingRef.current = false;
    if (usesTimer) {
      setDuration(targetDurationSec);
    } else {
      setDuration(0);
      mainAudioRef.current?.load();
      streamAudioRef.current?.load();
    }
  }, [soundscapeId, guidedTrackId, mainSrc, usesTimer, targetDurationSec, stopAllAudio, durationMinutes]);

  useEffect(() => () => stopAllAudio(), [stopAllAudio]);

  return {
    mainAudioRef,
    streamAudioRef,
    mainSrc,
    streamSrc: soundscape.streamUrl ?? "",
    soundscape,
    isPlaying,
    currentTime,
    effectiveDuration,
    targetDurationSec,
    durationMinutes,
    progressPercent,
    usesTimer,
    handlePlayPause,
    handleRestart,
    handleTimeUpdate,
    handleStreamTimeUpdate,
    handleLoadedMetadata,
    handleMainEnded,
    handleProgressSeek,
    stopAllAudio,
  };
}
