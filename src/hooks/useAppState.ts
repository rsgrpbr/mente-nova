/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AppState, DiaryDeconstruction, DiaryNewDestiny, VisionBoardItem, InterceptLog, StreamItem } from "../types";

const LOCAL_STORAGE_KEY = "mente_nova_state";

const DEFAULT_DECONSTRUCTION: DiaryDeconstruction = {
  emotionToUnmemorize: "Ansiedade crônica e controle obsessivo",
  whoIHaveBeen: "Uma pessoa que foca constantemente no pior cenário futuro para tentar se manter no controle seguro.",
  whatIHaveHidden: "O medo profundo do julgamento alheio e da improdutividade desmedida.",
  surrenderStatement: "Eu entrego esta necessidade de controle ao Campo Quântico de infinitas possibilidades. Que a sabedoria superior organize os detalhes de acordo com o crescimento harmônico.",
  limitingThoughts: [
    "Não tenho tempo suficiente para meditar hoje",
    "Estou desperdiçando horas produtivas se fechar os olhos",
    "Nada vai mudar de verdade, as coisas são difíceis"
  ],
  limitingBehaviors: [
    "Checar redes sociais nos primeiros 5 minutos ao acordar",
    "Reagir com pressa e impaciência com familiares",
    "Adiar momentos de calmaria por culpa"
  ],
  updatedAt: new Date().toISOString()
};

const DEFAULT_NEW_DESTINY: DiaryNewDestiny = {
  frontalLobeWhoAmI: "Uma presença de consciência expandida, que opera a partir da paz profunda e inspiração criativa.",
  whatWouldISay: "Você é livre dos condicionamentos do passado. O presente é o único espaço onde a realidade quântica se molda. Confie na harmonia divina e crie sem medo.",
  howToThink: "Pensar que o universo colabora inteiramente com meus estados de coerência emocional de bem-estar.",
  howToAct: "Apreciar deliberadamente o presente, escutar as pessoas sem julgamento reativo e sorrir com leveza.",
  howToFeel: "Sintonizar no amor altruísta, plenitude interior e gratidão antecipada pelas maravilhas da criação.",
  updatedAt: new Date().toISOString()
};

// Generates some initial intercepts across the last 5 days
const generateDefaultIntercepts = (): InterceptLog[] => {
  const list: InterceptLog[] = [];
  const days = [5, 4, 3, 2, 1, 0];
  const countPerDay = [3, 5, 2, 6, 4, 3]; // counts
  
  days.forEach((d, index) => {
    const today = new Date();
    today.setDate(today.getDate() - d);
    const dateStr = today.toISOString().split("T")[0];
    const cnt = countPerDay[index];
    
    for (let i = 0; i < cnt; i++) {
      list.push({
        id: `int-${d}-${i}`,
        date: dateStr,
        time: `${10 + (i * 2)}:${15 + (i * 5)}`,
        thoughtContext: "Detecção automática de reatividade"
      });
    }
  });
  return list;
};

// Generates default completions to help Weeks 2 or 3 look partially achieved
const generateDefaultMeditationLogs = (): StreamItem[] => {
  const list: StreamItem[] = [];
  
  // Week 1 completed: let's add 7 logs in the past for Week 1
  for (let i = 12; i >= 6; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    list.push({
      id: `m-1-${i}`,
      week: 1,
      date: d.toISOString().split("T")[0],
      durationMinutes: 20
    });
  }
  
  // Week 2 partially completed (e.g. 4 completions)
  for (let i = 5; i >= 2; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    list.push({
      id: `m-2-${i}`,
      week: 2,
      date: d.toISOString().split("T")[0],
      durationMinutes: 25
    });
  }
  
  return list;
};

export const INITIAL_STATE: AppState = {
  diaryDeconstruction: DEFAULT_DECONSTRUCTION,
  diaryNewDestiny: DEFAULT_NEW_DESTINY,
  visionBoard: [],
  intercepts: generateDefaultIntercepts(),
  meditationLogs: generateDefaultMeditationLogs(),
  currentWeek: 2, // Default in Week 2, since they already completed Week 1!
  streakDays: 8,
  lastMeditationDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split("T")[0],
};

export function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao ler LocalStorage state", e);
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  // Safe mechanism to force Developer manual week override (bypassing restriction)
  const [devModeOverride, setDevModeOverride] = useState<boolean>(true); // default true for best presentation testability

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Update Deconstruction Diary
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

  // Update New Destiny Diary
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

  // Add Item to Vision Board
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

  // Remove Item from Vision Board
  const removeVisionItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      visionBoard: prev.visionBoard.filter((item) => item.id !== id),
    }));
  };

  // Add intercept thought ("MUDE!")
  const addIntercept = (context?: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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

  // Remove individual intercept log
  const removeIntercept = (id: string) => {
    setState((prev) => ({
      ...prev,
      intercepts: prev.intercepts.filter((log) => log.id !== id),
    }));
  };

  // Complete a meditation session
  const completeMeditation = (weekNum: number, durationMin: number) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const newSession: StreamItem = {
      id: `med-${Date.now()}`,
      week: weekNum,
      date: todayStr,
      durationMinutes: durationMin,
    };

    setState((prev) => {
      // Calculate streaks
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
            newStreak = 1; // reset streak if gap is greater than 1 day
          }
        } else {
          newStreak = 1; // first ever
        }
      }

      // Check auto-progression: count completions for current week
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

  // Change active week manually
  const setCurrentWeekManual = (weekNum: number) => {
    setState((prev) => ({
      ...prev,
      currentWeek: weekNum,
    }));
  };

  // Reset all state to defaults
  const resetToDefaults = () => {
    if (confirm("Deseja redefinir todo o progresso do diário, visualização e logs para o padrão de demonstração?")) {
      setState(INITIAL_STATE);
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
