# Deploy — GitHub + Vercel

## 1. GitHub

Repositório criado a partir desta pasta. Comandos úteis:

```bash
git remote -v
git push origin main
```

## 2. Vercel

1. Acede a [vercel.com](https://vercel.com) com a conta GitHub.
2. **Add New → Project** → importa `mente-nova` (ou o nome do teu repo).
3. **Framework Preset:** Vite (detetado automaticamente).
4. **Root Directory:** `.` (raiz do repo).
5. **Build Command:** `npm run build`
6. **Output Directory:** `dist`

### Variáveis de ambiente (Settings → Environment Variables)

Adiciona para **Production**, **Preview** e **Development**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY` (opcional)

Opcionais de áudio: `VITE_AUDIO_SEMANA_1`, etc. (ver `.env.example`).

7. **Deploy**. Cada `git push` na branch `main` gera um deploy novo.

## 3. PWA no telemóvel

Abre o URL `https://teu-projeto.vercel.app` no telemóvel e instala como app (ver `MOBILE.md`).

## 4. Domínio personalizado (opcional)

Vercel → Project → Settings → Domains.
