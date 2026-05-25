# Mente Nova

App de prática baseado no método **Joe Dispenza** (*Quebrando o Hábito de Ser Você Mesmo*): diário escrito em 10 etapas, meditação guiada, vision board e lembretes diários de consciência.

Funciona no **browser** e como **PWA** no telemóvel (ecrã inicial).

## Funcionalidades

- **Diário escrito** — 10 etapas (antigo eu → novo eu → revisão diária)
- **O Meu Painel** — resumo, lembretes e leitura das reflexões
- **Meditação e Player** — 4 semanas, paisagens sonoras, progresso no Supabase
- **Vision Board** — upload de imagens para o bucket `vision_board`
- **Sync na nuvem** — diário em `diario_jornal` por dispositivo

## Stack

- React 19 + Vite 6 + Tailwind 4
- Supabase (DB + Storage)
- Gemini (IA no diário, opcional)
- PWA (`vite-plugin-pwa`)

## Instalação local

```bash
git clone https://github.com/SEU_USUARIO/mente-nova.git
cd mente-nova
npm install
cp .env.example .env.local
# Edite .env.local com as suas chaves
npm run dev
```

Abre `http://localhost:3000`. No telemóvel (mesma Wi‑Fi): `http://IP_DO_PC:3000`.

## Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, execute o ficheiro [`supabase/schema.sql`](supabase/schema.sql).
3. Crie o bucket público **`vision_board`** (Storage).
4. Copie **URL** e **anon key** para `.env.local`.

## Variáveis de ambiente

| Variável | Obrigatório | Uso |
|----------|-------------|-----|
| `VITE_SUPABASE_URL` | Sim | API Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Cliente anon |
| `VITE_GEMINI_API_KEY` | Não | IA no diário |
| `VITE_AUDIO_SEMANA_*` | Não | MP3 das meditações |

Ver [`.env.example`](.env.example).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento (porta 3000, rede local) |
| `npm run build` | Build de produção |
| `npm run preview` | Pré-visualizar build |
| `npm run lint` | Verificação TypeScript |

## Telemóvel e PWA

Guia completo: [`docs/MOBILE.md`](docs/MOBILE.md).

## Deploy (Vercel + GitHub)

1. Push deste repositório para o GitHub.
2. [vercel.com](https://vercel.com) → **Import Project** → escolhe o repo.
3. **Environment Variables**: as mesmas do `.env.local` (`VITE_*`).
4. Deploy → abre o URL no telemóvel → **Adicionar ao ecrã inicial**.

O ficheiro [`vercel.json`](vercel.json) já configura SPA + rotas.

## Estrutura do projeto

```
├── public/           # Ícones PWA
├── src/
│   ├── components/   # DiaryTab, PlayerTab, VisionBoardTab, …
│   ├── config/       # Etapas do diário, soundscapes, áudio
│   ├── hooks/        # Estado, diário, player
│   ├── lib/          # Supabase, IA, insights do diário
│   └── types/
├── supabase/
│   └── schema.sql    # Tabelas e RLS
└── docs/
    └── MOBILE.md
```

## Licença

Código com licença Apache-2.0 nos ficheiros fonte. Conteúdo metodológico inspirado na obra de Joe Dispenza — uso pessoal/educacional.
