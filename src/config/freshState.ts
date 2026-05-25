import type { AppState, DiaryDeconstruction, DiaryNewDestiny } from "../types";

const emptyDeconstruction = (): DiaryDeconstruction => ({
  emotionToUnmemorize: "",
  whoIHaveBeen: "",
  whatIHaveHidden: "",
  surrenderStatement: "",
  limitingThoughts: [],
  limitingBehaviors: [],
  updatedAt: new Date().toISOString(),
});

const emptyNewDestiny = (): DiaryNewDestiny => ({
  frontalLobeWhoAmI: "",
  whatWouldISay: "",
  howToThink: "",
  howToAct: "",
  howToFeel: "",
  updatedAt: new Date().toISOString(),
});

/** Estado inicial vazio — uso real, sem dados de demonstração */
export const FRESH_INITIAL_STATE: AppState = {
  diaryDeconstruction: emptyDeconstruction(),
  diaryNewDestiny: emptyNewDestiny(),
  visionBoard: [],
  intercepts: [],
  meditationLogs: [],
  currentWeek: 1,
  streakDays: 0,
  lastMeditationDate: null,
};
