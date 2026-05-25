export type DiaryModo = "inicio" | "escrita" | "conversa";

export type StepAnswers = Record<number, string>;
export type AllStepAnswers = Record<number, StepAnswers>;

export interface DiaryPersistedState {
  etapaAtual: number;
  modo: DiaryModo;
  respostas: AllStepAnswers;
  started: boolean;
  updatedAt?: number;
}
