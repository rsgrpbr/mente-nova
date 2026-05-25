/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ----------------------------------------------------
// TYPES OF THE CURRENT ACTIVE STATE (LOCAL STORAGE)
// ----------------------------------------------------

export interface DiaryDeconstruction {
  emotionToUnmemorize: string;
  whoIHaveBeen: string;
  whatIHaveHidden: string;
  surrenderStatement: string;
  limitingThoughts: string[];
  limitingBehaviors: string[];
  updatedAt: string;
}

export interface DiaryNewDestiny {
  frontalLobeWhoAmI: string;
  whatWouldISay: string;
  howToThink: string;
  howToAct: string;
  howToFeel: string;
  updatedAt: string;
}

export interface VisionBoardItem {
  id: string;
  imageUrl: string;
  title: string;
  createdAt: string;
}

export interface StreamItem {
  id: string;
  week: number;
  date: string; // ISO date YYYY-MM-DD
  durationMinutes: number;
}

export interface InterceptLog {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  time: string; // HH:MM
  thoughtContext?: string;
}

export interface WeekProgress {
  weekNum: number;
  title: string;
  subtitle: string;
  meditationTitle: string;
  audioDurationMin: number;
  unlocked: boolean;
  completionsRequired: number;
  completionsCount: number;
  description: string;
}

export interface AppState {
  diaryDeconstruction: DiaryDeconstruction;
  diaryNewDestiny: DiaryNewDestiny;
  visionBoard: VisionBoardItem[];
  intercepts: InterceptLog[];
  meditationLogs: StreamItem[];
  currentWeek: number; // 1, 2, 3, or 4
  streakDays: number;
  lastMeditationDate: string | null;
}
