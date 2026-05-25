/** Linha retornada pela tabela `imagens_manifestacao` */
export interface ImagemManifestacaoRow {
  id: string;
  url_imagem: string;
  titulo: string | null;
  created_at: string;
}

/** Linha retornada pela tabela `progresso_diario` */
export interface ProgressoDiarioRow {
  id: string;
  semana: number;
  pratica_concluida: boolean;
  created_at: string;
}

/** Linha retornada pela tabela `diario_jornal` */
export interface DiarioJornalRow {
  device_id: string;
  payload: Record<string, unknown>;
  updated_at: string;
}
