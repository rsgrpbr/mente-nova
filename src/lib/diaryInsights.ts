import { DIARY_ETAPAS } from "../config/diaryEtapas";
import type { AllStepAnswers, StepAnswers } from "../types/diary";

function pick(answers: StepAnswers | undefined, ...indices: number[]): string {
  if (!answers) return "";
  return indices
    .map((i) => String(answers[i] ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

function firstLine(text: string, max = 120): string {
  const line = text.split("\n").find((l) => l.trim())?.trim() ?? text.trim();
  return line.length > max ? `${line.slice(0, max)}…` : line;
}

export interface DiaryInsights {
  etapasPreenchidas: number;
  totalEtapas: number;
  percentual: number;
  emocaoLimitante: string;
  quemFui: string;
  oQueEscondi: string;
  declaracaoEntrega: string;
  comoPensar: string;
  comoAgir: string;
  comoSentir: string;
  idealEu: string;
  revisaoHoje: string;
  lembretesDiarios: { id: string; texto: string; tipo: "alerta" | "novo" | "entrega" }[];
}

export function countFilledSteps(respostas: AllStepAnswers): number {
  return DIARY_ETAPAS.filter((_, i) => {
    const a = respostas[i];
    return a && Object.values(a).some((v) => String(v ?? "").trim());
  }).length;
}

export function hasAnyDiaryContent(respostas: AllStepAnswers): boolean {
  return countFilledSteps(respostas) > 0;
}

const REMINDER_PRIORITY = ["emo", "pensar", "agir", "sentir", "entrega"] as const;

/** Até 3 lembretes para o widget da página inicial */
export function getTopDailyReminders(
  respostas: AllStepAnswers,
  limit = 3
): DiaryInsights["lembretesDiarios"] {
  const all = buildDiaryInsights(respostas).lembretesDiarios;
  const picked: DiaryInsights["lembretesDiarios"] = [];

  for (const id of REMINDER_PRIORITY) {
    const item = all.find((l) => l.id === id);
    if (item) picked.push(item);
    if (picked.length >= limit) break;
  }

  if (picked.length < limit) {
    for (const item of all) {
      if (!picked.some((p) => p.id === item.id)) {
        picked.push(item);
        if (picked.length >= limit) break;
      }
    }
  }

  return picked;
}

export function buildDiaryInsights(respostas: AllStepAnswers): DiaryInsights {
  const emocaoLimitante = pick(respostas[1], 0);
  const quemFui = pick(respostas[0], 0, 1, 2, 4);
  const oQueEscondi = pick(respostas[0], 5) || pick(respostas[0], 2, 3);
  const declaracaoEntrega = pick(respostas[5], 0, 1, 2, 3);
  const idealEu = pick(respostas[6], 0, 1, 2);
  const comoPensar = pick(respostas[6], 2, 3, 4, 5, 6, 7);
  const comoAgir = pick(respostas[7], 0, 1, 2, 3, 4);
  const comoSentir = pick(respostas[8], 0, 1, 2, 3, 4);
  const revisaoHoje = pick(respostas[9], 0, 1, 2, 3, 4, 5);

  const lembretesDiarios: DiaryInsights["lembretesDiarios"] = [];

  if (emocaoLimitante) {
    lembretesDiarios.push({
      id: "emo",
      tipo: "alerta",
      texto: `Quando surgir «${firstLine(emocaoLimitante, 60)}», pare. Respire. Não entre no piloto automático.`,
    });
  }
  if (declaracaoEntrega) {
    lembretesDiarios.push({
      id: "entrega",
      tipo: "entrega",
      texto: `Lembre da entrega: ${firstLine(declaracaoEntrega, 100)}`,
    });
  }
  if (comoPensar) {
    lembretesDiarios.push({
      id: "pensar",
      tipo: "novo",
      texto: `Hoje escolho pensar: ${firstLine(comoPensar, 90)}`,
    });
  }
  if (comoAgir) {
    lembretesDiarios.push({
      id: "agir",
      tipo: "novo",
      texto: `Hoje escolho agir: ${firstLine(comoAgir, 90)}`,
    });
  }
  if (comoSentir) {
    lembretesDiarios.push({
      id: "sentir",
      tipo: "novo",
      texto: `Hoje escolho sentir: ${firstLine(comoSentir, 90)}`,
    });
  }

  const etapasPreenchidas = countFilledSteps(respostas);
  const totalEtapas = DIARY_ETAPAS.length;

  return {
    etapasPreenchidas,
    totalEtapas,
    percentual: Math.round((etapasPreenchidas / totalEtapas) * 100),
    emocaoLimitante,
    quemFui,
    oQueEscondi,
    declaracaoEntrega,
    comoPensar,
    comoAgir,
    comoSentir,
    idealEu,
    revisaoHoje,
    lembretesDiarios,
  };
}

export type DiarySectionGroup = {
  id: string;
  titulo: string;
  subtitulo: string;
  cor: string;
  stepIndices: number[];
};

export const DIARY_SECTION_GROUPS: DiarySectionGroup[] = [
  {
    id: "antigo",
    titulo: "O Antigo Eu",
    subtitulo: "Desconstrução · Etapas 1–6",
    cor: "#B07070",
    stepIndices: [0, 1, 2, 3, 4, 5],
  },
  {
    id: "novo",
    titulo: "O Novo Eu",
    subtitulo: "Criação · Etapas 7–9",
    cor: "#5A8AAA",
    stepIndices: [6, 7, 8],
  },
  {
    id: "revisao",
    titulo: "Revisão Diária",
    subtitulo: "Refinar · Etapa 10",
    cor: "#6A6A8A",
    stepIndices: [9],
  },
];
