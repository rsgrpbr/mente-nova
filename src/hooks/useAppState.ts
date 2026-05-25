/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  AppState,
  DiaryDeconstruction,
  DiaryNewDestiny,
  VisionBoardItem,
  InterceptLog,
  StreamItem,
} from "../types";
import { FRESH_INITIAL_STATE } from "../config/freshState";
import { APP_STATE_KEY, loadAppState, wipeLocalAppData } from "../lib/appStorage";

export const INITIAL_STATE = FRESH_INITIAL_STATE;

export function useAppState() {
  const [state, setState] = useState<AppState>(loadAppState);
  const [devModeOverride, setDevModeOverride] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
  }, [state]);

  const updateDeconstruction = (data: Partial<DiaryDeconstruction>) => {
    setState((prev) => ({
      ...prev,
      diaryDeconstruction: {
        ...prev.diaryDeconstruction,
        ...data,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const updateNewDestiny = (data: Partial<DiaryNewDestiny>) => {
    setState((prev) => ({
      ...prev,
      diaryNewDestiny: {
        ...prev.diaryNewDestiny,
        ...data,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const addVisionItem = (
    imageUrl: string,
    title: string,
    id?: string,
    createdAt?: string
  ) => {
    const newItem: VisionBoardItem = {
      id: id ?? `vision-${Date.now()}`,
      imageUrl,
      title: title || "Meu Novo Eu",
      createdAt: createdAt ?? new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      visionBoard: [newItem, ...prev.visionBoard],
    }));
  };

  const removeVisionItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      visionBoard: prev.visionBoard.filter((item) => item.id !== id),
    }));
  };

  const addIntercept = (context?: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const newLog: InterceptLog = {
      id: `int-${Date.now()}`,
      date: todayStr,
      time: timeStr,
      thoughtContext: context || "Detecção reativa evitada",
    };
    setState((prev) => ({
      ...prev,
      intercepts: [newLog, ...prev.intercepts],
    }));
  };

  const removeIntercept = (id: string) => {
    setState((prev) => ({
      ...prev,
      intercepts: prev.intercepts.filter((log) => log.id !== id),
    }));
  };

  const completeMeditation = (weekNum: number, durationMin: number) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const newSession: StreamItem = {
      id: `med-${Date.now()}`,
      week: weekNum,
      date: todayStr,
      durationMinutes: durationMin,
    };

    setState((prev) => {
      let newStreak = prev.streakDays;
      if (prev.lastMeditationDate !== todayStr) {
        if (prev.lastMeditationDate) {
          const lastDateObj = new Date(prev.lastMeditationDate);
          const todayDateObj = new Date(todayStr);
          const diffDays = Math.ceil(
            Math.abs(todayDateObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays <= 1) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }
      }

      const currentWeekCompletions = [newSession, ...prev.meditationLogs].filter(
        (log) => log.week === prev.currentWeek
      ).length;

      let nextWeek = prev.currentWeek;
      if (currentWeekCompletions >= 7 && prev.currentWeek < 4) {
        nextWeek = prev.currentWeek + 1;
      }

      return {
        ...prev,
        meditationLogs: [newSession, ...prev.meditationLogs],
        lastMeditationDate: todayStr,
        streakDays: newStreak,
        currentWeek: devModeOverride ? prev.currentWeek : nextWeek,
      };
    });
  };

  const setCurrentWeekManual = (weekNum: number) => {
    setState((prev) => ({
      ...prev,
      currentWeek: weekNum,
    }));
  };

  const resetToDefaults = () => {
    if (confirm("Redefinir todo o progresso local para começar do zero?")) {
      wipeLocalAppData();
      setState({ ...FRESH_INITIAL_STATE });
      setDevModeOverride(false);
      window.location.reload();
    }
  };

  return {
    state,
    devModeOverride,
    setDevModeOverride,
    updateDeconstruction,
    updateNewDestiny,
    addVisionItem,
    removeVisionItem,
    addIntercept,
    removeIntercept,
    completeMeditation,
    setCurrentWeekManual,
    resetToDefaults,
  };
}
