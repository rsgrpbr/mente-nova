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

Opcionais de áudio (após `npm run upload-audio`): `VITE_AUDIO_INCEPTION`, `VITE_AUDIO_EINAUDI_LIVE`, etc. (ver `.env.example`).

### Áudios de meditação (Supabase Storage)

1. No Supabase → **SQL Editor**, execute [`supabase/storage-meditacoes.sql`](../supabase/storage-meditacoes.sql).
2. Na raiz do projeto, com `.env.local` configurado:

   ```bash
   npm run upload-audio
   ```

3. Copie as linhas `VITE_AUDIO_*` que o script imprimir para `.env.local` **e** para **Vercel → Environment Variables**.
4. Redeploy na Vercel.

7. **Deploy**. Cada `git push` na branch `main` gera um deploy novo.

## 3. PWA no telemóvel

Abre o URL `https://teu-projeto.vercel.app` no telemóvel e instala como app (ver `MOBILE.md`).

## 4. Domínio personalizado (opcional)

Vercel → Project → Settings → Domains.
